import {
	addDays,
	addMonths,
	differenceInDays,
	endOfMonth,
	format,
	isSameMonth,
	startOfMonth,
	startOfToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getUnitAvailabilityForClient } from '~/api/bookings/client'
import { Calendar } from '~/components/ui/calendar'

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
	unitSlug: string
	paymentFrequency: PropertyUnit['payment_frequency']
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

const MONTH_CHUNKS: Record<PropertyUnit['payment_frequency'], number> = {
	DAILY: 0,
	WEEKLY: 0,
	MONTHLY: 1,
	QUARTERLY: 3,
	BIANNUALLY: 6,
	ANNUALLY: 12,
}

const MONTHS = [
	'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
	'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface MonthPickerProps {
	chunkMonths: number
	selectedRange: { from: Date; to: Date } | null
	onRangeSelect: (range: { from: Date; to: Date } | null) => void
}

function MonthRangePicker({ chunkMonths, selectedRange, onRangeSelect }: MonthPickerProps) {
	const today = startOfToday()
	const [viewYear, setViewYear] = useState(today.getFullYear())
	const [pendingFrom, setPendingFrom] = useState<Date | null>(null)

	function handleMonthClick(month: number) {
		const clicked = new Date(viewYear, month, 1)
		if (clicked < startOfMonth(today)) return

		if (!pendingFrom) {
			setPendingFrom(clicked)
			onRangeSelect(null)
		} else {
			let start = pendingFrom
			let end = clicked
			if (end < start) {
				;[start, end] = [end, start]
			}
			const monthDiff =
				(end.getFullYear() - start.getFullYear()) * 12 +
				end.getMonth() - start.getMonth() + 1
			const chunks = Math.max(1, Math.ceil(monthDiff / chunkMonths))
			onRangeSelect({ from: start, to: endOfMonth(addMonths(start, chunks * chunkMonths - 1)) })
			setPendingFrom(null)
		}
	}

	function isInRange(month: number) {
		if (!selectedRange) return false
		const d = new Date(viewYear, month, 1)
		return d >= startOfMonth(selectedRange.from) && d <= startOfMonth(selectedRange.to)
	}

	function isStart(month: number) {
		if (!selectedRange) return false
		return isSameMonth(new Date(viewYear, month, 1), selectedRange.from)
	}

	function isEnd(month: number) {
		if (!selectedRange) return false
		return isSameMonth(new Date(viewYear, month, 1), selectedRange.to)
	}

	function isPending(month: number) {
		if (!pendingFrom) return false
		return isSameMonth(new Date(viewYear, month, 1), pendingFrom)
	}

	function isPast(month: number) {
		return new Date(viewYear, month, 1) < startOfMonth(today)
	}

	return (
		<div className="w-full">
			<div className="mb-4 flex items-center justify-between">
				<button
					onClick={() => setViewYear((y) => y - 1)}
					className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 disabled:opacity-40"
					disabled={viewYear <= today.getFullYear()}
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className="text-sm font-semibold text-zinc-900">{viewYear}</span>
				<button
					onClick={() => setViewYear((y) => y + 1)}
					className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>
			<div className="grid grid-cols-4 gap-2">
				{MONTHS.map((name, i) => {
					const past = isPast(i)
					const start = isStart(i)
					const end = isEnd(i)
					const inRange = isInRange(i)
					const pending = isPending(i)
					return (
						<button
							key={name}
							onClick={() => !past && handleMonthClick(i)}
							disabled={past}
							className={[
								'rounded-lg px-2 py-3 text-sm font-medium transition',
								past
									? 'cursor-not-allowed text-zinc-300'
									: start || end || pending
										? 'bg-rose-500 text-white'
										: inRange
											? 'bg-rose-50 text-rose-700'
											: 'bg-white text-zinc-700 hover:bg-zinc-50 border border-zinc-200',
							].join(' ')}
						>
							{name}
						</button>
					)
				})}
			</div>
			{pendingFrom && (
				<p className="mt-3 text-xs text-zinc-400 text-center">
					Now pick an end month
				</p>
			)}
		</div>
	)
}

export function AvailabilityCalendar({
	unitSlug,
	paymentFrequency,
	selectedRange,
	onRangeSelect,
}: Props) {
	const isDesktop = useIsDesktop()
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [unitSlug])

	if (loading) {
		return <div className="h-64 w-full animate-pulse rounded-xl bg-zinc-100" />
	}

	const chunkMonths = MONTH_CHUNKS[paymentFrequency]
	if (chunkMonths > 0) {
		return (
			<MonthRangePicker
				chunkMonths={chunkMonths}
				selectedRange={selectedRange}
				onRangeSelect={onRangeSelect}
			/>
		)
	}

	const disabledDates = blocksToDisabledDates(blocks)
	const isWeekly = paymentFrequency === 'WEEKLY'

	const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
		if (!range?.from) {
			onRangeSelect(null)
			return
		}
		if (!range.to) {
			onRangeSelect(null)
			return
		}
		if (isWeekly) {
			const days = differenceInDays(range.to, range.from) + 1
			const weeks = Math.max(1, Math.ceil(days / 7))
			onRangeSelect({ from: range.from, to: addDays(range.from, weeks * 7 - 1) })
		} else {
			onRangeSelect({ from: range.from, to: range.to })
		}
	}

	return (
		<Calendar
			mode="range"
			selected={selectedRange ?? undefined}
			onSelect={handleSelect}
			disabled={[{ before: today }, ...disabledDates]}
			fromDate={today}
			toDate={threeMonthsOut}
			numberOfMonths={isDesktop ? 2 : 1}
			className="w-full bg-transparent [--cell-size:--spacing(11)]"
		/>
	)
}
