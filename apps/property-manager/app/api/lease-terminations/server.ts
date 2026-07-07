import { fetchServer } from '~/lib/transport'

export const getTerminateLeaseForServer = async (
	clientId: string,
	props: { lease_id: string; property_id: string; terminationId: string },
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<LeaseTermination>>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/properties/${props.property_id}/leases/${props.lease_id}/terminations/${props.terminationId}?populate=`,
			{ ...apiConfig },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		console.error('Error fetching lease termination:', error)
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) {
			throw error
		}
	}
}
