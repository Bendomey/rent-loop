import type { PaymentFrequency } from './schedule'

const UNIT_NOUN: Record<PaymentFrequency, [string, string]> = {
	DAILY: ['day', 'days'],
	WEEKLY: ['week', 'weeks'],
	MONTHLY: ['month', 'months'],
	QUARTERLY: ['quarter', 'quarters'],
	BIANNUALLY: ['half-year', 'half-years'],
	ANNUALLY: ['year', 'years'],
}

const counted = (n: number, unit: PaymentFrequency) => {
	const [one, many] = UNIT_NOUN[unit]
	return `${n} ${n === 1 ? one : many}`
}

/** "a year" reads better than "12 months" mid-sentence. */
export const durationWords = (n: number, unit: PaymentFrequency) => {
	if (unit === 'MONTHLY') {
		if (n === 12) return 'a year'
		if (n === 24) return 'two years'
		if (n === 6) return 'six months'
	}
	return counted(n, unit)
}

export const durationBare = (n: number, unit: PaymentFrequency) =>
	durationWords(n, unit).replace(/^a /, '')

/** The same length as a label rather than as prose — for a button. */
export const durationPlain = (n: number, unit: PaymentFrequency) => {
	if (unit === 'MONTHLY' && n % 12 === 0) {
		return counted(n / 12, 'ANNUALLY')
	}
	return counted(n, unit)
}

const BASE_DURATIONS = [6, 12, 24]

export interface DurationOption {
	n: number
	label: string
	tag?: string
}

/**
 * The lengths offered as one-click answers, always including the one the tenant
 * is on now.
 *
 * Carrying the current length forward is the common renewal and the safe
 * default. A length nobody deliberately chose is how a six-month tenancy
 * becomes a twelve-month one, with a year of rent charges raised behind it.
 */
export const durationOptions = (
	parentDuration: number,
	unit: PaymentFrequency,
): DurationOption[] =>
	Array.from(new Set([...BASE_DURATIONS, parentDuration]))
		.filter((n) => n > 0)
		.sort((a, b) => a - b)
		.map((n) => ({
			n,
			label: durationPlain(n, unit),
			tag: n === parentDuration ? 'Same as now' : undefined,
		}))

/** What a renewal opens on when there is no length worth inheriting. */
export const FALLBACK_DURATION = 12

/**
 * The length the term step starts on.
 *
 * Staying put carries the current term forward — that is the common renewal,
 * and a length nobody chose is how a six-month tenancy quietly becomes a
 * twelve-month one. A move to another room is a new arrangement with no
 * precedent to inherit, so it falls back to the house default instead.
 */
export const defaultDuration = (
	parentDuration: number,
	unitChanged: boolean,
): number =>
	unitChanged || !parentDuration || parentDuration < 1
		? FALLBACK_DURATION
		: parentDuration
