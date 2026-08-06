import { PERIOD_NOUN, durationLabel, formatDay, lastDayOfTerm } from './term'
import type { PaymentFrequency, SchedulePeriod } from '~/lib/schedule'
import { cn } from '~/lib/utils'

interface TermBarProps {
	start: Date
	/** Exclusive — the first instant after the term. */
	end: Date
	duration: number
	frequency: PaymentFrequency
	periods: SchedulePeriod[]
	/** The day the unit actually becomes free, when that is after the start. */
	freeFrom?: Nullable<Date>
}

/**
 * Start to end, with a tick per rent charge.
 *
 * The ticks are the point: the term is not an abstract length, it is a specific
 * number of charges falling on specific days, and this is the only place on the
 * step where that is visible before the charges exist.
 */
export function TermBar({
	start,
	end,
	duration,
	frequency,
	periods,
	freeFrom,
}: TermBarProps) {
	const late = Boolean(freeFrom && freeFrom > start)
	const span = end.getTime() - start.getTime()
	const at = (date: Date) =>
		Math.max(
			0,
			Math.min(100, ((date.getTime() - start.getTime()) / span) * 100),
		)

	return (
		<div>
			<div className="mb-1 flex items-baseline justify-between gap-3">
				<div>
					<p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
						Term starts
					</p>
					<p className="mt-1 text-sm font-bold whitespace-nowrap">
						{formatDay(start)}
					</p>
				</div>
				{/* Three across needs the panel's full width. On a phone the dates
				    keep the row and the duration moves under it, rather than all
				    three wrapping into six lines. */}
				<p
					className={cn(
						'hidden text-xs font-bold sm:block',
						late ? 'text-warning' : 'text-primary',
					)}
				>
					{durationLabel(duration, frequency)}
				</p>
				<div className="text-right">
					<p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
						Term ends
					</p>
					<p className="mt-1 text-sm font-bold whitespace-nowrap">
						{formatDay(lastDayOfTerm(end))}
					</p>
				</div>
			</div>

			<p
				className={cn(
					'mb-1 text-center text-xs font-bold sm:hidden',
					late ? 'text-warning' : 'text-primary',
				)}
			>
				{durationLabel(duration, frequency)}
			</p>

			<div className="relative h-[34px]">
				<div
					className={cn(
						'absolute top-[11px] right-0 left-0 h-3 rounded-full border',
						late
							? 'bg-warning-bg border-warning/25'
							: 'bg-primary/8 border-primary/20',
					)}
				/>
				{periods.map((period) => (
					<div
						key={period.periodStart.toISOString()}
						title={formatDay(period.periodStart)}
						className={cn(
							'absolute top-[14px] h-1.5 w-0.5 rounded-full opacity-45',
							late ? 'bg-warning' : 'bg-primary',
						)}
						style={{ left: `${at(period.periodStart)}%` }}
					/>
				))}
				<div
					className={cn(
						'border-background absolute top-2 left-0 size-[18px] rounded-full border-[3px]',
						late ? 'bg-warning' : 'bg-primary',
					)}
				/>
				<div
					className={cn(
						'bg-background absolute top-2 right-0 size-[18px] rounded-full border-[3px]',
						late ? 'border-warning' : 'border-primary',
					)}
				/>
				{late && freeFrom ? (
					<p className="text-warning absolute top-[30px] left-0 text-[11px] font-bold">
						unit isn&apos;t free until {formatDay(freeFrom)}
					</p>
				) : null}
			</div>

			<div
				className={cn(
					'text-muted-foreground flex flex-col gap-0.5 text-[11px] sm:flex-row sm:justify-between sm:gap-3',
					late ? 'mt-5' : 'mt-1',
				)}
			>
				<span>
					{periods.length} rent {periods.length === 1 ? 'charge' : 'charges'} ·
					one per {PERIOD_NOUN[frequency]}
				</span>
				{periods[0] ? (
					<span>first due {formatDay(periods[0].dueDate)}</span>
				) : null}
			</div>
		</div>
	)
}
