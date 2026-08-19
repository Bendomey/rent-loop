/**
 * B1 — approving an application creates a lease and occupies the unit.
 *
 * This is the hinge of the whole flow: it is where an account's charges gain
 * their lease, and where the unit stops being available to anyone else. The
 * application is built through the API (a2 already covers building one through
 * the UI) so this case tests only the approval.
 */
import { getAccount, getApplicationAccountId } from '../lib/api'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

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

	// The application's own URL is now the overview, and its lead card carries
	// the only approve button in the product.
	const approve = page.getByRole('button', {
		name: /approve & make the lease/i,
	})
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

	// The badge flipping is the page's own signal that approval landed. Waiting
	// on it before reading the API: the read below is immediate, so without
	// this it races the request the click fired and finds an account that has
	// not been linked yet.
	await expect(
		page.locator('#application-header').getByText('Approved', { exact: true }),
	).toBeVisible({ timeout: 30_000 })

	// ── the lease now exists ───────────────────────────────────────────────
	// Read from the account rather than scanned for on the leases index: that
	// list is paginated and searchable only by lease code, so under a full-suite
	// run the shared E2E property accumulates enough leases to push this one off
	// page one — the same accumulation the units assertion below already guards
	// against with search.
	//
	// The lease is read off the charges, not off the account. One account now
	// spans every lease of a renewal chain, so it has no single lease to point
	// at; the link runs the other way, and approval stamps the account's
	// until-then unscoped charges with the lease it just created. That stamp is
	// the direct evidence approval did its job.
	const accountId = await getApplicationAccountId(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)
	const { charges } = await getAccount(
		s.token,
		s.clientId,
		s.propertyId,
		accountId,
	)
	const leaseId = charges.find((charge) => charge.lease_id)?.lease_id
	expect(
		leaseId,
		"approval should have scoped the account's charges to a lease",
	).toBeTruthy()

	// And the lease they point at is the one for this unit, viewable in the UI.
	await page.goto(`/properties/${s.propertyId}/occupancy/leases/${leaseId}`)
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
