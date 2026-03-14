import type { Route } from './+types/_auth._dashboard.activities.announcements.new._index'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { NewAnnouncementModule } from '~/modules'

export const handle = {
	breadcrumb: 'New',
}

export function loader({ request }: Route.LoaderArgs) {
	return { origin: getDomainUrl(request) }
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: 'New Announcement',
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
	})
}

export default NewAnnouncementModule
