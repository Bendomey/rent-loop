/**
 * C4 — voiding an invoice releases its charge back to unbilled.
 *
 * The mirror of c2: billing claims a charge, voiding un-claims it. The charge
 * itself survives — the obligation did not go away, it merely stopped being on
 * an invoice — so the account total must not move.
 *
 * The void is issued through the API rather than the UI because the PM app has
 * no void affordance for charge-derived invoices (see api.voidInvoice). What
 * this case tests is that the financials screen reflects the released charge
 * correctly, which is exactly the direction the migration runbook worried
 * about: invoices and charges disagreeing about what has been billed.
 */
import { approveApplication, listLeaseInvoices, voidInvoice } from '../lib/api'
import { chargesSummary } from '../lib/expect'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

/**
 * Billing does more than adding: it creates the charge, composes an invoice
 * and issues it. Against a Vite dev server that also compiles routes on first
 * visit, 20s proved occasionally too tight — the dialog was still showing a
 * pending submit when the wait expired.
 */
const BILL_TIMEOUT = 45_000

const CHARGE_AMOUNT = 175.0

test('voiding an invoice returns its charge to unbilled', async ({ page }) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'c4', { seq: 60 })
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

	// ── bill a charge ──────────────────────────────────────────────────────
	const chargeName = `E2E Voidable ${s.runId}`
	await page.getByRole('button', { name: 'Add charge' }).click()
	const addDialog = page.getByRole('dialog', { name: 'Add a charge' })
	await expect(addDialog).toBeVisible()
	await addDialog.getByRole('button', { name: 'Other', exact: true }).click()
	await addDialog.locator('#charge-name').fill(chargeName)
	await addDialog.locator('#charge-amount').fill(String(CHARGE_AMOUNT))
	await addDialog.locator('#charge-bill-now').click()
	await addDialog.getByRole('button', { name: 'Add and bill' }).click()
	await expect(addDialog).toBeHidden({ timeout: BILL_TIMEOUT })

	// It is billed before the void — otherwise the assertion afterwards proves
	// nothing about the void having done anything.
	const billedRow = page
		.locator('div')
		.filter({ hasText: chargeName })
		.filter({ hasText: /billed/i })
		.last()
	await expect(billedRow).not.toContainText('Not yet billed')

	const before = chargesSummary(await page.locator('body').innerText())

	// ── void it ────────────────────────────────────────────────────────────
	const invoices = await listLeaseInvoices(
		s.token,
		s.clientId,
		s.propertyId,
		lease.id,
	)
	const target = invoices.find((i) => i.status === 'ISSUED')
	expect(
		target,
		'expected an ISSUED invoice to void — billing should have created one',
	).toBeTruthy()

	await voidInvoice(s.token, s.clientId, s.propertyId, target!.id)

	// ── the charge is back on the ledger, unbilled ─────────────────────────
	await page.reload()
	await page.getByRole('tab', { name: 'Financials' }).click()

	const releasedRow = page
		.locator('div')
		.filter({ hasText: chargeName })
		.filter({ hasText: /not yet billed/i })
		.last()
	await expect(releasedRow).toBeVisible({ timeout: 20_000 })

	// ── and the obligation still stands ────────────────────────────────────
	const after = chargesSummary(await page.locator('body').innerText())
	expect(after.count).toBe(before.count)
	expect(after.total).toBeCloseTo(before.total, 2)
})
