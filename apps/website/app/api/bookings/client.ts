import { fetchClient, fetchServer } from '~/lib/transport'

export async function getUnitAvailabilityForClient(
	unitSlug: string,
	from: string,
	to: string,
): Promise<UnitDateBlock[]> {
	const response = await fetchClient<ApiResponse<UnitDateBlock[]>>(
		`/v1/public/units/${unitSlug}/availability?from=${from}&to=${to}`,
		{ isUnAuthorizedRequest: true },
	)
	return response.parsedBody.data ?? []
}

export async function getUnitForBookingPageServer(
	unitSlug: string,
	apiConfig: ApiConfigForServerConfig,
): Promise<PublicBookingUnit> {
	const response = await fetchServer<ApiResponse<PublicBookingUnit>>(
		`${apiConfig.baseUrl}/v1/public/units/${unitSlug}`,
		{ isUnAuthorizedRequest: true },
	)
	return response.parsedBody.data
}

export async function createPublicBooking(
	unitSlug: string,
	input: CreatePublicBookingInput,
): Promise<PublicBooking> {
	const response = await fetchClient<ApiResponse<PublicBooking>>(
		`/v1/public/units/${unitSlug}/bookings`,
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
): Promise<PublicBooking> {
	const encoded = encodeURIComponent(phone)
	const response = await fetchClient<ApiResponse<PublicBooking>>(
		`/v1/public/bookings/track/${trackingCode}?phone=${encoded}`,
		{ isUnAuthorizedRequest: true },
	)
	return response.parsedBody.data
}
