import { redirect } from 'react-router'
import type { Route } from './+types/logout'
import {
	deleteAuthSession,
	getAuthSession,
} from '~/lib/actions/auth.session.server'
import { USER_CACHE_KEY, userCache } from '~/lib/actions/cache.server'

export async function action({ request }: Route.ActionArgs) {
	const session = await getAuthSession(request.headers.get('Cookie'))

	const authToken = session.get('authToken')
	if (authToken) {
		userCache.delete(USER_CACHE_KEY.replace('{token}', authToken))
	}

	return redirect('/login', {
		headers: {
			'Set-Cookie': await deleteAuthSession(session),
		},
	})
}
