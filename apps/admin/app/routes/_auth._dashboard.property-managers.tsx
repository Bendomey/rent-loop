import type { Route } from './+types/_auth._dashboard.property-managers'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { PropertyManagersModule } from '~/modules'

export const handle = {
	breadcrumb: 'Property Managers',
}

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
		title: 'Property Managers',
	})
}

export default PropertyManagersModule