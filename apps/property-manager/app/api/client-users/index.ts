import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'

/**
 * GET all client users (Members) based on a query.
 */

const getClientUsers = async (
	props: FetchMultipleDataInputParams<FetchClientUserFilter>,
) => {
	try {
		const removeAllNullableValues = getQueryParams<FetchClientUserFilter>(props)
		const params = new URLSearchParams(removeAllNullableValues)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<ClientUser>>
		>(`/v1/client-users?${params.toString()}`)

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

export const useGetClientUsers = (
	query: FetchMultipleDataInputParams<FetchClientUserFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.CLIENT_USERS, query],
		queryFn: () => getClientUsers(query),
	})

/**
 *  Create client user (Member)
 */

export interface CreateClientUserInput {
	name: string
	phone: string
	email: string
	role: ClientUser['role']
}

export const createClientUser = async (
	props: CreateClientUserInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<ClientUser>>(
			`${apiConfig?.baseUrl}/v1/client-users`,
			{
				method: 'POST',
				body: JSON.stringify(props),
				...(apiConfig ? apiConfig : {}),
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

interface deactivateClientUserProps {
	id: string
	reason: string
}

/**
 * deactivate client user
 */
export const deactivateClientUser = async (
	{ id, reason }: deactivateClientUserProps,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<ClientUser>>(
			`${apiConfig?.baseUrl}/v1/client-users/${id}/deactivate`,
			{
				method: 'POST',
				body: JSON.stringify({ reason }),
				...(apiConfig ? apiConfig : {}),
			},
		)
		return response.parsedBody.data
	} catch (error) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}

		if (error instanceof Error) {
			throw error
		}
	}
}

/**
 * activate client user
 */

const activateClientUser = async (id: string) => {
	try {
		await fetchClient<boolean>(`/v1/client-users/${id}/activate`, {
			method: 'POST',
		})
	} catch (error) {
		if (error instanceof Error) {
			throw error
		}

		// Error from server.
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.message)
		}
	}
}

export const useActivateClientUser = () =>
	useMutation({ mutationFn: activateClientUser })
