import { useQuery } from '@tanstack/react-query'
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
	tenantId: string,
	props: FetchMultipleDataInputParams<FetchLeaseFilter>,
) => {
	try {
		const params = getQueryParams<FetchLeaseFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Lease>>
		>(`/v1/admin/tenants/${tenantId}/leases?${params.toString()}`)
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

export const useGetTenantLeases = (
	tenantId: string,
	query: FetchMultipleDataInputParams<FetchLeaseFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.LEASES, tenantId, query],
		queryFn: () => getTenantLeases(tenantId, query),
		enabled: !!tenantId,
	})
