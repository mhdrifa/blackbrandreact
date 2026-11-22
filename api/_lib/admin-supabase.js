
import { createClient } from '@supabase/supabase-js';

// =====================================================
// SUPABASE ENVIRONMENT CONFIGURATION
// =====================================================

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

// =====================================================
// SUPABASE AUTH OPTIONS
// =====================================================

const authOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
};

// =====================================================
// ADMIN DATABASE CLIENT (SERVER ONLY)
// =====================================================

export function getAdminDatabase() {
  if (!url || !secretKey) {
    throw new Error(
      'Supabase backend configuration is missing.'
    );
  }

  return createClient(url, secretKey, {
    ...authOptions,
    db: {
      schema: 'black_brand'
    }
  });
}

// =====================================================
// SUPABASE AUTH CLIENT
// =====================================================

export function getAuthClient() {
  if (!url || !publishableKey) {
    throw new Error(
      'Supabase authentication configuration is missing.'
    );
  }

  return createClient(
    url,
    publishableKey,
    authOptions
  );
}

// =====================================================
// VERIFY ADMIN EMAIL AND PASSWORD
// =====================================================

export async function verifyAdminCredentials(email, password) {
  const auth = getAuthClient();

  const { data, error } =
    await auth.auth.signInWithPassword({
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

  const { data: admin, error: adminError } =
    await database
      .from('admin_users')
      .select('user_id, role, active')
      .eq('user_id', data.user.id)
      .maybeSingle();

  if (
    adminError ||
    !admin?.active ||
    !['owner', 'staff'].includes(admin.role)
  ) {
    await auth.auth.signOut().catch(() => {});

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

// =====================================================
// CREATE AUTHENTICATED USER SESSION CLIENT
// REQUIRED FOR SUPABASE MFA
// =====================================================

export async function getUserSessionClient(
  accessToken,
  refreshToken
) {
  if (!url || !publishableKey) {
    throw new Error(
      'Supabase authentication configuration is missing.'
    );
  }

  if (
    typeof accessToken !== 'string' ||
    !accessToken ||
    typeof refreshToken !== 'string' ||
    !refreshToken
  ) {
    throw new Error(
      'A valid authentication session is required.'
    );
  }

  // Separate client for each authenticated request.
  const client = createClient(
    url,
    publishableKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );

  // Attach and validate the authenticated session.
  const { data, error } =
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

  if (
    error ||
    !data?.session ||
    !data?.user
  ) {
    throw new Error(
      'Authentication session is invalid or expired.'
    );
  }

  return {
    client,
    session: data.session,
    user: data.user
  };
}
