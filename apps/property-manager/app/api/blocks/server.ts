import { getQueryParams } from '~/lib/get-param'
import { fetchServer } from '~/lib/transport'

/**
 * GET all property blocks based on a query.
 */
export const getPropertyBlocksForServer = async (
	props: FetchMultipleDataInputParams<FetchPropertyBlockFilter> & {
		property_id: string
	},
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const removeAllNullableValues =
			getQueryParams<FetchPropertyBlockFilter>(props)
		const params = new URLSearchParams(removeAllNullableValues)
		const response = await fetchServer<
			ApiResponse<FetchMultipleDataResponse<PropertyBlock>>
		>(
			`${apiConfig.baseUrl}/v1/properties/${props.property_id}/blocks?${params.toString()}`,
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
