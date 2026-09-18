/**
 * H2 — recording a general expense.
 *
 * An expense is money owed to a vendor, so recording one raises a bill in the
 * same step. The "Already paid" toggle settles it there and then, which is how
 * most general expenses are entered: after the money has left.
 *
 * The KPI tiles on this page are Cube-backed, and Cube is a separate service
 * that need not be running for the portal to work. The assertions therefore
 * stay on the list, which reads from the API — a tile that renders a skeleton
 * because Cube is down should not fail a case about recording an expense.
 */
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

const UNPAID_AMOUNT = '850.00'
const PAID_AMOUNT = '400.00'

async function recordExpense(
	page: import('@playwright/test').Page,
	opts: { description: string; amount: string; vendor: string; paid: boolean },
) {
	await page.getByRole('button', { name: 'New expense' }).click()
	await page.getByLabel('Description').fill(opts.description)
	await page.getByLabel('Amount (GHS)').fill(opts.amount)
	await page.getByLabel('Vendor', { exact: true }).fill(opts.vendor)
	if (opts.paid) await page.getByRole('switch').click()
	await page.getByRole('button', { name: 'Record expense' }).click()
}

test('an unpaid expense is owed, and an already-paid one is settled', async ({
	page,
}) => {
	const s = readRunState()
	await page.goto(`/properties/${s.propertyId}/financials/expenses`)

	// ── owed ───────────────────────────────────────────────────────────────
	const owed = `Generator service ${s.runId}`
	await expect(page.getByRole('button', { name: 'New expense' })).toBeVisible({
		timeout: 20_000,
	})
	await recordExpense(page, {
		description: owed,
		amount: UNPAID_AMOUNT,
		vendor: `E2E Gensets ${s.runId}`,
		paid: false,
	})

	const owedRow = page.getByRole('row').filter({ hasText: owed })
	await expect(owedRow).toHaveCount(1, { timeout: 20_000 })
	// The bill exists from the moment the expense does, so it is owed rather
	// than merely noted — and it has a vendor, which migrated rows do not.
	await expect(owedRow).toContainText('Outstanding')
	await expect(owedRow).toContainText('E2E Gensets')
	await expect(owedRow).toContainText('General')
	await expect(owedRow).not.toContainText('No bill')
	await expect(
		owedRow.locator('a[href*="/financials/invoices/"]'),
	).toBeVisible()

	// ── settled in one step ────────────────────────────────────────────────
	const paid = `Landscaping ${s.runId}`
	await recordExpense(page, {
		description: paid,
		amount: PAID_AMOUNT,
		vendor: `E2E Gardens ${s.runId}`,
		paid: true,
	})

	const paidRow = page.getByRole('row').filter({ hasText: paid })
	await expect(paidRow).toHaveCount(1, { timeout: 20_000 })
	await expect(paidRow).toContainText('Settled')
	await expect(
		paidRow.locator('a[href*="/financials/invoices/"]'),
	).toBeVisible()
})
