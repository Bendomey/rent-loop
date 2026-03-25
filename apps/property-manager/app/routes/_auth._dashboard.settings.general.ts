import type { Route } from './+types/_auth._dashboard.settings.general'
import { getCurrentUser } from '~/api/auth'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { GeneralSettingsModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')

	const currentUser = await getCurrentUser({ baseUrl, authToken })

	return {
		origin: getDomainUrl(request),
		currentUser,
	}
}

export const handle = {
	breadcrumb: 'General',
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `General Settings | ${APP_NAME}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default GeneralSettingsModule
