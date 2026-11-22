
import {
  verifyAdminCredentials
} from './_lib/admin-supabase.js';

import {
  reserveLoginAttempt
} from './_lib/admin-rate-limit.js';

function send(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  res.setHeader('Allow', 'POST');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return send(res, 405, {
      ok: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed.'
      }
    });
  }

  const { action, data } = req.body || {};

  if (action !== 'adminLogin') {
    return send(res, 503, {
      ok: false,
      error: {
        code: 'AUTH_NOT_READY',
        message: 'This authentication action is not enabled yet.'
      }
    });
  }

  const email = String(data?.email || '')
    .trim()
    .toLowerCase();

  const password = data?.password;

  if (
    !email ||
    email.length > 254 ||
    typeof password !== 'string' ||
    !password ||
    password.length > 1024
  ) {
    return send(res, 400, {
      ok: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Enter a valid email and password.'
      }
    });
  }

  try {
    // Reserve an attempt before verifying the password.
    const limit = await reserveLoginAttempt(email);

    if (!limit.allowed) {
      res.setHeader(
        'Retry-After',
        String(Math.max(1, limit.retryAfterSeconds))
      );

      return send(res, 429, {
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many login attempts. Try again later.'
        }
      });
    }

    const result = await verifyAdminCredentials(
      email,
      password
    );

    if (!result.ok) {
      return send(res, 401, {
        ok: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    // Password is valid, but MFA has NOT been verified.
    // Never return an AAL1 session to the dashboard.
   return send(res, 503, {
  ok: false,
  error: {
    code: 'AUTH_NOT_READY',
    message: 'Admin authentication is not available yet.'
  }
});

  } catch (error) {
    console.error(
      'Admin authentication failed:',
      error?.code || 'INTERNAL_ERROR'
    );

    return send(res, 503, {
      ok: false,
      error: {
        code: 'AUTH_UNAVAILABLE',
        message: 'Admin authentication is temporarily unavailable.'
      }
    });
  }
}
