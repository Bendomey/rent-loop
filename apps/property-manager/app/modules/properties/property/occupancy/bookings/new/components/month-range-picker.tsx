import {
	addMonths,
	endOfMonth,
	isSameMonth,
	startOfMonth,
	startOfToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

const MONTHS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
]

interface Props {
	chunkMonths: number
	selectedRange: { from: Date; to: Date } | null
	onRangeSelect: (range: { from: Date; to: Date } | null) => void
}

export function MonthRangePicker({
	chunkMonths,
	selectedRange,
	onRangeSelect,
}: Props) {
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
				end.getMonth() -
				start.getMonth() +
				1
			const chunks = Math.max(1, Math.ceil(monthDiff / chunkMonths))
			onRangeSelect({
				from: start,
				to: endOfMonth(addMonths(start, chunks * chunkMonths - 1)),
			})
			setPendingFrom(null)
		}
	}

	function isInRange(month: number) {
		if (!selectedRange) return false
		const d = new Date(viewYear, month, 1)
		return (
			d >= startOfMonth(selectedRange.from) &&
			d <= startOfMonth(selectedRange.to)
		)
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
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="size-8"
					onClick={() => setViewYear((y) => y - 1)}
					disabled={viewYear <= today.getFullYear()}
				>
					<ChevronLeft className="size-4" />
				</Button>
				<span className="text-sm font-semibold">{viewYear}</span>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="size-8"
					onClick={() => setViewYear((y) => y + 1)}
				>
					<ChevronRight className="size-4" />
				</Button>
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
							type="button"
							onClick={() => !past && handleMonthClick(i)}
							disabled={past}
							className={cn(
								'rounded-lg px-2 py-3 text-sm font-medium transition-colors',
								past && 'text-muted-foreground/40 cursor-not-allowed',
								!past && (start || end || pending) && 'bg-rose-500 text-white',
								!past &&
									inRange &&
									!(start || end) &&
									'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
								!past &&
									!inRange &&
									!pending &&
									'border-border bg-background text-foreground hover:bg-muted border',
							)}
						>
							{name}
						</button>
					)
				})}
			</div>

			{pendingFrom ? (
				<p className="text-muted-foreground mt-3 text-center text-xs">
					Now pick an end month
				</p>
			) : null}
		</div>
	)
}
