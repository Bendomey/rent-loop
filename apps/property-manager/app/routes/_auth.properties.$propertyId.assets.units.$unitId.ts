import type { Route } from './+types/_auth.properties.$propertyId.assets.units.$unitId'
import { getPropertyUnitForServer } from '~/api/units/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { PropertyAssetUnitModule } from '~/modules/properties/property/assets/units/unit'

export const handle = {
	breadcrumb: 'View Unit',
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')

	const unit = await getPropertyUnitForServer(
		{
			property_id: params.propertyId,
			unit_id: params.unitId,
			populate: ['Property', 'PropertyBlock'],
		},
		{
			authToken,
			baseUrl,
		},
	)

	return {
		origin: getDomainUrl(request),
		unit,
		clientUserProperty,
	}
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `${loaderData?.unit?.name} | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default PropertyAssetUnitModule
