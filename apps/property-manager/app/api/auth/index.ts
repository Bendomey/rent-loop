import { useMutation } from '@tanstack/react-query'
import { fetchClient, fetchServer } from '~/lib/transport'

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
			`${apiConfig?.baseUrl}/v1/admin/client-users/login`,
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
			`${apiConfig?.baseUrl}/v1/admin/client-users/me?populate=Client`,
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
			`${apiConfig?.baseUrl}/v1/admin/client-users/forgot-password`,
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
			`${apiConfig?.baseUrl}/v1/admin/client-users/reset-password`,
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

interface UpdatePasswordProps {
	new_password: string
	old_password: string
}

/**
 * Update Password
 */

const updatePassword = async (props: UpdatePasswordProps) => {
	try {
		const response = await fetchClient<ApiResponse<ClientUser>>(
			`/v1/admin/client-users/me/password`,
			{
				method: 'PATCH',
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

export const useUpdatePassword = () =>
	useMutation({ mutationFn: updatePassword })

// OTP

// request OTP code

interface GetOtpCodeInput {
	channel: OTP['channel']
	phone?: Maybe<string>
	email?: Maybe<string>
}

export const getOtpCode = async (props: GetOtpCodeInput) => {
	try {
		const response = await fetchClient<ApiResponse<OTP>>(`/v1/auth/codes`, {
			method: 'POST',
			body: JSON.stringify(props),
		})
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

export const useGetOtpCode = () => useMutation({ mutationFn: getOtpCode })

// Verify OTP
interface VerifyOtpCodeInput {
	code: string
	phone?: Maybe<string>
	email?: Maybe<string>
}
export const verifyOtpCode = async (props: VerifyOtpCodeInput) => {
	try {
		const response = await fetchClient<ApiResponse<OTP>>(
			`/v1/auth/codes/verify`,
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

export const useVerifyOtpCode = () => useMutation({ mutationFn: verifyOtpCode })
