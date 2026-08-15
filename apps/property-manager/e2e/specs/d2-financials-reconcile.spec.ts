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
import { approveApplication, ensurePaymentAccount } from '../lib/api'
import { amountFor, chargesSummary } from '../lib/expect'
import { makeApprovableApplication } from '../lib/factory'
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
	await page.getByRole('tab', { name: 'Financials' }).click()
	await expect(page.getByRole('button', { name: 'Add charge' })).toBeVisible({
		timeout: 20_000,
	})

	// ── bill a charge ──────────────────────────────────────────────────────
	await page.getByRole('button', { name: 'Add charge' }).click()
	const addDialog = page.getByRole('dialog', { name: 'Add a charge' })
	await expect(addDialog).toBeVisible()
	await addDialog.getByRole('button', { name: 'Other', exact: true }).click()
	await addDialog.locator('#charge-name').fill(`E2E Partial ${s.runId}`)
	await addDialog.locator('#charge-amount').fill(String(CHARGE_AMOUNT))
	await addDialog.locator('#charge-bill-now').click()
	await addDialog.getByRole('button', { name: 'Add and bill' }).click()
	await expect(addDialog).toBeHidden({ timeout: BILL_TIMEOUT })

	// ── pay part of it ─────────────────────────────────────────────────────
	await page.getByRole('button', { name: 'Record payment' }).first().click()
	const payDialog = page.getByRole('dialog', { name: 'Record a payment' })
	await expect(payDialog).toBeVisible()
	await payDialog.locator('#pay-amount').fill(String(PART_PAYMENT))
	await payDialog.getByRole('combobox').first().click()
	await page.getByRole('option').first().click()
	await payDialog.getByRole('button', { name: /^Record\s/ }).click()
	await expect(payDialog).toBeHidden({ timeout: BILL_TIMEOUT })

	// ── the three figures must agree ───────────────────────────────────────
	await expect
		.poll(
			async () =>
				amountFor(await page.locator('body').innerText(), 'COLLECTED TO DATE'),
			{ timeout: 20_000 },
		)
		.toBeCloseTo(PART_PAYMENT, 2)

	const text = await page.locator('body').innerText()
	const outstanding = amountFor(text, 'OUTSTANDING')
	const settled = amountFor(text, 'COLLECTED TO DATE')
	const charged = chargesSummary(text).total

	// Guard against the identity holding for a boring reason: if settled were 0
	// or equal to charged, this would pass without exercising anything.
	expect(settled).toBeGreaterThan(0)
	expect(settled).toBeLessThan(charged)

	expect(outstanding).toBeCloseTo(charged - settled, 2)
})
