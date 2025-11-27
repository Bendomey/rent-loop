import { redirect, type MiddlewareFunction } from 'react-router'
import { userContext } from './auth.context.server'
import { deleteAuthSession, getAuthSession } from './auth.session.server'
import { USER_CACHE_KEY, userCache } from './cache.server'
import { environmentVariables } from './env.server'
import { getCurrentUser } from '~/api/auth'
import { getClientUserProperties } from '~/api/properties'

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
		const cached = userCache.get(cacheKey)
		if (cached) {
			const clientUserParsed = JSON.parse(cached as string)

			const clientUserPropertiesResponse = await getClientUserProperties(
				{
					pagination: { page: 1, per: 5 },
					sorter: {},
					filters: {},
					search: {},
					populate: ['Property'],
				},
				{
					baseUrl,
					authToken,
				},
			)

			if (clientUserParsed && clientUserPropertiesResponse) {
				context.set(userContext, {
					clientUser: clientUserParsed,
					clientUserProperties: clientUserPropertiesResponse,
				})
				return
			}
		}

		const [clientUserSettledResult, clientUserPropertiesSettledResult] =
			await Promise.allSettled([
				getCurrentUser({
					baseUrl,
					authToken,
				}),
				getClientUserProperties(
					{
						pagination: { page: 1, per: 5 },
						sorter: {},
						filters: {},
						search: {},
						populate: ['Property'],
					},
					{
						baseUrl,
						authToken,
					},
				),
			])

		if (
			clientUserSettledResult?.status === 'rejected' ||
			clientUserPropertiesSettledResult?.status === 'rejected'
		) {
			throw new Error('No user found')
		}

		const clientUser = clientUserSettledResult?.value
		const clientUserPropertiesResponse =
			clientUserPropertiesSettledResult?.value
		if (clientUser && clientUserPropertiesResponse) {
			userCache.set(cacheKey, JSON.stringify(clientUserSettledResult.value))
			context.set(userContext, {
				clientUser,
				clientUserProperties: clientUserPropertiesResponse,
			})
		}
	} catch {
		userCache.delete(cacheKey)
		return redirect(redirectToLogin, {
			headers: {
				'Set-Cookie': await deleteAuthSession(authSession),
			},
		})
	}
}
