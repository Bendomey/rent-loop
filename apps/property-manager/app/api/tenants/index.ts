import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET all tenants based on a query.
 */

const getPropertyTenants = async (
	clientId: string,
	props: FetchMultipleDataInputParams<FetchTenantFilter> & {
		property_id: string
	},
) => {
	try {
		const params = getQueryParams<FetchTenantFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Tenant>>
		>(
			`/v1/admin/clients/${clientId}/properties/${props.property_id}/tenants?${params.toString()}`,
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

export const useGetPropertyTenants = (
	clientId: string,
	query: FetchMultipleDataInputParams<FetchTenantFilter> & {
		property_id: string
	},
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PROPERTY_TENANTS, clientId, query],
		queryFn: () => getPropertyTenants(clientId, query),
		enabled: !!clientId,
	})

/**
 * Get Tenant by Phone
 */
const getTenantByPhone = async (phone?: string) => {
	try {
		const response = await fetchClient<ApiResponse<Tenant>>(
			`/v1/tenants/phone/${phone}`,
			{
				method: 'GET',
			},
		)
		return response.parsedBody.data
	} catch (error) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}
export const useGetTenantByPhone = () =>
	useMutation({ mutationFn: (phone?: string) => getTenantByPhone(phone) })
