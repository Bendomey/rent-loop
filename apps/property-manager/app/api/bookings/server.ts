import { fetchServer } from '~/lib/transport'

export const getBookingForServer = async (
	clientId: string,
	bookingId: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Booking>>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/bookings/${bookingId}?populate=Tenant,Unit,Property,Invoice`,
			{ ...apiConfig },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}
