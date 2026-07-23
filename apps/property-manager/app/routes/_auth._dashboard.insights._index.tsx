import type { Route } from './+types/_auth._dashboard.insights._index'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { InsightsOverviewModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export const handle = {
	breadcrumb: 'Overview',
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default InsightsOverviewModule
