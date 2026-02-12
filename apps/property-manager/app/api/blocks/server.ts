import type { CreatePropertyBlockInput } from '.'
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
		const params =
			getQueryParams<FetchPropertyBlockFilter>(props)
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

export const createPropertyBlockForServer = async (
	props: CreatePropertyBlockInput,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<PropertyBlock>>(
			`${apiConfig.baseUrl}/v1/properties/${props.property_id}/blocks`,
			{
				method: 'POST',
				body: JSON.stringify(props),
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
