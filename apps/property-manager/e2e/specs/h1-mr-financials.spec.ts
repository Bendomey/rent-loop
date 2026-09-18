/**
 * H1 — the maintenance request Financials tab.
 *
 * A request's cost can fall three ways: nobody pays, the tenant is recharged,
 * or the landlord pays a vendor. The tab has to show all three and total them,
 * because the tab it replaced showed only the vendor's share and so reported a
 * split job as costing less than it did.
 *
 * The "Tenant" option is asserted *absent* rather than disabled. Without a
 * lease there is no tenant to charge and nothing on the screen can change
 * that, so a control that never becomes usable would be worse than no control.
 */
import { createMaintenanceRequest, createUnit } from '../lib/api'
import { readRunState, tag } from '../lib/state'
import { expect, test } from '../lib/test'

const VENDOR_AMOUNT = '300.50'
const RECORD_AMOUNT = '49.50'

test('a request with no lease refuses to offer a tenant charge', async ({
	page,
}) => {
	const s = readRunState()
	const unit = await createUnit(s.token, s.clientId, s.propertyId, s.blockId, {
		name: tag(s.runId, 'h1a'),
		rentFee: 50_000,
	})
	// INTERNAL_ONLY never attaches a lease, whatever the unit's tenancy.
	const request = await createMaintenanceRequest(
		s.token,
		s.clientId,
		s.propertyId,
		{
			unitId: unit.id,
			title: tag(s.runId, 'h1a-request'),
			visibility: 'INTERNAL_ONLY',
		},
	)

	await page.goto(
		`/properties/${s.propertyId}/activities/maintenance-requests/${request.id}`,
	)
	await page.getByRole('tab', { name: 'Financials' }).click()
	await page.getByRole('button', { name: 'Log financial' }).click()

	await page.getByRole('combobox').first().click()
	await expect(
		page.getByRole('option', { name: /No one/ }),
	).toBeVisible({ timeout: 10_000 })
	await expect(page.getByRole('option', { name: /Landlord pays/ })).toBeVisible()
	await expect(page.getByRole('option', { name: /Tenant/ })).toHaveCount(0)
})

test('logged financials are listed with their settlement and totalled', async ({
	page,
}) => {
	const s = readRunState()
	const unit = await createUnit(s.token, s.clientId, s.propertyId, s.blockId, {
		name: tag(s.runId, 'h1b'),
		rentFee: 50_000,
	})
	const request = await createMaintenanceRequest(
		s.token,
		s.clientId,
		s.propertyId,
		{
			unitId: unit.id,
			title: tag(s.runId, 'h1b-request'),
			visibility: 'INTERNAL_ONLY',
		},
	)

	await page.goto(
		`/properties/${s.propertyId}/activities/maintenance-requests/${request.id}`,
	)
	await page.getByRole('tab', { name: 'Financials' }).click()

	// ── a vendor expense ───────────────────────────────────────────────────
	const vendorLine = `Plumber labour ${s.runId}`
	await page.getByRole('button', { name: 'Log financial' }).click()
	await page.getByLabel('Description').fill(vendorLine)
	await page.getByLabel('Amount (GHS)').fill(VENDOR_AMOUNT)
	await page.getByRole('combobox').first().click()
	await page.getByRole('option', { name: /Landlord pays/ }).click()
	await page.getByLabel('Vendor name').fill(`E2E Plumbing ${s.runId}`)
	await page.getByRole('button', { name: 'Save' }).click()

	await expect(page.getByText(vendorLine)).toBeVisible({ timeout: 20_000 })
	// Creating the expense raises its bill in the same step, so the line is
	// owed rather than merely recorded.
	await expect(page.getByText('Vendor').first()).toBeVisible()
	await expect(page.getByText('Outstanding').first()).toBeVisible()

	// ── and a cost nobody pays ─────────────────────────────────────────────
	const recordLine = `Callout ${s.runId}`
	await page.getByRole('button', { name: 'Log financial' }).click()
	await page.getByLabel('Description').fill(recordLine)
	await page.getByLabel('Amount (GHS)').fill(RECORD_AMOUNT)
	await page.getByRole('button', { name: 'Save' }).click()

	await expect(page.getByText(recordLine)).toBeVisible({ timeout: 20_000 })
	await expect(page.getByText('Recorded').first()).toBeVisible()

	// ── the total is what the request cost, both lines together ────────────
	const total = Number(VENDOR_AMOUNT) + Number(RECORD_AMOUNT)
	await expect(
		page.getByText(`Total:`).locator('..'),
	).toContainText(total.toFixed(2), { timeout: 20_000 })
})
