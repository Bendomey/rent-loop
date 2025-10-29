import { redirect } from 'react-router'
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

	return {
		origin: getDomainUrl(request),
	}
}

export async function action({ request }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS

	const session = await getAuthSession(request.headers.get('Cookie'))

	const form = await request.formData()
	const email = form.get('email')
	const password = form.get('password')

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
		const loginResponse = await login({ email, password }, { baseUrl })
		if (!loginResponse) {
			throw new Error('Login failed')
		}

		session.set('authToken', loginResponse.token)

		// get the return_to param from the URL
		const url = new URL(request.url)
		const returnTo = url.searchParams.get('return_to') || '/'
		return redirect(returnTo, {
			headers: {
				'Set-Cookie': await saveAuthSession(session),
			},
		})
	} catch (e) {
		console.log(e)
		return {
			error: 'Failed to login. Please check your credentials and try again.',
		}
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

	return meta
}

export default LoginModule
