import { expect, test } from 'vitest'
import { chargeDisplayStatus, invoiceDisplayStatus } from './display-status'

const charge = (over: Partial<ChargeInstance> = {}) =>
	({
		id: 'c1',
		amount: 100000,
		invoiced_amount: 0,
		settled_amount: 0,
		status: 'OUTSTANDING',
		voided_at: null,
		due_date: '2026-09-08T00:00:00Z',
		...over,
	}) as ChargeInstance

test('charge statuses read as the landlord thinks of them', () => {
	expect(chargeDisplayStatus(charge()).label).toBe('Not yet billed')
	expect(chargeDisplayStatus(charge({ status: 'INVOICED' })).label).toBe(
		'Billed',
	)
	expect(chargeDisplayStatus(charge({ status: 'SETTLED' })).label).toBe('Paid')
	expect(chargeDisplayStatus(charge({ status: 'VOID' })).label).toBe('Removed')
})

// Invoices use a DIFFERENT vocabulary from charges — ISSUED, not INVOICED.
// A table keyed on the charge words returns undefined for every invoice.
test('invoice statuses use the invoice vocabulary', () => {
	const inv = (status: Invoice['status'], due = '2099-01-01T00:00:00Z') =>
		({ status, due_date: due, total_amount: 100000 }) as unknown as Invoice
	expect(invoiceDisplayStatus(inv('ISSUED')).label).toBe('Unpaid')
	expect(invoiceDisplayStatus(inv('PARTIALLY_PAID')).label).toBe('Part paid')
	expect(invoiceDisplayStatus(inv('PAID')).label).toBe('Paid')
	expect(invoiceDisplayStatus(inv('DRAFT')).label).toBe('Draft')
	expect(invoiceDisplayStatus(inv('VOID')).label).toBe('Void')
})

// Overdue exists only on the client — the server has no such status.
test('an unpaid invoice past its due date is overdue', () => {
	const now = new Date('2026-10-01T00:00:00Z')
	const overdue = {
		status: 'ISSUED',
		due_date: '2026-09-08T00:00:00Z',
	} as unknown as Invoice
	expect(invoiceDisplayStatus(overdue, now).label).toBe('Overdue')
})

test('a paid invoice past its due date is not overdue', () => {
	const now = new Date('2026-10-01T00:00:00Z')
	const paid = {
		status: 'PAID',
		due_date: '2026-09-08T00:00:00Z',
	} as unknown as Invoice
	expect(invoiceDisplayStatus(paid, now).label).toBe('Paid')
})

test('an invoice with no due date is never overdue', () => {
	const now = new Date('2026-10-01T00:00:00Z')
	const undated = { status: 'ISSUED', due_date: null } as unknown as Invoice
	expect(invoiceDisplayStatus(undated, now).label).toBe('Unpaid')
})
