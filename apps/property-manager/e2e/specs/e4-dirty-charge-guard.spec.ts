/**
 * E4–E5 — what a billed charge should and should not freeze.
 *
 * The rule: changing the move-in setup is refused only when a *rent* charge is
 * dirty, because only rent derives from the move-in date. A billed security
 * deposit is unrelated and must not block the landlord from correcting a
 * mistyped date.
 *
 * `RederiveRent` already lists only rent charges before its dirty check, so e4
 * should hold today — it exists to keep it that way. Widening that query, or
 * moving the check to the whole account, would break e4 loudly instead of
 * quietly blocking every landlord who has taken a deposit first.
 *
 * "Dirty" is `invoiced_amount != 0 || settled_amount != 0`, so issuing an
 * invoice is enough to reach the guard's precondition — no payment needed.
 */
import {
	composeInvoice,
	createCharge,
	getApplicationAccountId,
	setApplicationTerms,
} from '../lib/api'
import { makeApprovableApplication } from '../lib/factory'
import { readRunState } from '../lib/state'
import { expect, test } from '../lib/test'

const BILL_TIMEOUT = 45_000
const isoDaysFromNow = (days: number) =>
	new Date(Date.now() + days * 86_400_000).toISOString()

test('e4 · a billed deposit does not freeze the move-in date', async ({
	page,
}) => {
	const s = readRunState()
	const { application, stayDuration } = await makeApprovableApplication(
		s,
		'e4',
		{ seq: 140 },
	)

	const accountId = await getApplicationAccountId(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)

	// A deposit, billed. Every rent charge stays clean.
	const deposit = await createCharge(
		s.token,
		s.clientId,
		s.propertyId,
		accountId,
		{
			name: `E2E Deposit ${s.runId}`,
			category: 'SECURITY_DEPOSIT',
			amount: 10_000,
		},
	)
	await composeInvoice(s.token, s.clientId, s.propertyId, accountId, [
		{ charge_instance_id: deposit.id, amount: 10_000 },
	])

	// The move-in date may still move: nothing that derives from it was billed.
	await expect(
		setApplicationTerms(s.token, s.clientId, s.propertyId, application.id, {
			rentFee: 50_000,
			moveInDate: isoDaysFromNow(45),
			stayDuration,
		}),
	).resolves.toBeUndefined()

	// The screen must agree that rent is still editable. The API allowing the
	// change means nothing if the page has locked the step: it previously
	// derived "billed" from every charge on the account, so a billed deposit
	// showed rent as fixed while the service would have accepted the edit.
	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/financial`,
	)
	await expect(page.getByText(/you can still change it/i)).toBeVisible({
		timeout: 20_000,
	})
	await expect(page.getByText(/rent is fixed now/i)).toHaveCount(0)
})

test('e5 · a billed rent charge does freeze the move-in date', async ({
	page,
}) => {
	const s = readRunState()
	const { application, stayDuration } = await makeApprovableApplication(
		s,
		'e5',
		{ seq: 150 },
	)

	const accountId = await getApplicationAccountId(
		s.token,
		s.clientId,
		s.propertyId,
		application.id,
	)

	// Bill one rent charge — the state that must freeze the terms.
	const { charges } = await import('../lib/api').then((m) =>
		m.getAccount(s.token, s.clientId, s.propertyId, accountId),
	)
	const rent = charges.find((c) => c.category === 'RENT')
	if (!rent) throw new Error('the account should have rent charges')

	await composeInvoice(s.token, s.clientId, s.propertyId, accountId, [
		{ charge_instance_id: rent.id, amount: rent.amount },
	])

	await expect(
		setApplicationTerms(s.token, s.clientId, s.propertyId, application.id, {
			rentFee: 50_000,
			moveInDate: isoDaysFromNow(45),
			stayDuration,
		}),
	).rejects.toThrow(/ChargesAlreadyBilled/)

	// The screen must say so too, rather than leaving rent apparently editable.
	await page.goto(
		`/properties/${s.propertyId}/occupancy/applications/${application.id}/financial`,
	)
	await expect(page.getByText(/rent is fixed now/i)).toBeVisible({
		timeout: BILL_TIMEOUT,
	})
})
