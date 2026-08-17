/**
 * Runs once before the suite.
 *
 *  1. API login — resolves the workspace and gives the factory a token
 *  2. UI login + workspace selection — saved as storageState so the 11 specs
 *     pay for one login between them rather than one each
 *  3. Find-or-create the single `E2E Suite` property
 *
 * The property is found-or-created, not created per run: one property holds
 * every scenario, and cases add units beneath it. Units are the per-run thing
 * because approving an application occupies a unit permanently.
 */
import { chromium, type FullConfig } from '@playwright/test'
import {
	CREDENTIALS,
	REQUIRED_MODES,
	WEB_BASE,
	createBlock,
	createProperty,
	listProperties,
	login,
	setPropertyModes,
} from './lib/api'
import { STORAGE_STATE, tag, writeRunState } from './lib/state'

const PROPERTY_NAME = 'E2E Suite'
const BLOCK_NAME = 'E2E Block'

export default async function globalSetup(_config: FullConfig) {
	const runId = Date.now().toString(36).slice(-6)

	// ── 1. API login ────────────────────────────────────────────────────────
	const { token, clientId, clientName } = await login()
	console.log(`[e2e] run ${runId} · workspace "${clientName}" (${clientId})`)

	// ── 2. UI login → storageState ──────────────────────────────────────────
	const browser = await chromium.launch()
	const page = await browser.newPage()

	await page.goto(`${WEB_BASE}/login`)
	// Located by name rather than label: the password field's <label for> points
	// at the show/hide wrapper <div> instead of the <input>, because shadcn's
	// FormControl assigns its id to its direct child. getByLabel('Password')
	// therefore matches nothing. That is an app accessibility bug, not a test
	// one — switch these back to getByLabel once the input is the direct child.
	await page.locator('input[name="email"]').fill(CREDENTIALS.email)
	await page.locator('input[name="password"]').fill(CREDENTIALS.password)
	await page.getByRole('button', { name: 'Login' }).click()

	// The account belongs to several workspaces, so login lands on the picker.
	// Choosing the same client the API resolved keeps the browser session and
	// the factory pointed at one workspace — mismatch here 404s every page.
	await page.waitForURL(/\/(select-client|$)/, { timeout: 20_000 })
	if (page.url().includes('select-client')) {
		await page.getByText(clientName, { exact: false }).first().click()
		await page.waitForURL((url) => !url.pathname.includes('select-client'), {
			timeout: 20_000,
		})
	}

	await page.context().storageState({ path: STORAGE_STATE })
	await browser.close()

	// ── 3. Find-or-create the property ──────────────────────────────────────
	const existing = await listProperties(token, clientId)
	let property = existing.find((p) => p.name === PROPERTY_NAME)

	if (property) {
		console.log(`[e2e] reusing property ${property.name} (${property.id})`)

		// Self-heal a property created before modes were set, rather than
		// leaving the whole suite 404ing under /occupancy with no clue why.
		const modes = property.modes ?? []
		const missing = REQUIRED_MODES.filter((m) => !modes.includes(m))
		if (missing.length) {
			await setPropertyModes(token, clientId, property.id, [
				...modes,
				...missing,
			])
			console.log(`[e2e] added missing mode(s) ${missing.join(', ')}`)
		}
	} else {
		property = await createProperty(token, clientId, PROPERTY_NAME)
		console.log(`[e2e] created property ${property.name} (${property.id})`)
	}

	// A unit must hang off a block. One block per run keeps this run's units
	// grouped and legible in the UI.
	const block = await createBlock(
		token,
		clientId,
		property.id,
		tag(runId, BLOCK_NAME),
	)

	writeRunState({
		runId,
		token,
		clientId,
		clientName,
		propertyId: property.id,
		propertyName: property.name,
		blockId: block.id,
	})
}
