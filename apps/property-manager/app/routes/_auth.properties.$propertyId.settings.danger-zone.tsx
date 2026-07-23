import type { Route } from './+types/_auth.properties.$propertyId.settings.danger-zone'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { PropertyDangerZoneModule } from '~/modules'

export async function loader({ request, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)

	if (clientUserProperty?.role !== 'MANAGER') {
		throw new Response(null, { status: 403, statusText: 'Unauthorized' })
	}

	return {
		origin: getDomainUrl(request),
		clientUserProperty,
	}
}

export const handle = {
	breadcrumb: 'Danger Zone',
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Danger Zone | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default PropertyDangerZoneModule
