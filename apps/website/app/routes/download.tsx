import type { Route } from './+types/download'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { DownloadModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: 'Download the App | RentLoop',
		description:
			'Get the RentLoop mobile app for iOS and Android. Manage your properties, track rent, and stay connected with tenants — all from your phone.',
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default DownloadModule
