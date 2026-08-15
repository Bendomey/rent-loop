/**
 * B1 — approving an application creates a lease and occupies the unit.
 *
 * This is the hinge of the whole flow: it is where a financial account gains
 * its lease_id, and where the unit stops being available to anyone else. The
 * application is built through the API (a2 already covers building one through
 * the UI) so this case tests only the approval.
 */
import { expect, test } from '../lib/test'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'

test('approving an application creates a lease and occupies the unit', async ({
	page,
}) => {
	const s = readRunState()

	const { unit, application } = await makeApprovableApplication(s, 'b1', {
		seq: 10,
	})

	// ── approve through the UI ─────────────────────────────────────────────
	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}`,
	)

	const approve = page.getByRole('button', { name: /^approve$/i })
	await expect(approve).toBeEnabled({ timeout: 20_000 })

	await approve.click()

	// Approval confirms in a Dialog (role="dialog") — note the invite modal in
	// a1 is an alertdialog, so the two are not interchangeable. Waiting for it
	// explicitly rather than probing visibility right after the click: the probe
	// races the render and silently skips the confirmation, leaving the
	// application InProgress with no lease and a test that still goes green
	// until the final assertion.
	// Addressed by name: another, unnamed dialog is mounted on this page, so a
	// bare getByRole('dialog') matches that one and never finds the button.
	const confirm = page.getByRole('dialog', { name: 'Approve Application' })
	await expect(confirm).toBeVisible({ timeout: 15_000 })
	await confirm.getByRole('button', { name: 'Yes, Approve' }).click()

	// ── the lease now exists ───────────────────────────────────────────────
	await page.goto(`/properties/${s.propertyId}/occupancy/leases`)
	await expect(page.getByText(unit.name).first()).toBeVisible({
		timeout: 30_000,
	})

	// ── and the unit is no longer available ────────────────────────────────
	// Searching rather than scanning the table: the shared E2E property
	// accumulates a unit per case per run, so the row is not on page one.
	await page.goto(`/properties/${s.propertyId}/assets/units`)
	await page
		.getByPlaceholder(/search/i)
		.first()
		.fill(unit.name)

	// The units page renders cards, not a table, so there is no row role to
	// filter. Match the innermost element carrying both this unit's name and its
	// status — asserting "Occupied appears somewhere on the page" would pass on
	// any other unit's badge.
	const card = page
		.locator('div')
		.filter({ hasText: unit.name })
		.filter({ hasText: /occupied/i })
		.last()
	await expect(card).toBeVisible({ timeout: 20_000 })
})
