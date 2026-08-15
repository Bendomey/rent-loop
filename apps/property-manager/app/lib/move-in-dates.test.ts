import { expect, test } from 'vitest'
import { quickDates } from './move-in-dates'

const iso = (date: Date) => date.toISOString().slice(0, 10)
const TODAY = new Date('2026-08-15T00:00:00Z')

test('offers today and the next two month starts', () => {
	const offers = quickDates({ today: TODAY })

	expect(offers.map((o) => o.key)).toEqual([
		'today',
		'next-month',
		'month-after',
	])
	expect(iso(offers[0]!.date)).toBe('2026-08-15')
	expect(iso(offers[1]!.date)).toBe('2026-09-01')
	expect(iso(offers[2]!.date)).toBe('2026-10-01')
})

test('month starts are named after their month', () => {
	const offers = quickDates({ today: TODAY })
	expect(offers[1]!.label).toBe('Start of September')
	expect(offers[2]!.label).toBe('Start of October')
})

// The constraint belongs in the question, not in an error after it.
test('a sitting tenant adds the day after they leave', () => {
	const offers = quickDates({
		today: TODAY,
		freeFrom: new Date('2026-09-30T00:00:00Z'),
		occupant: 'Ama Owusu',
	})

	const added = offers.find((o) => o.key === 'free-from')
	expect(added).toBeDefined()
	expect(iso(added!.date)).toBe('2026-10-01')
	expect(added!.label).toBe('Day after Ama Owusu leaves')
	expect(added!.constrained).toBe(true)
})

test('an unnamed occupant still gets an offer', () => {
	const offers = quickDates({
		today: TODAY,
		freeFrom: new Date('2026-09-30T00:00:00Z'),
	})
	expect(offers.find((o) => o.key === 'free-from')!.label).toBe(
		'Day after the unit frees up',
	)
})

// The day after notice often IS a month start. A single-choice row that shows
// the same date twice makes one of the two answers a lie.
test('a duplicate date is replaced, not appended', () => {
	const offers = quickDates({
		today: TODAY,
		// Leaves 31 Aug, so the day after is 1 Sep — the same as "Start of
		// September".
		freeFrom: new Date('2026-08-31T00:00:00Z'),
		occupant: 'Ama Owusu',
	})

	const dates = offers.map((o) => iso(o.date))
	expect(new Set(dates).size, 'no date appears twice').toBe(dates.length)

	const sept = offers.find((o) => iso(o.date) === '2026-09-01')
	expect(sept!.key, 'the constraint framing wins').toBe('free-from')
	expect(sept!.constrained).toBe(true)
})
