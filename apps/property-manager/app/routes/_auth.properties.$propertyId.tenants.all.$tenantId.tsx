import type { Route } from './+types/_auth.properties.$propertyId.tenants.all.$tenantId'
import { getPropertyTenantForServer } from '~/api/tenants/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
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

	try {
		const tenant = await getPropertyTenantForServer(
			{
				tenant_id: params.tenantId,
				property_id: params.propertyId,
			},
			{
				authToken,
				baseUrl,
			},
		)

		return {
			origin: getDomainUrl(request),
			clientUserProperty,
			tenant,
		}
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export const handle = {
	breadcrumb: (data: Awaited<ReturnType<typeof loader>>) =>
		data?.tenant?.last_name ?? 'Tenant',
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `${loaderData?.tenant?.last_name ?? 'Tenant'} | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default TenantModule
