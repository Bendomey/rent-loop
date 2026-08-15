/**
 * C2 — billing a charge issues an invoice and marks the charge Billed.
 *
 * Uses the Add-charge dialog's "bill now" branch rather than the charges
 * panel's "Pay charges": that one submits as "Bill and pay", which invoices and
 * settles in a single step and would make this case assert c3's behaviour as
 * well. Here the invoice must come out *unpaid* — billing and paying are
 * separate events in this model, and the charge's invoiced_amount moving while
 * settled_amount stays at zero is the whole point.
 */
import { approveApplication } from '../lib/api'
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

const CHARGE_AMOUNT = 250.0

test('billing a charge issues an unpaid invoice and marks it Billed', async ({
	page,
}) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'c2', { seq: 40 })
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

	// ── add the charge, billing it immediately ─────────────────────────────
	const chargeName = `E2E Billed ${s.runId}`
	await page.getByRole('button', { name: 'Add charge' }).click()

	const dialog = page.getByRole('dialog', { name: 'Add a charge' })
	await expect(dialog).toBeVisible()
	await dialog.getByRole('button', { name: 'Other', exact: true }).click()
	await dialog.locator('#charge-name').fill(chargeName)
	await dialog.locator('#charge-amount').fill(String(CHARGE_AMOUNT))
	await dialog.locator('#charge-bill-now').click()

	// Ticking bill-now relabels the submit, which is the app's own signal that
	// the branch changed.
	await dialog.getByRole('button', { name: 'Add and bill' }).click()
	await expect(dialog).toBeHidden({ timeout: BILL_TIMEOUT })

	// ── the charge is billed, not merely added ─────────────────────────────
	const row = page
		.locator('div')
		.filter({ hasText: chargeName })
		.filter({ hasText: /billed/i })
		.last()
	await expect(row).toBeVisible({ timeout: 20_000 })
	// "Billed" and "Not yet billed" differ only by that prefix, so assert the
	// absence explicitly — toContainText('Billed') alone would be satisfied by
	// neither, but a future badge reword could make it ambiguous.
	await expect(row).not.toContainText('Not yet billed')

	// ── an invoice now exists for it, and is unsettled ─────────────────────
	// Asserted via "outstanding" rather than an Unpaid badge: the dialog's
	// default due date is today, so the invoice is issued already Overdue. The
	// badge wording therefore depends on the date, but money still owed does
	// not.
	const invoice = page.getByRole('link', { name: new RegExp(chargeName) })
	await expect(invoice).toContainText(/outstanding/i, { timeout: 20_000 })
	await expect(invoice).toContainText('250.00')
	await expect(
		page.getByRole('button', { name: 'Record payment' }).first(),
	).toBeVisible()

	// ── and the account total is unchanged: billing moves no money ─────────
	const after = chargesSummary(await page.locator('body').innerText())
	expect(after.count).toBe(before.count + 1)
	expect(after.total).toBeCloseTo(before.total + CHARGE_AMOUNT, 2)
})
