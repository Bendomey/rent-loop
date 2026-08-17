/**
 * G4 — the rent & payments step says what it is about to do, then what it did.
 *
 * In setup the plain-words panel is the design: it restates the answers as a
 * sentence before anything is saved, so a landlord can check it without
 * decoding a table. In the running view the page becomes one figure — what is
 * still owed — and that figure has to agree with the ledger it came from.
 */
import { makeApprovableApplication } from '../lib/factory'
import { chargesSummary } from '../lib/expect'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

test('the running view agrees with the ledger', async ({ page }) => {
	const s = readRunState()
	const { application, rentFee, stayDuration } =
		await makeApprovableApplication(s, 'g4', { seq: 600 })

	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/financial`,
	)

	await expect(page.getByText(/still owes you/i)).toBeVisible({
		timeout: 20_000,
	})

	// The summarised rent run states the same count and total the ledger holds.
	await expect(page.getByText(/\d+ payments? ·/i).first()).toBeVisible()
	const summary = chargesSummary(await page.locator('body').innerText())
	expect(summary.count).toBe(stayDuration)
	expect(summary.total).toBeCloseTo((rentFee / 100) * stayDuration, 2)

	// Nothing has been paid, so nothing can be late.
	await expect(page.getByText(/nothing is late/i)).toBeVisible()
})

test('a manual plan does not claim a bill is going out', async ({ page }) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'g4b', {
		seq: 610,
	})

	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/financial`,
	)
	await expect(page.getByText(/still owes you/i)).toBeVisible({
		timeout: 20_000,
	})

	// A prepared account is MANUAL until the landlord chooses otherwise, and
	// Rentloop issues nothing on a manual plan — so naming a next bill and a
	// date would be the page claiming something the product does not do. The
	// whole panel is absent, not merely reworded.
	//
	// Anchored on the panel's own heading rather than "goes out on its own":
	// the manual copy is "Nothing goes out on its own", which contains it.
	await expect(page.getByText(/next bill/i)).toHaveCount(0)
	await expect(page.getByText(/nothing goes out on its own/i)).toBeVisible()
})
