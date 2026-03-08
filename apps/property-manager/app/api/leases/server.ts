import { fetchServer } from '~/lib/transport'

export const getLeaseForServer = async (
	props: { lease_id: string },
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Lease>>(
			`${apiConfig.baseUrl}/v1/admin/leases/${props.lease_id}?populate=Tenant,Unit,TenantApplication,TenantApplication.LeaseAgreementDocumentSignatures,TenantApplication.ApplicationPaymentInvoice`,
			{ ...apiConfig },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		console.error('Error fetching lease:', error)
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) {
			throw error
		}
	}
}
