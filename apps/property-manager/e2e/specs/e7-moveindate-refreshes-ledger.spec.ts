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

	// Shorten by one period, then confirm the rebuild. The stepper lives behind
	// "Something else" now — the presets are whole terms, not increments.
	await page.getByRole('button', { name: /something else/i }).click()
	await page.getByRole('button', { name: 'Shorten the term' }).click()
	await page.locator('#save-move-in').click()

	const confirm = page.getByRole('alertdialog', {
		name: /rebuild the rent charges/i,
	})
	await expect(confirm).toBeVisible({ timeout: 20_000 })
	await confirm.getByRole('button', { name: /save and rebuild/i }).click()
	await expect(confirm).toBeHidden({ timeout: SAVE_TIMEOUT })

	// Client-side navigation to the ledger — no reload, which is the workaround
	// under test. The checklist rail is gone; the step header carries the link.
	await page
		.getByRole('link', { name: /next: rent & payments/i })
		.first()
		.click()
	await page.waitForURL(/\/financial$/, { timeout: 20_000 })

	// Wait for the charges panel to exist before polling its contents.
	// `expect.poll` propagates a throw from its callback rather than retrying,
	// and `chargesSummary` throws when the panel has not rendered yet — so
	// polling straight after navigation fails on the first tick rather than
	// waiting for the ledger. The assertion below is unchanged.
	await expect(page.getByText(/\d+ charges? ·/i).first()).toBeVisible({
		timeout: SAVE_TIMEOUT,
	})

	await expect
		.poll(
			async () => chargesSummary(await page.locator('body').innerText()).count,
			{ timeout: SAVE_TIMEOUT },
		)
		.toBe(stayDuration - 1)
})
