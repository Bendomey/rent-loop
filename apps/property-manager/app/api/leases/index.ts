import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

const getPropertyLeases = async (
	propertyId: string,
	props: FetchMultipleDataInputParams<FetchLeaseFilter>,
) => {
	try {
		const params = getQueryParams<FetchLeaseFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Lease>>
		>(`/v1/admin/properties/${propertyId}/leases?${params.toString()}`)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) {
			throw error
		}
	}
}

export const useGetPropertyLeases = (
	propertyId: string,
	query: FetchMultipleDataInputParams<FetchLeaseFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.LEASES, propertyId, query],
		queryFn: () => getPropertyLeases(propertyId, query),
		enabled: !!propertyId,
	})

const getTenantLeases = async (
	propertyId: string,
	tenantId: string,
	props: FetchMultipleDataInputParams<FetchLeaseFilter>,
) => {
	try {
		const params = getQueryParams<FetchLeaseFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Lease>>
		>(
			`/v1/admin/properties/${propertyId}/tenants/${tenantId}/leases?${params.toString()}`,
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) {
			throw error
		}
	}
}

export interface UpdateLeaseInput {
	propertyId: string
	leaseId: string
	utility_transfers_date?: Date
}

const updateLease = async (props: UpdateLeaseInput) => {
	try {
		const body: Record<string, unknown> = {}
		if (props.utility_transfers_date)
			body.utility_transfers_date = props.utility_transfers_date.toISOString()

		const response = await fetchClient<ApiResponse<Lease>>(
			`/v1/admin/properties/${props.propertyId}/leases/${props.leaseId}`,
			{
				method: 'PATCH',
				body: JSON.stringify(body),
			},
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

export const useUpdateLease = () => useMutation({ mutationFn: updateLease })

const activateLease = async (props: {
	propertyId: string
	leaseId: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/properties/${props.propertyId}/leases/${props.leaseId}/status:active`,
			{ method: 'PATCH' },
		)
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useActivateLease = () => useMutation({ mutationFn: activateLease })

export const useGetTenantLeases = (
	propertyId: string,
	tenantId: string,
	query: FetchMultipleDataInputParams<FetchLeaseFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.LEASES, propertyId, tenantId, query],
		queryFn: () => getTenantLeases(propertyId, tenantId, query),
		enabled: !!tenantId && !!propertyId,
	})
