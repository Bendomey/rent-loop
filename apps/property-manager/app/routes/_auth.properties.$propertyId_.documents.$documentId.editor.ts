import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId_.documents.$documentId.editor'
import { getDocument } from '~/api/documents'
import { getLeaseAgreementDocumentForServer } from '~/api/lease-agreement-document/server'
import { getAdminPropertyTenantApplicationForServer } from '~/api/tenant-applications'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { DocumentEditorModule } from '~/modules'

export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	if (!authToken) return redirect('/login')

	const clientId = safeString(authSession.get('selectedClientId'))
	const url = new URL(request.url)
	const applicationId = url.searchParams.get('applicationId')
	const leaseId = url.searchParams.get('leaseId')
	const returnUrl = url.searchParams.get('returnUrl')

	try {
		const [document, tenantApplication, leaseAgreementDocument] =
			await Promise.all([
				getDocument(clientId, params.documentId, { authToken, baseUrl }),
				applicationId
					? getAdminPropertyTenantApplicationForServer(
							clientId,
							{
								id: applicationId,
								property_id: params.propertyId,
								populate: ['DesiredUnit', 'CreatedBy'],
							},
							{ baseUrl, authToken },
						)
					: Promise.resolve(null),
				leaseId
					? getLeaseAgreementDocumentForServer(
							clientId,
							params.propertyId,
							leaseId,
							{
								authToken,
								baseUrl,
							},
						).catch(() => null)
					: Promise.resolve(null),
			])

		return {
			origin: getDomainUrl(request),
			document,
			tenantApplication,
			leaseAgreementDocument: leaseAgreementDocument ?? null,
			leaseId,
			propertyId: params.propertyId,
			returnUrl,
		}
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const docTitle = loaderData?.document?.title ?? 'Document'
	return getSocialMetas({
		title: `Edit ${docTitle}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default DocumentEditorModule
