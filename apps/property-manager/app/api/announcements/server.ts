import { fetchServer } from '~/lib/transport'

/**
 * GET single announcement by ID (server-side, global scope).
 */
export const getAnnouncementForServer = async (
	clientId: string,
	id: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Announcement>>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/announcements/${id}`,
			{ ...apiConfig },
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
 * GET single announcement by ID (server-side, property-scoped).
 */
export const getPropertyAnnouncementForServer = async (
	clientId: string,
	propertyId: string,
	id: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Announcement>>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/properties/${propertyId}/announcements/${id}?populate=PropertyBlock`,
			{ ...apiConfig },
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
