import type { Route } from './+types/_auth.properties.$propertyId.tenants.applications.$applicationId'
import { getPropertyTenantApplicationForServer } from '~/api/tenant-applications'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { PropertyTenantApplicationContainer } from '~/modules'

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))

	const clientUserProperty = context.get(propertyContext)

	const tenantApplication = await getPropertyTenantApplicationForServer(
		{
			id: params.applicationId,
			populate: [
				'DesiredUnit',
				'CreatedBy',
				'CompletedBy',
				'CancelledBy',
				'LeaseAgreementDocument',
				'LeaseAgreementDocumentSignatures',
			],
		},
		{
			baseUrl,
			authToken: authSession.get('authToken'),
		},
	)

	return {
		origin: getDomainUrl(request),
		clientUserProperty,
		tenantApplication,
	}
}

export const handle = {
	breadcrumb: (data: Awaited<ReturnType<typeof loader>>) =>
		data?.tenantApplication?.code ?? 'Tenant Application',
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `#${loaderData.tenantApplication?.code} Application | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default PropertyTenantApplicationContainer
