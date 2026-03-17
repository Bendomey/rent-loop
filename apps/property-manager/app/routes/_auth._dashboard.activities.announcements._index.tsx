import type { Route } from './+types/_auth._dashboard.activities.announcements._index'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { AnnouncementsModule } from '~/modules'

export function loader({ request }: Route.LoaderArgs) {
	return { origin: getDomainUrl(request) }
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: `Announcements - ${APP_NAME}`,
		description: 'Broadcast messages to tenants across your properties.',
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
	})
}

export default AnnouncementsModule
