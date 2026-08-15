/**
 * C3 — recording a payment moves money, not claims.
 *
 * c2 established that billing raises a charge's invoiced amount while settled
 * stays at zero. This is the other half: a payment against that invoice raises
 * collected and lowers outstanding, and the charge's settled amount finally
 * moves. The account total does *not* change — paying settles what was already
 * owed rather than adding to it.
 */
import { approveApplication, ensurePaymentAccount } from '../lib/api'
import { amountFor, chargesSummary } from '../lib/expect'
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

const CHARGE_AMOUNT = 300.0

test('recording a payment raises collected and lowers outstanding', async ({
	page,
}) => {
	const s = readRunState()
	await ensurePaymentAccount(s.token, s.clientId)

	const { application } = await makeApprovableApplication(s, 'c3', { seq: 50 })
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

	// ── bill a charge so there is an invoice to pay ────────────────────────
	const chargeName = `E2E Payable ${s.runId}`
	await page.getByRole('button', { name: 'Add charge' }).click()
	const addDialog = page.getByRole('dialog', { name: 'Add a charge' })
	await expect(addDialog).toBeVisible()
	await addDialog.getByRole('button', { name: 'Other', exact: true }).click()
	await addDialog.locator('#charge-name').fill(chargeName)
	await addDialog.locator('#charge-amount').fill(String(CHARGE_AMOUNT))
	await addDialog.locator('#charge-bill-now').click()
	await addDialog.getByRole('button', { name: 'Add and bill' }).click()
	await expect(addDialog).toBeHidden({ timeout: BILL_TIMEOUT })

	const before = {
		charges: chargesSummary(await page.locator('body').innerText()),
		collected: amountFor(
			await page.locator('body').innerText(),
			'COLLECTED TO DATE',
		),
		outstanding: amountFor(
			await page.locator('body').innerText(),
			'OUTSTANDING',
		),
	}

	// ── record the payment ─────────────────────────────────────────────────
	await page.getByRole('button', { name: 'Record payment' }).first().click()

	const payDialog = page.getByRole('dialog', { name: 'Record a payment' })
	await expect(payDialog).toBeVisible()
	await payDialog.locator('#pay-amount').fill(String(CHARGE_AMOUNT))

	// "Received into" — the dialog keeps its submit disabled until an account is
	// picked, which is why setup seeds one.
	await payDialog.getByRole('combobox').first().click()
	await page.getByRole('option').first().click()

	// The submit carries the amount, e.g. "Record GH₵ 300.00".
	await payDialog.getByRole('button', { name: /^Record\s/ }).click()
	await expect(payDialog).toBeHidden({ timeout: 20_000 })

	// ── collected up, outstanding down, total unmoved ──────────────────────
	await expect
		.poll(
			async () =>
				amountFor(await page.locator('body').innerText(), 'COLLECTED TO DATE'),
			{ timeout: 20_000 },
		)
		.toBeCloseTo(before.collected + CHARGE_AMOUNT, 2)

	const afterText = await page.locator('body').innerText()
	expect(amountFor(afterText, 'OUTSTANDING')).toBeCloseTo(
		before.outstanding - CHARGE_AMOUNT,
		2,
	)

	// Paying settles an existing obligation; it must not change what is owed in
	// total, only how much of it remains unpaid.
	expect(chargesSummary(afterText).total).toBeCloseTo(before.charges.total, 2)
})
