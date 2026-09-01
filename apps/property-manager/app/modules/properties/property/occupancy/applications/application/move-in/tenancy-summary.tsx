import { PERIOD_NOUN, durationLabel, formatDay, lastDayOfTerm } from './term'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import { type Pronouns, verb } from '~/lib/pronouns'
import type { PaymentFrequency, SchedulePeriod } from '~/lib/schedule'
import { cn } from '~/lib/utils'

/**
 * What the two answers add up to, in the words a landlord would use.
 *
 * Every figure is derived from the schedule that has already been built, not
 * restated — the first and last due dates come from the periods themselves, so
 * this panel cannot disagree with what gets saved.
 */
export function TenancySummary({
	start,
	end,
	duration,
	frequency,
	periods,
	blocked,
	freeFrom,
	applicantName,
	pronouns,
	readonly,
	dirty,
	saving,
	canSave,
	onSave,
}: {
	start: Nullable<Date>
	end: Nullable<Date>
	duration: number
	frequency: PaymentFrequency
	periods: SchedulePeriod[]
	blocked: boolean
	freeFrom: Nullable<Date>
	applicantName: string
	pronouns: Pronouns
	readonly: boolean
	dirty: boolean
	saving: boolean
	canSave: boolean
	onSave: () => void
}) {
	const noun = PERIOD_NOUN[frequency]
	const first = periods[0]
	const last = periods[periods.length - 1]

	return (
		<div className="flex flex-col gap-4">
			<Card className="gap-0 overflow-hidden p-0 shadow-none">
				<div
					className={cn(
						'border-b p-5',
						blocked ? 'bg-warning-bg' : 'bg-primary/5',
					)}
				>
					<p className="font-bold">In plain words</p>
					<p className="mt-2.5 text-sm leading-relaxed">
						{!start ? (
							'Set a date and this will spell out the tenancy — when it starts, when it ends, and how many rent payments that makes.'
						) : blocked && freeFrom ? (
							<>
								You&rsquo;ve put {applicantName} in on <b>{formatDay(start)}</b>
								, but the unit is <b>occupied until {formatDay(freeFrom)}</b>.
								Every bed is spoken for until then, so pick a later date.
							</>
						) : (
							<>
								<b>{applicantName}</b> gets the keys on{' '}
								<b>{formatDay(start)}</b> and stays for{' '}
								<b>{durationLabel(duration, frequency)}</b>
								{end ? (
									<>
										, until <b>{formatDay(lastDayOfTerm(end))}</b>
									</>
								) : null}
								. That makes{' '}
								<b>
									{periods.length} rent payment
									{periods.length === 1 ? '' : 's'}
								</b>
								, one per {noun}.
							</>
						)}
					</p>
				</div>

				{start && !blocked && first && last ? (
					<CardContent className="pt-5">
						{[
							['First rent', `Due ${formatDay(first.dueDate)}`],
							['Last rent', `Due ${formatDay(last.dueDate)}`],
						].map(([label, value], index) => (
							<div
								key={label}
								className={cn(
									'flex items-baseline justify-between gap-3 py-2.5',
									index === 0 ? '' : 'border-t',
								)}
							>
								<span className="text-muted-foreground text-sm">{label}</span>
								<span className="text-sm font-bold">{value}</span>
							</div>
						))}
					</CardContent>
				) : null}
			</Card>

			{!readonly ? (
				<div>
					<Button
						id="save-move-in"
						className="w-full"
						size="lg"
						disabled={!canSave || saving}
						onClick={onSave}
					>
						{saving ? <Spinner /> : null}
						{dirty ? 'Save the new dates' : 'Save these dates'}
					</Button>
					<p className="text-muted-foreground mt-3 text-sm leading-relaxed">
						{blocked
							? 'Pick a date on or after the unit frees up and this will turn on.'
							: !start
								? `Agree a date with ${applicantName} first — a message or a call is usually all it takes.`
								: dirty
									? 'The payment dates get worked out again from the new dates.'
									: `Next you’ll set what ${pronouns.subject} ${verb(pronouns, 'pay')}. You can come back and change these until the first payment lands.`}
					</p>
				</div>
			) : null}
		</div>
	)
}
