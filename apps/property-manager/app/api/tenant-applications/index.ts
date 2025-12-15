import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET all tenant applications based on a query.
 */

const getPropertyTenantApplications = async (
	props: FetchMultipleDataInputParams<FetchTenantApplicationFilter> & {
		property_id: string
	},
) => {
	try {
		const removeAllNullableValues =
			getQueryParams<FetchTenantApplicationFilter>(props)
		const params = new URLSearchParams(removeAllNullableValues)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<TenantApplication>>
		>(
			`/v1/properties/${props.property_id}/tenant-applications?${params.toString()}`,
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

export const useGetPropertyTenantApplications = (
	query: FetchMultipleDataInputParams<FetchTenantApplicationFilter> & {
		property_id: string
	},
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PROPERTY_TENANT_APPLICATIONS, query],
		queryFn: () => getPropertyTenantApplications(query),
	})
