import { fetchServer } from '~/lib/transport'

/**
 * GET single invoice by ID.
 */
export const getInvoiceForServer = async (
	props: { invoice_id: string },
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Invoice>>(
			`${apiConfig.baseUrl}/v1/admin/invoices/${props.invoice_id}`,
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
