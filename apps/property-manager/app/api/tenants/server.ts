import { getQueryParams } from '~/lib/get-param'
import { fetchServer } from '~/lib/transport'

/**
 * GET property tenant by ID .
 */
export const getPropertyTenantForServer = async (
	props: {
		tenant_id: string
		populate?: Array<string>
	},
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const params = getQueryParams<FetchTenantFilter>({
			populate: props.populate,
		})
		const response = await fetchServer<ApiResponse<Tenant>>(
			`${apiConfig.baseUrl}/v1/admin/tenants/${props.tenant_id}?${params.toString()}`,
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
