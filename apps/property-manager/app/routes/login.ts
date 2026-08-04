import { data, redirect } from 'react-router'
import type { Route } from './+types/login'

import { login } from '~/api/auth'
import {
	getAuthSession,
	saveAuthSession,
} from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { LoginModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	const authSession = await getAuthSession(request.headers.get('Cookie'))

	if (authSession.has('authToken')) {
		return redirect('/')
	}

	const error = authSession.get('error')
	const success = authSession.get('success')

	return data(
		{
			origin: getDomainUrl(request),
			error,
			success,
			rentLoopWebsiteUrl: environmentVariables().RENTLOOP_WEBSITE_URL,
		},
		{
			headers: {
				'Set-Cookie': await saveAuthSession(authSession),
			},
		},
	)
}

export async function action({ request }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS

	const session = await getAuthSession(request.headers.get('Cookie'))

	const form = await request.formData()
	const email = form.get('email')
	const password = form.get('password')

	// Client-supplied and cosmetic: if it is missing or unparseable we log in
	// anyway and simply store no metadata. Never let it fail a login.
	let deviceMetadata: unknown
	const rawMetadata = form.get('device_metadata')
	if (typeof rawMetadata === 'string' && rawMetadata.length) {
		try {
			deviceMetadata = JSON.parse(rawMetadata)
		} catch {
			deviceMetadata = undefined
		}
	}

	if (
		!email ||
		!password ||
		typeof email !== 'string' ||
		typeof password !== 'string'
	) {
		return {
			formError: 'Email and password are required fields.',
		}
	}

	try {
		// Pass the browser's identity through to the backend. X-Forwarded-For is
		// only present in front of a proxy (Fly in production); locally it is
		// absent and the backend falls back to the connection address.
		const forwardedHeaders: Record<string, string> = {}
		const browserUserAgent = request.headers.get('User-Agent')
		if (browserUserAgent) forwardedHeaders['User-Agent'] = browserUserAgent
		const forwardedFor = request.headers.get('X-Forwarded-For')
		if (forwardedFor) forwardedHeaders['X-Forwarded-For'] = forwardedFor

		const loginResponse = await login(
			{ email, password, metadata: deviceMetadata },
			{ baseUrl, forwardedHeaders },
		)
		if (!loginResponse) {
			throw new Error('Login failed')
		}

		session.set('authToken', loginResponse.token)
		session.set('refreshToken', loginResponse.refresh_token)

		// Check how many clients the user has
		const clientUsers = loginResponse.user.client_users ?? []

		if (clientUsers.length === 1) {
			const clientUser = clientUsers[0]
			if (clientUser?.client_id) {
				// Auto-select the single client
				session.set('selectedClientId', clientUser.client_id)
				const url = new URL(request.url)
				const returnTo = url.searchParams.get('return_to') || '/'
				return redirect(returnTo, {
					headers: { 'Set-Cookie': await saveAuthSession(session) },
				})
			}
		}

		// Multiple clients (or zero) → go to picker, preserving return_to
		const url = new URL(request.url)
		const returnTo = url.searchParams.get('return_to')
		const pickerUrl = returnTo
			? `/select-client?return_to=${encodeURIComponent(returnTo)}`
			: '/select-client'
		return redirect(pickerUrl, {
			headers: { 'Set-Cookie': await saveAuthSession(session) },
		})
	} catch {
		session.flash(
			'error',
			'Failed to login. Please check your credentials and try again.',
		)
		return data(undefined, {
			headers: {
				'Set-Cookie': await saveAuthSession(session),
			},
		})
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Login - ${APP_NAME}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return [...meta, { name: 'robots', content: 'noindex, nofollow' }]
}

export default LoginModule
