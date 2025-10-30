import { data, redirect } from 'react-router'
import type { Route } from './+types/forgot-your-password'
import { sendForgotPasswordLink } from '~/api/auth'
import {
	getAuthSession,
	saveAuthSession,
} from '~/lib/actions/auth.session.server'

import { environmentVariables } from '~/lib/actions/env.server'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { ForgotYourPasswordModule } from '~/modules'

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

	if (!email || typeof email !== 'string') {
		return {
			formError: 'Email is required fields.',
		}
	}

	try {
		const response = await sendForgotPasswordLink({ email }, { baseUrl })
		if (!response) {
			throw new Error('Forgot Password init failed')
		}

		session.flash('success', 'Reset password link sent successfully.')
		return redirect('/login', {
			headers: {
				'Set-Cookie': await saveAuthSession(session),
			},
		})
	} catch {
		session.flash('error', 'Failed to send reset password link.')
		return data(
			{
				origin: getDomainUrl(request),
			},
			{
				headers: {
					'Set-Cookie': await saveAuthSession(session),
				},
			},
		)
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Forgot Your Password? - ${APP_NAME}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default ForgotYourPasswordModule
