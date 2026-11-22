
import { getAuthClient, getAdminDatabase } from './admin-supabase.js';

export async function getAuthenticatedAdmin(accessToken) {
  if (!accessToken || typeof accessToken !== 'string') {
    return null;
  }

  const auth = getAuthClient();

  const { data, error } = await auth.auth.getUser(accessToken);

  if (error || !data?.user) {
    return null;
  }

  const database = getAdminDatabase();

  const { data: admin, error: adminError } = await database
    .from('admin_users')
    .select('user_id, role, active')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (
    adminError ||
    !admin?.active ||
    !['owner', 'staff'].includes(admin.role)
  ) {
    return null;
  }

  return {
    user: data.user,
    role: admin.role
  };
}

export async function requireMfaSession(accessToken) {
  const admin = await getAuthenticatedAdmin(accessToken);

  if (!admin) {
    return null;
  }

  // Do not trust a token's decoded payload without verification.
  // getUser() above verifies the token with Supabase Auth.
  const payload = JSON.parse(
    Buffer.from(accessToken.split('.')[1], 'base64url')
      .toString('utf8')
  );

  if (payload.aal !== 'aal2') {
    return null;
  }

  return admin;
}
