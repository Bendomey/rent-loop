import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

// ---- Queries ----

const getPropertyBookings = async (
	clientId: string,
	propertyId: string,
	props: FetchMultipleDataInputParams<FetchBookingFilter>,
) => {
	try {
		const params = getQueryParams<FetchBookingFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Booking>>
		>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/bookings?${params.toString()}`,
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

export const useGetPropertyBookings = (
	clientId: string,
	propertyId: string,
	query: FetchMultipleDataInputParams<FetchBookingFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.BOOKINGS, clientId, propertyId, query],
		queryFn: () => getPropertyBookings(clientId, propertyId, query),
		enabled: !!clientId && !!propertyId,
	})

const getBooking = async (clientId: string, bookingId: string) => {
	try {
		const response = await fetchClient<ApiResponse<Booking>>(
			`/v1/admin/clients/${clientId}/bookings/${bookingId}?populate=Tenant,Unit,Property,Invoice`,
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

export const useGetBooking = (
	clientId: string,
	bookingId: string,
	initialData?: Booking,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.BOOKINGS, clientId, bookingId],
		queryFn: () => getBooking(clientId, bookingId),
		enabled: !!clientId && !!bookingId,
		initialData,
	})

const getUnitAvailability = async (
	clientId: string,
	unitId: string,
	from: Date,
	to: Date,
) => {
	try {
		const params = new URLSearchParams({
			from: from.toISOString(),
			to: to.toISOString(),
		})
		const response = await fetchClient<ApiResponse<UnitDateBlock[]>>(
			`/v1/admin/clients/${clientId}/units/${unitId}/availability?${params.toString()}`,
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

export const useGetUnitAvailability = (
	clientId: string,
	unitId: string,
	from: Date,
	to: Date,
) =>
	useQuery({
		queryKey: [
			QUERY_KEYS.DATE_BLOCKS,
			clientId,
			unitId,
			from.toISOString(),
			to.toISOString(),
		],
		queryFn: () => getUnitAvailability(clientId, unitId, from, to),
		enabled: !!clientId && !!unitId,
	})

// ---- Mutations ----

export interface CreateBookingInput {
	clientId: string
	propertyId: string
	unit_id: string
	check_in_date: string
	check_out_date: string
	rate: number
	currency: string
	notes?: string
	guest_first_name: string
	guest_last_name: string
	guest_phone: string
	guest_email: string
	guest_id_number: string
}

const createBooking = async ({
	clientId,
	propertyId,
	...body
}: CreateBookingInput) => {
	try {
		const response = await fetchClient<ApiResponse<Booking>>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/bookings`,
			{ method: 'POST', body: JSON.stringify(body) },
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

export const useCreateBooking = () => useMutation({ mutationFn: createBooking })

const confirmBooking = async ({
	clientId,
	bookingId,
}: {
	clientId: string
	bookingId: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<Booking>>(
			`/v1/admin/clients/${clientId}/bookings/${bookingId}/confirm`,
			{ method: 'PUT' },
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

export const useConfirmBooking = () =>
	useMutation({ mutationFn: confirmBooking })

const checkInBooking = async ({
	clientId,
	bookingId,
}: {
	clientId: string
	bookingId: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${clientId}/bookings/${bookingId}/check-in`,
			{ method: 'PUT' },
		)
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useCheckInBooking = () =>
	useMutation({ mutationFn: checkInBooking })

const completeBooking = async ({
	clientId,
	bookingId,
}: {
	clientId: string
	bookingId: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${clientId}/bookings/${bookingId}/complete`,
			{ method: 'PUT' },
		)
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useCompleteBooking = () =>
	useMutation({ mutationFn: completeBooking })

export interface CancelBookingInput {
	clientId: string
	bookingId: string
	reason: string
}

const cancelBooking = async ({
	clientId,
	bookingId,
	reason,
}: CancelBookingInput) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${clientId}/bookings/${bookingId}/cancel`,
			{ method: 'PUT', body: JSON.stringify({ reason }) },
		)
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useCancelBooking = () => useMutation({ mutationFn: cancelBooking })

export interface CreateDateBlockInput {
	clientId: string
	unitId: string
	start_date: string
	end_date: string
	block_type: 'MAINTENANCE' | 'PERSONAL' | 'OTHER'
	reason?: string
}

const createDateBlock = async ({
	clientId,
	unitId,
	...body
}: CreateDateBlockInput) => {
	try {
		const response = await fetchClient<ApiResponse<UnitDateBlock>>(
			`/v1/admin/clients/${clientId}/units/${unitId}/date-blocks`,
			{ method: 'POST', body: JSON.stringify(body) },
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

export const useCreateDateBlock = () =>
	useMutation({ mutationFn: createDateBlock })

const deleteDateBlock = async ({
	clientId,
	blockId,
}: {
	clientId: string
	blockId: string
}) => {
	try {
		await fetchClient(`/v1/admin/clients/${clientId}/date-blocks/${blockId}`, {
			method: 'DELETE',
		})
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useDeleteDateBlock = () =>
	useMutation({ mutationFn: deleteDateBlock })
