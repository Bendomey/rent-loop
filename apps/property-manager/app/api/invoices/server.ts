import { fetchServer } from '~/lib/transport'

/**
 * GET single invoice by ID.
 */
export const getInvoiceForServer = async (
	clientId: string,
	props: { invoice_id: string; property_id: string },
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		// ContextTenantApplication is NOT a relation on Invoice — GORM rejects the
		// whole preload with "unsupported relations for schema Invoice" and the
		// request 500s. An invoice reaches its application through the financial
		// account now, which is where TenantApplicationID lives.
		const response = await fetchServer<ApiResponse<Invoice>>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/properties/${props.property_id}/invoices/${props.invoice_id}?populate=Payments,LineItems,FinancialAccount`,
			{
				...apiConfig,
			},
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		console.error('Error fetching invoice:', error)
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}
