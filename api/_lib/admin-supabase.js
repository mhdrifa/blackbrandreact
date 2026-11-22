
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

const authOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
};

export function getAdminDatabase() {
  if (!url || !secretKey) {
    throw new Error('Supabase backend configuration is missing.');
  }

  return createClient(url, secretKey, {
    ...authOptions,
    db: { schema: 'black_brand' }
  });
}

export function getAuthClient() {
  if (!url || !publishableKey) {
    throw new Error('Supabase authentication configuration is missing.');
  }

  return createClient(url, publishableKey, authOptions);
}

export async function verifyAdminCredentials(email, password) {
  const auth = getAuthClient();

  const { data, error } = await auth.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data?.user || !data?.session) {
    return {
      ok: false,
      code: 'INVALID_CREDENTIALS'
    };
  }

  const database = getAdminDatabase();

  const { data: admin, error: adminError } = await database
    .from('admin_users')
    .select('user_id, role, active')
    .eq('user_id', data.user.id)
    .maybeSingle();

  if (adminError || !admin?.active ||
      !['owner', 'staff'].includes(admin.role)) {
    await auth.auth.signOut();

    return {
      ok: false,
      code: 'UNAUTHORIZED'
    };
  }

  return {
    ok: true,
    user: data.user,
    session: data.session,
    role: admin.role,
    auth
  };
}
