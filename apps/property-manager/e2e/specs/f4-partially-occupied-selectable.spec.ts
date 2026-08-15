/**
 * F4 — a partially occupied unit can still be chosen.
 *
 * A unit whose `max_occupants_allowed` exceeds its live lease count is
 * PartiallyOccupied: it has room, and the service says so — create, bulk create
 * and approve all accept `Available || PartiallyOccupied`. So does the unit
 * picker in the new-application wizard, which labels both as "(Available)".
 *
 * The Change Unit modal disagreed, testing `status === 'Unit.Status.Available'`
 * alone and disabling everything else. A landlord filling the second bed in a
 * shared unit could start an application for it but never move an existing one
 * onto it.
 */
import { approveApplication, createUnit } from '../lib/api'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState, tag } from '../lib/state'
import { expect, test } from '../lib/test'

test('a partially occupied unit is selectable when changing unit', async ({
	page,
}) => {
	const s = readRunState()

	// A two-bed unit, then one lease on it — occupying 1 of 2, which is exactly
	// what makes a unit PartiallyOccupied rather than Occupied.
	const shared = await createUnit(
		s.token,
		s.clientId,
		s.propertyId,
		s.blockId,
		{
			name: tag(s.runId, 'f4-shared'),
			rentFee: 40_000,
			maxOccupants: 2,
		},
	)

	const firstTenant = await makeApprovableApplication(s, 'f4-first', {
		seq: 210,
		unitId: shared.id,
	})
	await approveApplication(
		s.token,
		s.clientId,
		s.propertyId,
		firstTenant.application.id,
	)

	// A second application, on its own unit, which we now try to move across.
	const mover = await makeApprovableApplication(s, 'f4-mover', { seq: 220 })

	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${mover.application.id}`,
	)
	await page.getByRole('button', { name: 'Change', exact: true }).click()

	const modal = page.getByRole('alertdialog', { name: 'Change Unit' })
	await expect(modal).toBeVisible({ timeout: 20_000 })

	// The shared unit has room, so it must be offered — not greyed out.
	const option = modal.getByRole('button', { name: new RegExp(shared.name) })
	await expect(option).toBeVisible()
	await expect(
		option,
		'a unit with spare capacity should still be selectable',
	).toBeEnabled()
})
