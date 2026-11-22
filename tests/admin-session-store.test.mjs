import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import {
  createAdminSessionStore,
  decryptAdminSession,
  encryptAdminSession,
  hasAdminSessionAssurance
} from '../api/_lib/admin-session-store.js';

const key = Buffer.alloc(32, 7);

function createDatabase() {
  const rows = new Map();

  return {
    rows,
    from(table) {
      assert.equal(table, 'admin_sessions');
      const query = {
        action: '',
        filters: {},
        select() {
          this.action = 'select';
          return this;
        },
        eq(column, value) {
          this.filters[column] = value;
          return this;
        },
        async maybeSingle() {
          return { data: rows.get(this.filters.session_hash) || null, error: null };
        },
        async insert(row) {
          rows.set(row.session_hash, structuredClone(row));
          return { error: null };
        },
        update(values) {
          this.action = 'update';
          this.values = values;
          return this;
        },
        then(resolve, reject) {
          if (this.action === 'update') {
            const row = rows.get(this.filters.session_hash);
            if (row) Object.assign(row, this.values);
          }
          return Promise.resolve({ error: null }).then(resolve, reject);
        }
      };
      return query;
    }
  };
}

function responseStub() {
  return {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    }
  };
}

function requestFromResponse(res) {
  return {
    headers: {
      cookie: res.headers['Set-Cookie'].split(';')[0]
    }
  };
}

function sessionPayload(assuranceLevel = 'aal2') {
  return {
    userId: 'admin-user-id',
    accessToken: 'access-token-value',
    refreshToken: 'refresh-token-value',
    assuranceLevel,
    scope: assuranceLevel === 'aal2' ? 'full' : 'setup'
  };
}

test('session creation stores only the cookie hash and encrypted state in the existing schema', async () => {
  const database = createDatabase();
  const store = createAdminSessionStore(database, key, () => 1_800_000_000_000);
  const res = responseStub();
  const created = await store.create(res, sessionPayload(), 900);
  const sessionId = decodeURIComponent(res.headers['Set-Cookie'].split(';')[0].split('=')[1]);
  const row = database.rows.get(created.sessionHash);

  assert.equal(created.sessionHash, createHash('sha256').update(sessionId).digest('hex'));
  assert.deepEqual(Object.keys(row).sort(), [
    'assurance_level',
    'created_at',
    'encrypted_auth_state',
    'expires_at',
    'revoked_at',
    'session_hash',
    'updated_at',
    'user_id'
  ]);
  assert.equal(row.assurance_level, 'aal2');
  assert.equal(row.encrypted_auth_state.includes('access-token-value'), false);

  const session = await store.read(requestFromResponse(res));
  assert.equal(session.sessionHash, created.sessionHash);
  assert.equal(session.assuranceLevel, 'aal2');
  assert.deepEqual(session.payload, sessionPayload());
});

test('revoked sessions are timestamped and rejected on lookup', async () => {
  const database = createDatabase();
  const store = createAdminSessionStore(database, key);
  const res = responseStub();
  const created = await store.create(res, sessionPayload());
  const session = await store.read(requestFromResponse(res));

  await store.revoke(session);

  assert.ok(database.rows.get(created.sessionHash).revoked_at);
  assert.equal(await store.read(requestFromResponse(res)), null);
});

test('expired sessions are rejected on lookup', async () => {
  const database = createDatabase();
  let timestamp = 1_800_000_000_000;
  const store = createAdminSessionStore(database, key, () => timestamp);
  const res = responseStub();
  await store.create(res, sessionPayload(), 60);

  timestamp += 60_000;
  assert.equal(await store.read(requestFromResponse(res)), null);
});

test('AAL2 checks reject pending AAL1 sessions', () => {
  const aal1 = { assuranceLevel: 'aal1', payload: sessionPayload('aal1') };
  const aal2 = { assuranceLevel: 'aal2', payload: sessionPayload('aal2') };

  assert.equal(hasAdminSessionAssurance(aal1, 'aal2'), false);
  assert.equal(hasAdminSessionAssurance(aal1, 'aal1'), true);
  assert.equal(hasAdminSessionAssurance(aal2, 'aal2'), true);
});

test('encrypted auth state rejects tampering', () => {
  const payload = sessionPayload();
  const encrypted = encryptAdminSession(payload, key);
  assert.deepEqual(decryptAdminSession(encrypted, key), payload);

  const parts = encrypted.split('.');
  parts[3] = `${parts[3][0] === 'A' ? 'B' : 'A'}${parts[3].slice(1)}`;
  assert.throws(() => decryptAdminSession(parts.join('.'), key));
});