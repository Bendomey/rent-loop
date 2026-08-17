import { expect, test } from 'vitest'
import { billLabel, billStatus, deriveLeaseMoney } from './lease-money'

const ASAT = new Date('2026-11-15T00:00:00Z')

const charge = (over: Partial<ChargeInstance>): ChargeInstance =>
	({
		id: 'c1',
		financial_account_id: 'a1',
		name: 'Rent – Nov 2026',
		category: 'RENT',
		amount: 100000,
		currency: 'GHS',
		due_date: '2026-11-08T00:00:00Z',
		invoiced_amount: 0,
		settled_amount: 0,
		outstanding_amount: 100000,
		status: 'OUTSTANDING',
		created_at: '',
		updated_at: '',
		...over,
	}) as ChargeInstance

const line = (chargeId: Nullable<string>, amount = 100000) =>
	({
		id: `l-${chargeId}`,
		invoice_id: 'i1',
		charge_instance_id: chargeId,
		label: 'Rent',
		category: 'RENT',
		quantity: 1,
		unit_amount: amount,
		total_amount: amount,
		currency: 'GHS',
		metadata: null,
	}) as InvoiceLineItem

const invoice = (over: Partial<Invoice>): Invoice =>
	({
		id: 'i1',
		code: 'INV-1',
		status: 'ISSUED',
		total_amount: 100000,
		currency: 'GHS',
		due_date: '2026-11-08T00:00:00Z',
		issued_at: '2026-11-03T00:00:00Z',
		paid_at: null,
		voided_at: null,
		line_items: [],
		payments: [],
		created_at: '2026-11-03T00:00:00Z',
		...over,
	}) as unknown as Invoice

const paidPayment = (amount: number) =>
	({ id: 'p1', amount, status: 'SUCCESSFUL' }) as unknown as Payment

const summaryOf = (charges: ChargeInstance[]): AccountSummary =>
	({
		account: { id: 'a1', currency: 'GHS' },
		charges,
		total_charged: charges.reduce((s, c) => s + c.amount, 0),
		total_settled: charges.reduce((s, c) => s + c.settled_amount, 0),
		outstanding_amount: charges.reduce((s, c) => s + c.outstanding_amount, 0),
		available_credit: 0,
	}) as AccountSummary

// ── billStatus ───────────────────────────────────────────────────────────────

test('a settled bill reads as paid', () => {
	const status = billStatus(invoice({ payments: [paidPayment(100000)] }), ASAT)
	expect(status.kind).toBe('paid')
	expect(status.label).toBe('Paid')
})

test('an unpaid bill past its date counts the days', () => {
	const status = billStatus(
		invoice({ due_date: '2026-11-08T00:00:00Z' as never }),
		ASAT,
	)
	expect(status.kind).toBe('late')
	expect(status.daysLate).toBe(7)
	expect(status.label).toBe('7 days late')
})

test('due today says so rather than zero days late', () => {
	const status = billStatus(
		invoice({ due_date: '2026-11-15T00:00:00Z' as never }),
		ASAT,
	)
	expect(status.kind).toBe('today')
	expect(status.label).toBe('Due today')
})

// The API leaves a bill's due date optional, so the label must not report on a
// date that was never set.
test('a bill with no due date of its own still reads as owed', () => {
	const status = billStatus(invoice({ due_date: null }), ASAT)
	expect(status.kind).toBe('open')
	expect(status.label).toBe('Not paid yet')
	expect(status.daysLate).toBe(0)
})

test('a bill not yet due counts down', () => {
	const status = billStatus(
		invoice({ due_date: '2026-11-20T00:00:00Z' as never }),
		ASAT,
	)
	expect(status.kind).toBe('open')
	expect(status.label).toBe('Due in 5 days')
})

// ── the merge ────────────────────────────────────────────────────────────────

// The whole point of this redesign. Two lists double-counted every billed item:
// a landlord saw "November rent" as a charge AND as an invoice line and had to
// work out they were the same money.
test('every charge appears exactly once across the three sections', () => {
	const charges = [
		charge({ id: 'r0', invoiced_amount: 100000, name: 'Rent – Sep' }),
		charge({ id: 'r1', invoiced_amount: 100000, name: 'Rent – Oct' }),
		charge({ id: 'r2', name: 'Rent – Nov' }),
		charge({ id: 'r3', name: 'Rent – Dec' }),
		charge({ id: 'f0', category: 'UTILITY', name: 'Water' }),
	]
	const invoices = [
		invoice({
			id: 'i1',
			total_amount: 200000,
			line_items: [line('r0'), line('r1')],
		}),
	]

	const money = deriveLeaseMoney(summaryOf(charges), invoices, ASAT)

	const seen = [
		...money.waiting.flatMap((g) => g.lines.map((c) => c.id)),
		...money.paid.flatMap((g) => g.lines.map((c) => c.id)),
		...money.comingRent.map((c) => c.id),
		...money.comingFees.map((c) => c.id),
	]

	expect(seen).toHaveLength(charges.length)
	expect(new Set(seen).size, 'no charge appears twice').toBe(charges.length)
	expect([...seen].sort()).toEqual(charges.map((c) => c.id).sort())
})

// The reason charge_instance_id had to be added to the API: two rent months of
// identical label and amount cannot be told apart any other way.
test('lines resolve through charge_instance_id, not by label', () => {
	const charges = [
		charge({ id: 'r0', name: 'Monthly rent' }),
		charge({ id: 'r1', name: 'Monthly rent', invoiced_amount: 100000 }),
	]
	const invoices = [invoice({ line_items: [line('r1')], total_amount: 100000 })]

	const money = deriveLeaseMoney(summaryOf(charges), invoices, ASAT)

	// Identical label and amount — only the id separates them.
	expect(money.waiting[0]!.lines.map((c) => c.id)).toEqual(['r1'])
	expect(money.comingRent.map((c) => c.id)).toEqual(['r0'])
})

// "Exactly once" must not depend on `invoiced_amount` agreeing with the lines.
// If a claimed charge somehow still reads as unbilled, it belongs to its bill —
// showing it in both places is the double-count this page exists to remove.
test('a claimed charge never also appears as still to come', () => {
	const charges = [charge({ id: 'r0', invoiced_amount: 0 })]
	const invoices = [invoice({ line_items: [line('r0')], total_amount: 100000 })]

	const money = deriveLeaseMoney(summaryOf(charges), invoices, ASAT)

	expect(money.waiting[0]!.lines.map((c) => c.id)).toEqual(['r0'])
	expect(money.comingRent).toHaveLength(0)
})

test('a line whose charge is missing is skipped rather than guessed at', () => {
	const charges = [charge({ id: 'r0' })]
	const invoices = [
		invoice({ line_items: [line('gone'), line('r0')], total_amount: 200000 }),
	]

	const money = deriveLeaseMoney(summaryOf(charges), invoices, ASAT)
	expect(money.waiting[0]!.lines.map((c) => c.id)).toEqual(['r0'])
})

test('a part-paid bill stays waiting, for what is left', () => {
	const charges = [
		charge({ id: 'r0', invoiced_amount: 100000 }),
		charge({ id: 'r1', invoiced_amount: 100000 }),
	]
	const invoices = [
		invoice({
			total_amount: 200000,
			line_items: [line('r0'), line('r1')],
			payments: [paidPayment(50000)],
		}),
	]

	const money = deriveLeaseMoney(summaryOf(charges), invoices, ASAT)
	expect(money.waiting).toHaveLength(1)
	expect(money.paid).toHaveLength(0)
	expect(money.waiting[0]!.balance).toBe(150000)
})

// L5 — voiding a bill releases its charges back to the ledger.
test('a void bill is dropped and its charges return to still-to-come', () => {
	const charges = [charge({ id: 'r0' })]
	const invoices = [
		invoice({
			status: 'VOID',
			voided_at: '2026-11-10T00:00:00Z' as never,
			line_items: [line('r0')],
		}),
	]

	const money = deriveLeaseMoney(summaryOf(charges), invoices, ASAT)
	expect(money.waiting).toHaveLength(0)
	expect(money.paid).toHaveLength(0)
	expect(money.comingRent.map((c) => c.id)).toEqual(['r0'])
})

test('removed charges are excluded from every figure', () => {
	const charges = [
		charge({ id: 'r0' }),
		charge({
			id: 'gone',
			voided_at: '2026-11-01T00:00:00Z',
			status: 'VOID',
		}),
	]

	const money = deriveLeaseMoney(summaryOf(charges), [], ASAT)
	expect(money.comingRent.map((c) => c.id)).toEqual(['r0'])
})

// Both come from the same resolved lines, so the part can never exceed the whole.
test('the late part of what is waiting never exceeds the whole', () => {
	const charges = [
		charge({
			id: 'r0',
			invoiced_amount: 100000,
			due_date: '2026-11-08T00:00:00Z',
		}),
		charge({
			id: 'r1',
			invoiced_amount: 100000,
			due_date: '2026-12-08T00:00:00Z',
		}),
	]
	const invoices = [
		invoice({ total_amount: 200000, line_items: [line('r0'), line('r1')] }),
	]

	const money = deriveLeaseMoney(summaryOf(charges), invoices, ASAT)
	expect(money.waitingLate).toBeLessThanOrEqual(money.waitingTotal)
	expect(money.waitingLate).toBe(100000)
	expect(money.waitingTotal).toBe(200000)
})

// Late means past due and unpaid whether or not a bill went out, so an unbilled
// overdue fee cannot hide from the figure at the top of the page.
test('an unbilled overdue fee still counts as late', () => {
	const charges = [
		charge({
			id: 'f0',
			category: 'UTILITY',
			name: 'Water',
			due_date: '2026-11-01T00:00:00Z',
		}),
	]

	const money = deriveLeaseMoney(summaryOf(charges), [], ASAT)
	expect(money.lateTotal).toBe(100000)
})

test('owed and paid are read off the server totals, not re-summed', () => {
	const summary = {
		...summaryOf([charge({ id: 'r0' })]),
		outstanding_amount: 424242,
		total_settled: 131313,
	} as AccountSummary

	const money = deriveLeaseMoney(summary, [], ASAT)
	expect(money.owes).toBe(424242)
	expect(money.paidToDate).toBe(131313)
})

// ── billLabel · what a bill is for, in the landlord's words ──────────────────

test('a bill for one thing is named by that thing', () => {
	expect(
		billLabel({ lines: [charge({ name: 'November 2026 rent' })] } as never),
	).toBe('November 2026 rent')
})

test('a bill for several things lists them with "and" before the last', () => {
	expect(
		billLabel({
			lines: [
				charge({ id: 'a', name: 'November 2026 rent' }),
				charge({ id: 'b', name: 'Water' }),
				charge({ id: 'c', name: 'Broken handle' }),
			],
		} as never),
	).toBe('November 2026 rent, Water and Broken handle')
})

test('a bill whose lines resolve to nothing still reads as something', () => {
	// Lines are dropped when their charge is not in the ledger, so a group can
	// legitimately arrive empty. "Bill" beats an empty string in a sentence.
	expect(billLabel({ lines: [] } as never)).toBe('This bill')
})

// ── naming what is late ──────────────────────────────────────────────────────

test('a late bill is exposed so the hero can name what is overdue', () => {
	const rent = charge({ id: 'r1', name: 'November 2026 rent' })
	const money = deriveLeaseMoney(
		summaryOf([rent]),
		[invoice({ line_items: [line('r1')] })],
		ASAT,
	)

	expect(money.lateBills).toHaveLength(1)
	expect(billLabel(money.lateBills[0]!)).toBe('November 2026 rent')
})

test('a bill that is not yet due is not late', () => {
	const rent = charge({ id: 'r1', due_date: '2026-12-08T00:00:00Z' })
	const money = deriveLeaseMoney(
		summaryOf([rent]),
		[
			invoice({
				due_date: new Date('2026-12-08T00:00:00Z'),
				line_items: [line('r1')],
			}),
		],
		ASAT,
	)

	expect(money.lateBills).toHaveLength(0)
})

test('an overdue fee no bill has claimed is still named as late', () => {
	// The case the hero's fallback exists for: money owed today that no bill
	// went out for. Saying "some of it hasn't been billed" tells the landlord
	// nothing they can act on.
	const fee = charge({
		id: 'f1',
		category: 'UTILITY',
		name: 'Water · Oct',
		due_date: '2026-11-01T00:00:00Z',
	})
	const money = deriveLeaseMoney(summaryOf([fee]), [], ASAT)

	expect(money.lateBills).toHaveLength(0)
	expect(money.lateCharges.map((c) => c.name)).toEqual(['Water · Oct'])
})

// ── still to come, in date order ─────────────────────────────────────────────

test('fees and the rent run interleave by date rather than fees always first', () => {
	// A fee due after the rent run starts belongs after it. Listing every fee
	// first put a February fee above the November rent it follows.
	const fee = charge({
		id: 'f1',
		category: 'UTILITY',
		name: 'Water',
		due_date: '2027-02-01T00:00:00Z',
	})
	const rent = charge({ id: 'r1', due_date: '2026-12-08T00:00:00Z' })

	const money = deriveLeaseMoney(summaryOf([fee, rent]), [], ASAT)

	expect(money.coming.map((item) => item.kind)).toEqual(['run', 'fee'])
})

test('the rent run is keyed on its earliest month', () => {
	const early = charge({ id: 'r1', due_date: '2026-12-08T00:00:00Z' })
	const later = charge({ id: 'r2', due_date: '2027-01-08T00:00:00Z' })
	const fee = charge({
		id: 'f1',
		category: 'OTHER',
		name: 'Fee',
		due_date: '2026-11-20T00:00:00Z',
	})

	const money = deriveLeaseMoney(summaryOf([later, early, fee]), [], ASAT)

	expect(money.coming.map((item) => item.kind)).toEqual(['fee', 'run'])
	const run = money.coming.find((item) => item.kind === 'run')
	expect(run?.kind === 'run' && run.run.map((c) => c.id)).toEqual(['r1', 'r2'])
})
