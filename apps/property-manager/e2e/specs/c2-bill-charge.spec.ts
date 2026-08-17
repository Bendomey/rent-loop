/**
 * C2 — a billed charge moves onto its bill and stops being "still to come".
 *
 * Billing and paying are separate events in this model: the charge's
 * invoiced_amount moves while its settled_amount stays at zero, and the page
 * has to show that as a bill waiting on the tenant rather than as money
 * collected.
 *
 * The billing itself now happens through the API. The fee dialog lost its
 * bill-now tick when the flow changed to ask whether the money is already in
 * hand — answering yes settles as well as bills — so there is no longer a UI
 * route to a billed-and-unpaid fee. That state is this case's precondition;
 * what it asserts is still entirely what the page shows.
 */
import { approveApplication, getApplicationAccountId } from '../lib/api'
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

const CHARGE_AMOUNT = 250.0

test('a billed charge reads as billed and unpaid', async ({ page }) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'c2', { seq: 40 })
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

	// ── bill a charge ──────────────────────────────────────────────────────
	// Through the API: the fee dialog lost its bill-now tick, so the page no
	// longer has a route to a billed-and-unpaid fee. That state is this case's
	// precondition, not its subject — what it asserts is how the page reads it.
	const chargeName = `E2E Billed ${s.runId}`
	const accountId = await getApplicationAccountId(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)
	await billedFee(s, accountId, chargeName, CHARGE_AMOUNT * 100)

	await page.reload()
	await page.getByRole('tab', { name: 'Money' }).click()

	// ── the charge is billed, not merely added ─────────────────────────────
	// The page shows every item exactly once, inside the bill that claimed it,
	// so "billed" is now a placement rather than a badge. Waiting on them is
	// the section for bills that have gone out and are not settled.
	const bill = page.locator('[data-bill]').filter({ hasText: chargeName })
	await expect(bill).toBeVisible({ timeout: 20_000 })
	await expect(page.locator('#waiting-on-them')).toContainText(chargeName)

	// The other half of "exactly once": having been claimed by a bill, it must
	// have left the unbilled section. Without this the merge could regress to
	// the old double-counting and the case above would still pass.
	await expect(page.locator('#still-to-come')).toBeVisible()
	await expect(
		page.locator('#still-to-come').getByText(chargeName),
	).toHaveCount(0)

	// ── an invoice now exists for it, and is unsettled ─────────────────────
	// Asserted via the money still owed rather than a status badge: the
	// dialog's default due date is today, so the invoice is issued already
	// overdue and the badge wording depends on the date. What is owed does not.
	await expect(bill).toContainText('250.00')
	await expect(
		bill.getByRole('button', { name: 'Record a payment' }),
	).toBeVisible()

	// ── and the account total is unchanged: billing moves no money ─────────
	const after = chargesSummary(await page.locator('body').innerText())
	expect(after.count).toBe(before.count + 1)
	expect(after.total).toBeCloseTo(before.total + CHARGE_AMOUNT, 2)
})
