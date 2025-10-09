import { type Route } from './+types/_index'
import { authMiddleware } from '~/lib/actions/auth.middleware.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { DashboardModule } from '~/modules'

export const middleware = [authMiddleware]

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export function meta({ loaderData }: Route.MetaArgs) {
	const meta = getSocialMetas({
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default DashboardModule
