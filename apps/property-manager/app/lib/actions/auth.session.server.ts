import { createCookieSessionStorage } from 'react-router'
import { USER_CIPHER } from '../constants'
import { environmentVariables } from './env.server'

type SessionData = {
	authToken: string
}

type SessionFlashData = {
	error: string
}

const isProduction = environmentVariables().NODE_ENV === 'production'

const {
	getSession: getAuthSession,
	commitSession: saveAuthSession,
	destroySession: deleteAuthSession,
} = createCookieSessionStorage<SessionData, SessionFlashData>({
	// a Cookie from `createCookie` or the CookieOptions to create one
	cookie: {
		name: USER_CIPHER,

		// all of these are optional
		// Expires can also be set (although maxAge overrides it when used in combination).
		// Note that this method is NOT recommended as `new Date` creates only one date on each server deployment, not a dynamic date in the future!
		//
		// expires: new Date(Date.now() + 60_000),
		httpOnly: true,
		path: '/',
		sameSite: 'lax',
		secrets: ['s3cret1'], // TODO: use env var
		secure: isProduction,
	},
})

export { getAuthSession, saveAuthSession, deleteAuthSession }
