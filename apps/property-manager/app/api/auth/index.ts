import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchClient, fetchServer } from '~/lib/transport'

export const CURRENT_USER_QUERY_KEY = ['current-user']

export interface LoginInput {
	email: string
	password: string
}

interface LoginResponse {
	user: User
	token: string
}

export const login = async (
	props: LoginInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<LoginResponse>>(
			`${apiConfig?.baseUrl}/v1/admin/users/login`,
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
		if (error instanceof Error) throw error
	}
}

export const getCurrentUser = async (apiConfig?: ApiConfigForServerConfig) => {
	try {
		const response = await fetchServer<ApiResponse<User>>(
			`${apiConfig?.baseUrl}/v1/admin/users/me`,
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
		if (error instanceof Error) throw error
	}
}

const getCurrentUserClient = async () => {
	const response = await fetchClient<ApiResponse<User>>(`/v1/admin/users/me`, {
		method: 'GET',
	})
	return response.parsedBody.data
}

export const useGetCurrentUser = (initialData?: User) =>
	useQuery({
		queryKey: CURRENT_USER_QUERY_KEY,
		queryFn: getCurrentUserClient,
		initialData,
	})

export interface SendForgotPasswordLinkInput {
	email: string
}

export const sendForgotPasswordLink = async (
	props: SendForgotPasswordLinkInput,
	apiConfig?: ApiConfigForServerConfig,
) => {
	try {
		await fetchServer(`${apiConfig?.baseUrl}/v1/admin/users/forgot-password`, {
			method: 'POST',
			body: JSON.stringify(props),
		})
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
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
			`${apiConfig?.baseUrl}/v1/admin/users/reset-password`,
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
		if (error instanceof Error) throw error
	}
}

interface UpdatePasswordProps {
	new_password: string
	old_password: string
}

const updatePassword = async (props: UpdatePasswordProps) => {
	try {
		const response = await fetchClient<ApiResponse<User>>(
			`/v1/admin/users/me/password`,
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
		if (error instanceof Error) throw error
	}
}

export const useUpdatePassword = () =>
	useMutation({ mutationFn: updatePassword })

export interface UpdateUserMeInput {
	name?: string
	phone_number?: string
	email?: string
}

const updateUserMe = async (props: UpdateUserMeInput) => {
	try {
		const response = await fetchClient<ApiResponse<User>>(
			`/v1/admin/users/me`,
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
		if (error instanceof Error) throw error
	}
}

export const useUpdateUserMe = () => useMutation({ mutationFn: updateUserMe })

// OTP

// request OTP code

interface GetOtpCodeInput {
	channel: Array<OTP['channel']>
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
