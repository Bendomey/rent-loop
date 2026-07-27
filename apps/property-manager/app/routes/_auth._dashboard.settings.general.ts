import type { Route } from './+types/_auth._dashboard.settings.general'
import { getCurrentUser } from '~/api/auth'
import { resolveAuthToken } from '~/lib/actions/auth.token.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { GeneralSettingsModule } from '~/modules'

export async function loader({ request, context }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authToken = await resolveAuthToken(request, context)

	const currentUser = await getCurrentUser({ baseUrl, authToken })
	if (!currentUser.ok) {
		throw new Response(null, { status: currentUser.status ?? 500 })
	}

	return {
		origin: getDomainUrl(request),
		currentUser: currentUser.user,
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
