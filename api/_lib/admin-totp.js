
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
