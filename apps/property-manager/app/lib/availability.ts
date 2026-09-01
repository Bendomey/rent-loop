/**
 * What the server says about a unit's free days.
 *
 * A saturated range is a span where the blocks covering each day reach the
 * unit's capacity — which is not the same as "a block exists". A shared room
 * below capacity has blocks and no saturated ranges, and none of its days are
 * disabled.
 */

/*
 * Compared by calendar day, not by instant. The API sends UTC dates while the
 * calendar hands back local ones, so a raw comparison can disable the boundary
 * day itself — the one day back-to-back terms need.
 */
const dayKey = (value: Date) =>
	Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())

const localDayKey = (value: Date) =>
	Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())

const parse = (value: string) => new Date(`${value}T00:00:00Z`)

export function dayIsSaturated(day: Date, ranges: SaturatedRange[]): boolean {
	const at = localDayKey(day)
	return ranges.some(
		(range) =>
			at >= dayKey(parse(range.start_date)) &&
			at < dayKey(parse(range.end_date)),
	)
}

export function termIsSaturated(
	start: Date,
	end: Date,
	ranges: SaturatedRange[],
): boolean {
	const from = localDayKey(start)
	const to = localDayKey(end)
	return ranges.some(
		(range) =>
			dayKey(parse(range.start_date)) < to &&
			dayKey(parse(range.end_date)) > from,
	)
}

/**
 * The earliest day at or after `from` that no range covers.
 *
 * Loops until nothing moves rather than sorting: ranges arrive in boundary
 * order, but a span ending exactly where the next begins moves the candidate
 * more than once.
 */
export function firstFreeDay(from: Date, ranges: SaturatedRange[]): Date {
	let candidate = from
	let moved = true

	while (moved) {
		moved = false
		for (const range of ranges) {
			if (dayIsSaturated(candidate, [range])) {
				candidate = parse(range.end_date)
				moved = true
			}
		}
	}

	return candidate
}
