/**
 * G1 — the overview names the next action and links each step correctly.
 *
 * The hub's whole claim is that it answers "what do I do next". A fully-set-up
 * application is ready, so the lead card must offer the approve decision
 * rather than a step; and every step card must go where it says, because a
 * card that lies is worse than the rail it replaced.
 */
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

test('a ready application leads with the approve decision', async ({
	page,
}) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'g1', {
		seq: 300,
	})

	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}`,
	)

	// The lead card, not a step card.
	const lead = page.locator('#application-lead')
	await expect(lead).toBeVisible({ timeout: 20_000 })
	await expect(lead).toContainText(/last thing/i)
	await expect(
		lead.getByRole('button', { name: /approve & make the lease/i }),
	).toBeEnabled()

	// Five steps, and the unit card goes to the unit page.
	const steps = page.locator('#application-steps > a')
	await expect(steps).toHaveCount(5)
	await expect(steps.first()).toHaveAttribute(
		'href',
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/unit`,
	)

	// Lease documents are vacuously approvable until an agreement is attached,
	// so this application is ready with a step still unstarted. No step may be
	// highlighted as the next thing — the page cannot say "everything's done"
	// and point at an unfinished step at the same time.
	await expect(
		page.locator('#application-steps [data-lead="true"]'),
	).toHaveCount(0)
})

test('the progress bar agrees with the step count', async ({ page }) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'g1b', {
		seq: 310,
	})

	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}`,
	)

	const header = page.locator('#application-header')
	await expect(header).toBeVisible({ timeout: 20_000 })

	// Lease documents are optional until an agreement is attached, so an
	// approvable application is not necessarily 5/5 — but the bar must never
	// claim more than the step count does.
	const text = await header.innerText()
	const done = /(\d+) of 5 steps done/.exec(text)
	const pct = /(\d+)%/.exec(text)

	expect(done, 'the header states how many steps are done').not.toBeNull()
	expect(pct, 'the header states a percentage').not.toBeNull()
	expect(Number(pct?.[1])).toBe(Math.round((Number(done?.[1]) / 5) * 100))
})
