import type { Route } from './+types/_auth.properties.$propertyId.tenants.all.$tenantId'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { getPropertyTenantForServer } from '~/api/tenants/server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { TenantModule } from '~/modules'

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')

	const tenant = await getPropertyTenantForServer(
		{
			tenant_id: params.tenantId,
		},
		{
			authToken,
			baseUrl,
		},
	)

	return {
		origin: getDomainUrl(request),
		clientUserProperty,
		tenant
	}
}

export const handle = {
	breadcrumb: 'Domey Benjamin',
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Tenant Name | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default TenantModule
