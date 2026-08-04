/**
 * Tests for the cube row-level-security helpers.
 *
 * `scope.js` uses ESM `export` because Cube's schema compiler transpiles model
 * files, but `services/cube/package.json` has no `"type": "module"`, so plain
 * Node would treat a `.js` file as CommonJS and choke on `export`. Loading the
 * real source through a data: URL sidesteps that without changing how Cube
 * sees the file — and still tests the actual shipped code, not a copy.
 *
 * Run: node --test services/cube/model/
 */
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

const src = await readFile(new URL('./scope.js', import.meta.url), 'utf8');
const { propertyScopeSql, scopeClientUserId } = await import(
  `data:text/javascript;base64,${Buffer.from(src).toString('base64')}`
);

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const norm = (s) => s.replace(/\s+/g, ' ').trim();

test('one predicate covers both access paths — no owner special case', () => {
  const sql = norm(propertyScopeSql({ clientUserId: USER }, 'u.property_id::text'));
  // Path 1: owners reach their whole client, even with zero explicit grants.
  assert.match(sql, /EXISTS \( SELECT 1 FROM client_users cu/);
  assert.match(sql, /cu\.role = 'OWNER'/);
  // Path 2: everyone else goes through explicit grants.
  assert.match(sql, /IN \( SELECT cup\.property_id::text FROM client_user_properties cup/);
  assert.match(sql, /OR \(u\.property_id::text\)/);
});

test('the predicate is constant-size regardless of portfolio size', () => {
  const sql = propertyScopeSql({ clientUserId: USER }, 'u.property_id::text');
  assert.ok(sql.length < 500, `predicate should stay small, got ${sql.length}`);
  // Same caller, different cube expression — size tracks the expression only.
  const other = propertyScopeSql({ clientUserId: USER }, 'x');
  assert.equal(
    sql.length - other.length,
    'u.property_id::text'.length - 'x'.length,
  );
});

test('soft-deleted grants and soft-deleted users do not count', () => {
  const sql = norm(propertyScopeSql({ clientUserId: USER }, 'x'));
  assert.match(sql, /cu\.deleted_at IS NULL/);
  assert.match(sql, /cup\.deleted_at IS NULL/);
});

test('a missing or malformed client-user id fails closed', () => {
  for (const clientUserId of [
    undefined,
    null,
    '',
    42,
    'not-a-uuid',
    "' OR 1=1 --",
    `${USER}' OR '1'='1`,
    `${USER}'); DROP TABLE properties; --`,
  ]) {
    assert.equal(propertyScopeSql({ clientUserId }, 'x'), 'FALSE');
  }
});

test('a missing or empty security context matches nothing', () => {
  assert.equal(propertyScopeSql(undefined, 'x'), 'FALSE');
  assert.equal(propertyScopeSql({}, 'x'), 'FALSE');
});

test('no policy is read from the token — only identity', () => {
  // A forged `unrestricted`/`role` claim must not widen anything: role now
  // comes from client_users, so these claims are inert.
  const forged = propertyScopeSql(
    { clientUserId: USER, unrestricted: true, role: 'OWNER' },
    'x',
  );
  const plain = propertyScopeSql({ clientUserId: USER }, 'x');
  assert.equal(forged, plain);
});

test('scopeClientUserId only accepts a well-formed uuid', () => {
  assert.equal(scopeClientUserId({ clientUserId: USER }), USER);
  assert.equal(scopeClientUserId({ clientUserId: 'nope' }), null);
  assert.equal(scopeClientUserId({}), null);
});

test('a caller with zero grants needs no special case', () => {
  // Previously an explicit "empty list -> FALSE" branch existed because an
  // empty SQL IN () is a client-wide leak. With a subquery there is no list:
  // no matching rows is already false, so the dangerous branch is gone.
  const sql = propertyScopeSql({ clientUserId: USER }, 'x');
  assert.ok(!sql.includes('IN ()'), 'must never emit an empty IN list');
});
