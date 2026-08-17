/**
 * The move-in dates a landlord actually says out loud.
 *
 * The application carries no date — one is agreed on a call — so the step opens
 * by offering the answers people give, rather than pretending a date exists.
 */
export interface QuickDate {
	key: 'today' | 'next-month' | 'month-after' | 'free-from'
	label: string
	date: Date
	/** True when this offer exists because the unit is not free before it. */
	constrained: boolean
}

const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
]

const utcDay = (date: Date) =>
	new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
	)

const monthStart = (from: Date, ahead: number) =>
	new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + ahead, 1))

const sameDay = (a: Date, b: Date) => a.getTime() === b.getTime()

export function quickDates({
	today,
	freeFrom,
	occupant,
}: {
	today: Date
	freeFrom?: Nullable<Date>
	occupant?: Nullable<string>
}): QuickDate[] {
	const first = monthStart(today, 1)
	const second = monthStart(today, 2)

	const offers: QuickDate[] = [
		{ key: 'today', label: 'Today', date: utcDay(today), constrained: false },
		{
			key: 'next-month',
			label: `Start of ${MONTHS[first.getUTCMonth()]}`,
			date: first,
			constrained: false,
		},
		{
			key: 'month-after',
			label: `Start of ${MONTHS[second.getUTCMonth()]}`,
			date: second,
			constrained: false,
		},
	]

	if (!freeFrom) return offers

	const dayAfter = utcDay(freeFrom)
	dayAfter.setUTCDate(dayAfter.getUTCDate() + 1)

	const entry: QuickDate = {
		key: 'free-from',
		label: occupant
			? `Day after ${occupant} leaves`
			: 'Day after the unit frees up',
		date: dayAfter,
		constrained: true,
	}

	// The day after notice is often a month start. Replace rather than append:
	// a single-choice row showing the same date twice makes one of them a lie,
	// and the constraint framing is the more useful of the two.
	const clash = offers.findIndex((offer) => sameDay(offer.date, dayAfter))
	if (clash >= 0) offers[clash] = entry
	else offers.push(entry)

	return offers
}
