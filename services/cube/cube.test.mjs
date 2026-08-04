/**
 * Tests for cube.js — the Cube.js server config.
 *
 * Two behaviours here are load-bearing for row-level security, and neither is
 * obvious from reading the config:
 *
 *  1. `contextToAppId` keys the compiled-schema cache. Cube generates cube SQL
 *     at *compile* time from COMPILE_CONTEXT, so if two callers share an app
 *     id they share the generated security predicates — whoever compiled first
 *     defines row-level security for everyone else with that key. The tests
 *     below pin the property that actually matters: two different users of the
 *     same client must never collide.
 *
 *  2. `checkAuth` unwraps the JWT's `u` key. Without it, Cube only extracts `u`
 *     at query time and COMPILE_CONTEXT sees the raw payload — leaving
 *     `securityContext.clientId` undefined and every cube falling back to
 *     `WHERE 1 = 0`, which looks like "analytics is empty" rather than an error.
 *
 * cube.js is CommonJS (Node evaluates it directly, unlike model/*.js which
 * Cube's schema compiler transpiles), so it is loaded with createRequire.
 *
 * Run: yarn --cwd services/cube test
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import jwt from 'jsonwebtoken';

const require = createRequire(import.meta.url);
const config = require('./cube.js');

const CLIENT_A = '11111111-1111-4111-8111-111111111111';
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const appId = (securityContext) => config.contextToAppId({ securityContext });

test('two users of the SAME client never share a compiled schema', () => {
  // The cross-user leak this key exists to prevent: same client, different
  // property access, so their generated SQL differs and must not be shared.
  const a = appId({ clientId: CLIENT_A, clientUserId: USER_A });
  const b = appId({ clientId: CLIENT_A, clientUserId: USER_B });
  assert.notEqual(a, b);
});

test('the same caller gets a stable key, so the cache actually hits', () => {
  const first = appId({ clientId: CLIENT_A, clientUserId: USER_A });
  const second = appId({ clientId: CLIENT_A, clientUserId: USER_A });
  assert.equal(first, second);
});

test('different clients never share a compiled schema', () => {
  const other = '22222222-2222-4222-8222-222222222222';
  assert.notEqual(
    appId({ clientId: CLIENT_A, clientUserId: USER_A }),
    appId({ clientId: other, clientUserId: USER_A }),
  );
});

test('a malformed client-user id collapses to the same key as no id', () => {
  // Must agree with propertyScopeSql, which fails closed to FALSE for exactly
  // these inputs — otherwise a key could promise SQL the schema does not carry.
  const none = appId({ clientId: CLIENT_A });
  for (const clientUserId of ['', 'not-a-uuid', 42, null, "' OR 1=1 --"]) {
    assert.equal(appId({ clientId: CLIENT_A, clientUserId }), none);
  }
});

test('a missing security context still produces a usable key', () => {
  assert.equal(typeof appId(undefined), 'string');
  assert.ok(appId(undefined).length > 0);
  assert.equal(config.contextToAppId({}), appId(undefined));
});

test('claims the schema no longer reads do not fragment the cache', () => {
  // `unrestricted` was removed from the token; a stale or forged one must not
  // silently mint a second compiled schema for the same caller.
  assert.equal(
    appId({ clientId: CLIENT_A, clientUserId: USER_A, unrestricted: true }),
    appId({ clientId: CLIENT_A, clientUserId: USER_A }),
  );
});

test('checkAuth unwraps the `u` claim into the security context', () => {
  const secret = 'test-secret-not-a-real-key';
  const previous = process.env.CUBEJS_API_SECRET;
  process.env.CUBEJS_API_SECRET = secret;
  try {
    const token = jwt.sign(
      { u: { clientId: CLIENT_A, clientUserId: USER_A } },
      secret,
    );
    const req = {};
    config.checkAuth(req, token);
    // Unwrapped — not left nested under `u`, which is what made every cube
    // fall back to WHERE 1 = 0 at compile time.
    assert.equal(req.securityContext.clientId, CLIENT_A);
    assert.equal(req.securityContext.clientUserId, USER_A);
  } finally {
    if (previous === undefined) delete process.env.CUBEJS_API_SECRET;
    else process.env.CUBEJS_API_SECRET = previous;
  }
});

test('checkAuth falls back to the raw payload when there is no `u`', () => {
  const secret = 'test-secret-not-a-real-key';
  const previous = process.env.CUBEJS_API_SECRET;
  process.env.CUBEJS_API_SECRET = secret;
  try {
    const token = jwt.sign({ clientId: CLIENT_A, clientUserId: USER_A }, secret);
    const req = {};
    config.checkAuth(req, token);
    assert.equal(req.securityContext.clientId, CLIENT_A);
  } finally {
    if (previous === undefined) delete process.env.CUBEJS_API_SECRET;
    else process.env.CUBEJS_API_SECRET = previous;
  }
});

test('checkAuth rejects a token signed with the wrong secret', () => {
  const previous = process.env.CUBEJS_API_SECRET;
  process.env.CUBEJS_API_SECRET = 'the-real-secret';
  try {
    const forged = jwt.sign({ u: { clientId: CLIENT_A } }, 'not-the-secret');
    assert.throws(() => config.checkAuth({}, forged));
  } finally {
    if (previous === undefined) delete process.env.CUBEJS_API_SECRET;
    else process.env.CUBEJS_API_SECRET = previous;
  }
});
