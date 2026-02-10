import { fetchServer } from '~/lib/transport'

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
