import { defineConfig, devices } from '@playwright/test'
import { WEB_BASE } from './lib/api'
import { STORAGE_STATE } from './lib/state'

/**
 * The suite does not start servers. Run `make run` (API on 5003) and
 * `yarn dev` (web on 3000) yourself, then `yarn e2e`. Owning the servers would
 * mean owning their database choice too, and the point of this suite is that it
 * runs against whatever `DB_NAME` the API is already pointed at.
 */
export default defineConfig({
	testDir: './specs',
	globalSetup: './global-setup.ts',
	timeout: 60_000,
	expect: { timeout: 15_000 },

	// Serial for now. Every case creates its own unit, so the cases are
	// independent and this can be raised — but a shared dev server plus a
	// single database makes failures much easier to read one at a time.
	workers: 1,
	fullyParallel: false,

	reporter: [['list'], ['html', { open: 'never' }]],

	use: {
		baseURL: WEB_BASE,
		storageState: STORAGE_STATE,
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		...devices['Desktop Chrome'],
	},
})
