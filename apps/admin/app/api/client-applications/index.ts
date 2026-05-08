import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

const getClientApplications = async (
	props: FetchMultipleDataInputParams<FetchClientApplicationFilter>,
) => {
	try {
		const params = getQueryParams<FetchClientApplicationFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<ClientApplication>>
		>(`/v1/admin/client-applications?${params.toString()}`)

		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) throw error
	}
}

export const useGetClientApplications = (
	query: FetchMultipleDataInputParams<FetchClientApplicationFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.CLIENT_APPLICATIONS, query],
		queryFn: () => getClientApplications(query),
	})

/**
 * Approve a client(Property manager) application.
 */
const approveClientApplication = async ({ id }: { id: string }) => {
	try {
		const response = await fetchClient<ApiResponse<ClientApplication>>(
			`/v1/admin/client-applications/${id}/approve`,
			{ method: 'PATCH' },
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

export const useApproveClientApplication = () =>
	useMutation({ mutationFn: approveClientApplication })

/**
 * Reject a client(Property manager) application.
 */
const rejectClientApplication = async ({
	id,
	reason,
}: {
	id: string
	reason: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<ClientApplication>>(
			`/v1/admin/client-applications/${id}/reject`,
			{ method: 'PATCH', body: JSON.stringify({ reason }) },
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

export const useRejectClientApplication = () =>
	useMutation({ mutationFn: rejectClientApplication })
