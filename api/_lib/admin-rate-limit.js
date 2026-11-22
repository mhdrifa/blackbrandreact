
import { createHash } from 'node:crypto';
import { getAdminDatabase } from './admin-supabase.js';

function hashIdentifier(value) {
  return createHash('sha256')
    .update(value)
    .digest('hex');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export async function reserveLoginAttempt(email) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || normalizedEmail.length > 254) {
    throw new Error('Invalid login identifier.');
  }

  const identifierHash = hashIdentifier(
    `black-brand:admin-login:${normalizedEmail}`
  );

  const database = getAdminDatabase();

  const { data, error } = await database.rpc(
    'admin_login_reserve',
    {
      p_identifier_hash: identifierHash
    }
  );

  if (error) {
    console.error('Admin login rate limit failed:', error.code);
    throw new Error('Login temporarily unavailable.');
  }

  const result = Array.isArray(data) ? data[0] : data;

  if (!result || typeof result.allowed !== 'boolean') {
    throw new Error('Invalid rate-limit response.');
  }

  return {
    allowed: result.allowed,
    attemptsRemaining: result.attempts_remaining,
    retryAfterSeconds: result.retry_after_seconds,
    identifierHash
  };
}

export async function resetLoginAttempts(identifierHash) {
  const database = getAdminDatabase();

  const { error } = await database.rpc('admin_login_reset', {
    p_identifier_hash: identifierHash
  });

  if (error) {
    console.error('Admin login reset failed:', error.code);
    throw new Error('Unable to reset login attempts.');
  }
}
