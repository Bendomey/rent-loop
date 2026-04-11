import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient, fetchServer } from '~/lib/transport'

/**
 * GET all client users (Members) based on a query.
 */

const getClientUsers = async (
	clientId: string,
	props: FetchMultipleDataInputParams<FetchClientUserFilter>,
) => {
	try {
		const params = getQueryParams<FetchClientUserFilter>(props)
		const response = await fetchClient<
			ApiResponse<FetchMultipleDataResponse<ClientUser>>
		>(`/v1/admin/clients/${clientId}/client-users?${params.toString()}`)

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
	clientId: string,
	query: FetchMultipleDataInputParams<FetchClientUserFilter>,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.CLIENT_USERS, clientId, query],
		queryFn: () => getClientUsers(clientId, query),
		enabled: !!clientId,
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
	clientId: string,
	props: CreateClientUserInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<ClientUser>>(
			`${apiConfig?.baseUrl}/v1/admin/clients/${clientId}/client-users`,
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
	clientId: string
	id: string
	reason: string
}

/**
 * deactivate client user
 */
const deactivateClientUser = async ({
	clientId,
	id,
	reason,
}: deactivateClientUserProps) => {
	try {
		const response = await fetchClient<ApiResponse<ClientUser>>(
			`/v1/admin/clients/${clientId}/client-users/${id}/deactivate`,
			{
				method: 'POST',
				body: JSON.stringify({ reason }),
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
export const useDeactivateClientUser = () =>
	useMutation({ mutationFn: deactivateClientUser })

/**
 * activate client user
 */

const activateClientUser = async ({
	clientId,
	id,
}: {
	clientId: string
	id: string
}) => {
	try {
		await fetchClient<boolean>(
			`/v1/admin/clients/${clientId}/client-users/${id}/activate`,
			{
				method: 'POST',
			},
		)
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

/**
 * GET client user by ID (server-side)
 */
export const getClientUserForServer = async (
	clientId: string,
	id: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<ClientUser>>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/client-users/${id}?populate=User`,
			{ method: 'GET', ...apiConfig },
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

export const getClientUser = async (clientId: string, id: string) => {
	try {
		const response = await fetchClient<ApiResponse<ClientUser>>(
			`/v1/admin/clients/${clientId}/client-users/${id}?populate=User`,
			{ method: 'GET' },
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

export const useGetClientUser = (
	clientId: string,
	id: string,
	initialData?: ClientUser,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.CLIENT_USER, clientId, id],
		queryFn: () => getClientUser(clientId, id),
		enabled: !!clientId && !!id,
		initialData,
	})

/**
 * PATCH update client user by ID
 */
const updateClientUser = async ({
	clientId,
	id,
	name,
	phoneNumber,
}: {
	clientId: string
	id: string
	name?: string
	phoneNumber?: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<ClientUser>>(
			`/v1/admin/clients/${clientId}/client-users/${id}`,
			{
				method: 'PATCH',
				body: JSON.stringify({ name, phoneNumber }),
			},
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

export const useUpdateClientUser = () =>
	useMutation({ mutationFn: updateClientUser })
