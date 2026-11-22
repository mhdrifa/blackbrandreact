
import {
  getAdminDatabase,
  getUserSessionClient
} from './admin-supabase.js';

// =====================================================
// VERIFY ACTIVE ADMINISTRATOR
// =====================================================

async function verifyActiveAdmin(userId) {
  const database = getAdminDatabase();

  const { data: admin, error } = await database
    .from('admin_users')
    .select('user_id, role, active')
    .eq('user_id', userId)
    .maybeSingle();

  if (
    error ||
    !admin?.active ||
    !['owner', 'staff'].includes(admin.role)
  ) {
    throw new Error('Unauthorized administrator.');
  }

  return admin;
}

// =====================================================
// ENROLL GOOGLE AUTHENTICATOR
// =====================================================

export async function enrollAdminTotp(
  accessToken,
  refreshToken
) {
  // Establish the authenticated Supabase session.
  const { client, user, session } =
    await getUserSessionClient(
      accessToken,
      refreshToken
    );

  // Only active administrators can enroll MFA.
  await verifyActiveAdmin(user.id);

  // Check existing MFA factors.
  const { data: factors, error: factorsError } =
    await client.auth.mfa.listFactors();

  if (factorsError) {
    throw new Error('Unable to check MFA factors.');
  }

  // Prevent duplicate verified TOTP enrollment.
  const verifiedTotp = factors?.totp?.find(
    (factor) => factor.status === 'verified'
  );

  if (verifiedTotp) {
    return {
      alreadyEnrolled: true,
      nextStep: 'verify',
      factorId: verifiedTotp.id,
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token
      }
    };
  }

  // Create a new TOTP enrollment.
  const { data, error } =
    await client.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'BLACK BRAND Admin'
    });

  if (
    error ||
    !data?.id ||
    !data?.totp?.uri ||
    !data?.totp?.secret
  ) {
    throw new Error('Unable to enroll authenticator.');
  }

  return {
    alreadyEnrolled: false,
    nextStep: 'setup',
    factorId: data.id,
    otpauthUri: data.totp.uri,
    secret: data.totp.secret,
    session: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token
    }
  };
}

// =====================================================
// CONFIRM GOOGLE AUTHENTICATOR CODE
// =====================================================

export async function confirmAdminTotp(
  accessToken,
  refreshToken,
  factorId,
  code
) {
  if (
    typeof factorId !== 'string' ||
    !factorId ||
    !/^\d{6}$/.test(String(code || ''))
  ) {
    throw new Error('Invalid authenticator request.');
  }

  // Establish the password-authenticated session.
  const { client, user } =
    await getUserSessionClient(
      accessToken,
      refreshToken
    );

  // Verify that this is still an active admin.
  const admin = await verifyActiveAdmin(user.id);

  // Find the user's TOTP factor.
  const { data: factors, error: factorsError } =
    await client.auth.mfa.listFactors();

  if (factorsError) {
    throw new Error('Unable to check authenticator.');
  }

  const factor = factors?.all?.find(
    (item) =>
      item.id === factorId &&
      item.factor_type === 'totp'
  );

  if (!factor) {
    throw new Error('Authenticator factor not found.');
  }

  // Create an MFA challenge.
  const { data: challenge, error: challengeError } =
    await client.auth.mfa.challenge({
      factorId
    });

  if (challengeError || !challenge?.id) {
    throw new Error('Unable to create MFA challenge.');
  }

  // Verify the six-digit authenticator code.
  const { data: verified, error: verifyError } =
    await client.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: String(code)
    });

  if (
    verifyError ||
    !verified?.access_token ||
    !verified?.refresh_token
  ) {
    throw new Error('Invalid authenticator code.');
  }

  // Establish the newly verified session.
  const { data: sessionData, error: sessionError } =
    await client.auth.setSession({
      access_token: verified.access_token,
      refresh_token: verified.refresh_token
    });

  if (sessionError || !sessionData?.session) {
    throw new Error('Unable to establish MFA session.');
  }

  // Confirm that the session has MFA assurance level AAL2.
  const { data: aalData, error: aalError } =
    await client.auth.mfa.getAuthenticatorAssuranceLevel();

  if (
    aalError ||
    aalData?.currentLevel !== 'aal2'
  ) {
    throw new Error('MFA verification is incomplete.');
  }

  return {
    accessToken: sessionData.session.access_token,
    refreshToken: sessionData.session.refresh_token,
    role: admin.role,
    userId: user.id,
    email: user.email || '',
    name: user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Administrator',
    scope: 'full'
  };
}
