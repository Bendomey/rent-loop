import { getQueryParams } from '~/lib/get-param'
import { fetchServer } from '~/lib/transport'

/**
 * Link client user to property (server-side)
 */
export const linkClientUserPropertyForServer = async (
	props: {
		property_id: string
		role: ClientUserProperty['role']
		client_user_ids: string[]
	},
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<ClientUserProperty>>(
			`${apiConfig.baseUrl}/v1/admin/properties/${props.property_id}/client-users:link`,
			{
				method: 'POST',
				body: JSON.stringify({
					role: props.role,
					client_user_ids: props.client_user_ids,
				}),
				...apiConfig,
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
