import { Card, CardContent } from '~/components/ui/card'
import { getBookingDuration } from '~/lib/booking.utils'
import { localizedDayjs } from '~/lib/date'
import { getPaymentFrequencyLabel } from '~/lib/properties.utils'

export function BookingStatsStrip({ booking }: { booking: Booking }) {
	const { count, label } = getBookingDuration(
		booking.check_in_date,
		booking.check_out_date,
		booking.stay_frequency,
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
			value: `${count} ${label}`,
			sub: getPaymentFrequencyLabel(booking.stay_frequency),
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
							<p className="font-serif text-lg font-bold">{s.value}</p>
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
