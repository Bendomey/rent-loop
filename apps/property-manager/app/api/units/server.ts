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
		const params = getQueryParams<FetchPropertyUnitFilter>(props)
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

export const getPropertyUnitForServer = async (
	props: {
		property_id: string
		unit_id: string
		populate?: Array<string>
	},
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const params = getQueryParams<FetchPropertyUnitFilter>({
			populate: props.populate,
		})
		const response = await fetchServer<
			ApiResponse<PropertyUnit>
		>(
			`${apiConfig.baseUrl}/v1/properties/${props.property_id}/units/${props.unit_id}?${params.toString()}`,
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
