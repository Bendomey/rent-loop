import type { Route } from './+types/_auth.properties.$propertyId.activities.maintenance-requests.$requestId'
import { getMaintenanceRequestForServer } from '~/api/maintenance-requests/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { MaintenanceRequestDetailModule } from '~/modules'

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')

	const mr = await getMaintenanceRequestForServer(
		{ request_id: params.requestId },
		{ authToken, baseUrl },
	)

	return {
		origin: getDomainUrl(request),
		clientUserProperty,
		mr,
	}
}

export const handle = {
	breadcrumb: (data: Awaited<ReturnType<typeof loader>>) =>
		data?.mr?.code ?? 'Request',
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	return getSocialMetas({
		title: `${loaderData?.mr?.code ?? 'Request'} | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default MaintenanceRequestDetailModule
