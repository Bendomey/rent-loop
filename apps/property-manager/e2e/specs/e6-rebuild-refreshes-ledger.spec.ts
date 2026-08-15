/**
 * E6 — a rebuild refreshes the charge ledger without a page reload.
 *
 * Changing the term rebuilds every rent charge. The move-in step calls
 * `revalidator.revalidate()` on success, which refreshes React Router loader
 * data — but the ledger is served by a React Query cache under
 * QUERY_KEYS.FINANCIAL_ACCOUNT, which that does not touch. The landlord is
 * then shown the schedule they just replaced, with no indication it is stale.
 *
 * Adding a charge does not have this problem because add-charge-dialog
 * invalidates the key. This case holds the rebuild paths to the same standard.
 *
 * Deliberately drives the UI and never reloads: a reload is exactly the
 * workaround being tested away.
 */
import { getApplicationAccountId } from '../lib/api'
import { chargesSummary } from '../lib/expect'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

const SAVE_TIMEOUT = 45_000

test('rebuilding the term refreshes the ledger without a reload', async ({
	page,
}) => {
	const s = readRunState()
	const { application, stayDuration } = await makeApprovableApplication(
		s,
		'e6',
		{ seq: 180, stayDuration: 12 },
	)
	await getApplicationAccountId(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)

	const financialUrl = `/properties/${s.propertyId}/occupancy/applications/${application.id}/financial`

	// What the ledger says before.
	await page.goto(financialUrl)
	const before = chargesSummary(await page.locator('body').innerText())
	expect(before.count).toBe(stayDuration)

	// ── change the agreed rent, on this very page ──────────────────────────
	// The rebuild is triggered beside the ledger it invalidates, so there is no
	// navigation to mask a stale cache — which is why the move-in step did not
	// reproduce this: leaving and returning refetches on mount.
	const newRent = 750
	await page.locator('#agreed-rent').fill(String(newRent))
	await page.getByRole('button', { name: /save and rebuild/i }).click()

	// The ledger sits on the same screen and must follow, untouched by a reload.
	await expect
		.poll(
			async () => chargesSummary(await page.locator('body').innerText()).total,
			{ timeout: SAVE_TIMEOUT },
		)
		.toBeCloseTo(newRent * stayDuration, 2)
})
