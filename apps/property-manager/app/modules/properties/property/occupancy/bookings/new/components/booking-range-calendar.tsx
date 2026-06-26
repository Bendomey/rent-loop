import { addDays } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { MonthRangePicker } from './month-range-picker'
import { useGetUnitAvailability } from '~/api/bookings'
import { Calendar } from '~/components/ui/calendar'
import { getCalendarPickerHint } from '~/lib/booking.utils'

const MONTH_CHUNKS: Record<string, number> = {
	MONTHLY: 1,
	QUARTERLY: 3,
	BIANNUALLY: 6,
	ANNUALLY: 12,
}

function blocksToDisabledDates(blocks: UnitDateBlock[]): Date[] {
	const dates: Date[] = []
	for (const block of blocks) {
		const cursor = new Date(block.start_date)
		const end = new Date(block.end_date)
		while (cursor <= end) {
			dates.push(new Date(cursor))
			cursor.setDate(cursor.getDate() + 1)
		}
	}
	return dates
}

function useIsDesktop() {
	const [isDesktop, setIsDesktop] = useState(() =>
		typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
	)
	useEffect(() => {
		const mq = window.matchMedia('(min-width: 1024px)')
		const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
		mq.addEventListener('change', handler)
		return () => mq.removeEventListener('change', handler)
	}, [])
	return isDesktop
}

interface Props {
	clientId: string
	propertyId: string
	unitId: string
	paymentFrequency: PropertyUnit['payment_frequency']
	selectedRange: { from: Date; to: Date } | null
	onRangeSelect: (range: { from: Date; to: Date } | null) => void
}

export function BookingRangeCalendar({
	clientId,
	propertyId,
	unitId,
	paymentFrequency,
	selectedRange,
	onRangeSelect,
}: Props) {
	const isDesktop = useIsDesktop()

	const today = useMemo(() => {
		const d = new Date()
		d.setHours(0, 0, 0, 0)
		return d
	}, [])

	const ninetyDaysOut = useMemo(() => addDays(today, 90), [today])

	const { data: blocks = [], isPending: loadingAvailability } =
		useGetUnitAvailability(clientId, propertyId, unitId, today, ninetyDaysOut)

	const disabledDates = useMemo(() => blocksToDisabledDates(blocks), [blocks])

	if (loadingAvailability) {
		return <div className="bg-muted h-64 w-full animate-pulse rounded-xl" />
	}

	const chunkMonths = MONTH_CHUNKS[paymentFrequency]

	const hint = getCalendarPickerHint(paymentFrequency)

	if (chunkMonths !== undefined) {
		return (
			<div className="space-y-3">
				<p className="text-muted-foreground text-xs">{hint}</p>
				<MonthRangePicker
					chunkMonths={chunkMonths}
					selectedRange={selectedRange}
					onRangeSelect={onRangeSelect}
				/>
			</div>
		)
	}

	const isWeekly = paymentFrequency === 'WEEKLY'

	const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
		if (!range?.from || !range.to) {
			onRangeSelect(null)
			return
		}
		if (isWeekly) {
			const days =
				Math.round(
					(range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24),
				) + 1
			const weeks = Math.max(1, Math.ceil(days / 7))
			onRangeSelect({
				from: range.from,
				to: addDays(range.from, weeks * 7 - 1),
			})
		} else {
			onRangeSelect({ from: range.from, to: range.to })
		}
	}

	const blockedCount = blocks.length

	return (
		<div className="space-y-2">
			<p className="text-muted-foreground text-xs">{hint}</p>
			{blockedCount > 0 ? (
				<p className="text-muted-foreground text-xs">
					{blockedCount} date block{blockedCount > 1 ? 's' : ''} — greyed out
					dates are unavailable
				</p>
			) : (
				<p className="text-muted-foreground text-xs">
					All dates available for the next 90 days
				</p>
			)}
			<Calendar
				mode="range"
				selected={selectedRange ?? undefined}
				onSelect={handleSelect}
				disabled={[
					{ before: today },
					{ after: ninetyDaysOut },
					...disabledDates,
				]}
				startMonth={today}
				endMonth={ninetyDaysOut}
				numberOfMonths={isDesktop ? 2 : 1}
				className="w-full [--cell-size:--spacing(9)]"
			/>
		</div>
	)
}
