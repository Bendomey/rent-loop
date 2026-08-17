/**
 * F3 — changing the unit does not silently re-price the lease.
 *
 * Rent is stated, not inherited: the Agreed Rent step says so outright ("It is
 * not inherited from the unit; you state it here"). The Change Unit modal was
 * nonetheless sending the new unit's listed rent, so moving an application to a
 * dearer unit quietly rebuilt every charge at a figure nobody agreed to.
 *
 * Currency and payment frequency legitimately follow the unit — only the rent
 * figure is the landlord's to state.
 */
import { createUnit } from '../lib/api'
import { chargesSummary } from '../lib/expect'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState, tag } from '../lib/state'
import { expect, test } from '../lib/test'

const SAVE_TIMEOUT = 45_000

test('changing the unit keeps the agreed rent by default', async ({ page }) => {
	const s = readRunState()
	const { application, rentFee, stayDuration } =
		await makeApprovableApplication(s, 'f3', { seq: 200 })
	const agreedRent = rentFee / 100

	// A dearer unit, so adopting its price would be unmistakable.
	const dearer = await createUnit(
		s.token,
		s.clientId,
		s.propertyId,
		s.blockId,
		{ name: tag(s.runId, 'f3-dearer'), rentFee: 90_000 },
	)

	// ── change the unit, accepting whatever rent the modal defaults to ─────
	// The picker is on the page now — there is no Change Unit modal.
	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/unit`,
	)
	await page.getByRole('button', { name: /pick a different unit/i }).click()

	await page.locator(`[data-unit-id="${dearer.id}"]`).click()
	await page.locator('#confirm-unit').click()
	await expect(page.locator('#confirm-unit')).toBeHidden({
		timeout: SAVE_TIMEOUT,
	})

	// ── the lease is still priced at what was agreed ───────────────────────
	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/financial`,
	)
	// The agreed figure is edited in place in the "Changing the rent" card.
	await page
		.getByRole('button', { name: /change the rent/i })
		.click({ timeout: 20_000 })
	await expect(page.locator('#change-rent')).toHaveValue(String(agreedRent))

	// And the rebuilt schedule uses that figure, not the new unit's.
	await expect
		.poll(
			async () => chargesSummary(await page.locator('body').innerText()).total,
			{ timeout: SAVE_TIMEOUT },
		)
		.toBeCloseTo(agreedRent * stayDuration, 2)
})
