import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'

/**
 * GET all payment accounts based on a query.
 */

const getPaymentAccounts = async (
	clientId: string,
	props: FetchMultipleDataInputParams<FetchPaymentAccountFilter>,
) => {
	try {
		const params = getQueryParams<FetchPaymentAccountFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<PaymentAccount>>
		>(`/v1/admin/clients/${clientId}/payment-accounts?${params.toString()}`)
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

export const getPaymentAccountsForServer = async (
	clientId: string,
	props: FetchMultipleDataInputParams<FetchPaymentAccountFilter>,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const params = getQueryParams<FetchPaymentAccountFilter>(props)
		const response = await fetchServer<
			ApiResponse<FetchMultipleDataResponse<PaymentAccount>>
		>(
			`${apiConfig?.baseUrl}/v1/admin/clients/${clientId}/payment-accounts?${params.toString()}`,
			apiConfig,
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

export const useGetPaymentAccounts = (
	clientId: string,
	query: FetchMultipleDataInputParams<FetchPaymentAccountFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PAYMENT_ACCOUNTS, clientId, query],
		queryFn: () => getPaymentAccounts(clientId, query),
		enabled: !!clientId,
	})

interface UpdatePaymentAccountProps {
	clientId: string
	id: string
	identifier?: string
	is_default?: boolean
	provider?: PaymentAccount['provider']
	status?: PaymentAccount['status']
}

/**
 * Update payment account
 */

const updatePaymentAccount = async ({
	clientId,
	...props
}: UpdatePaymentAccountProps) => {
	try {
		await fetchClient<PaymentAccount>(
			`/v1/admin/clients/${clientId}/payment-accounts/${props.id}`,
			{
				method: 'PATCH',
				body: JSON.stringify(props),
			},
		)
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

export const useUpdatePaymentAccount = () =>
	useMutation({ mutationFn: updatePaymentAccount })

/**
 * Delete payment account
 */
const deletePaymentAccount = async (props: {
	clientId: string
	payment_account_id: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${props.clientId}/payment-accounts/${props.payment_account_id}`,
			{
				method: 'DELETE',
			},
		)
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

export const useDeletePaymentAccount = () =>
	useMutation({
		mutationFn: deletePaymentAccount,
	})
