import type { Route } from './+types/_auth.properties.$propertyId.occupancy.applications.$applicationId'
import { getAdminPropertyTenantApplicationForServer } from '~/api/tenant-applications'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { PropertyTenantApplicationContainer } from '~/modules'

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const clientId = safeString(authSession.get('selectedClientId'))

	const clientUserProperty = context.get(propertyContext)

	try {
		const tenantApplication = await getAdminPropertyTenantApplicationForServer(
			clientId,
			{
				id: params.applicationId,
				property_id: params.propertyId,
				populate: [
					'DesiredUnit',
					'CreatedBy',
					'CreatedBy.User',
					'CompletedBy',
					'CancelledBy',
					'LeaseAgreementDocument',
					'LeaseAgreementDocumentSignatures',
					'LeaseAgreementDocumentSignatures.SignedBy',
					'LeaseAgreementDocumentSignatures.SignedBy.User',
					'ApplicationPaymentInvoice',
					'ApplicationPaymentInvoice.LineItems',
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
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export const handle = {
	breadcrumb: (data: Awaited<ReturnType<typeof loader>>) =>
		'tenantApplication' in data
			? data?.tenantApplication?.code
			: 'Lease Application',
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `#${loaderData?.tenantApplication?.code} Application | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({
			origin: safeString(loaderData?.origin),
			path: location?.pathname,
		}),
		origin: loaderData?.origin,
	})

	return meta
}

export default PropertyTenantApplicationContainer
