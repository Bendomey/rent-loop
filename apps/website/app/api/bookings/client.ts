import { fetchClient } from '~/lib/transport'

export async function getUnitAvailabilityForClient(
	unitSlug: string,
	from: string,
	to: string,
): Promise<UnitDateBlock[]> {
	const response = await fetchClient<ApiResponse<UnitDateBlock[]>>(
		`/v1/units/${unitSlug}/availability?from=${from}&to=${to}`,
		{ isUnAuthorizedRequest: true },
	)
	return response.parsedBody.data ?? []
}

export interface CreateBookingInput {
	check_in_date: string
	check_out_date: string
	first_name: string
	last_name: string
	phone: string
	email?: string
	id_number: string
}

export async function createBooking(
	unitSlug: string,
	input: CreateBookingInput,
): Promise<Booking> {
	const response = await fetchClient<ApiResponse<Booking>>(
		`/v1/units/${unitSlug}/bookings`,
		{
			method: 'POST',
			body: JSON.stringify(input),
			isUnAuthorizedRequest: true,
		},
	)
	return response.parsedBody.data
}

export async function trackBooking(
	trackingCode: string,
	phone: string,
): Promise<Booking> {
	const encoded = encodeURIComponent(phone)
	const response = await fetchClient<ApiResponse<Booking>>(
		`/v1/bookings/${trackingCode}?phone=${encoded}`,
		{ isUnAuthorizedRequest: true },
	)
	return response.parsedBody.data
}
