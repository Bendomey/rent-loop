/**
 * A2 — a PM can create an application end-to-end through the ADMIN wizard.
 *
 * This is the branch that actually produces a tenant_application row (a1's SELF
 * branch only emails a link). Five steps: unit + method, personal details,
 * identification, employment/emergency contact, then review.
 *
 * Success is the redirect to the application detail page — the app only routes
 * there once the API has returned a created application, so a green run means a
 * row exists rather than that a form merely submitted.
 */
import type { Page } from '@playwright/test'
import { expect, test } from '../lib/test'
import { createUnit } from '../lib/api'
import { readRunState, tag, uniquePhone } from '../lib/state'

/**
 * Picks a value from a shadcn Select.
 *
 * Targets `button[role="combobox"]` rather than `getByRole('combobox')`: each
 * Select renders two comboboxes — the visible trigger and a hidden native
 * <select> that carries the value for form submission — so the role alone
 * matches twice per field. The triggers also expose no accessible name, hence
 * the positional index.
 */
async function chooseNth(page: Page, index: number, option: string) {
	await page.locator('button[role="combobox"]').nth(index).click()
	await page.getByRole('option', { name: option, exact: true }).click()
}

async function next(page: Page) {
	await page.getByRole('button', { name: /^next/i }).click()
}

test('a PM can create an application through the admin wizard', async ({
	page,
}) => {
	const s = readRunState()

	const unit = await createUnit(s.token, s.clientId, s.propertyId, s.blockId, {
		name: tag(s.runId, 'a2'),
		rentFee: 50_000,
	})
	const phone = uniquePhone(s.runId, 2)

	await page.goto(`/properties/${s.propertyId}/occupancy/applications/new`)

	// ── step 0 · unit + onboarding method ──────────────────────────────────
	await page.getByRole('combobox').first().click()
	await page.getByRole('option', { name: unit.name }).click()
	await page.getByText('Admin Onboarding').click()
	await page.locator('input[type="tel"]').fill(phone)
	await next(page)

	// ── step 1 · personal details ──────────────────────────────────────────
	// Gender and marital status already default to Male/Single, and
	// date_of_birth is optional, so only the empty required fields need filling.
	await expect(page.locator('input[name="first_name"]')).toBeVisible()
	await page.locator('input[name="first_name"]').fill('E2E')
	await page.locator('input[name="last_name"]').fill(`Tenant${s.runId}`)
	await page
		.locator('input[name="email"]')
		.fill(`e2e-${s.runId}-a2@example.com`)
	await page.locator('input[name="current_address"]').fill('12 E2E Road, Accra')

	// date_of_birth is optional to *this step*, but the submit-time schema in
	// applications.new.ts requires it — skip it and Review rejects the submit
	// with no redirect. The picker opens at endMonth (18 years ago), so any
	// enabled day in the visible month is a valid date of birth.
	await page.getByRole('button', { name: /select date/i }).click()
	await page
		.getByRole('gridcell')
		.locator('button:not([disabled])')
		.first()
		.click()

	await next(page)

	// ── step 2 · identification ────────────────────────────────────────────
	await expect(page.locator('input[name="nationality"]')).toBeVisible()
	await page.locator('input[name="nationality"]').fill('Ghanaian')
	await chooseNth(page, 0, 'Ghana Card') // the step's only select: ID type
	await page.locator('input[name="id_number"]').fill(`GHA-${s.runId}-0`)
	await next(page)

	// ── step 3 · emergency contact + employment ────────────────────────────
	await expect(
		page.locator('input[name="emergency_contact_name"]'),
	).toBeVisible()

	// Employment type first: selecting it re-renders the form and drops text
	// typed beforehand, so filling then clicking leaves the name and
	// relationship fields empty and the step silently refuses to advance.
	await page.getByRole('button', { name: 'Worker', exact: true }).click()

	await page.locator('input[name="emergency_contact_name"]').fill('E2E Kin')
	await page
		.locator('input[name="relationship_to_emergency_contact"]')
		.fill('Sibling')
	// The step-1 phone carries forward disabled; this is the editable one.
	await page
		.locator('input[type="tel"]:not([disabled])')
		.first()
		.fill(uniquePhone(s.runId, 3))

	// Optional to this step, required by the submit-time schema — same trap as
	// date_of_birth above.
	await page.locator('input[name="occupation"]').fill('Engineer')
	await page.locator('input[name="employer"]').fill('E2E Ltd')
	await page
		.locator('input[name="occupation_address"]')
		.fill('9 Work Street, Accra')

	await page.getByRole('button', { name: /preview & submit/i }).click()

	// ── step 4 · review + submit ───────────────────────────────────────────
	await page
		.getByRole('button', { name: /submit|create|finish|confirm/i })
		.last()
		.click()

	// The action redirects to the created application, so this URL is proof the
	// row exists — not merely that the form posted.
	await expect(page).toHaveURL(/\/occupancy\/applications\/[0-9a-f-]{36}$/, {
		timeout: 30_000,
	})
})
