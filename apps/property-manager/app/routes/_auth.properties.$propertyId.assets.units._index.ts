import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId.assets.units._index'
import { getPropertyBlocksForServer } from '~/api/blocks/server'
import { getPropertyUnitsForServer } from '~/api/units/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { NOT_FOUND_ROUTE } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { PropertyAssetUnitsModule } from '~/modules'

export async function loader({ request, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	const property_id = safeString(clientUserProperty?.property?.id)

	if (clientUserProperty?.property?.type === 'SINGLE') {
		const units = await getPropertyUnitsForServer(
			{
				property_id: property_id,
				pagination: {
					per: 1,
					page: 1,
				},
				filters: {},
				sorter: {},
				populate: [],
				search: {},
			},
			{
				authToken,
				baseUrl,
			},
		)

		if (units?.rows?.length) {
			return redirect(
				`/properties/${clientUserProperty?.property?.id}/assets/units/${units.rows?.[0]?.id}`,
			)
		}
		return redirect(NOT_FOUND_ROUTE)
	}

	const blocks = await getPropertyBlocksForServer(
		{ property_id },
		{
			authToken,
			baseUrl,
		},
	)

	return {
		origin: getDomainUrl(request),
		clientUserProperty,
		blocks,
	}
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Units | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default PropertyAssetUnitsModule
