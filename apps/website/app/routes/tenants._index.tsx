import type { Route } from './+types/tenants._index'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { TenantsPage } from '~/modules/tenants/page'

export async function loader({ request }: Route.LoaderArgs) {
	return { origin: getDomainUrl(request) }
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const url = getDisplayUrl({
		origin: loaderData.origin,
		path: location.pathname,
	})
	return getSocialMetas({
		url,
		origin: loaderData.origin,
		title: 'Pay Rent and Track Maintenance Online | Rentloop for Tenants',
		description:
			'Pay rent, submit maintenance requests and find your rental agreement in one app. For tenants renting.',
	})
}

export default TenantsPage
