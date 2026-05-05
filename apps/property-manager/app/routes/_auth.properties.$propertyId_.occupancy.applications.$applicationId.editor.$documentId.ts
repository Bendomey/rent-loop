import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId_.occupancy.applications.$applicationId.editor.$documentId'
import { getDocument } from '~/api/documents'
import { getAdminPropertyTenantApplicationForServer } from '~/api/tenant-applications'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { LeaseDocumentModule } from '~/modules/properties/property/occupancy/applications/application/docs/lease-editor'

export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	if (!authToken) {
		return redirect('/login')
	}

	const clientId = safeString(authSession.get('selectedClientId'))

	try {
		const [document, tenantApplication] = await Promise.all([
			getDocument(clientId, params.documentId, { authToken, baseUrl }),
			getAdminPropertyTenantApplicationForServer(
				clientId,
				{
					id: params.applicationId,
					property_id: params.propertyId,
					populate: ['DesiredUnit', 'CreatedBy'],
				},
				{ baseUrl, authToken },
			),
		])

		return {
			origin: getDomainUrl(request),
			document,
			tenantApplication,
		}
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const docTitle = loaderData?.document?.title ?? 'Lease Document'
	const appCode = loaderData?.tenantApplication?.code

	return getSocialMetas({
		title: `Edit ${docTitle}${appCode ? ` | #${appCode}` : ''}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default LeaseDocumentModule
