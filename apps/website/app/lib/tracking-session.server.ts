import { createCookieSessionStorage } from 'react-router'
import { environmentVariables } from './actions/env.server'

type TrackingSessionData = {
	verified_code: string
}

type TrackingSessionFlashData = {
	error: string
}

function getStorage(code: string) {
	const env = environmentVariables()
	const isProduction = env.NODE_ENV === 'production'
	return createCookieSessionStorage<
		TrackingSessionData,
		TrackingSessionFlashData
	>({
		cookie: {
			name: `rl_tracking_${code}`,
			httpOnly: true,
			path: '/',
			sameSite: 'lax',
			secrets: [env.TRACKING_COOKIE_SECRET],
			secure: isProduction,
			maxAge: 60 * 60 * 24, // 24 hours
		},
	})
}

export function getTrackingSession(request: Request, code: string) {
	const { getSession } = getStorage(code)
	return getSession(request.headers.get('Cookie'))
}

export function commitTrackingSession(
	session: Awaited<ReturnType<typeof getTrackingSession>>,
	code: string,
) {
	const { commitSession } = getStorage(code)
	return commitSession(session)
}

export function destroyTrackingSession(
	session: Awaited<ReturnType<typeof getTrackingSession>>,
	code: string,
) {
	const { destroySession } = getStorage(code)
	return destroySession(session)
}
