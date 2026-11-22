import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { createAdminRateLimiter } from '../api/_lib/admin-rate-limit.js';

function hashEmail(email) {
  return createHash('sha256')
    .update(`black-brand:admin-login:${email}`)
    .digest('hex');
}

test('admin rate limiter calls the existing reserve and reset RPC contracts', async () => {
  const calls = [];
  const database = {
    async rpc(name, args) {
      calls.push({ name, args });
      if (name === 'admin_login_reserve') {
        return {
          data: { allowed: true, attempts_remaining: 4, retry_after_seconds: 0 },
          error: null
        };
      }
      return { data: null, error: null };
    }
  };
  const rateLimiter = createAdminRateLimiter(database);
  const reservation = await rateLimiter.reserveLoginAttempt(' Admin@Example.com ');
  await rateLimiter.resetLoginAttempts(reservation.identifierHash);
  const expectedHash = createHash('sha256')
    .update('black-brand:admin-login:admin@example.com')
    .digest('hex');

  assert.equal(reservation.identifierHash, expectedHash);
  assert.equal(reservation.allowed, true);
  assert.deepEqual(calls, [
    { name: 'admin_login_reserve', args: { p_identifier_hash: expectedHash } },
    { name: 'admin_login_reset', args: { p_identifier_hash: expectedHash } }
  ]);
});

test('three reservations pass and the fourth is rejected until the lock expires', async () => {
  const identifierHash = hashEmail('lockout@example.com');
  const state = { attempts: 0, lockedUntil: 0 };
  let timestamp = 1_800_000_000_000;
  const database = {
    async rpc(name, args) {
      assert.equal(args.p_identifier_hash, identifierHash);
      if (name === 'admin_login_reset') {
        state.attempts = 0;
        state.lockedUntil = 0;
        return { data: null, error: null };
      }
      if (state.lockedUntil > timestamp) {
        return {
          data: {
            allowed: false,
            attempts_remaining: 0,
            retry_after_seconds: Math.ceil((state.lockedUntil - timestamp) / 1000)
          },
          error: null
        };
      }
      if (state.lockedUntil) {
        state.attempts = 0;
        state.lockedUntil = 0;
      }
      if (state.attempts === 3) {
        state.lockedUntil = timestamp + 15 * 60 * 1000;
        return {
          data: { allowed: false, attempts_remaining: 0, retry_after_seconds: 900 },
          error: null
        };
      }
      state.attempts += 1;
      return {
        data: { allowed: true, attempts_remaining: 3 - state.attempts, retry_after_seconds: 0 },
        error: null
      };
    }
  };
  const limiter = createAdminRateLimiter(database);

  for (const remaining of [2, 1, 0]) {
    const result = await limiter.reserveLoginAttempt('lockout@example.com');
    assert.equal(result.allowed, true);
    assert.equal(result.attemptsRemaining, remaining);
  }

  const locked = await limiter.reserveLoginAttempt('lockout@example.com');
  assert.equal(locked.allowed, false);
  assert.equal(locked.retryAfterSeconds, 900);

  timestamp += 15 * 60 * 1000;
  const expired = await limiter.reserveLoginAttempt('lockout@example.com');
  assert.equal(expired.allowed, true);
  assert.equal(expired.attemptsRemaining, 2);
});

test('reset RPC clears the limiter state after successful MFA', async () => {
  const identifierHash = hashEmail('reset@example.com');
  const state = { attempts: 3, lockedUntil: 1_800_000_900_000 };
  const database = {
    async rpc(name, args) {
      assert.equal(args.p_identifier_hash, identifierHash);
      if (name === 'admin_login_reset') {
        state.attempts = 0;
        state.lockedUntil = 0;
        return { data: null, error: null };
      }
      state.attempts += 1;
      return {
        data: {
          allowed: !state.lockedUntil,
          attempts_remaining: 3 - state.attempts,
          retry_after_seconds: state.lockedUntil ? 900 : 0
        },
        error: null
      };
    }
  };
  const limiter = createAdminRateLimiter(database);

  await limiter.resetLoginAttempts(identifierHash);
  const result = await limiter.reserveLoginAttempt('reset@example.com');
  assert.equal(result.allowed, true);
  assert.equal(state.lockedUntil, 0);
  assert.equal(state.attempts, 1);
});