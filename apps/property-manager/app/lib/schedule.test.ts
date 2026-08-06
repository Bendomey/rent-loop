import { describe, expect, test } from 'vitest'
import { buildSchedule, graceDays } from './schedule'
import type { SchedulePeriod } from './schedule'

// tsconfig has noUncheckedIndexedAccess, so indexing returns T | undefined.
// Failing loudly here is better than sprinkling non-null assertions.
const at = (periods: SchedulePeriod[], i: number): SchedulePeriod => {
	const period = periods[i]
	if (!period) throw new Error(`no period at index ${i}`)
	return period
}

// Grace periods mirror lib.RentInvoiceGracePeriod in the Go backend.
describe('graceDays', () => {
	test('matches the backend for every frequency', () => {
		expect(graceDays('MONTHLY')).toBe(7)
		expect(graceDays('QUARTERLY')).toBe(14)
		expect(graceDays('BIANNUALLY')).toBe(14)
		expect(graceDays('ANNUALLY')).toBe(30)
		expect(graceDays('WEEKLY')).toBe(3)
		expect(graceDays('DAILY')).toBe(0)
	})
})

describe('buildSchedule', () => {
	const base = {
		rent: 100000,
		moveIn: '2026-09-01T00:00:00Z',
		periods: 12,
		frequency: 'MONTHLY' as const,
	}

	test('produces one period per month of the term', () => {
		expect(buildSchedule(base)).toHaveLength(12)
	})

	// The rule people get wrong: rent is DUE seven days after the period
	// starts, not on the first. Verified end to end by case A1.
	test('due date is period start plus the grace period', () => {
		const s = buildSchedule(base)
		expect(at(s, 0).periodStart.toISOString()).toBe('2026-09-01T00:00:00.000Z')
		expect(at(s, 0).dueDate.toISOString()).toBe('2026-09-08T00:00:00.000Z')
		expect(at(s, 1).dueDate.toISOString()).toBe('2026-10-08T00:00:00.000Z')
	})

	test('every period carries one period of rent, never a multiple', () => {
		for (const p of buildSchedule(base)) expect(p.amount).toBe(100000)
	})

	test('labels read as the month the rent covers', () => {
		const s = buildSchedule(base)
		expect(at(s, 0).name).toBe('Rent – September 2026')
		expect(at(s, 11).name).toBe('Rent – August 2027')
	})

	test('quarterly terms step three months and use a 14 day grace', () => {
		const s = buildSchedule({ ...base, periods: 4, frequency: 'QUARTERLY' })
		expect(s).toHaveLength(4)
		expect(at(s, 1).periodStart.toISOString()).toBe('2026-12-01T00:00:00.000Z')
		expect(at(s, 0).dueDate.toISOString()).toBe('2026-09-15T00:00:00.000Z')
	})

	test('a zero or negative term produces nothing', () => {
		expect(buildSchedule({ ...base, periods: 0 })).toHaveLength(0)
	})

	// A month-end move-in overflows rather than clamping, because Go's
	// time.AddDate normalises the same way: 31 Jan + 1 month is 3 March in both,
	// not 28 Feb. Verified against the backend directly. Do not "fix" this to
	// clamp — it would put the preview out of step with the charges actually
	// created.
	test('a month-end move-in overflows exactly as the backend does', () => {
		const s = buildSchedule({ ...base, moveIn: '2026-01-31T00:00:00Z', periods: 3 })
		expect(at(s, 0).periodStart.toISOString().slice(0, 10)).toBe('2026-01-31')
		expect(at(s, 1).periodStart.toISOString().slice(0, 10)).toBe('2026-03-03')
	})

	test('an annual term labels by year rather than month', () => {
		const s = buildSchedule({ ...base, periods: 2, frequency: 'ANNUALLY' })
		expect(at(s, 0).name).toBe('Rent – 2026')
		expect(at(s, 0).dueDate.toISOString().slice(0, 10)).toBe('2026-10-01')
	})
})
