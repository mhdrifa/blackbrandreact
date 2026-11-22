import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes
} from 'node:crypto';
import { getAdminDatabase } from './admin-supabase.js';
import {
  clearAdminSessionCookie,
  readAdminSessionCookie,
  setAdminSessionCookie
} from './admin-cookies.js';

const SESSION_TTL_SECONDS = 15 * 60;
const SESSION_TABLE = 'admin_sessions';
const ASSURANCE_LEVELS = new Set(['aal1', 'aal2']);

function getEncryptionKey() {
  const configured = process.env.ADMIN_SESSION_ENCRYPTION_KEY || '';
  const key = /^[a-f0-9]{64}$/i.test(configured)
    ? Buffer.from(configured, 'hex')
    : Buffer.from(configured, 'base64');

  if (key.length !== 32) {
    throw new Error('Admin session encryption is not configured.');
  }

  return key;
}

export function encryptAdminSession(payload, key = getEncryptionKey()) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final()
  ]);

  return [
    'v1',
    nonce.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url')
  ].join('.');
}

export function decryptAdminSession(value, key = getEncryptionKey()) {
  if (typeof value !== 'string') {
    throw new Error('Invalid encrypted admin session.');
  }

  const [version, nonceValue, tagValue, encryptedValue, ...extra] = value.split('.');
  if (version !== 'v1' || !nonceValue || !tagValue || !encryptedValue || extra.length) {
    throw new Error('Invalid encrypted admin session.');
  }

  const nonce = Buffer.from(nonceValue, 'base64url');
  const tag = Buffer.from(tagValue, 'base64url');
  const encrypted = Buffer.from(encryptedValue, 'base64url');
  if (nonce.length !== 12 || tag.length !== 16 || !encrypted.length) {
    throw new Error('Invalid encrypted admin session.');
  }

  const decipher = createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8');

  return JSON.parse(plaintext);
}

function hashSessionId(sessionId) {
  return createHash('sha256').update(sessionId).digest('hex');
}

export function hasAdminSessionAssurance(session, assuranceLevel) {
  return ASSURANCE_LEVELS.has(assuranceLevel) &&
    session?.assuranceLevel === assuranceLevel &&
    session?.payload?.assuranceLevel === assuranceLevel;
}

export function createAdminSessionStore(database, encryptionKey, now = Date.now) {
  if (!database || !Buffer.isBuffer(encryptionKey) || encryptionKey.length !== 32) {
    throw new Error('Admin session store configuration is invalid.');
  }

  async function create(res, payload, ttlSeconds = SESSION_TTL_SECONDS) {
    const assuranceLevel = payload?.assuranceLevel;
    if (!ASSURANCE_LEVELS.has(assuranceLevel)) {
      throw new Error('Invalid admin session assurance level.');
    }
    if (!payload.userId || !payload.accessToken || !payload.refreshToken) {
      throw new Error('Invalid admin session state.');
    }
    if (!Number.isInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > SESSION_TTL_SECONDS) {
      throw new Error('Invalid admin session lifetime.');
    }

    const timestamp = now();
    const sessionId = randomBytes(32).toString('hex');
    const sessionHash = hashSessionId(sessionId);
    const expiresAt = new Date(timestamp + ttlSeconds * 1000).toISOString();
    const { error } = await database.from(SESSION_TABLE).insert({
      session_hash: sessionHash,
      user_id: payload.userId,
      assurance_level: assuranceLevel,
      encrypted_auth_state: encryptAdminSession(payload, encryptionKey),
      created_at: new Date(timestamp).toISOString(),
      expires_at: expiresAt,
      revoked_at: null,
      updated_at: new Date(timestamp).toISOString()
    });

    if (error) {
      console.error('Admin session insert failed:', error.code || 'DATABASE_ERROR');
      throw new Error('Unable to create admin session.');
    }

    setAdminSessionCookie(res, sessionId, ttlSeconds);
    return { sessionId, sessionHash, expiresAt, ttlSeconds };
  }

  async function read(req) {
    const sessionId = readAdminSessionCookie(req);
    if (!sessionId) return null;

    const sessionHash = hashSessionId(sessionId);
    const { data: row, error } = await database
      .from(SESSION_TABLE)
      .select('session_hash, user_id, assurance_level, encrypted_auth_state, expires_at, revoked_at')
      .eq('session_hash', sessionHash)
      .maybeSingle();

    if (error) {
      console.error('Admin session lookup failed:', error.code || 'DATABASE_ERROR');
      throw new Error('Unable to read admin session.');
    }

    const expiresAt = row?.expires_at ? Date.parse(row.expires_at) : NaN;
    if (!row || row.revoked_at || !Number.isFinite(expiresAt) || expiresAt <= now()) {
      return null;
    }

    if (!ASSURANCE_LEVELS.has(row.assurance_level)) return null;

    let payload;
    try {
      payload = decryptAdminSession(row.encrypted_auth_state, encryptionKey);
    } catch {
      await revoke({ sessionHash });
      return null;
    }

    if (
      payload.userId !== row.user_id ||
      payload.assuranceLevel !== row.assurance_level ||
      !payload.accessToken ||
      !payload.refreshToken
    ) {
      await revoke({ sessionHash });
      return null;
    }

    return {
      sessionId,
      sessionHash,
      assuranceLevel: row.assurance_level,
      payload,
      expiresAt: row.expires_at
    };
  }

  async function revoke(session) {
    if (!session?.sessionHash) return;
    const timestamp = new Date(now()).toISOString();
    const { error } = await database
      .from(SESSION_TABLE)
      .update({ revoked_at: timestamp, updated_at: timestamp })
      .eq('session_hash', session.sessionHash);

    if (error) {
      console.error('Admin session revocation failed:', error.code || 'DATABASE_ERROR');
      throw new Error('Unable to end admin session.');
    }
  }

  return { create, read, revoke };
}

function getStore() {
  return createAdminSessionStore(getAdminDatabase(), getEncryptionKey());
}

export async function createAdminSession(res, payload, ttlSeconds) {
  return getStore().create(res, payload, ttlSeconds);
}

export async function readAdminSession(req) {
  return getStore().read(req);
}

export async function deleteAdminSession(session) {
  return getStore().revoke(session);
}

export function expireAdminSessionCookie(res) {
  clearAdminSessionCookie(res);
}