import { fetchServer } from '~/lib/transport'

/**
 * GET single announcement by ID (server-side).
 */
export const getAnnouncementForServer = async (
	id: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Announcement>>(
			`${apiConfig.baseUrl}/v1/admin/announcements/${id}`,
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
