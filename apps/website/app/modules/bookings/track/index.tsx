import { useState } from 'react'
import { trackBooking } from '~/api/bookings/client'
import { BookingDetails } from './components/booking-details'
import { PhoneGate } from './components/phone-gate'

interface Props {
	trackingCode: string
}

export function BookTrackModule({ trackingCode }: Props) {
	const [booking, setBooking] = useState<Booking | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function handleVerify(phone: string) {
		setLoading(true)
		setError(null)
		try {
			const found = await trackBooking(trackingCode, phone)
			setBooking(found)
		} catch (err: unknown) {
			if (err instanceof Response && err.status === 403) {
				setError('No booking found for this phone number.')
			} else {
				setError('Unable to find your booking. Please try again.')
			}
		} finally {
			setLoading(false)
		}
	}

	if (booking) {
		return <BookingDetails booking={booking} />
	}

	return <PhoneGate onVerify={handleVerify} error={error} loading={loading} />
}
