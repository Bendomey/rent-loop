import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient } from '~/lib/transport'

/**
 * Every device currently signed in as the caller. Always self-scoped — a
 * session belongs to the person, not to a workspace membership, so there is no
 * client_id in any of these paths.
 */

const getSessions = async () => {
	try {
		const response = await fetchClient<ApiResponse<Session[]>>(
			'/v1/admin/users/me/sessions',
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

export const useGetSessions = () =>
	useQuery({
		queryKey: [QUERY_KEYS.SESSIONS],
		queryFn: getSessions,
	})

/**
 * Ends one session and every refresh token under it. Idempotent — revoking an
 * already-revoked session still succeeds.
 */

const revokeSession = async (sessionId: string) => {
	try {
		await fetchClient(`/v1/admin/users/me/sessions/${sessionId}`, {
			method: 'DELETE',
		})
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

export const useRevokeSession = () => useMutation({ mutationFn: revokeSession })

/**
 * Ends every session except the one making the request. Returns how many were
 * ended so the UI can report it rather than guess.
 */

const revokeOtherSessions = async () => {
	try {
		const response = await fetchClient<ApiResponse<{ revoked_count: number }>>(
			'/v1/admin/users/me/sessions:revoke-others',
			{ method: 'POST' },
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

export const useRevokeOtherSessions = () =>
	useMutation({ mutationFn: revokeOtherSessions })
