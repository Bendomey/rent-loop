import { getQueryParams } from '~/lib/get-param'
import { fetchServer } from '~/lib/transport'

/**
 * GET all property apartments/units based on a query.
 */
export const getPropertyUnitsForServer = async (
	props: FetchMultipleDataInputParams<FetchPropertyUnitFilter> & {
		property_id: string
	},
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const removeAllNullableValues =
			getQueryParams<FetchPropertyUnitFilter>(props)
		const params = new URLSearchParams(removeAllNullableValues)
		const response = await fetchServer<
			ApiResponse<FetchMultipleDataResponse<PropertyUnit>>
		>(
			`${apiConfig.baseUrl}/v1/properties/${props.property_id}/units?${params.toString()}`,
			{
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

/**
 * GET single property apartment/unit by ID.
 */
export const getPropertyUnitForServer = async (
	props: {
		unit_id: string
	},
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<PropertyUnit>>(
			`${apiConfig.baseUrl}/v1/units/${props.unit_id}`,
			{
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
