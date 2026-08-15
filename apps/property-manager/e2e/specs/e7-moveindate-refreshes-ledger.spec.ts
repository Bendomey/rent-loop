/**
 * E7 — shortening the term rebuilds the schedule end to end.
 *
 * Covers the move-in step's rebuild: confirm dialog, save, and a ledger that
 * agrees afterwards.
 *
 * What it does NOT prove: that the move-in save invalidates the React Query
 * cache. Moving between steps remounts the query and refetches, so this passes
 * with or without that invalidation — verified by removing it and re-running.
 * Only e6 reproduces the stale-cache bug, because it stays on one page.
 *
 * Do not treat this as the regression guard for cache invalidation. If that
 * behaviour needs pinning on this path, it needs a case that never leaves the
 * page the stale data is rendered on.
 */
import { chargesSummary } from '../lib/expect'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

const SAVE_TIMEOUT = 45_000

test('changing the term refreshes the ledger without a reload', async ({
	page,
}) => {
	const s = readRunState()
	const { application, stayDuration } = await makeApprovableApplication(
		s,
		'e7',
		{ seq: 190, stayDuration: 12 },
	)

	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/move-in`,
	)

	// Shorten by one period, then confirm the rebuild.
	await page.getByRole('button', { name: 'Shorten the term' }).click()
	await page.getByRole('button', { name: /save/i }).click()

	const confirm = page.getByRole('alertdialog', {
		name: /rebuild the rent charges/i,
	})
	await expect(confirm).toBeVisible({ timeout: 20_000 })
	await confirm.getByRole('button', { name: /save and rebuild/i }).click()
	await expect(confirm).toBeHidden({ timeout: SAVE_TIMEOUT })

	// Client-side navigation to the ledger — no reload, which is the workaround
	// under test.
	await page
		.getByRole('link', { name: /financial setup/i })
		.first()
		.click()

	await expect
		.poll(
			async () => chargesSummary(await page.locator('body').innerText()).count,
			{ timeout: SAVE_TIMEOUT },
		)
		.toBe(stayDuration - 1)
})
