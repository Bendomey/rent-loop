import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchClient, fetchServer } from '~/lib/transport'

export const CURRENT_USER_QUERY_KEY = ['current-user']

export interface LoginInput {
	email: string
	password: string
	/**
	 * Device/browser description for the session row. Optional and untrusted —
	 * the backend stores it verbatim for display only.
	 */
	metadata?: unknown
}

export interface TokenPair {
	token: string
	expires_in: number
	refresh_token: string
	refresh_expires_in: number
}

interface LoginResponse extends TokenPair {
	user: User
}

export const login = async (
	props: LoginInput,
	apiConfig?: ApiConfigForServerConfig & { forwardedHeaders?: HeadersInit },
) => {
	try {
		const response = await fetchServer<ApiResponse<LoginResponse>>(
			`${apiConfig?.baseUrl}/v1/admin/users/login`,
			{
				method: 'POST',
				body: JSON.stringify(props),
				// Login runs server-side, so without these the backend records THIS
				// server as the client — every web session would be stamped with
				// the Node user-agent and the loopback address instead of the
				// person's actual browser and IP.
				headers: apiConfig?.forwardedHeaders,
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

export type CurrentUserResult =
	| { ok: true; user: User }
	| { ok: false; status: number | null }

export const getCurrentUser = async (
	apiConfig?: ApiConfigForServerConfig,
): Promise<CurrentUserResult> => {
	try {
		const response = await fetchServer<ApiResponse<User>>(
			`${apiConfig?.baseUrl}/v1/admin/users/me`,
			{
				method: 'GET',
				...(apiConfig ? apiConfig : {}),
			},
		)
		const user = response.parsedBody.data
		if (!user) return { ok: false, status: null }
		return { ok: true, user }
	} catch (error: unknown) {
		if (error instanceof Response) {
			return { ok: false, status: error.status }
		}
		return { ok: false, status: null }
	}
}

export interface RefreshTokenInput {
	refresh_token: string
	/**
	 * Optionally re-describes the device, same untrusted display-only blob as
	 * on login. Omitted keys leave the recorded values untouched, so a partial
	 * object (just the timezone, say) updates only the reported location.
	 */
	metadata?: unknown
}

/**
 * Exchanges a refresh token for a new pair. Returns null on any failure — the
 * backend answers every rejection (invalid, revoked, expired) with the same
 * opaque 401 by design, so there is nothing for a caller to branch on beyond
 * success or failure.
 */
export const refreshAuthToken = async (
	props: RefreshTokenInput,
	apiConfig?: ApiConfigForServerConfig,
): Promise<TokenPair | null> => {
	try {
		const response = await fetchServer<ApiResponse<TokenPair>>(
			`${apiConfig?.baseUrl}/v1/admin/users/refresh`,
			{
				method: 'POST',
				body: JSON.stringify(props),
			},
		)
		return response.parsedBody.data ?? null
	} catch {
		return null
	}
}

/**
 * Revokes a refresh token server-side. Best-effort by contract: it never
 * throws and never reports failure, because logging out must not be blocked by
 * a network problem. The caller destroys the cookie regardless.
 *
 * The timeout is load-bearing, not defensive garnish. Catching exceptions
 * alone is not enough: a backend that accepts the connection but never
 * responds — overloaded, paused, blackholed — makes fetch hang indefinitely,
 * and a hang is not an exception. Without this, logout waits forever and the
 * user is trapped in the session this function exists to end.
 */
const REVOKE_TIMEOUT_MS = 3000

export const revokeRefreshToken = async (
	props: RefreshTokenInput,
	apiConfig?: ApiConfigForServerConfig,
): Promise<void> => {
	try {
		await fetchServer(`${apiConfig?.baseUrl}/v1/admin/users/logout`, {
			method: 'POST',
			body: JSON.stringify(props),
			signal: AbortSignal.timeout(REVOKE_TIMEOUT_MS),
		})
	} catch {
		// intentionally ignored — see doc comment
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
	new_password: string
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
