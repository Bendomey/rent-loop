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
import {
	approveApplication,
	listLeaseInvoices,
	voidInvoice,
	getApplicationAccountId,
} from '../lib/api'
import { chargesSummary } from '../lib/expect'
import { makeApprovableApplication } from '../lib/factory'
import { billedFee } from '../lib/money'
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
	await page.getByRole('tab', { name: 'Money' }).click()
	await expect(
		page.getByRole('button', { name: 'Add a fee' }).first(),
	).toBeVisible({
		timeout: 20_000,
	})

	// ── bill a charge, so there is a bill to pay ───────────────────────────
	// Through the API: the fee dialog lost its bill-now tick, so the page has
	// no route to a billed-and-unpaid fee. That is this case's precondition,
	// not its subject.
	const chargeName = `E2E Voidable ${s.runId}`
	const accountId = await getApplicationAccountId(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)
	await billedFee(s, accountId, chargeName, CHARGE_AMOUNT * 100)

	await page.reload()
	await page.getByRole('tab', { name: 'Money' }).click()

	// It is billed before the void — otherwise the assertion afterwards proves
	// nothing about the void having done anything. Billed is a place now: the
	// charge sits inside the bill that claimed it, and the page shows each item
	// exactly once, so it must have left Still to come to get there.
	await expect(
		page.locator('#waiting-on-them').getByText(chargeName),
	).toBeVisible({ timeout: BILL_TIMEOUT })
	await expect(page.locator('#still-to-come')).toBeVisible()
	await expect(
		page.locator('#still-to-come').getByText(chargeName),
	).toHaveCount(0)

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
	await page.getByRole('tab', { name: 'Money' }).click()

	await expect(
		page.locator('#still-to-come').getByText(chargeName),
	).toBeVisible({ timeout: 20_000 })

	// ── and the obligation still stands ────────────────────────────────────
	const after = chargesSummary(await page.locator('body').innerText())
	expect(after.count).toBe(before.count)
	expect(after.total).toBeCloseTo(before.total, 2)
})
