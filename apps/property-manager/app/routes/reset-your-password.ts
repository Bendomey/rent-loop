import { data, redirect } from 'react-router'
import type { Route } from './+types/login'
import { resetPassword } from '~/api/auth'
import {
	getAuthSession,
	saveAuthSession,
} from '~/lib/actions/auth.session.server'

import { environmentVariables } from '~/lib/actions/env.server'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { ResetYourPasswordModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	if (authSession.has('authToken')) {
		return redirect('/')
	}

	const url = new URL(request.url)
	const token = url.searchParams.get('token')
	if (!token) {
		return redirect('/forgot-your-password')
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
	const newPassword = form.get('password')
	const token = form.get('token')

	if (
		!newPassword ||
		!token ||
		typeof newPassword !== 'string' ||
		typeof token !== 'string'
	) {
		return {
			formError: 'Password and token are required fields.',
		}
	}

	try {
		await resetPassword({ newPassword }, { baseUrl, authToken: token })

		session.flash('success', 'Password has been reset successfully.')
		return redirect('/login', {
			headers: {
				'Set-Cookie': await saveAuthSession(session),
			},
		})
	} catch {
		session.flash('error', 'Failed to send reset password, Try again.')
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
		title: `Reset Your Password - ${APP_NAME}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default ResetYourPasswordModule
