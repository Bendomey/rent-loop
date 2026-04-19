import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

const getPropertyLeases = async (
	clientId: string,
	propertyId: string,
	props: FetchMultipleDataInputParams<FetchLeaseFilter>,
) => {
	try {
		const params = getQueryParams<FetchLeaseFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Lease>>
		>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/leases?${params.toString()}`,
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

export const useGetPropertyLeases = (
	clientId: string,
	propertyId: string,
	query: FetchMultipleDataInputParams<FetchLeaseFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.LEASES, clientId, propertyId, query],
		queryFn: () => getPropertyLeases(clientId, propertyId, query),
		enabled: !!propertyId && !!clientId,
	})

const getTenantLeases = async (
	clientId: string,
	propertyId: string,
	tenantId: string,
	props: FetchMultipleDataInputParams<FetchLeaseFilter>,
) => {
	try {
		const params = getQueryParams<FetchLeaseFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Lease>>
		>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/tenants/${tenantId}/leases?${params.toString()}`,
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
	clientId: string
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
			`/v1/admin/clients/${props.clientId}/properties/${props.propertyId}/leases/${props.leaseId}`,
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
	clientId: string
	propertyId: string
	leaseId: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${props.clientId}/properties/${props.propertyId}/leases/${props.leaseId}/status:active`,
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
	clientId: string,
	propertyId: string,
	tenantId: string,
	query: FetchMultipleDataInputParams<FetchLeaseFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.LEASES, clientId, propertyId, tenantId, query],
		queryFn: () => getTenantLeases(clientId, propertyId, tenantId, query),
		enabled: !!tenantId && !!propertyId && !!clientId,
	})
