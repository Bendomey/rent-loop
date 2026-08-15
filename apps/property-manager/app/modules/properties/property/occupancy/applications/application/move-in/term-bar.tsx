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
	/** The chosen date falls before the unit is free. */
	blocked?: boolean
}

/**
 * The term as one block per rent payment.
 *
 * A proportional timeline said how long; this says how many, which is what the
 * two answers on this page actually decide. Blocks fade along their length so a
 * long term still reads as a run rather than a solid bar.
 */
export function TermBar({
	start,
	end,
	duration,
	frequency,
	periods,
	blocked,
}: TermBarProps) {
	const count = periods.length || duration
	const noun = PERIOD_NOUN[frequency]
	// Past roughly three dozen the blocks stop being countable, so they get
	// thinner rather than the row getting wider.
	const dense = count > 36

	return (
		<div>
			{/* Three columns on a tablet up. On a phone the middle label would
			    otherwise wrap between the two dates and read as if it belonged to
			    one of them. */}
			<div className="mb-3 flex items-end justify-between gap-3">
				<div>
					<p className="text-muted-foreground font-mono text-[10px] tracking-wide uppercase">
						Moves in
					</p>
					<p
						className={cn(
							'mt-1.5 text-lg font-bold',
							blocked ? 'text-warning' : '',
						)}
					>
						{formatDay(start)}
					</p>
				</div>
				<p className="text-muted-foreground hidden pb-1 text-sm font-semibold sm:block">
					{durationLabel(duration, frequency)}
				</p>
				<div className="text-right">
					<p className="text-muted-foreground font-mono text-[10px] tracking-wide uppercase">
						Last day
					</p>
					<p className="mt-1.5 text-lg font-bold">
						{formatDay(lastDayOfTerm(end))}
					</p>
				</div>
			</div>

			<div
				className={cn('flex h-8 items-stretch', dense ? 'gap-px' : 'gap-1')}
				aria-hidden
			>
				{Array.from({ length: count }, (_, index) => (
					<div
						key={index}
						className={cn(
							'flex-1',
							dense ? 'rounded-xs' : 'rounded-sm',
							blocked ? 'bg-warning' : 'bg-primary',
						)}
						style={{
							opacity: 0.4 + 0.6 * (1 - index / Math.max(count - 1, 1)),
						}}
					/>
				))}
			</div>

			<p className="text-muted-foreground mt-2.5 text-sm">
				One block is one {noun} of rent —{' '}
				<b className="text-foreground">
					{count} payment{count === 1 ? '' : 's'}
				</b>{' '}
				in total
				<span className="sm:hidden">
					, over {durationLabel(duration, frequency)}
				</span>
				.
			</p>
		</div>
	)
}
