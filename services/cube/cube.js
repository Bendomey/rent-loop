/**
 * Cube.js configuration for Rentloop analytics.
 *
 * DB connection is handled via CUBEJS_DB_* environment variables.
 * contextToAppId ensures per-client schema compilation (multi-tenant row-level security).
 *
 * checkAuth explicitly unwraps the JWT `u` key so that securityContext.clientId is
 * available at both schema compile time (COMPILE_CONTEXT) and query time. Without this,
 * Cube.js only extracts `u` at query execution time — COMPILE_CONTEXT receives the raw
 * payload, causing `securityContext.clientId` to be undefined and all cube SQL to fall
 * back to `WHERE 1 = 0`.
 */
const jwt = require('jsonwebtoken')

module.exports = {
  checkAuth: (req, auth) => {
    if (auth) {
      const decoded = jwt.verify(auth, process.env.CUBEJS_API_SECRET)
      // Unwrap the legacy `u` convention so securityContext.clientId is consistent
      // at both COMPILE_CONTEXT and query-time contexts.
      req.securityContext = decoded.u ?? decoded
    }
  },

  contextToAppId: ({ securityContext }) =>
    `RENTLOOP_${securityContext?.clientId ?? 'anon'}`,
}
