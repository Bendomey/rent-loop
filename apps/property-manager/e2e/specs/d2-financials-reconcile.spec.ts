/**
 * D2 — the lease financials figures reconcile after a partial payment.
 *
 * outstanding == charged − settled is the arithmetic every other number on the
 * screen depends on. c1–c4 only ever left settled at zero or fully paid, where
 * the identity holds trivially; this pays *part* of an invoice so all three
 * figures are distinct and non-zero.
 *
 * A partial payment is also the state the backfill verification gates care
 * about most — gates 2 and 3 exist because a charge's settled amount can drift
 * from its allocations.
 */
import {
	approveApplication,
	ensurePaymentAccount,
	getApplicationAccountId,
} from '../lib/api'
import { amountFor, chargesSummary } from '../lib/expect'
import { makeApprovableApplication } from '../lib/factory'
import { billedFee } from '../lib/money'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

const BILL_TIMEOUT = 45_000
const CHARGE_AMOUNT = 200.0
const PART_PAYMENT = 80.0

test('lease financials reconcile after a partial payment', async ({ page }) => {
	const s = readRunState()
	await ensurePaymentAccount(s.token, s.clientId)

	const { application } = await makeApprovableApplication(s, 'd2', { seq: 80 })
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
	const chargeName = `E2E Fee ${s.runId}`
	const accountId = await getApplicationAccountId(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)
	await billedFee(s, accountId, chargeName, CHARGE_AMOUNT * 100)

	await page.reload()
	await page.getByRole('tab', { name: 'Money' }).click()

	// ── pay part of it ─────────────────────────────────────────────────────
	await page.getByRole('button', { name: 'Record a payment' }).first().click()
	const payDialog = page.getByRole('dialog', { name: /pay for\?$/i })
	await expect(payDialog).toBeVisible()
	await payDialog.locator('#pay-amount').fill(String(PART_PAYMENT))
	await payDialog.getByRole('combobox').first().click()
	await page.getByRole('option').first().click()
	await payDialog.getByRole('button', { name: 'Save this payment' }).click()
	await expect(payDialog).toBeHidden({ timeout: BILL_TIMEOUT })

	// ── the three figures must agree ───────────────────────────────────────
	await expect
		.poll(
			async () => amountFor(await page.locator('body').innerText(), 'paid you'),
			{ timeout: 20_000 },
		)
		.toBeCloseTo(PART_PAYMENT, 2)

	const text = await page.locator('body').innerText()
	const outstanding = amountFor(text, 'still owes you')
	const settled = amountFor(text, 'paid you')
	const charged = chargesSummary(text).total

	// Guard against the identity holding for a boring reason: if settled were 0
	// or equal to charged, this would pass without exercising anything.
	expect(settled).toBeGreaterThan(0)
	expect(settled).toBeLessThan(charged)

	expect(outstanding).toBeCloseTo(charged - settled, 2)
})
