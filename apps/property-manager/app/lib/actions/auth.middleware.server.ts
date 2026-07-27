import { redirect, type MiddlewareFunction } from 'react-router'
import { userContext } from './auth.context.server'
import {
	deleteAuthSession,
	getAuthSession,
	saveAuthSession,
} from './auth.session.server'
import { authTokenContext } from './auth.token.server'
import { USER_CACHE_KEY, userCache } from './cache.server'
import { environmentVariables } from './env.server'
import { getCurrentUser, refreshAuthToken } from '~/api/auth'

export const authMiddleware: MiddlewareFunction<Response> = async (
	{ request, context },
	next,
) => {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const url = new URL(request.url)
	const returnTo = `${url.pathname}${url.search}`
	const redirectToLogin = `/login?return_to=${encodeURIComponent(returnTo)}`

	const authToken = authSession.get('authToken')
	if (!authToken) {
		return redirect(redirectToLogin)
	}

	const endSession = async () => {
		userCache.delete(USER_CACHE_KEY.replace('{token}', authToken))
		return redirect(redirectToLogin, {
			headers: { 'Set-Cookie': await deleteAuthSession(authSession) },
		})
	}

	let activeToken = authToken
	let didRotate = false

	let result = await getCurrentUser({ baseUrl, authToken: activeToken })

	// 401 means this access token is spent — the expected state once an hour.
	// Try to rotate rather than ending the session.
	if (!result.ok && result.status === 401) {
		const refreshToken = authSession.get('refreshToken')
		if (!refreshToken) {
			// Session predates refresh tokens, or was never issued one.
			return endSession()
		}

		const pair = await refreshAuthToken(
			{ refresh_token: refreshToken },
			{ baseUrl },
		)
		if (!pair) {
			return endSession()
		}

		authSession.set('authToken', pair.token)
		authSession.set('refreshToken', pair.refresh_token)
		activeToken = pair.token
		didRotate = true

		result = await getCurrentUser({ baseUrl, authToken: activeToken })
	}

	if (!result.ok) {
		// A second 401, after a successful refresh, means the token is genuinely
		// not accepted — end the session.
		if (result.status === 401) {
			return endSession()
		}
		// Anything else (5xx, network failure, null status) is transient. The
		// previous implementation logged the user out here; it must not. Let the
		// error surface instead so the session survives a backend hiccup.
		throw new Error('Unable to verify your session. Please try again.')
	}

	context.set(userContext, { user: result.user })
	context.set(authTokenContext, { token: activeToken })

	const response = await next()

	if (didRotate) {
		// Appended, not set: clientMiddleware may already have added its own
		// Set-Cookie for selectedClientId, and overwriting would drop it.
		response.headers.append('Set-Cookie', await saveAuthSession(authSession))
	}

	return response
}
