/**
 * E1–E3 — changing the move-in setup rebuilds the rent schedule.
 *
 * Rent charges are derived from move-in date + stay duration, so editing
 * either must re-derive them. Nothing here is billed, which is the
 * straightforward case: RederiveRent is free to delete and rebuild.
 *
 * Grouped in one file because they are three views of one rule — shift the
 * start, lengthen the term, shorten the term.
 */
import {
	getAccount,
	getApplicationAccountId,
	setApplicationTerms,
} from '../lib/api'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

const isoDaysFromNow = (days: number) =>
	new Date(Date.now() + days * 86_400_000).toISOString()

async function rentCharges(
	s: ReturnType<typeof readRunState>,
	applicationId: string,
) {
	const accountId = await getApplicationAccountId(
		s.token,
		s.clientId,
		s.propertyId,
		applicationId,
	)
	const { charges } = await getAccount(
		s.token,
		s.clientId,
		s.propertyId,
		accountId,
	)
	return charges.filter((c) => c.category === 'RENT')
}

test('e1 · moving the move-in date shifts the rent schedule', async ({
	page,
}) => {
	const s = readRunState()
	const { application, stayDuration } = await makeApprovableApplication(
		s,
		'e1',
		{ seq: 110 },
	)

	const before = await rentCharges(s, application.id)
	expect(before).toHaveLength(stayDuration)
	const firstDueBefore = before[0]?.due_date

	await setApplicationTerms(s.token, s.clientId, s.propertyId, application.id, {
		rentFee: 50_000,
		moveInDate: isoDaysFromNow(60),
		stayDuration,
	})

	const after = await rentCharges(s, application.id)
	expect(after, 'the term length did not change').toHaveLength(stayDuration)
	expect(
		after[0]?.due_date,
		'the schedule should have moved with the move-in date',
	).not.toBe(firstDueBefore)

	// The screen must agree — a rebuild the PM cannot see is not a rebuild.
	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/financial`,
	)
	await expect(page.getByText(`${stayDuration} charges`).first()).toBeVisible({
		timeout: 20_000,
	})
})

test('e2 · extending the stay adds rent charges', async () => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'e2', {
		seq: 120,
		stayDuration: 12,
	})

	expect(await rentCharges(s, application.id)).toHaveLength(12)

	await setApplicationTerms(s.token, s.clientId, s.propertyId, application.id, {
		rentFee: 50_000,
		moveInDate: isoDaysFromNow(1),
		stayDuration: 18,
	})

	expect(await rentCharges(s, application.id)).toHaveLength(18)
})

test('e3 · shortening the stay removes rent charges', async () => {
	const s = readRunState()
	const { application } = await makeApprovableApplication(s, 'e3', {
		seq: 130,
		stayDuration: 12,
	})

	expect(await rentCharges(s, application.id)).toHaveLength(12)

	await setApplicationTerms(s.token, s.clientId, s.propertyId, application.id, {
		rentFee: 50_000,
		moveInDate: isoDaysFromNow(1),
		stayDuration: 6,
	})

	expect(await rentCharges(s, application.id)).toHaveLength(6)
})
