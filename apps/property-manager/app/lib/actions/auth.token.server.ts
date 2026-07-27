import { createContext, type RouterContextProvider } from 'react-router'
import { getAuthSession } from './auth.session.server'

/**
 * The access token that should be used for the remainder of THIS request.
 *
 * authMiddleware sets it after validating — and possibly refreshing — the
 * session. It exists because a refreshed token cannot reach loaders any other
 * way: loaders re-parse the session from the *incoming* request cookie, which
 * still carries the old token no matter what Set-Cookie the response will
 * eventually have.
 */
export const authTokenContext = createContext<{ token: string } | null>(null)

/**
 * Returns the access token a loader or action should send.
 *
 * Prefers the context value published by authMiddleware; falls back to the
 * session cookie for routes that run outside that middleware. The fallback is
 * what makes migrating call sites safe to do ahead of the middleware change —
 * before the middleware publishes anything, this returns exactly what the old
 * inline session read returned.
 */
export async function resolveAuthToken(
	request: Request,
	context: Readonly<RouterContextProvider>,
): Promise<string | undefined> {
	const fromContext = context.get(authTokenContext)
	if (fromContext?.token) return fromContext.token

	const session = await getAuthSession(request.headers.get('Cookie'))
	return session.get('authToken')
}
