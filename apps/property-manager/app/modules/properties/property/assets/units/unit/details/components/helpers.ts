import dayjs, { type Dayjs } from 'dayjs'

export type AvailabilityKind = BlockType | 'FREE'

export interface Stretch {
	id: string
	kind: BlockType
	from: Dayjs
	to: Dayjs
	reason: string
}

export interface TimelineRow {
	key: string
	kind: AvailabilityKind
	from: Dayjs
	to: Dayjs | null
	nights: number | null
	reason: string
}

export const KIND_LABEL: Record<AvailabilityKind, string> = {
	FREE: 'Free',
	BOOKING: 'Booked',
	LEASE: 'Rented out',
	MAINTENANCE: 'Being fixed',
	PERSONAL: 'You kept it back',
	OTHER: 'Held back',
}

export const KIND_CELL: Record<AvailabilityKind, string> = {
	FREE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900',
	BOOKING: 'bg-blue-600 text-white border-blue-600',
	LEASE: 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-200',
	MAINTENANCE: 'bg-orange-500 text-white border-orange-500',
	PERSONAL:
		'bg-zinc-400 text-white border-zinc-400 dark:bg-zinc-600 dark:border-zinc-600',
	OTHER:
		'bg-zinc-400 text-white border-zinc-400 dark:bg-zinc-600 dark:border-zinc-600',
}

export const KIND_SWATCH: Record<AvailabilityKind, string> = {
	FREE: 'bg-emerald-400',
	BOOKING: 'bg-blue-600',
	LEASE: 'bg-zinc-900 dark:bg-zinc-200',
	MAINTENANCE: 'bg-orange-500',
	PERSONAL: 'bg-zinc-400 dark:bg-zinc-600',
	OTHER: 'bg-zinc-400 dark:bg-zinc-600',
}

export const HOLD_KINDS: {
	value: Extract<BlockType, 'MAINTENANCE' | 'PERSONAL' | 'OTHER'>
	label: string
	hint: string
}[] = [
	{
		value: 'MAINTENANCE',
		label: 'It is being fixed',
		hint: 'Repairs, painting, plumbing',
	},
	{ value: 'PERSONAL', label: 'You are keeping it', hint: 'Family, your own use' },
	{ value: 'OTHER', label: 'Something else', hint: 'Say why below' },
]

const dayKey = (d: Dayjs) => d.format('YYYY-MM-DD')

export const nightsWord = (n: number) => (n === 1 ? '1 night' : `${n} nights`)
export const daysWord = (n: number) => (n === 1 ? '1 day' : `${n} days`)
export const longDate = (d: Dayjs) => d.format('D MMMM YYYY')
export const shortDate = (d: Dayjs) => d.format('D MMM')

export function buildStretches(
	blocks: UnitDateBlock[] | undefined,
): Stretch[] {
	if (!blocks) return []
	return blocks
		.map((b) => ({
			id: b.id,
			kind: b.block_type,
			from: dayjs(b.start_date).startOf('day'),
			to: dayjs(b.end_date).startOf('day'),
			reason: b.reason ?? '',
		}))
		.sort((a, b) => a.from.valueOf() - b.from.valueOf())
}

export function stretchByDay(stretches: Stretch[]): Map<string, Stretch> {
	const map = new Map<string, Stretch>()
	for (const s of stretches) {
		let cur = s.from
		while (cur.isSame(s.to) || cur.isBefore(s.to)) {
			map.set(dayKey(cur), s)
			cur = cur.add(1, 'day')
		}
	}
	return map
}

export const dayStretch = (byDay: Map<string, Stretch>, d: Dayjs) =>
	byDay.get(dayKey(d)) ?? null

export function currentStretch(
	stretches: Stretch[],
	today: Dayjs,
): Stretch | null {
	return (
		stretches.find(
			(s) =>
				!today.isBefore(s.from) && !today.isAfter(s.to),
		) ?? null
	)
}

export function nextStretch(
	stretches: Stretch[],
	today: Dayjs,
): Stretch | null {
	return stretches.find((s) => s.from.isAfter(today)) ?? null
}

export function countFreeNights(
	byDay: Map<string, Stretch>,
	months: Dayjs[],
	today: Dayjs,
): number {
	let n = 0
	for (const month of months) {
		const start = month.startOf('month')
		for (let d = 0; d < start.daysInMonth(); d++) {
			const dt = start.add(d, 'day')
			if (dt.isBefore(today)) continue
			if (!byDay.has(dayKey(dt))) n++
		}
	}
	return n
}

export function buildRows(stretches: Stretch[], today: Dayjs): TimelineRow[] {
	const rows: TimelineRow[] = []
	let cursor = today
	const upcoming = stretches.filter((s) => !s.to.isBefore(today))
	upcoming.forEach((s, i) => {
		const gap = s.from.diff(cursor, 'day')
		if (gap > 0) {
			rows.push({
				key: `free-${i}`,
				kind: 'FREE',
				from: cursor,
				to: s.from.subtract(1, 'day'),
				nights: gap,
				reason: '',
			})
		}
		const from = s.from.isBefore(cursor) ? cursor : s.from
		rows.push({
			key: s.id,
			kind: s.kind,
			from,
			to: s.to,
			nights: s.to.diff(from, 'day') + 1,
			reason: s.reason,
		})
		cursor = s.to.add(1, 'day')
	})
	rows.push({
		key: 'free-end',
		kind: 'FREE',
		from: cursor,
		to: null,
		nights: null,
		reason: '',
	})
	return rows
}

export function rangeLabel(months: Dayjs[]): string {
	const first = months[0]!
	const last = months[months.length - 1]!
	if (first.year() === last.year()) {
		return `${first.format('MMMM')} – ${last.format('MMMM YYYY')}`
	}
	return `${first.format('MMMM YYYY')} – ${last.format('MMMM YYYY')}`
}
