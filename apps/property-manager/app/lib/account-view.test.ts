import { expect, test } from 'vitest'
import { deriveAccountView } from './account-view'

const charge = (over: Partial<ChargeInstance>): ChargeInstance =>
	({
		id: 'c1',
		financial_account_id: 'a1',
		name: 'Rent – Sep 2026',
		category: 'RENT',
		amount: 100000,
		currency: 'GHS',
		due_date: '2026-09-08T00:00:00Z',
		invoiced_amount: 0,
		settled_amount: 0,
		outstanding_amount: 100000,
		status: 'OUTSTANDING',
		created_at: '',
		updated_at: '',
		...over,
	}) as ChargeInstance

const summary = (charges: ChargeInstance[]): AccountSummary =>
	({
		account: { currency: 'GHS' },
		charges,
		total_charged: charges.reduce((s, c) => s + c.amount, 0),
		total_settled: charges.reduce((s, c) => s + c.settled_amount, 0),
		outstanding_amount: charges.reduce((s, c) => s + c.outstanding_amount, 0),
		available_credit: 0,
	}) as AccountSummary

const ASAT = new Date('2026-10-20T00:00:00Z')

test('late is past due and not fully paid, whether or not it was billed', () => {
	const view = deriveAccountView(
		summary([
			charge({ id: 'a', due_date: '2026-09-08T00:00:00Z' }),
			charge({ id: 'b', due_date: '2026-11-08T00:00:00Z' }),
		]),
		{ asAt: ASAT, leadDays: 5 },
	)

	expect(view.lateTotal).toBe(100000)
})

test('a part-paid charge is late only for what is left', () => {
	const view = deriveAccountView(
		summary([
			charge({
				id: 'a',
				due_date: '2026-09-08T00:00:00Z',
				settled_amount: 40000,
				outstanding_amount: 60000,
			}),
		]),
		{ asAt: ASAT, leadDays: 5 },
	)

	expect(view.lateTotal).toBe(60000)
	expect(view.paid).toBe(40000)
})

// Removed charges stay on the record but stop counting (F9).
test('voided charges are excluded from every figure', () => {
	const view = deriveAccountView(
		summary([
			charge({ id: 'a', due_date: '2026-09-08T00:00:00Z' }),
			charge({
				id: 'v',
				due_date: '2026-09-08T00:00:00Z',
				voided_at: '2026-09-01T00:00:00Z',
				status: 'VOID',
			}),
		]),
		{ asAt: ASAT, leadDays: 5 },
	)

	expect(view.lateTotal).toBe(100000)
})

// The next bill is the first rent charge no invoice has claimed yet.
test('the next bill is the first unclaimed rent charge', () => {
	const view = deriveAccountView(
		summary([
			charge({
				id: 'r1',
				due_date: '2026-09-08T00:00:00Z',
				invoiced_amount: 100000,
			}),
			charge({ id: 'r2', due_date: '2026-11-08T00:00:00Z' }),
		]),
		{ asAt: ASAT, leadDays: 5 },
	)

	expect(view.next).not.toBeNull()
	expect(view.next!.dueOn.toISOString().slice(0, 10)).toBe('2026-11-08')
	// Issued leadDays before it falls due.
	expect(view.next!.issueOn.toISOString().slice(0, 10)).toBe('2026-11-03')
	// The charge's own name — the UI must not re-derive a period label and
	// risk disagreeing with what the ledger says.
	expect(view.next!.rentLabel).toBe('Rent – Sep 2026')
})

// F5 — the first invoice is never rent alone.
test('unbilled fees already due are swept into the next bill', () => {
	const view = deriveAccountView(
		summary([
			charge({ id: 'r', due_date: '2026-11-08T00:00:00Z' }),
			charge({
				id: 'dep',
				category: 'SECURITY_DEPOSIT',
				name: 'Security deposit',
				amount: 50000,
				outstanding_amount: 50000,
				due_date: '2026-09-01T00:00:00Z',
			}),
		]),
		{ asAt: ASAT, leadDays: 5 },
	)

	expect(view.next!.amount).toBe(150000)
	expect(view.next!.feeNames).toEqual(['Security deposit'])
})

test('a fee due after the next rent is left for later', () => {
	const view = deriveAccountView(
		summary([
			charge({ id: 'r', due_date: '2026-11-08T00:00:00Z' }),
			charge({
				id: 'fee',
				category: 'UTILITY',
				name: 'Water',
				amount: 5000,
				outstanding_amount: 5000,
				due_date: '2027-01-01T00:00:00Z',
			}),
		]),
		{ asAt: ASAT, leadDays: 5 },
	)

	expect(view.next!.amount).toBe(100000)
	expect(view.next!.feeNames).toEqual([])
})

test('everything billed leaves no next bill', () => {
	const view = deriveAccountView(
		summary([charge({ id: 'r', invoiced_amount: 100000 })]),
		{ asAt: ASAT, leadDays: 5 },
	)
	expect(view.next).toBeNull()
})
