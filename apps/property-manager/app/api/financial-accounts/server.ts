import { fetchServer } from '~/lib/transport'

/** SSR fetch for the account summary, used as TanStack Query initialData. */
export const getFinancialAccountForServer = async (
	clientId: string,
	props: { property_id: string; account_id: string },
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<AccountSummary>>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/properties/${props.property_id}/financial-accounts/${props.account_id}`,
			{ ...apiConfig },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		console.error('Error fetching financial account:', error)
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}
