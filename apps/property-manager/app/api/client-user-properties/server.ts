import { getQueryParams } from '~/lib/get-param'
import { fetchServer } from '~/lib/transport'

/**
 * GET all client users (Members) for a particular property based on a query.
 */
export const getClientUserPropertiesForServer = async (
	props: FetchMultipleDataInputParams<FetchClientUserPropertyFilter>,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const params = getQueryParams<FetchClientUserPropertyFilter>(props)
		const response = await fetchServer<
			ApiResponse<FetchMultipleDataResponse<ClientUserProperty>>
		>(
			`${apiConfig.baseUrl}/v1/admin/client-user-properties?${params.toString()}`,
			{
				method: 'GET',
				...apiConfig,
			},
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
