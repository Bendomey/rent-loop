/**
 * Shared row-level-security helpers for every cube.
 *
 * Cubes were originally scoped on `securityContext.clientId` alone, which is
 * only half of what the Go API enforces. On the REST side,
 * `InjectPropertyAccessScopeMiddleware` gives OWNER users access to their whole
 * client and restricts every other role (ADMIN/MANAGER/STAFF) to the properties
 * they hold explicit `client_user_properties` rows for. A cube filtered on
 * clientId only therefore aggregated across properties the caller could not
 * open through the API — the count/amount leaked, even though the underlying
 * rows were unreachable.
 *
 * The scope is resolved the way the REST repository layer resolves it: live
 * subqueries at query time. The analytics JWT carries only
 * `{ clientId, clientUserId }` — pure identity, no policy, no resolved sets.
 *
 * Why the id and not a resolved property list: embedding the list makes the
 * token grow with the caller's portfolio (a 500-property manager is ~18KB of
 * UUIDs, past the 8KB header buffer most proxies default to), bloats every
 * compiled schema with the same literal, forces a separate compiled schema per
 * distinct property set, and freezes permissions for the token's lifetime.
 * These predicates are constant-size and reflect grants, revocations and role
 * changes immediately.
 *
 * IMPORTANT — import path: cube files import this as `'./scope'`, NOT
 * `'../scope'`, even though they live one directory down in `model/cubes/`.
 * Cube's schema compiler resolves imports relative to the **model root**, not
 * relative to the importing file. `'../scope'` escapes the model directory,
 * falls through to Node's `require`, and fails with
 * `Cannot find module '<repo>/services/cube/scope'` — which aborts compilation
 * of the *entire* schema, so every cube in every dashboard starts returning
 * errors, not just the ones that changed. There is a test in
 * `cube.test.mjs` pinning the specifier for exactly this reason.
 *
 * IMPORTANT: `cube.js`'s `contextToAppId` must also key on `clientUserId`, or
 * Cube caches one compiled schema per *client* and the first caller's scope is
 * reused for everyone else in that client. That half lives in `cube.js` and is
 * deliberately self-contained — `cube.js` is plain CommonJS evaluated by Node,
 * while this file is evaluated by Cube's schema compiler (hence `export`), so
 * the two cannot share a module. Keep them consistent by intent, not import.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The caller's client-user id, or null when absent or malformed.
 *
 * It arrives inside a JWT this backend signed, so it is already trusted; it is
 * re-validated because it is interpolated straight into SQL, and this helper
 * is the one place that check is guaranteed to run for all 8 cubes.
 */
export const scopeClientUserId = (securityContext) => {
  const id = securityContext?.clientUserId;
  return typeof id === 'string' && UUID_RE.test(id) ? id : null;
};

/**
 * A SQL boolean fragment restricting rows to the properties the caller may
 * reach. `propertyIdSql` is the expression yielding a property id as text in
 * that cube's FROM clause — cubes reach it differently (a direct column, a
 * join alias, or a correlated subquery for the money cubes).
 *
 * Two access paths, expressed as one predicate rather than a flag plus a
 * special case:
 *   1. OWNER — reaches every property of their client. Owners generally have
 *      no `client_user_properties` rows at all (nobody links an owner to their
 *      own portfolio), so a membership-only check would show them nothing.
 *   2. Everyone else — explicit grants in `client_user_properties`.
 *
 * The cube's own `p.client_id = '<clientId>'` predicate already bounds every
 * row to the caller's client, so branch 1 does not need to re-check tenancy;
 * it only asks whether this user is an owner.
 *
 * The OWNER branch is an *uncorrelated* EXISTS — it references no column of
 * the outer query — so Postgres hoists it into an InitPlan and evaluates it
 * once per query, not once per row.
 *
 * A caller with no usable id yields FALSE: fail closed. Note there is no
 * "empty property list" case to get wrong any more — a restricted caller with
 * zero grants produces a subquery with no rows, which is already false.
 */
export const propertyScopeSql = (securityContext, propertyIdSql) => {
  const clientUserId = scopeClientUserId(securityContext);
  if (!clientUserId) return 'FALSE';
  return `(
    EXISTS (
      SELECT 1 FROM client_users cu
      WHERE cu.id = '${clientUserId}'::uuid
        AND cu.role = 'OWNER'
        AND cu.deleted_at IS NULL
    )
    OR (${propertyIdSql}) IN (
      SELECT cup.property_id::text
      FROM client_user_properties cup
      WHERE cup.client_user_id = '${clientUserId}'::uuid
        AND cup.deleted_at IS NULL
    )
  )`;
};
