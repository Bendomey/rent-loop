import { expect, test } from 'vitest'
import { allocateOldestFirst, owedOn } from './payment-allocation'

const charge = (
	id: string,
	amount: number,
	due: string,
	invoiced = 0,
): ChargeInstance =>
	({
		id,
		name: id,
		category: 'RENT',
		amount,
		invoiced_amount: invoiced,
		settled_amount: 0,
		due_date: due,
	}) as ChargeInstance

const RUN = [
	charge('deposit', 100000, '2026-09-01T00:00:00Z'),
	charge('oct', 100000, '2026-10-08T00:00:00Z'),
	charge('nov', 100000, '2026-11-08T00:00:00Z'),
	charge('dec', 100000, '2026-12-08T00:00:00Z'),
]

test('nothing is claimed for nothing', () => {
	expect(allocateOldestFirst(RUN, 0)).toEqual([])
})

test('an amount covering one charge claims only the oldest', () => {
	expect(allocateOldestFirst(RUN, 100000)).toEqual(['deposit'])
})

test('an amount covering several fills them oldest first', () => {
	expect(allocateOldestFirst(RUN, 300000)).toEqual(['deposit', 'oct', 'nov'])
})

test('a part payment still claims the oldest charge', () => {
	// The money has to land somewhere. Claiming nothing would leave the
	// landlord with a payment they cannot record at all.
	expect(allocateOldestFirst(RUN, 40000)).toEqual(['deposit'])
})

test('an amount past the last charge claims everything and no more', () => {
	expect(allocateOldestFirst(RUN, 999999)).toEqual([
		'deposit',
		'oct',
		'nov',
		'dec',
	])
})

test('order comes from the due date, not the order passed in', () => {
	const shuffled = [RUN[2]!, RUN[0]!, RUN[3]!, RUN[1]!]
	expect(allocateOldestFirst(shuffled, 200000)).toEqual(['deposit', 'oct'])
})

test('what is already part-billed only counts for the rest', () => {
	// A charge half-claimed by an earlier bill owes half. Filling against its
	// full amount would silently under-claim the next one.
	const part = [
		charge('half', 100000, '2026-09-01T00:00:00Z', 60000),
		charge('oct', 100000, '2026-10-08T00:00:00Z'),
	]
	expect(owedOn(part[0]!)).toBe(40000)
	expect(allocateOldestFirst(part, 40000)).toEqual(['half'])
	expect(allocateOldestFirst(part, 50000)).toEqual(['half', 'oct'])
})
