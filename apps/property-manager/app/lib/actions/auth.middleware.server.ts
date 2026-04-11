import { redirect, type MiddlewareFunction } from 'react-router'
import { userContext } from './auth.context.server'
import { deleteAuthSession, getAuthSession } from './auth.session.server'
import { USER_CACHE_KEY, userCache } from './cache.server'
import { environmentVariables } from './env.server'
import { getCurrentUser } from '~/api/auth'

export const authMiddleware: MiddlewareFunction = async ({
	request,
	context,
}) => {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const url = new URL(request.url)
	const returnTo = `${url.pathname}${url.search}`
	const redirectToLogin = `/login?return_to=${encodeURIComponent(returnTo)}`

	const authToken = authSession.get('authToken')

	if (!authToken) {
		return redirect(redirectToLogin)
	}

	const cacheKey = USER_CACHE_KEY.replace('{token}', authToken)
	try {
		// TODO: temporarily disable caching of user data
		// const cached = userCache.get(cacheKey)
		// if (cached) {
		// 	const clientUserParsed = JSON.parse(cached as string)
		// 	context.set(userContext, {
		// 		clientUser: clientUserParsed,
		// 	})
		// 	return
		// }

		const user = await getCurrentUser({
			baseUrl,
			authToken,
		})

		if (!user) {
			throw new Error('No user found')
		}

		// userCache.set(cacheKey, JSON.stringify(user))
		context.set(userContext, {
			user,
		})
	} catch {
		userCache.delete(cacheKey)
		return redirect(redirectToLogin, {
			headers: {
				'Set-Cookie': await deleteAuthSession(authSession),
			},
		})
	}
}
