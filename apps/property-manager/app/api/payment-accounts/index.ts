import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

/**
 * GET all payment accounts based on a query.
 */

const getPaymentAccounts = async (
	props: FetchMultipleDataInputParams<FetchPaymentAccountFilter>,
) => {
	try {
		const removeAllNullableValues =
			getQueryParams<FetchPaymentAccountFilter>(props)
		const params = new URLSearchParams(removeAllNullableValues)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<PaymentAccount>>
		>(`/v1/payment-accounts?${params.toString()}`)
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

export const useGetPaymentAccounts = (
	query: FetchMultipleDataInputParams<FetchPaymentAccountFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PAYMENT_ACCOUNTS, query],
		queryFn: () => getPaymentAccounts(query),
	})
