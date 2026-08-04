/**
 * Cube.js configuration for Rentloop analytics.
 *
 * DB connection is handled via CUBEJS_DB_* environment variables.
 *
 * checkAuth explicitly unwraps the JWT `u` key so that the security context is
 * available at both schema compile time (COMPILE_CONTEXT) and query time.
 * Without this, Cube.js only extracts `u` at query execution time —
 * COMPILE_CONTEXT receives the raw payload, causing `securityContext.clientId`
 * to be undefined and all cube SQL to fall back to `WHERE 1 = 0`.
 *
 * contextToAppId keys the compiled-schema cache. It must include **both** the
 * client and the caller, because cube SQL is generated at compile time from
 * COMPILE_CONTEXT: two users of the same client with different property access
 * would otherwise share one compiled schema, and whichever compiled first
 * would silently define row-level security for the other. Keying on clientId
 * alone was a real (if latent) cross-user leak — it only stayed invisible
 * while every cube ignored the property scope.
 *
 * Because the scope is resolved by live subqueries keyed on the client-user id
 * (see `model/scope.js`) rather than an inlined property list, the cache key is
 * one entry per user and the compiled SQL is constant-size regardless of how
 * large a portfolio the caller manages.
 */
const jwt = require('jsonwebtoken')

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Caller component of the compiled-schema cache key. A malformed id collapses
 * to 'none', which is also what `propertyScopeSql` fails closed to, so the key
 * and the generated SQL stay in agreement.
 */
const scopeCacheKey = (securityContext) => {
  const id = securityContext?.clientUserId
  return typeof id === 'string' && UUID_RE.test(id) ? id : 'none'
}

module.exports = {
  checkAuth: (req, auth) => {
    if (auth) {
      const decoded = jwt.verify(auth, process.env.CUBEJS_API_SECRET)
      // Unwrap the legacy `u` convention so the security context is consistent
      // at both COMPILE_CONTEXT and query-time contexts.
      req.securityContext = decoded.u ?? decoded
    }
  },

  contextToAppId: ({ securityContext }) =>
    `RENTLOOP_${securityContext?.clientId ?? 'anon'}_${scopeCacheKey(securityContext)}`,
}
