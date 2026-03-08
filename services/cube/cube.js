/**
 * Cube.js configuration for Rentloop analytics.
 *
 * DB connection is handled via CUBEJS_DB_* environment variables.
 * contextToAppId ensures per-client schema compilation (multi-tenant row-level security).
 */
module.exports = {
  contextToAppId: ({ securityContext }) =>
    `RENTLOOP_${securityContext?.clientId ?? 'anon'}`,
}
