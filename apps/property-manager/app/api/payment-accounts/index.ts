import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'

/**
 * GET all payment accounts based on a query.
 */

const getPaymentAccounts = async (
	props: FetchMultipleDataInputParams<FetchPaymentAccountFilter>,
) => {
	try {
		const params = getQueryParams<FetchPaymentAccountFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<PaymentAccount>>
		>(`/v1/admin/payment-accounts?${params.toString()}`)
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
	props: FetchMultipleDataInputParams<FetchPaymentAccountFilter>,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const params = getQueryParams<FetchPaymentAccountFilter>(props)
		const response = await fetchServer<
			ApiResponse<FetchMultipleDataResponse<PaymentAccount>>
		>(
			`${apiConfig?.baseUrl}/v1/admin/payment-accounts?${params.toString()}`,
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
	query: FetchMultipleDataInputParams<FetchPaymentAccountFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.PAYMENT_ACCOUNTS, query],
		queryFn: () => getPaymentAccounts(query),
	})

interface CreatePaymentAccountProps {
	rail: PaymentAccount['rail']
	provider?: PaymentAccount['provider']
	identifier?: string
	metadata?: PaymentAccountMetadata
	is_default: boolean
	status: PaymentAccount['status']
}

/**
 * Create payment account
 */

const createPaymentAccount = async (props: CreatePaymentAccountProps) => {
	try {
		const response = await fetchClient<ApiResponse<PaymentAccount>>(
			`/v1/admin/payment-accounts`,
			{
				method: 'POST',
				body: JSON.stringify(props),
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

export const useCreatePaymentAccount = () =>
	useMutation({ mutationFn: createPaymentAccount })

interface UpdatePaymentAccountProps {
	id: string
	identifier?: string
	is_default?: boolean
	provider?: PaymentAccount['provider']
	status?: PaymentAccount['status']
	metadata?: PaymentAccountMetadata
}

/**
 * Update payment account
 */

const updatePaymentAccount = async (props: UpdatePaymentAccountProps) => {
	try {
		await fetchClient<PaymentAccount>(
			`/v1/admin/payment-accounts/${props.id}`,
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
const deletePaymentAccount = async (props: { payment_account_id: string }) => {
	try {
		await fetchClient(
			`/v1/admin/payment-accounts/${props.payment_account_id}`,
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
