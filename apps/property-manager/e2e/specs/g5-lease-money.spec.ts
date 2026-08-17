/**
 * G5 — the merged listing shows every charge exactly once.
 *
 * The page this replaced had two lists: bills, and charges. A rent charge that
 * had been billed appeared in both, so a landlord looking at a twelve-month
 * lease saw "November rent" twice and had to work out they were the same
 * money. The listing now shows each charge once, inside the bill that claimed
 * it if there is one.
 *
 * c2 pins this for an ad-hoc fee. Rent is the harder case and the one that
 * actually bit: unbilled rent collapses into a "N more months" run, so a
 * double-counted month hides inside a control that is closed by default.
 *
 * The join runs on `charge_instance_id`, which the invoice line-item payload
 * only started carrying for this page — so this is also the case that fails if
 * that field stops being returned.
 */
import {
	approveApplication,
	composeInvoice,
	getAccount,
	getApplicationAccountId,
} from '../lib/api'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

const STAY = 12

test('a billed rent charge leaves the run and appears only on its bill', async ({
	page,
}) => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'g5', {
		seq: 800,
		stayDuration: STAY,
	})

	const lease = await approveApplication(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)

	// The account is created against the application and carried onto the
	// lease, so this is the same ledger either side of approval.
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

	// The rent run, oldest first. Two are needed: one to bill, and one to prove
	// the absence assertion below can see into the run at all.
	const rent = charges
		.filter((charge) => charge.category === 'RENT')
		.sort((a, b) => Date.parse(a.due_date) - Date.parse(b.due_date))
	expect(
		rent.length,
		'the term should have produced a rent run',
	).toBeGreaterThan(1)
	const [billed, untouched] = rent

	// Billed through the API: the UI has no affordance for billing a single
	// rent charge, and what is under test is how the page *reads* the result.
	await composeInvoice(s.token, s.clientId, s.propertyId, accountId, [
		{ charge_instance_id: billed!.id, amount: billed!.amount },
	])

	await page.goto(`/properties/${s.propertyId}/occupancy/leases/${lease.id}`)
	await page.getByRole('tab', { name: 'Money' }).click()
	await expect(page.locator('#still-to-come')).toBeVisible({ timeout: 20_000 })

	// The run has to be opened before anything inside it can be asserted about
	// — a charge double-counted into a closed run is not in the DOM at all, so
	// checking for its absence while closed would pass for the wrong reason.
	const run = page.getByRole('button', { name: /more months? of rent/i })
	if (await run.isVisible()) await run.click()

	// The control that proves the absence below is not vacuous: a rent charge
	// that was never billed is findable inside the run by exactly this locator.
	await expect(
		page.locator(`#still-to-come [data-charge="${untouched!.id}"]`),
		'an unbilled month should still be listed in the run',
	).toBeVisible({ timeout: 20_000 })

	// And the billed one is not — it moved onto its bill.
	await expect(
		page.locator(`#still-to-come [data-charge="${billed!.id}"]`),
		'a billed month must not also be counted as still to come',
	).toHaveCount(0)

	await expect(
		page.locator(`#waiting-on-them [data-charge="${billed!.id}"]`),
		'it should appear inside the bill that claimed it',
	).toBeVisible()
})
