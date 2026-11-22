
import {
  getAdminDatabase,
  getUserSessionClient
} from './admin-supabase.js';

export async function enrollAdminTotp(
  accessToken,
  refreshToken
) {
  const { client, user, session } =
    await getUserSessionClient(
      accessToken,
      refreshToken
    );

  // Verify this user is an active administrator.
  const database = getAdminDatabase();

  const { data: admin, error: adminError } =
    await database
      .from('admin_users')
      .select('role, active')
      .eq('user_id', user.id)
      .maybeSingle();

  if (
    adminError ||
    !admin?.active ||
    !['owner', 'staff'].includes(admin.role)
  ) {
    throw new Error('Unauthorized administrator.');
  }

  // Check existing MFA factors.
  const { data: factors, error: factorsError } =
    await client.auth.mfa.listFactors();

  if (factorsError) {
    throw new Error('Unable to check MFA factors.');
  }

  // Do not create another factor if TOTP
  // is already verified.
  const verifiedTotp =
    factors?.totp?.find(
      (factor) => factor.status === 'verified'
    );

  if (verifiedTotp) {
    return {
      alreadyEnrolled: true,
      session: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token
      }
    };
  }

  // Enroll a new TOTP factor.
  const { data, error } =
    await client.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'BLACK BRAND Admin'
    });

  if (error || !data?.id || !data?.totp) {
    throw new Error('Unable to enroll authenticator.');
  }

  return {
    alreadyEnrolled: false,
    factorId: data.id,
    otpauthUri: data.totp.uri,
    secret: data.totp.secret,
    session: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token
    }
  };
}

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

  // Establish the password-authenticated user session.
  const { client, user } =
    await getUserSessionClient(
      accessToken,
      refreshToken
    );

  // Check that the user is still an active administrator.
  const database = getAdminDatabase();

  const { data: admin, error: adminError } =
    await database
      .from('admin_users')
      .select('role, active')
      .eq('user_id', user.id)
      .maybeSingle();

  if (
    adminError ||
    !admin?.active ||
    !['owner', 'staff'].includes(admin.role)
  ) {
    throw new Error('Unauthorized administrator.');
  }

  // Confirm that this factor belongs to the user.
  const { data: factors, error: factorsError } =
    await client.auth.mfa.listFactors();

  if (factorsError) {
    throw new Error('Unable to check authenticator.');
  }

  const factor = [
    ...(factors?.totp || []),
    ...(factors?.all || [])
  ].find(
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

  // Verify the six-digit Google Authenticator code.
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

  // Verify the new access token's authentication level.
  const { data: aalData, error: aalError } =
    await client.auth.mfa.getAuthenticatorAssuranceLevel();

  if (
    aalError ||
    aalData?.currentLevel !== 'aal2'
  ) {
    throw new Error('MFA verification is incomplete.');
  }

  return {
    accessToken: verified.access_token,
    refreshToken: verified.refresh_token,
    role: admin.role,
    userId: user.id,
    scope: 'full'
  };
}
