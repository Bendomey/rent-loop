/**
 * C1 — an ad-hoc charge lands on the account unbilled.
 *
 * A landlord adding a one-off (a utility bill, a repair) should see it join the
 * ledger immediately, marked as not yet on an invoice, and raise the account
 * total. It must *not* create an invoice by itself — billing is a separate
 * decision, which is what "Add charge" means as distinct from "Add and bill".
 */
import { approveApplication } from '../lib/api'
import { chargesSummary } from '../lib/expect'
import { makeApprovableApplication } from '../lib/factory'
import { addFee } from '../lib/money'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

const CHARGE_AMOUNT = 123.45

test('an ad-hoc charge is added unbilled and raises the total', async ({
	page,
}) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'c1', { seq: 30 })
	const lease = await approveApplication(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)

	await page.goto(`/properties/${s.propertyId}/occupancy/leases/${lease.id}`)
	await page.getByRole('tab', { name: 'Money' }).click()

	await expect(
		page.getByRole('button', { name: 'Add a fee' }).first(),
	).toBeVisible({
		timeout: 20_000,
	})
	const before = chargesSummary(await page.locator('body').innerText())

	// ── add the charge ─────────────────────────────────────────────────────
	const chargeName = `E2E Utility ${s.runId}`
	await addFee(page, chargeName, CHARGE_AMOUNT)

	// ── it is on the ledger, unbilled ──────────────────────────────────────
	// "Unbilled" is now a place rather than a badge: the page lists every item
	// exactly once, under the section describing what you would do about it.
	// Still to come is the section for money no bill has claimed, so landing
	// there *is* the assertion — and it is a stronger one than a status pill,
	// which could be right while the item sat in the wrong list.
	await expect(
		page.locator('#still-to-come').getByText(chargeName),
	).toBeVisible({ timeout: 20_000 })

	// ── and the account total moved by exactly the charge ──────────────────
	const after = chargesSummary(await page.locator('body').innerText())
	expect(after.count).toBe(before.count + 1)
	expect(after.total).toBeCloseTo(before.total + CHARGE_AMOUNT, 2)
})
