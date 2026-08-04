import { redirect } from 'react-router'
import type { Route } from './+types/logout'
import { revokeRefreshToken } from '~/api/auth'
import {
	deleteAuthSession,
	getAuthSession,
} from '~/lib/actions/auth.session.server'
import { USER_CACHE_KEY, userCache } from '~/lib/actions/cache.server'
import { environmentVariables } from '~/lib/actions/env.server'

export async function action({ request }: Route.ActionArgs) {
	const session = await getAuthSession(request.headers.get('Cookie'))

	const authToken = session.get('authToken')
	if (authToken) {
		userCache.delete(USER_CACHE_KEY.replace('{token}', authToken))
	}

	// Without this the refresh token stays valid server-side for its full
	// 90-day window — "log out" would end the browser's session while leaving
	// the credential behind it alive. revokeRefreshToken never throws: a user
	// trying to leave must not be held in a session by a network failure.
	const refreshToken = session.get('refreshToken')
	if (refreshToken) {
		await revokeRefreshToken(
			{ refresh_token: refreshToken },
			{ baseUrl: environmentVariables().API_ADDRESS },
		)
	}

	return redirect('/login', {
		headers: {
			'Set-Cookie': await deleteAuthSession(session),
		},
	})
}
