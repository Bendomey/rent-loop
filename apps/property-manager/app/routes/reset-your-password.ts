import { data, redirect } from 'react-router'
import type { Route } from './+types/login'
import { getAuthSession, saveAuthSession } from '~/lib/actions/auth.session.server'

import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { ResetYourPasswordModule } from '~/modules'

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
