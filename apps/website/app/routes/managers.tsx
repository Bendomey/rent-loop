import type { Route } from './+types/managers'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { ManagersPage } from '~/modules/managers'

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
		title: 'Property Management Software for Landlords | Rentloop',
		description:
			'Rent collection, tenant management, maintenance tracking and rental agreements in one dashboard. Built for property managers and landlords.',
	})
}

export default ManagersPage
