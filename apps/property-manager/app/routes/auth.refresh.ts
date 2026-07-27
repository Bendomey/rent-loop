import { data } from 'react-router'
import type { Route } from './+types/auth.refresh'
import { refreshAuthToken } from '~/api/auth'
import {
	deleteAuthSession,
	getAuthSession,
	saveAuthSession,
} from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'

/**
 * Client-side refresh endpoint.
 *
 * The browser cannot read the httpOnly cookie holding the refresh token, and
 * must not be given one — so rotation happens here, server-side. The rotated
 * pair goes back into the cookie; only the new ACCESS token is returned in the
 * body, because the caller (fetchClient) needs it to retry its request and has
 * no way to read the cookie it just caused to be updated.
 *
 * Deliberately named `auth.refresh` and not `_auth.refresh`: the leading
 * `_auth.` prefix would nest this under the auth layout and subject it to
 * authMiddleware — the very middleware that cannot pass once the access token
 * has expired, which is exactly when this route is needed.
 */
export async function action({ request }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const session = await getAuthSession(request.headers.get('Cookie'))

	const refreshToken = session.get('refreshToken')
	if (!refreshToken) {
		return data(
			{ error: 'refresh_failed' },
			{
				status: 401,
				headers: { 'Set-Cookie': await deleteAuthSession(session) },
			},
		)
	}

	const pair = await refreshAuthToken(
		{ refresh_token: refreshToken },
		{ baseUrl },
	)
	if (!pair) {
		return data(
			{ error: 'refresh_failed' },
			{
				status: 401,
				headers: { 'Set-Cookie': await deleteAuthSession(session) },
			},
		)
	}

	session.set('authToken', pair.token)
	session.set('refreshToken', pair.refresh_token)

	// Only the access token crosses back to the browser.
	return data(
		{ token: pair.token },
		{ headers: { 'Set-Cookie': await saveAuthSession(session) } },
	)
}
