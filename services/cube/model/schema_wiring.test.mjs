/**
 * Guards the schema wiring that unit tests cannot reach.
 *
 * These exist because of a real outage: every cube imported the shared scope
 * helper as `'../scope'`, which reads correctly to a Node developer — the file
 * really is one directory up. But Cube's schema compiler resolves imports
 * relative to the **model root**, not the importing file, so `'../scope'`
 * escaped `model/`, fell through to Node's `require`, and failed with
 * `Cannot find module '<repo>/services/cube/scope'`.
 *
 * A failed import aborts compilation of the WHOLE schema, so every cube in
 * every dashboard returned errors — the blast radius was all analytics, not
 * just the cubes that changed. Nothing in the JS unit tests could catch it:
 * `scope.js` is correct in isolation, and the cube files are never evaluated
 * by Node.
 *
 * Run: yarn --cwd services/cube test
 */
import { readdir, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

const CUBES_DIR = new URL('./cubes/', import.meta.url);

const cubeFiles = (await readdir(CUBES_DIR)).filter((f) => f.endsWith('.js'));

test('there are cube files to check', () => {
  assert.ok(cubeFiles.length > 0, 'no cube files found — wrong directory?');
});

for (const file of cubeFiles) {
  test(`${file} imports the scope helper the way Cube resolves it`, async () => {
    const src = await readFile(new URL(file, CUBES_DIR), 'utf8');
    const imports = [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);

    for (const spec of imports) {
      // Cube resolves relative to the model root, so a specifier that walks
      // up out of model/ can never resolve — it is the outage, verbatim.
      assert.ok(
        !spec.startsWith('../'),
        `${file} imports '${spec}' — Cube resolves imports from the model ` +
          `root, so '../' escapes model/ and aborts the whole schema. ` +
          `Use './scope' instead.`,
      );
    }

    // Every cube must actually apply the scope predicate; a cube that forgets
    // to import it is a cube with no row-level security.
    assert.ok(
      imports.includes('./scope'),
      `${file} does not import './scope' — is it applying propertyScopeSql?`,
    );
    assert.match(
      src,
      /propertyScopeSql\(\s*COMPILE_CONTEXT\.securityContext/,
      `${file} imports the scope helper but never applies it`,
    );
  });
}
