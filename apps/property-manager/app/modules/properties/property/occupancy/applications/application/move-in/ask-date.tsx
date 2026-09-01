import { Calendar, TriangleAlert } from 'lucide-react'
import { formatDay } from './term'
import { DatePickerInput } from '~/components/date-picker-input'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Button } from '~/components/ui/button'
import { dayIsSaturated } from '~/lib/availability'
import { quickDates } from '~/lib/move-in-dates'
import { type Pronouns, verb } from '~/lib/pronouns'
import { cn } from '~/lib/utils'

/**
 * "When do they get the keys?"
 *
 * When the unit is not free yet the constraint is part of the question — the
 * days it is full cannot be picked and a quick-pick offers the first workable
 * day — rather than an error raised after the fact.
 *
 * The copy says "the unit", never a tenant's name: what holds the days may be
 * a booking or a maintenance block, and neither has an occupant.
 */
export function AskDate({
	value,
	onChange,
	freeFrom,
	ranges,
	availabilityPending,
	availabilityFailed,
	blocked,
	readonly,
	applicantName,
	pronouns,
}: {
	value: Nullable<Date>
	onChange: (next: Nullable<Date>) => void
	freeFrom: Nullable<Date>
	ranges: SaturatedRange[]
	availabilityPending: boolean
	availabilityFailed: boolean
	blocked: boolean
	readonly: boolean
	applicantName: string
	pronouns: Pronouns
}) {
	const offers = quickDates({ today: new Date(), freeFrom })
	const firstFree = freeFrom
		? offers.find((offer) => offer.key === 'free-from')?.date
		: undefined

	return (
		<section className="pb-6">
			<h2 className="text-xl font-bold tracking-tight">
				{readonly
					? `When ${pronouns.subject} ${verb(pronouns, 'get')} the keys`
					: `When does ${applicantName} get the keys?`}
			</h2>

			<p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
				{readonly ? (
					'The tenancy starts on this date and it can no longer change.'
				) : freeFrom ? (
					<>
						The application doesn&rsquo;t come with a date — agree one with{' '}
						{applicantName} and set it here.{' '}
						<b className="text-foreground">
							This unit is occupied until {formatDay(freeFrom)}
						</b>
						, so {pronouns.subject} cannot start before{' '}
						{firstFree ? formatDay(firstFree) : 'then'}.
					</>
				) : (
					`The application doesn’t come with a date — agree one with ${applicantName} on a call or a message, then set it here.`
				)}
			</p>

			{!readonly ? (
				<div className="mt-4 flex flex-wrap gap-2">
					{offers.map((offer) => {
						const on =
							value != null &&
							value.toDateString() === offer.date.toDateString()
						return (
							<Button
								key={offer.key}
								variant={on ? 'default' : 'outline'}
								className="h-auto flex-col items-start gap-0.5 py-2"
								onClick={() => onChange(offer.date)}
							>
								<span className="font-bold">{offer.label}</span>
								<span
									className={cn(
										'text-xs font-normal',
										on
											? 'opacity-80'
											: offer.constrained
												? 'text-warning'
												: 'text-muted-foreground',
									)}
								>
									{formatDay(offer.date)}
								</span>
							</Button>
						)
					})}
				</div>
			) : null}

			<div className="mt-4 flex flex-wrap items-center gap-3">
				{!readonly ? (
					<span className="text-muted-foreground text-sm">Or pick any day</span>
				) : null}
				<div className="w-56">
					<DatePickerInput
						value={value ?? undefined}
						placeholder="Pick a date"
						readOnly={readonly || availabilityPending}
						disabled={(day) => dayIsSaturated(day, ranges)}
						onChange={(next) => onChange(next ?? null)}
					/>
				</div>
				{!value && !readonly ? (
					<span className="text-warning text-sm font-semibold">
						No date agreed yet
					</span>
				) : null}
			</div>

			{availabilityFailed ? (
				<Alert className="bg-warning-bg mt-4 border-transparent">
					<TriangleAlert className="text-warning size-4" />
					<AlertTitle className="text-warning">
						Couldn&rsquo;t check what this unit already has booked
					</AlertTitle>
					<AlertDescription>
						Every date is selectable, but a clash will be refused when the
						tenancy is approved.
					</AlertDescription>
				</Alert>
			) : null}

			{blocked && freeFrom ? (
				<Alert className="bg-warning-bg mt-4 border-transparent">
					<TriangleAlert className="text-warning size-4" />
					<AlertTitle className="text-warning">
						The unit isn&rsquo;t free on that date
					</AlertTitle>
					<AlertDescription className="flex flex-col items-start gap-3">
						<span>
							Every bed is taken until {formatDay(freeFrom)}. To move{' '}
							{applicantName} in sooner, free one up first — cancel the booking
							or end the lease that holds it, from that record.
						</span>
						{firstFree ? (
							<Button
								variant="outline"
								size="sm"
								onClick={() => onChange(firstFree)}
							>
								<Calendar className="size-4" />
								Use {formatDay(firstFree)}
							</Button>
						) : null}
					</AlertDescription>
				</Alert>
			) : null}
		</section>
	)
}
