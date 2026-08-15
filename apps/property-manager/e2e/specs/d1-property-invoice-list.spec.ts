/**
 * D1 — the property invoice list shows issued invoices and hides voided ones.
 *
 * This is the failure the financials migration runbook warned about most
 * loudly: if invoices stop resolving to a property, the PM's list silently
 * returns empty — no error, just missing money. It was verified by hand once
 * during the rehearsal; this case makes it a standing guard.
 *
 * Both invoices are created by this run and looked up by their own codes, so
 * the assertions never depend on what else the property holds.
 */
import { approveApplication, listLeaseInvoices, voidInvoice } from '../lib/api'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

const BILL_TIMEOUT = 45_000

test('the property invoice list shows issued invoices and hides voided ones', async ({
	page,
}) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'd1', { seq: 70 })
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

	// ── bill two charges ───────────────────────────────────────────────────
	for (const [label, amount] of [
		['Keeper', 90],
		['Doomed', 60],
	] as const) {
		await page.getByRole('button', { name: 'Add charge' }).click()
		const dialog = page.getByRole('dialog', { name: 'Add a charge' })
		await expect(dialog).toBeVisible()
		await dialog.getByRole('button', { name: 'Other', exact: true }).click()
		await dialog.locator('#charge-name').fill(`E2E ${label} ${s.runId}`)
		await dialog.locator('#charge-amount').fill(String(amount))
		await dialog.locator('#charge-bill-now').click()
		await dialog.getByRole('button', { name: 'Add and bill' }).click()
		await expect(dialog).toBeHidden({ timeout: BILL_TIMEOUT })
	}

	// Two invoices, one of which is about to be voided. Ordering from the API is
	// newest-first, so the second charge billed is the first row back.
	const issued = await listLeaseInvoices(
		s.token,
		s.clientId,
		s.propertyId,
		lease.id,
	)
	const live = issued.filter((i) => i.status === 'ISSUED')
	expect(live.length, 'billing twice should have issued two invoices').toBe(2)

	const doomed = live[0]
	const keeper = live[1]
	if (!doomed || !keeper) {
		throw new Error('expected two issued invoices to work with')
	}

	await voidInvoice(s.token, s.clientId, s.propertyId, doomed.id)

	// ── the property list ──────────────────────────────────────────────────
	await page.goto(`/properties/${s.propertyId}/financials/invoices`)
	const search = page.getByPlaceholder(/search invoice/i)
	await expect(search).toBeVisible({ timeout: 20_000 })

	// Searched by code rather than scanned: the shared E2E property accumulates
	// invoices across runs, so "the list contains a row" must mean *this* row.
	await search.fill(keeper.code)
	await expect(page.getByText(keeper.code).first()).toBeVisible({
		timeout: 20_000,
	})

	await search.fill(doomed.code)
	await expect(page.getByText(doomed.code)).toHaveCount(0, { timeout: 20_000 })
})
