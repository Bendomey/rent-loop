import { redirect } from 'react-router'
import { type Route } from './+types/login'

import { getAuthSession, saveAuthSession } from '~/lib/actions/session.server'
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
	const session = await getAuthSession(request.headers.get('Cookie'))

	const form = await request.formData()
	const email = form.get('email')
	const password = form.get('password')

	// TODO: make api call to validate user credentials.

	// get the return_to param from the URL
	const url = new URL(request.url)
	const returnTo = url.searchParams.get('return_to') || '/'

	session.set('authToken', `${email}${password}`)

	return redirect(returnTo, {
		headers: {
			'Set-Cookie': await saveAuthSession(session),
		},
	})
}

export function meta({ loaderData }: Route.MetaArgs) {
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
