import type { PaymentFrequency } from '~/lib/schedule'

/** Singular / plural, for "12 months" and "1 quarter". */
const UNITS: Record<PaymentFrequency, [string, string]> = {
	DAILY: ['day', 'days'],
	WEEKLY: ['week', 'weeks'],
	MONTHLY: ['month', 'months'],
	QUARTERLY: ['quarter', 'quarters'],
	BIANNUALLY: ['half-year', 'half-years'],
	ANNUALLY: ['year', 'years'],
}

/** What one rent charge covers — "one per month". */
export const PERIOD_NOUN: Record<PaymentFrequency, string> = {
	DAILY: 'day',
	WEEKLY: 'week',
	MONTHLY: 'month',
	QUARTERLY: 'quarter',
	BIANNUALLY: 'half-year',
	ANNUALLY: 'year',
}

/**
 * The durations worth one tap, per frequency.
 *
 * A six-month term is the overwhelming default, so it sits first where it
 * reads as the norm rather than a minimum.
 */
export const DURATION_PRESETS: Record<PaymentFrequency, number[]> = {
	DAILY: [7, 14, 30],
	WEEKLY: [4, 12, 26],
	MONTHLY: [6, 12, 24],
	QUARTERLY: [2, 4, 8],
	BIANNUALLY: [1, 2, 4],
	ANNUALLY: [1, 2, 3],
}

export const durationLabel = (n: number, frequency: PaymentFrequency) =>
	`${n} ${UNITS[frequency][n === 1 ? 0 : 1]}`

export const unitLabel = (n: number, frequency: PaymentFrequency) =>
	UNITS[frequency][n === 1 ? 0 : 1]

export const formatDay = (date: Date) =>
	date.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC',
	})

/**
 * The last day the tenant is in the unit.
 *
 * termEndDate is exclusive — it is the first instant after the term, which is
 * the right thing for the schedule maths and the wrong thing to print on a
 * screen. A twelve-month term from 1 Sep ends on 31 Aug, not 1 Sep.
 */
export const lastDayOfTerm = (exclusiveEnd: Date) => {
	const last = new Date(exclusiveEnd.getTime())
	last.setUTCDate(last.getUTCDate() - 1)
	return last
}
