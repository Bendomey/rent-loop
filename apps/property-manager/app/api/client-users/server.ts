import { fetchServer } from '~/lib/transport'

/**
 * activate client user (server-side)
 */
export const activateClientUserForServer = async (
	clientId: string,
	id: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		await fetchServer<boolean>(
			`${apiConfig.baseUrl}/v1/admin/clients/${clientId}/client-users/${id}/activate`,
			{ method: 'POST', ...apiConfig },
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
