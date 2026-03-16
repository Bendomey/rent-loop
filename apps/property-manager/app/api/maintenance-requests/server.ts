import { fetchServer } from '~/lib/transport'

export const getMaintenanceRequestForServer = async (
	props: { request_id: string },
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<MaintenanceRequest>>(
			`${apiConfig.baseUrl}/v1/admin/maintenance-requests/${props.request_id}?populate=Unit,AssignedWorker,AssignedManager`,
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
