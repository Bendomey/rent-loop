/**
 * A1 — a PM can invite a tenant to apply for an available unit.
 *
 * The SELF onboarding path, which is the wizard's default. Note what this does
 * *not* do: it creates no tenant_application. The invite emails a link carrying
 * the unit id, and the application row appears only when the tenant opens that
 * link and applies. Verified against the database — after this case runs, the
 * property still has zero applications.
 *
 * Creating an application through the UI is the ADMIN branch (steps 1–4, ~17
 * required fields) and is a2's job.
 */
import { expect, test } from '../lib/test'
import { createUnit } from '../lib/api'
import { readRunState, tag, uniquePhone } from '../lib/state'

test('a PM can invite a tenant to apply for an available unit', async ({
	page,
}) => {
	const s = readRunState()

	// Prerequisite via API: the thing under test is the wizard, not unit setup.
	const unit = await createUnit(s.token, s.clientId, s.propertyId, s.blockId, {
		name: tag(s.runId, 'a1'),
		rentFee: 50_000,
	})
	const phone = uniquePhone(s.runId, 1)
	const email = `e2e-${s.runId}-a1@example.com`

	await page.goto(`/properties/${s.propertyId}/occupancy/applications/new`)

	await expect(
		page.getByRole('heading', { name: /add new rental application/i }),
	).toBeVisible()

	// Pick this run's unit. Only Available units are listed, which is why each
	// case creates its own — approving one occupies it permanently.
	await page.getByRole('combobox').first().click()
	await page.getByRole('option', { name: unit.name }).click()

	// SELF is the default onboarding method; Next opens the invite modal.
	await page.getByRole('button', { name: /^next/i }).click()

	// The invite modal is an alertdialog, and it is tabbed — Email is selected
	// by default, Phone is a second tab, so only one contact field is on screen.
	const modal = page.getByRole('alertdialog')
	await expect(modal).toBeVisible()
	await expect(modal).toContainText(unit.name)

	// The shareable link must point at *this* unit — an invite that silently
	// targets the wrong unit would still close the modal and look like success.
	// The shareable link is the modal's last textbox, after the contact field.
	await expect(modal.getByRole('textbox').last()).toHaveValue(
		new RegExp(`unit=${unit.id}`),
	)

	await modal.getByRole('textbox', { name: 'Email' }).fill(email)
	await modal.getByRole('button', { name: 'Invite Tenant' }).click()

	// The modal closing is the app's own signal that the invite was accepted;
	// asserting on a toast would couple the case to notification copy.
	await expect(modal).toBeHidden({ timeout: 20_000 })

	void phone
})
