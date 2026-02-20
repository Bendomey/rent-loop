import { useMutation } from '@tanstack/react-query'
import { fetchClient } from '~/lib/transport'

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
