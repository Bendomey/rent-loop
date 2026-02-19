import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId_.tenants.applications.$applicationId.lease-editor.$documentId'
import { getDocument } from '~/api/documents'
import { getPropertyTenantApplicationForServer } from '~/api/tenant-applications'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { NOT_FOUND_ROUTE } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { LeaseDocumentModule } from '~/modules/properties/property/tenants/applications/application/docs/lease-editor'

export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	if (!authToken) {
		return redirect('/login')
	}

	try {
		const [document, tenantApplication] = await Promise.all([
			getDocument(params.documentId, { authToken, baseUrl }),
			getPropertyTenantApplicationForServer(
				{
					id: params.applicationId,
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
		return redirect(NOT_FOUND_ROUTE)
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
