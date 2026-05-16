import type { Route } from './+types/tenants._index'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { TenantsPage } from '~/modules/tenants/page'

export async function loader({ request }: Route.LoaderArgs) {
	return { origin: getDomainUrl(request) }
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const url = getDisplayUrl({ origin: loaderData.origin, path: location.pathname })
	return getSocialMetas({
		url,
		origin: loaderData.origin,
		title: 'Rentloop for Tenants — Your lease, in your pocket.',
		description: 'Pay rent, submit maintenance, find your paperwork — all in the app your landlord gave you. Free for tenants.',
	})
}

export default TenantsPage
