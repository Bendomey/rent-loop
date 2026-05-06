import { Card, CardContent } from '~/components/ui/card'
import { localizedDayjs } from '~/lib/date'

export function BookingStatsStrip({ booking }: { booking: Booking }) {
	const nights = localizedDayjs(booking.check_out_date).diff(
		localizedDayjs(booking.check_in_date),
		'day',
	)

	const stats = [
		{
			label: 'Check-in',
			value: localizedDayjs(booking.check_in_date).format('MMM D, YYYY'),
			sub: localizedDayjs(booking.check_in_date).format('dddd'),
		},
		{
			label: 'Check-out',
			value: localizedDayjs(booking.check_out_date).format('MMM D, YYYY'),
			sub: localizedDayjs(booking.check_out_date).format('dddd'),
		},
		{
			label: 'Duration',
			value: `${nights} ${nights === 1 ? 'night' : 'nights'}`,
			sub:
				nights >= 7
					? `${Math.floor(nights / 7)} week${Math.floor(nights / 7) > 1 ? 's' : ''}`
					: null,
		},
		{
			label: 'Source',
			value: booking.booking_source === 'GUEST_LINK' ? 'Guest Link' : 'Manager',
			sub:
				booking.booking_source === 'GUEST_LINK' ? 'Direct booking' : 'Internal',
		},
	]

	return (
		<Card className="shadow-none">
			<CardContent className="p-0">
				<div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
					{stats.map((s) => (
						<div key={s.label} className="flex flex-col gap-0.5 px-4">
							<p className="text-muted-foreground text-[10px] font-light tracking-widest uppercase">
								{s.label}
							</p>
							<p className="text-lg font-bold">{s.value}</p>
							{s.sub ? (
								<p className="text-muted-foreground text-xs">{s.sub}</p>
							) : null}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
