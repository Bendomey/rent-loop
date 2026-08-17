/**
 * C3 — recording a payment moves money, not claims.
 *
 * c2 established that billing raises a charge's invoiced amount while settled
 * stays at zero. This is the other half: a payment against that invoice raises
 * collected and lowers outstanding, and the charge's settled amount finally
 * moves. The account total does *not* change — paying settles what was already
 * owed rather than adding to it.
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
	const chargeName = `E2E Payable ${s.runId}`
	const accountId = await getApplicationAccountId(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)
	await billedFee(s, accountId, chargeName, CHARGE_AMOUNT * 100)

	await page.reload()
	await page.getByRole('tab', { name: 'Money' }).click()
	await expect(page.getByText(chargeName).first()).toBeVisible({
		timeout: 20_000,
	})

	// Read after billing, so the deltas below isolate the payment: billing
	// moves no money, but taking the baseline before it would fold the new
	// charge's arrival into the same comparison.
	const before = {
		charges: chargesSummary(await page.locator('body').innerText()),
		collected: amountFor(await page.locator('body').innerText(), 'paid you'),
		outstanding: amountFor(
			await page.locator('body').innerText(),
			'still owes you',
		),
	}

	// ── record the payment ─────────────────────────────────────────────────
	await page.getByRole('button', { name: 'Record a payment' }).first().click()

	const payDialog = page.getByRole('dialog', { name: /pay for\?$/i })
	await expect(payDialog).toBeVisible()
	await payDialog.locator('#pay-amount').fill(String(CHARGE_AMOUNT))

	// "Received into" — the dialog keeps its submit disabled until an account is
	// picked, which is why setup seeds one.
	await payDialog.getByRole('combobox').first().click()
	await page.getByRole('option').first().click()

	await payDialog.getByRole('button', { name: 'Save this payment' }).click()
	await expect(payDialog).toBeHidden({ timeout: 20_000 })

	// ── collected up, outstanding down, total unmoved ──────────────────────
	await expect
		.poll(
			async () => amountFor(await page.locator('body').innerText(), 'paid you'),
			{ timeout: 20_000 },
		)
		.toBeCloseTo(before.collected + CHARGE_AMOUNT, 2)

	const afterText = await page.locator('body').innerText()
	expect(amountFor(afterText, 'still owes you')).toBeCloseTo(
		before.outstanding - CHARGE_AMOUNT,
		2,
	)

	// Paying settles an existing obligation; it must not change what is owed in
	// total, only how much of it remains unpaid.
	expect(chargesSummary(afterText).total).toBeCloseTo(before.charges.total, 2)
})
