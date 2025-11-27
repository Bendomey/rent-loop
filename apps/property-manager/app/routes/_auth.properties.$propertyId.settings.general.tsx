import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId.settings.general'
import { propertyContext } from '~/lib/actions/property.context.server'
import { NOT_FOUND_ROUTE } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { PropertyGeneralSettingsModule } from '~/modules'

export async function loader({ request, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)

	if (clientUserProperty?.role !== 'MANAGER') {
		return redirect(NOT_FOUND_ROUTE)
	}

	return {
		origin: getDomainUrl(request),
		clientUserProperty,
	}
}

export const handle = {
	breadcrumb: 'General',
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `General Settings | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default PropertyGeneralSettingsModule
