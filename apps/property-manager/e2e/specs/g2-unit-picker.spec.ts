/**
 * G2 — the picker groups units by whether they can actually be taken.
 *
 * The old step was a radio list where unpickable units were greyed to 50% and
 * still took up the list. Here they collapse into one line that says how many.
 * What matters is that the split is honest: a unit in the grid must be
 * selectable, and a unit in the collapsed group must not be in the grid.
 */
import { createUnit } from '../lib/api'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState, tag } from '../lib/state'
import { expect, test } from '../lib/test'

test('units that cannot be taken are collapsed out of the grid', async ({
	page,
}) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'g2', {
		seq: 400,
	})

	// A second free unit, so the grid has something in it besides the current.
	const spare = await createUnit(s.token, s.clientId, s.propertyId, s.blockId, {
		name: tag(s.runId, 'g2-spare'),
		rentFee: 70_000,
	})

	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/unit`,
	)
	await page.getByRole('button', { name: /pick a different unit/i }).click()

	// The spare is offered.
	await expect(
		page.locator(`#unit-grid [data-unit-id="${spare.id}"]`),
	).toBeVisible({ timeout: 20_000 })

	// Whatever is in the can't-take group is not also in the grid. The shared
	// E2E property accumulates occupied units across runs, so there is
	// reliably something in there by now — but the assertion holds either way.
	const collapsed = page.getByRole('button', { name: /can’t take/i })
	if (await collapsed.isVisible()) {
		await collapsed.click()
		const ids = await page
			.locator('[data-unavailable-unit]')
			.evaluateAll((nodes) =>
				nodes.map((node) => node.getAttribute('data-unavailable-unit')),
			)
		expect(ids.length, 'the group opened and listed its units').toBeGreaterThan(
			0,
		)
		for (const id of ids) {
			await expect(
				page.locator(`#unit-grid [data-unit-id="${id}"]`),
				`${id} cannot be taken, so it must not be in the grid`,
			).toHaveCount(0)
		}
	}
})

test('selecting a unit arms the confirm button', async ({ page }) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'g2b', {
		seq: 410,
	})
	const spare = await createUnit(s.token, s.clientId, s.propertyId, s.blockId, {
		name: tag(s.runId, 'g2b-spare'),
		rentFee: 70_000,
	})

	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/unit`,
	)
	await page.getByRole('button', { name: /pick a different unit/i }).click()

	// Nothing picked yet, so there is nothing to confirm.
	await expect(page.locator('#confirm-unit')).toBeDisabled({ timeout: 20_000 })

	await page.locator(`[data-unit-id="${spare.id}"]`).click()
	await expect(page.locator('#confirm-unit')).toBeEnabled()
	await expect(page.locator('#confirm-unit')).toContainText(spare.name)
})
