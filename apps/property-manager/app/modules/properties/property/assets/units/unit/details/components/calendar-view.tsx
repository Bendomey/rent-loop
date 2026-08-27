import { type Dayjs } from 'dayjs'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'
import {
	countFreeNights,
	dayStretch,
	KIND_CELL,
	nightsWord,
	rangeLabel,
	type Stretch,
} from './helpers'
import { AvailabilityLegend } from './legend'
import { Button } from '~/components/ui/button'
import { cn } from '~/lib/utils'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function MonthGrid({
	month,
	byDay,
	today,
}: {
	month: Dayjs
	byDay: Map<string, Stretch>
	today: Dayjs
}) {
	const start = month.startOf('month')
	const lead = start.day()
	const cells: (Dayjs | null)[] = Array.from({ length: lead }, () => null)
	for (let d = 0; d < start.daysInMonth(); d++) cells.push(start.add(d, 'day'))
	while (cells.length % 7) cells.push(null)

	return (
		<div className="min-w-0 flex-1">
			<div className="text-foreground border-b pb-2 text-sm font-semibold">
				{month.format('MMMM YYYY')}
			</div>
			<div className="mt-2 grid grid-cols-7 gap-1">
				{WEEKDAYS.map((w) => (
					<div
						key={w}
						className="text-muted-foreground pb-1 text-center text-xs"
					>
						{w}
					</div>
				))}
				{cells.map((d, i) => {
					if (!d) return <div key={i} />
					const stretch = dayStretch(byDay, d)
					const past = d.isBefore(today)
					const isToday = d.isSame(today, 'day')
					return (
						<div
							key={i}
							className={cn(
								'flex aspect-square items-center justify-center rounded-md border text-sm',
								past
									? 'text-muted-foreground/40 border-transparent'
									: stretch
										? cn('font-medium', KIND_CELL[stretch.kind])
										: 'border-emerald-200 bg-emerald-50/60 font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
								isToday && 'ring-2 ring-rose-600 ring-offset-1 ring-offset-background',
							)}
						>
							{d.date()}
						</div>
					)
				})}
			</div>
		</div>
	)
}

export function AvailabilityCalendarView({
	stretches,
	byDay,
	today,
}: {
	stretches: Stretch[]
	byDay: Map<string, Stretch>
	today: Dayjs
}) {
	const [offset, setOffset] = useState(0)
	const base = today.startOf('month').add(offset * 3, 'month')
	const months = [0, 1, 2].map((i) => base.add(i, 'month'))
	const free = countFreeNights(byDay, months, today)
	const past = offset < 0

	return (
		<div className="mt-6">
			<div className="mb-4 flex items-center gap-4">
				<Button
					variant="outline"
					size="icon"
					disabled={offset <= -2}
					onClick={() => setOffset(offset - 1)}
				>
					<ChevronLeftIcon />
				</Button>
				<div className="min-w-0 flex-1 text-center">
					<div className="text-foreground truncate text-base font-semibold">
						{rangeLabel(months)}
					</div>
					<div className="text-muted-foreground mt-0.5 text-xs">
						{past
							? 'Already gone'
							: free === 0
								? 'Nothing free in these months'
								: `${nightsWord(free)} still free`}
					</div>
				</div>
				<Button
					variant="outline"
					size="icon"
					disabled={offset >= 3}
					onClick={() => setOffset(offset + 1)}
				>
					<ChevronRightIcon />
				</Button>
			</div>

			<div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
				{months.map((month) => (
					<MonthGrid
						key={month.format('YYYY-MM')}
						month={month}
						byDay={byDay}
						today={today}
					/>
				))}
			</div>

			<div className="mt-6 border-t pt-5">
				<AvailabilityLegend stretches={stretches} extra="Red ring is today." />
			</div>
		</div>
	)
}
