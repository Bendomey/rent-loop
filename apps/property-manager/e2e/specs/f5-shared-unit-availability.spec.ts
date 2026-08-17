/**
 * F5 — a shared unit with a spare bed is not reported as unavailable.
 *
 * The move-in step warns when a term would overlap a sitting tenant's lease.
 * That check counted live leases without consulting the unit's capacity, so a
 * two-bed unit holding one tenant was declared unavailable until that tenant
 * left — even though the second bed was free the whole time.
 *
 * The companion to f4: the same capacity-blindness, on the step that decides
 * dates rather than the one that picks the unit.
 */
import { approveApplication, createUnit } from '../lib/api'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState, tag } from '../lib/state'
import { expect, test } from '../lib/test'

test('a shared unit with a free bed shows no availability warning', async ({
	page,
}) => {
	const s = readRunState()

	const shared = await createUnit(
		s.token,
		s.clientId,
		s.propertyId,
		s.blockId,
		{
			name: tag(s.runId, 'f5-shared'),
			rentFee: 40_000,
			maxOccupants: 2,
		},
	)

	// One sitting tenant — occupying 1 of 2.
	const sitting = await makeApprovableApplication(s, 'f5-sitting', {
		seq: 230,
		unitId: shared.id,
	})
	await approveApplication(
		s.token,
		s.clientId,
		s.propertyId,
		sitting.application.id,
	)

	// A second applicant for the same unit, still choosing dates.
	const second = await makeApprovableApplication(s, 'f5-second', {
		seq: 240,
		unitId: shared.id,
	})

	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${second.application.id}/move-in`,
	)

	// Wait for the step to render before asserting an absence — otherwise the
	// assertion passes on an empty page. Anchored on the first question's
	// heading: the duration stepper now lives behind "Something else", and the
	// date control is a popover button rather than a labelled input.
	await expect(
		page.getByRole('heading', { name: /get the keys/i }),
	).toBeVisible({ timeout: 20_000 })

	// The warning is driven by a leases query, so waiting only for the step to
	// render asserts the absence before the data that would produce it has
	// arrived — which passes for the wrong reason.
	await page.waitForLoadState('networkidle')

	// The phrasing moved with the redesign: the constraint is now part of the
	// question ("Ama is in this unit until …") rather than an error after it.
	// This string must match `ask-date.tsx` — a negative assertion against copy
	// that no longer exists passes for the wrong reason and stops testing
	// anything.
	await expect(
		page.getByText(/is in this unit until/i),
		'a unit with a spare bed should not be reported as occupied',
	).toHaveCount(0)
})
