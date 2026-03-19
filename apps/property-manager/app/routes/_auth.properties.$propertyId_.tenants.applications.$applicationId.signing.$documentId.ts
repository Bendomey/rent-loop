import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId_.tenants.applications.$applicationId.signing.$documentId'
import { getAdminPropertyTenantApplicationForServer } from '~/api/tenant-applications'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { LeaseSigningModule } from '~/modules/properties/property/tenants/applications/application/docs/lease-signing'

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	if (!authToken) {
		return redirect('/login')
	}

	const clientUserProperty = context.get(propertyContext)

	try {
		const tenantApplication = await getAdminPropertyTenantApplicationForServer(
			{
				id: params.applicationId,
				property_id: params.propertyId,
				populate: [
					'DesiredUnit',
					'CreatedBy',
					'LeaseAgreementDocumentSignatures',
					'LeaseAgreementDocument',
				],
			},
			{ baseUrl, authToken },
		)

		return {
			origin: getDomainUrl(request),
			document: tenantApplication?.lease_agreement_document,
			tenantApplication,
			clientUserProperty,
		}
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const docTitle = loaderData?.document?.title ?? 'Lease Document'
	const appCode = loaderData?.tenantApplication?.code

	return getSocialMetas({
		title: `Sign ${docTitle}${appCode ? ` | #${appCode}` : ''}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default LeaseSigningModule
