import { fetchServer } from '~/lib/transport'

export const getMaintenanceRequestForServer = async (
	clientId: string,
	props: { request_id: string; property_id: string },
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<MaintenanceRequest>>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/properties/${props.property_id}/maintenance-requests/${props.request_id}?populate=Unit,AssignedWorker,AssignedWorker.User,AssignedManager,AssignedManager.User,CreatedByTenant,CreatedByClientUser.User`,
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
