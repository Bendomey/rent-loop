import type { Route } from './+types/_auth.properties.$propertyId.bookings.availability'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { AvailabilityModule } from '~/modules'

export async function loader({ request, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)
	return { origin: getDomainUrl(request), clientUserProperty }
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	return getSocialMetas({
		title: `Availability | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
	})
}

export const handle = { breadcrumb: 'Availability' }

export default AvailabilityModule
