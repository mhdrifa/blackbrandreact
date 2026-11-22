
import { createClient } from '@supabase/supabase-js';

function send(res, status, payload) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  res.setHeader('Allow', 'POST');

  if (req.method !== 'POST') {
    return send(res, 405, {
      ok: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed.'
      }
    });
  }

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    return send(res, 503, {
      ok: false,
      error: {
        code: 'CONFIGURATION_ERROR',
        message: 'Supabase backend configuration is missing.'
      }
    });
  }

  try {
    const supabase = createClient(url, secretKey, {
      db: { schema: 'black_brand' },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Read-only database connection test.
    const { error } = await supabase
      .from('admin_users')
      .select('user_id')
      .limit(1);

    if (error) {
      console.error('Admin database connection failed:', error.code);

      return send(res, 503, {
        ok: false,
        error: {
          code: 'DATABASE_CONNECTION_FAILED',
          message: 'Admin database connection failed.'
        }
      });
    }

    // Login remains disabled.
    return send(res, 503, {
      ok: false,
      error: {
        code: 'AUTH_NOT_READY',
        message: 'Database connected. Admin login is not enabled yet.'
      }
    });
  } catch (error) {
    console.error('Admin auth initialization failed');

    return send(res, 500, {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to initialize admin authentication.'
      }
    });
  }
}
