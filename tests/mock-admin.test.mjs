import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'vite';

test('sandbox admin login and 2FA enrollment return usable sessions', async () => {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
  const server = await createServer({
    configFile: false,
    plugins: [],
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'error',
    define: { __ALLOW_MOCK__: 'true' }
  });
  try {
    const { mockPost, resetMockDb } = await server.ssrLoadModule('/src/services/mockBackend.js');
    resetMockDb();
    const owner = await mockPost('adminLogin', { email: 'owner@sandbox.test', password: 'SandboxOwner123!' });
    assert.equal(owner.scope, 'full');
    assert.equal(owner.staff.role, 'owner');

    const setupLogin = await mockPost('adminLogin', { email: 'setup@sandbox.test', password: 'SandboxSetup123!' });
    assert.equal(setupLogin.scope, 'setup');
    const auth = { token: setupLogin.token };
    const setup = await mockPost('adminTotpSetup', {}, auth);
    assert.ok(setup.otpauthUri.startsWith('otpauth://'));
    await assert.rejects(mockPost('adminTotpConfirm', { code: '000000' }, auth), { code: 'INVALID_CODE' });
    const confirmed = await mockPost('adminTotpConfirm', { code: '123456' }, auth);
    assert.equal(confirmed.scope, 'full');
    const me = await mockPost('adminMe', {}, { token: confirmed.token });
    assert.equal(me.scope, 'full');
  } finally {
    await server.close();
    delete globalThis.localStorage;
  }
});
