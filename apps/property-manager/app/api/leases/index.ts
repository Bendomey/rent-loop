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
