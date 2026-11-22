import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleAdminLogin } from '../api/admin-auth.js';

function responseStub() {
  return {
    statusCode: 0,
    body: null,
    setHeader() {},
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('login sends already-enrolled MFA to code verification instead of QR setup', async () => {
  const res = responseStub();
  let createdSessions = 0;
  let resetCount = 0;
  const dependencies = {
    reserveLoginAttempt: async () => ({ allowed: true, identifierHash: 'a'.repeat(64) }),
    verifyAdminCredentials: async () => ({
      ok: true,
      user: { id: 'admin-id', email: 'admin@example.com', user_metadata: {} },
      session: { access_token: 'aal1-access', refresh_token: 'aal1-refresh' },
      role: 'owner'
    }),
    loadFactors: async () => [],
    enrollAdminTotp: async () => ({
      alreadyEnrolled: true,
      nextStep: 'verify',
      factorId: 'factor-id',
      session: { accessToken: 'aal1-access', refreshToken: 'aal1-refresh' }
    }),
    createAdminSession: async () => { createdSessions += 1; },
    resetLoginAttempts: async () => { resetCount += 1; }
  };

  await handleAdminLogin(res, {
    email: 'admin@example.com',
    password: 'valid-password'
  }, dependencies);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'ALREADY_ENROLLED');
  assert.equal(createdSessions, 0);
  assert.equal(resetCount, 0);
});

test('incomplete TOTP setup response cannot create an empty setup session', async () => {
  const res = responseStub();
  let createdSessions = 0;
  const dependencies = {
    reserveLoginAttempt: async () => ({ allowed: true, identifierHash: 'b'.repeat(64) }),
    verifyAdminCredentials: async () => ({
      ok: true,
      user: { id: 'admin-id', email: 'admin@example.com', user_metadata: {} },
      session: { access_token: 'aal1-access', refresh_token: 'aal1-refresh' },
      role: 'owner'
    }),
    loadFactors: async () => [],
    enrollAdminTotp: async () => ({
      alreadyEnrolled: false,
      nextStep: 'setup',
      factorId: 'factor-id',
      session: { accessToken: 'aal1-access', refreshToken: 'aal1-refresh' }
    }),
    createAdminSession: async () => { createdSessions += 1; }
  };

  await assert.rejects(
    handleAdminLogin(res, {
      email: 'admin@example.com',
      password: 'valid-password'
    }, dependencies),
    /Invalid authenticator enrollment response/
  );
  assert.equal(createdSessions, 0);
});

test('successful AAL2 login resets the reserved lockout identifier', async () => {
  const res = responseStub();
  const identifierHash = 'e'.repeat(64);
  const resetHashes = [];
  const createdSessions = [];
  const dependencies = {
    reserveLoginAttempt: async () => ({ allowed: true, identifierHash }),
    verifyAdminCredentials: async () => ({
      ok: true,
      user: { id: 'admin-id', email: 'admin@example.com', user_metadata: {} },
      session: { access_token: 'aal1-access', refresh_token: 'aal1-refresh' },
      role: 'owner'
    }),
    loadFactors: async () => [{ id: 'factor-id', status: 'verified' }],
    enrollAdminTotp: async () => { throw new Error('Enrollment must not run'); },
    confirmAdminTotp: async () => ({
      userId: 'admin-id',
      role: 'owner',
      accessToken: 'aal2-access',
      refreshToken: 'aal2-refresh'
    }),
    createAdminSession: async (_res, payload) => { createdSessions.push(payload); },
    resetLoginAttempts: async (hash) => { resetHashes.push(hash); }
  };

  await handleAdminLogin(res, {
    email: 'admin@example.com',
    password: 'valid-password',
    code: '123456'
  }, dependencies);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.scope, 'full');
  assert.equal(createdSessions[0].assuranceLevel, 'aal2');
  assert.deepEqual(resetHashes, [identifierHash]);
});