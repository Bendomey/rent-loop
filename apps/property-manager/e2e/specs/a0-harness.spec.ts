/**
 * A0 — the harness itself.
 *
 * Not a product assertion. It proves global setup produced a usable session and
 * a reachable property before the real cases build on top of it, so a broken
 * login shows up here rather than as eleven confusing failures.
 */
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

test('the saved session lands on the E2E property, already authenticated', async ({
	page,
}) => {
	const state = readRunState()

	await page.goto(`/properties/${state.propertyId}`)

	// Not redirected to login — storageState carried the session.
	await expect(page).not.toHaveURL(/\/login/)

	// The property global setup found-or-created is the one we landed on.
	await expect(
		page.getByRole('heading', { name: new RegExp(state.propertyName, 'i') }),
	).toBeVisible()
})
