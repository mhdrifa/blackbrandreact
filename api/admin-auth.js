import {
  confirmAdminTotp,
  enrollAdminTotp
} from './_lib/admin-totp.js';
import {
  getAuthenticatedAdmin,
  requireMfaSession
} from './_lib/admin-mfa.js';
import {
  getUserSessionClient,
  verifyAdminCredentials
} from './_lib/admin-supabase.js';
import {
  reserveLoginAttempt,
  resetLoginAttempts
} from './_lib/admin-rate-limit.js';
import {
  createAdminSession,
  deleteAdminSession,
  expireAdminSessionCookie,
  hasAdminSessionAssurance,
  readAdminSession
} from './_lib/admin-session-store.js';

function send(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(payload);
}

function originIsAllowed(req) {
  if (typeof req.headers.origin !== 'string') return false;

  let origin;
  try {
    origin = new URL(req.headers.origin);
  } catch {
    return false;
  }

  const configuredOrigin = process.env.ADMIN_ALLOWED_ORIGIN;
  if (configuredOrigin) {
    try {
      return origin.origin === new URL(configuredOrigin).origin &&
        req.headers['sec-fetch-site'] !== 'cross-site';
    } catch {
      return false;
    }
  }

  const forwardedHost = req.headers['x-forwarded-host'];
  const requestHost = (forwardedHost || req.headers.host || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  const forwardedProto = req.headers['x-forwarded-proto'];
  const requestProto = (forwardedProto || (req.socket?.encrypted ? 'https' : 'http'))
    .split(',')[0]
    .trim()
    .toLowerCase();

  return Boolean(
    requestHost &&
    origin.host.toLowerCase() === requestHost &&
    origin.protocol === `${requestProto}:` &&
    req.headers['sec-fetch-site'] !== 'cross-site'
  );
}

function staffFor(user, role) {
  return {
    id: user.id,
    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Administrator',
    email: user.email || '',
    role
  };
}

function unauthorized(res, message = 'Your admin session is invalid or expired.') {
  expireAdminSessionCookie(res);
  return send(res, 401, {
    ok: false,
    error: { code: 'SESSION_EXPIRED', message }
  });
}

async function loadFactors(accessToken, refreshToken) {
  const { client } = await getUserSessionClient(accessToken, refreshToken);
  const { data, error } = await client.auth.mfa.listFactors();
  if (error) throw new Error('Unable to check administrator MFA.');
  return data?.totp || [];
}

export async function handleAdminLogin(res, data, dependencies = {}) {
  const services = {
    reserveLoginAttempt,
    verifyAdminCredentials,
    loadFactors,
    enrollAdminTotp,
    confirmAdminTotp,
    createAdminSession,
    resetLoginAttempts,
    ...dependencies
  };
  const email = String(data?.email || '').trim().toLowerCase();
  const password = data?.password;
  const code = data?.code === undefined ? '' : String(data.code).trim();

  if (
    !email ||
    email.length > 254 ||
    typeof password !== 'string' ||
    !password ||
    password.length > 1024 ||
    (code && !/^\d{6}$/.test(code))
  ) {
    return send(res, 400, {
      ok: false,
      error: { code: 'INVALID_INPUT', message: 'Enter a valid email, password, and authenticator code.' }
    });
  }

  const limit = await services.reserveLoginAttempt(email);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(Math.max(1, limit.retryAfterSeconds)));
    return send(res, 429, {
      ok: false,
      error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' }
    });
  }

  const result = await services.verifyAdminCredentials(email, password);
  if (!result.ok) {
    return send(res, 401, {
      ok: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
    });
  }

  const factors = await services.loadFactors(result.session.access_token, result.session.refresh_token);
  const verifiedFactor = factors.find((factor) => factor.status === 'verified');
  const staff = staffFor(result.user, result.role);

  if (!verifiedFactor) {
    if (code) {
      return send(res, 401, {
        ok: false,
        error: { code: 'INVALID_CODE', message: 'Authenticator setup is required.' }
      });
    }

    const enrollment = await services.enrollAdminTotp(result.session.access_token, result.session.refresh_token);
    if (enrollment.alreadyEnrolled || enrollment.nextStep === 'verify') {
      return send(res, 401, {
        ok: false,
        error: {
          code: 'ALREADY_ENROLLED',
          message: 'An authenticator is already enrolled. Enter its code to sign in.'
        }
      });
    }
    if (
      enrollment.nextStep !== 'setup' ||
      !enrollment.factorId ||
      !enrollment.otpauthUri ||
      !enrollment.secret ||
      !enrollment.session?.accessToken ||
      !enrollment.session?.refreshToken
    ) {
      throw new Error('Invalid authenticator enrollment response.');
    }

    await services.createAdminSession(res, {
      userId: result.user.id,
      role: result.role,
      accessToken: enrollment.session.accessToken,
      refreshToken: enrollment.session.refreshToken,
      assuranceLevel: 'aal1',
      email,
      scope: 'setup',
      enrollment: {
        factorId: enrollment.factorId,
        otpauthUri: enrollment.otpauthUri,
        secret: enrollment.secret
      }
    }, 5 * 60);

    return send(res, 200, { ok: true, data: { scope: 'setup', staff } });
  }

  if (!code) {
    return send(res, 401, {
      ok: false,
      error: { code: 'TOTP_REQUIRED', message: 'Enter your authenticator code.' }
    });
  }

  let verified;
  try {
    verified = await services.confirmAdminTotp(
      result.session.access_token,
      result.session.refresh_token,
      verifiedFactor.id,
      code
    );
  } catch {
    return send(res, 401, {
      ok: false,
      error: { code: 'INVALID_CODE', message: 'The authenticator code is invalid or expired.' }
    });
  }

  await services.createAdminSession(res, {
    userId: verified.userId,
    role: verified.role,
    accessToken: verified.accessToken,
    refreshToken: verified.refreshToken,
    assuranceLevel: 'aal2',
    scope: 'full'
  });
  try {
    await services.resetLoginAttempts(limit.identifierHash);
  } catch (error) {
    console.error('Admin login attempt reset failed:', error?.code || 'DATABASE_ERROR');
  }

  return send(res, 200, { ok: true, data: { scope: 'full', staff } });
}

async function handleTotpSetup(req, res) {
  const session = await readAdminSession(req);
  if (
    !session ||
    session.payload.scope !== 'setup' ||
    !session.payload.enrollment ||
    !hasAdminSessionAssurance(session, 'aal1')
  ) {
    if (session) await deleteAdminSession(session);
    return unauthorized(res, 'Start sign-in again to continue authenticator setup.');
  }

  const admin = await getAuthenticatedAdmin(session.payload.accessToken);
  if (!admin || admin.user.id !== session.payload.userId) {
    await deleteAdminSession(session);
    return unauthorized(res);
  }

  return send(res, 200, {
    ok: true,
    data: {
      otpauthUri: session.payload.enrollment.otpauthUri,
      secret: session.payload.enrollment.secret
    }
  });
}

async function handleTotpConfirm(req, res, data) {
  const code = String(data?.code || '').trim();
  if (!/^\d{6}$/.test(code)) {
    return send(res, 400, {
      ok: false,
      error: { code: 'INVALID_INPUT', message: 'Enter the 6-digit authenticator code.' }
    });
  }

  const session = await readAdminSession(req);
  const enrollment = session?.payload.enrollment;
  if (
    !session ||
    session.payload.scope !== 'setup' ||
    !enrollment?.factorId ||
    !hasAdminSessionAssurance(session, 'aal1')
  ) {
    if (session) await deleteAdminSession(session);
    return unauthorized(res, 'Start sign-in again to continue authenticator setup.');
  }

  const limit = await reserveLoginAttempt(session.payload.email);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(Math.max(1, limit.retryAfterSeconds)));
    return send(res, 429, {
      ok: false,
      error: { code: 'RATE_LIMITED', message: 'Too many verification attempts. Try again later.' }
    });
  }

  let verified;
  try {
    verified = await confirmAdminTotp(
      session.payload.accessToken,
      session.payload.refreshToken,
      enrollment.factorId,
      code
    );
  } catch {
    return send(res, 401, {
      ok: false,
      error: { code: 'INVALID_CODE', message: 'The authenticator code is invalid or expired.' }
    });
  }

  await deleteAdminSession(session);
  await createAdminSession(res, {
    userId: verified.userId,
    role: verified.role,
    accessToken: verified.accessToken,
    refreshToken: verified.refreshToken,
    assuranceLevel: 'aal2',
    scope: 'full'
  });
  try {
    await resetLoginAttempts(limit.identifierHash);
  } catch (error) {
    console.error('Admin login attempt reset failed:', error?.code || 'DATABASE_ERROR');
  }

  return send(res, 200, {
    ok: true,
    data: {
      scope: 'full',
      staff: {
        id: verified.userId,
        name: verified.name,
        email: verified.email,
        role: verified.role
      }
    }
  });
}

async function handleMe(req, res) {
  const session = await readAdminSession(req);
  if (!session) return unauthorized(res);

  const isFullSession = session.payload.scope === 'full' &&
    hasAdminSessionAssurance(session, 'aal2');
  const isSetupSession = session.payload.scope === 'setup' &&
    hasAdminSessionAssurance(session, 'aal1');
  if (!isFullSession && !isSetupSession) {
    await deleteAdminSession(session);
    return unauthorized(res);
  }

  const admin = isFullSession
    ? await requireMfaSession(session.payload.accessToken)
    : await getAuthenticatedAdmin(session.payload.accessToken);

  if (!admin || admin.user.id !== session.payload.userId) {
    await deleteAdminSession(session);
    return unauthorized(res);
  }

  return send(res, 200, {
    ok: true,
    data: {
      scope: isSetupSession ? 'setup' : 'full',
      staff: staffFor(admin.user, admin.role)
    }
  });
}

async function handleLogout(req, res) {
  try {
    const session = await readAdminSession(req);
    if (session) await deleteAdminSession(session);
  } finally {
    expireAdminSessionCookie(res);
  }
  return send(res, 200, { ok: true, data: { loggedOut: true } });
}

export default async function handler(req, res) {
  res.setHeader('Allow', 'POST');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return send(res, 405, {
      ok: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' }
    });
  }

  if (!originIsAllowed(req)) {
    return send(res, 403, {
      ok: false,
      error: { code: 'ORIGIN_NOT_ALLOWED', message: 'Request origin is not allowed.' }
    });
  }

  const { action, data } = req.body || {};
  try {
    if (action === 'adminLogin') return await handleAdminLogin(res, data);
    if (action === 'adminTotpSetup') return await handleTotpSetup(req, res);
    if (action === 'adminTotpConfirm') return await handleTotpConfirm(req, res, data);
    if (action === 'adminMe') return await handleMe(req, res);
    if (action === 'adminLogout') return await handleLogout(req, res);

    return send(res, 404, {
      ok: false,
      error: { code: 'UNKNOWN_ACTION', message: 'Unknown authentication action.' }
    });
  } catch (error) {
    console.error('Admin authentication failed:', error?.code || 'INTERNAL_ERROR');
    return send(res, 503, {
      ok: false,
      error: { code: 'AUTH_UNAVAILABLE', message: 'Admin authentication is temporarily unavailable.' }
    });
  }
}