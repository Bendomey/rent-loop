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

export interface SendForgotPasswordLinkInput {
	email: string
}

export const sendForgotPasswordLink = async (
	props: SendForgotPasswordLinkInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		 await fetchServer(
			`${apiConfig?.baseUrl}/v1/client-users/forgot-password`,
			{
				method: 'POST',
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

export interface ResetPasswordInput {
	newPassword: string
}

export const resetPassword = async (
	props: ResetPasswordInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		await fetchServer<ApiResponse<string>>(
			`${apiConfig?.baseUrl}/v1/client-users/reset-password`,
			{
				method: 'POST',
				body: JSON.stringify(props),
				authToken: apiConfig?.authToken,
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
