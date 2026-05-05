import type { Route } from './+types/_auth.properties.$propertyId.occupancy.leases.bulk-onboard'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { BulkOnboardModule } from '~/modules'

export const handle = { breadcrumb: 'Onboard Existing Tenants' }

export async function loader({ request, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)
	return {
		origin: getDomainUrl(request),
		clientUserProperty,
	}
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	return getSocialMetas({
		title: `Onboard Existing Tenants | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
	})
}

export default BulkOnboardModule
