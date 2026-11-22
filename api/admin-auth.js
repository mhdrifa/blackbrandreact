
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

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

  // Authentication is deliberately disabled until
  // credential verification, MFA, authorization,
  // and rate limiting are fully implemented.
  return send(res, 503, {
    ok: false,
    error: {
      code: 'AUTH_NOT_READY',
      message: 'Supabase admin authentication is not enabled yet.'
    }
  });
}
