
const COOKIE_NAME = '__Host-bb_admin_session';

const COOKIE_OPTIONS = [
  'Path=/',
  'HttpOnly',
  'Secure',
  'SameSite=Strict'
];

function serializeCookie(name, value, maxAge) {
  return [
    `${name}=${encodeURIComponent(value)}`,
    ...COOKIE_OPTIONS,
    `Max-Age=${maxAge}`
  ].join('; ');
}

export function setAdminSessionCookie(
  res,
  sessionId,
  maxAgeSeconds = 900
) {
  if (
    typeof sessionId !== 'string' ||
    !/^[a-f0-9]{64}$/.test(sessionId)
  ) {
    throw new Error('Invalid session identifier.');
  }

  res.setHeader(
    'Set-Cookie',
    serializeCookie(
      COOKIE_NAME,
      sessionId,
      maxAgeSeconds
    )
  );
}

export function clearAdminSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    serializeCookie(COOKIE_NAME, '', 0)
  );
}

export function readAdminSessionCookie(req) {
  const raw = req.headers.cookie || '';

  const cookie = raw
    .split(';')
    .map((part) => part.trim())
    .find((part) =>
      part.startsWith(`${COOKIE_NAME}=`)
    );

  if (!cookie) return null;

  try {
    const value = decodeURIComponent(
      cookie.slice(COOKIE_NAME.length + 1)
    );

    return /^[a-f0-9]{64}$/.test(value)
      ? value
      : null;
  } catch {
    return null;
  }
}
