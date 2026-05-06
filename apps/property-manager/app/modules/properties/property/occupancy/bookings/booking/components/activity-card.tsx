import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { localizedDayjs } from '~/lib/date'
import { cn } from '~/lib/utils'

type Step = {
	label: string
	sublabel: string
	done: boolean
	active: boolean
	colour: string
	timestamp?: Date
}

function buildSteps(booking: Booking): Step[] {
	const s = booking.status
	const isDone = (statuses: BookingStatus[]) => statuses.includes(s)

	const steps: Step[] = [
		{
			label:
				booking.booking_source === 'GUEST_LINK'
					? 'Submitted via Guest Link'
					: 'Created by manager',
			sublabel: booking.tenant
				? `${booking.tenant.first_name} ${booking.tenant.last_name}`
				: 'System',
			done: true,
			active: s === 'PENDING',
			colour: 'bg-rose-500',
			timestamp: booking.created_at,
		},
		{
			label: 'Confirmed',
			sublabel: booking.confirmed_by
				? `${booking.confirmed_by.user?.name}`
				: 'System',
			done: !!booking.confirmed_at,
			active: s === 'CONFIRMED',
			colour: 'bg-teal-500',
			timestamp: booking.confirmed_at ?? undefined,
		},
		{
			label: 'Checked in',
			sublabel: booking.checked_in_by
				? `${booking.checked_in_by.user?.name}`
				: 'Scheduled',
			done: isDone(['CHECKED_IN', 'COMPLETED']),
			active: s === 'CHECKED_IN',
			colour: 'bg-blue-500',
			timestamp: booking.checked_in_at ?? booking.check_in_date,
		},
		{
			label: 'Completed',
			sublabel: booking.checked_out_by
				? `${booking.checked_out_by.user?.name}`
				: 'Scheduled',
			done: isDone(['COMPLETED']),
			active: s === 'COMPLETED',
			colour: 'bg-zinc-400',
			timestamp: booking.checked_out_at ?? booking.check_out_date,
		},
	]

	if (s === 'CANCELLED') {
		steps.push({
			label: 'Cancelled',
			sublabel: booking.canceled_by
				? `${booking.canceled_by.user?.name}`
				: 'System',
			done: true,
			active: true,
			colour: 'bg-rose-500',
			timestamp: booking.updated_at,
		})
	}

	return steps
}

export function ActivityCard({ booking }: { booking: Booking }) {
	const steps = buildSteps(booking)

	return (
		<Card className="shadow-none">
			<CardHeader className="">
				<CardTitle className="text-[10px] font-semibold tracking-widest text-rose-600 uppercase">
					Activity
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="relative space-y-0">
					{steps.map((step, i) => (
						<div key={i} className="flex gap-3">
							{/* Timeline spine */}
							<div className="flex flex-col items-center">
								<div
									className={cn(
										'mt-0.5 size-2.5 shrink-0 rounded-full',
										step.done
											? step.colour
											: 'bg-background border-2 border-zinc-300 dark:border-zinc-600',
									)}
								/>
								{i < steps.length - 1 ? (
									<div
										className={cn(
											'my-1 w-px flex-1',
											step.done
												? 'bg-zinc-300 dark:bg-zinc-600'
												: 'bg-zinc-200 dark:bg-zinc-700',
										)}
										style={{ minHeight: '20px' }}
									/>
								) : null}
							</div>

							{/* Content */}
							<div
								className={cn(
									'min-w-0 flex-1 pb-4',
									i === steps.length - 1 && 'pb-0',
								)}
							>
								<p
									className={cn(
										'text-xs font-medium',
										!step.done && 'text-muted-foreground',
									)}
								>
									{step.label}
								</p>
								<p className="text-muted-foreground text-[11px]">
									{step.timestamp
										? `${localizedDayjs(step.timestamp).format('MMM D, YYYY · HH:mm')} · `
										: ''}
									{step.sublabel}
								</p>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
