import { fetchServer } from '~/lib/transport'

export const getLeaseAgreementDocumentForServer = async (
	clientId: string,
	propertyId: string,
	leaseId: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<LeaseAgreementDocument>>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/properties/${propertyId}/leases/${leaseId}/agreement-documents`,
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
