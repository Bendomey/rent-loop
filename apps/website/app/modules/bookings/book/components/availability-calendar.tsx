import { addDays, format, startOfToday } from 'date-fns'
import { useEffect, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { getUnitAvailabilityForClient } from '~/api/bookings/client'

interface Props {
	unitSlug: string
	selectedRange: { from: Date; to: Date } | null
	onRangeSelect: (range: { from: Date; to: Date } | null) => void
}

function blocksToDisabledDates(blocks: UnitDateBlock[]): Date[] {
	const dates: Date[] = []
	for (const block of blocks) {
		const start = new Date(block.start_date)
		const end = new Date(block.end_date)
		const cursor = new Date(start)
		while (cursor <= end) {
			dates.push(new Date(cursor))
			cursor.setDate(cursor.getDate() + 1)
		}
	}
	return dates
}

export function AvailabilityCalendar({
	unitSlug,
	selectedRange,
	onRangeSelect,
}: Props) {
	const today = startOfToday()
	const threeMonthsOut = addDays(today, 90)

	const [blocks, setBlocks] = useState<UnitDateBlock[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancelled = false
		setLoading(true)
		getUnitAvailabilityForClient(
			unitSlug,
			format(today, 'yyyy-MM-dd'),
			format(threeMonthsOut, 'yyyy-MM-dd'),
		)
			.then((data) => {
				if (!cancelled) {
					setBlocks(data)
					setLoading(false)
				}
			})
			.catch(() => {
				if (!cancelled) setLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [unitSlug])

	const disabledDates = blocksToDisabledDates(blocks)

	const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
		if (range?.from && range?.to) {
			onRangeSelect({ from: range.from, to: range.to })
		} else {
			onRangeSelect(null)
		}
	}

	if (loading) {
		return <div className="h-64 w-full animate-pulse rounded-xl bg-zinc-100" />
	}

	return (
		<div
			style={
				{
					'--rdp-accent-color': '#e11d48',
					'--rdp-accent-background-color': '#fff1f2',
				} as React.CSSProperties
			}
		>
			<DayPicker
				mode="range"
				selected={selectedRange ?? undefined}
				onSelect={handleSelect}
				disabled={[{ before: today }, ...disabledDates]}
				fromDate={today}
				toDate={threeMonthsOut}
				numberOfMonths={1}
			/>
		</div>
	)
}
