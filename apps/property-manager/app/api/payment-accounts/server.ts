import { getQueryParams } from '~/lib/get-param'
import { fetchServer } from '~/lib/transport'

/**
 * GET single payment account by ID.
 */
export const getPaymentAccountForServer = async (
	props: {payment_account_id: string	},
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<PaymentAccount>>(
			`${apiConfig.baseUrl}/v1/payment-accounts/${props.payment_account_id}`,
			{
				...apiConfig,
			},
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}
