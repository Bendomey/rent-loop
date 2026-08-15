/**
 * G3 — the move-in step is two answers, and everything else follows them.
 *
 * The quick-date offers are the point: the application carries no date, so the
 * step opens by offering the answers a landlord actually gives rather than
 * pretending one exists. The rail then reads those answers back, and its
 * payment count has to agree with the term that was set.
 */
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

test('the rail reads the term back with the right payment count', async ({
	page,
}) => {
	const s = readRunState()
	const { application, stayDuration } = await makeApprovableApplication(
		s,
		'g3',
		{ seq: 500 },
	)

	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/move-in`,
	)

	await expect(
		page.getByRole('heading', { name: /get the keys/i }),
	).toBeVisible({ timeout: 20_000 })

	await expect(page.getByText(/gets the keys on/i)).toBeVisible()
	await expect(
		page.getByText(new RegExp(`${stayDuration} rent payments`, 'i')),
	).toBeVisible()
})

test('a preset sets the term and arms the save', async ({ page }) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'g3b', {
		seq: 510,
	})

	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/move-in`,
	)

	await expect(
		page.getByRole('heading', { name: /get the keys/i }),
	).toBeVisible({ timeout: 20_000 })

	// The fixture sets 12 months, so 6 is a change.
	await page.getByRole('button', { name: /^6 months/ }).click()

	await expect(page.getByText(/6 payments/i).first()).toBeVisible()
	await expect(page.locator('#save-move-in')).toBeEnabled()
})
