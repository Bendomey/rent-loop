import { fetchServer } from '~/lib/transport'

export interface LoginClientUserInput {
	email: string
	password: string
}

interface LoginClientUserResponse {
	client_user: ClientUser
	token: string
}

export const login = async (
	props: LoginClientUserInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<LoginClientUserResponse>>(
			`${apiConfig?.baseUrl}/v1/client-users/login`,
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

export const getCurrentUser = async (apiConfig?: ApiConfigForServerConfig) => {
	try {
		const response = await fetchServer<ApiResponse<ClientUser>>(
			`${apiConfig?.baseUrl}/v1/client-users/me`,
			{
				method: 'GET',
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
