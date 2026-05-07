import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET all Admin Users based on a query.
 */

const getAdmins = async (
	props: FetchMultipleDataInputParams<FetchAdminFilter>,
) => {
	try {
		const params = getQueryParams<FetchAdminFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<Admin>>
		>(`/v1/admin/admins?${params.toString()}`)

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

export const useGetAdmins = (
	query: FetchMultipleDataInputParams<FetchAdminFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.ADMINS, query],
		queryFn: () => getAdmins(query),
	})
