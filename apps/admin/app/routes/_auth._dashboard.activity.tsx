import type { Route } from './+types/_auth._dashboard.activity'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { ActivityModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return { origin: getDomainUrl(request) }
}

export const handle = {
	breadcrumb: 'Activity Log',
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
		title: 'Activity Log',
	})
}

export default ActivityModule
