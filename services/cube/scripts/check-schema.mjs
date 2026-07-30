/**
 * Schema compile check — the guard that would have caught the outage.
 *
 * Boots the Cube server against a deliberately unreachable database and asks
 * for `/cubejs-api/v1/meta`. Cube compiles the data model *before* it ever
 * touches Postgres, so a real DB is not needed: any compile error — a bad
 * import specifier, a syntax error, a cube referencing a missing dimension —
 * surfaces here as an `error` in the meta response.
 *
 * This exists because a single bad import (`'../scope'`, which escapes the
 * model root Cube resolves against) aborted compilation of the WHOLE schema
 * and took every dashboard down. Unit tests could not see it: `scope.js` is
 * correct in isolation and the cube files are never evaluated by Node.
 *
 * Run: yarn --cwd services/cube check:schema
 */
import { spawn } from 'node:child_process';
import process from 'node:process';

const PORT = process.env.SCHEMA_CHECK_PORT ?? '4199';
const META = `http://127.0.0.1:${PORT}/cubejs-api/v1/meta`;
const BOOT_TIMEOUT_MS = 120_000;

// Every cube that must be present. A cube going silently missing is the other
// half of the failure mode: the schema "compiles" but a dashboard reads zero.
const EXPECTED = [
  'Bookings',
  'Expenses',
  'Invoices',
  'Leases',
  'MaintenanceRequests',
  'Payments',
  'TenantApplications',
  'Units',
];

const server = spawn('npx', ['cubejs-server'], {
  env: {
    ...process.env,
    CUBEJS_API_SECRET: 'schema-check',
    CUBEJS_DB_TYPE: 'postgres',
    // Intentionally unreachable — compilation must not depend on it.
    CUBEJS_DB_HOST: '127.0.0.1',
    CUBEJS_DB_PORT: '59999',
    CUBEJS_DB_NAME: 'schema_check',
    CUBEJS_DB_USER: 'schema_check',
    CUBEJS_DB_PASS: 'schema_check',
    CUBEJS_DEV_MODE: 'true',
    PORT,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
server.stdout.on('data', (d) => (serverOutput += d));
server.stderr.on('data', (d) => (serverOutput += d));

let exited = false;
server.on('exit', (code) => {
  exited = true;
  if (code !== 0 && code !== null) {
    console.error(`cubejs-server exited early with code ${code}`);
    console.error(serverOutput.slice(-4000));
    process.exit(1);
  }
});

const stop = () => {
  if (!exited) server.kill('SIGTERM');
};
process.on('exit', stop);
process.on('SIGINT', () => {
  stop();
  process.exit(130);
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const deadline = Date.now() + BOOT_TIMEOUT_MS;
let meta = null;
while (Date.now() < deadline) {
  if (exited) break;
  try {
    const res = await fetch(META);
    meta = await res.json();
    break;
  } catch {
    await sleep(1000);
  }
}

if (!meta) {
  console.error(`✗ Cube did not answer ${META} within ${BOOT_TIMEOUT_MS}ms`);
  console.error(serverOutput.slice(-4000));
  stop();
  process.exit(1);
}

if (meta.error) {
  console.error('✗ Schema failed to compile:\n');
  console.error(String(meta.error).slice(0, 4000));
  stop();
  process.exit(1);
}

const found = (meta.cubes ?? []).map((c) => c.name).sort();
const missing = EXPECTED.filter((n) => !found.includes(n));

if (missing.length > 0) {
  console.error(`✗ Schema compiled but cubes are missing: ${missing.join(', ')}`);
  console.error(`  found: ${found.join(', ') || '(none)'}`);
  stop();
  process.exit(1);
}

console.log(`✓ Schema compiles — ${found.length} cubes: ${found.join(', ')}`);
stop();
process.exit(0);
