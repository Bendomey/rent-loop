import type { Route } from './+types/managers'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { ManagersPage } from '~/modules/managers'

export async function loader({ request }: Route.LoaderArgs) {
	return { origin: getDomainUrl(request) }
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const url = getDisplayUrl({ origin: loaderData.origin, path: location.pathname })
	return getSocialMetas({
		url,
		origin: loaderData.origin,
		title: 'Rentloop for Property Managers — Run your rentals like you mean it.',
		description: 'Leases, rent, maintenance, applications — all in one place. The dashboard that does the chasing so you don\'t have to.',
	})
}

export default ManagersPage
