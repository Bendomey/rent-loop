/**
 * C1 — an ad-hoc charge lands on the account unbilled.
 *
 * A landlord adding a one-off (a utility bill, a repair) should see it join the
 * ledger immediately, marked as not yet on an invoice, and raise the account
 * total. It must *not* create an invoice by itself — billing is a separate
 * decision, which is what "Add charge" means as distinct from "Add and bill".
 */
import { expect, test } from '../lib/test'
import { approveApplication } from '../lib/api'
import { chargesSummary } from '../lib/expect'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'

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
	await page.getByRole('tab', { name: 'Financials' }).click()

	await expect(page.getByRole('button', { name: 'Add charge' })).toBeVisible({
		timeout: 20_000,
	})
	const before = chargesSummary(await page.locator('body').innerText())

	// ── add the charge ─────────────────────────────────────────────────────
	const chargeName = `E2E Utility ${s.runId}`
	await page.getByRole('button', { name: 'Add charge' }).click()

	const dialog = page.getByRole('dialog', { name: 'Add a charge' })
	await expect(dialog).toBeVisible()

	// Type must be chosen explicitly: the dialog defaults to "Security deposit"
	// (both the category and the pre-filled name), so a one-off utility left at
	// the default is recorded as a refundable deposit. Selecting Other keeps
	// this case about the charge it claims to add.
	await dialog.getByRole('button', { name: 'Other', exact: true }).click()

	await dialog.locator('#charge-name').fill(chargeName)
	await dialog.locator('#charge-amount').fill(String(CHARGE_AMOUNT))

	// "Add charge" adds without billing; "Add and bill" is the other branch and
	// would make this case assert the opposite of what it is named for.
	await dialog.getByRole('button', { name: 'Add charge' }).click()
	await expect(dialog).toBeHidden({ timeout: 20_000 })

	// ── it is on the ledger, unbilled ──────────────────────────────────────
	const row = page
		.locator('div')
		.filter({ hasText: chargeName })
		.filter({ hasText: /not yet billed/i })
		.last()
	await expect(row).toBeVisible({ timeout: 20_000 })

	// ── and the account total moved by exactly the charge ──────────────────
	const after = chargesSummary(await page.locator('body').innerText())
	expect(after.count).toBe(before.count + 1)
	expect(after.total).toBeCloseTo(before.total + CHARGE_AMOUNT, 2)
})
