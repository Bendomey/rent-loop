import { data } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertySlug.settings.documents'
import {
	getAuthSession,
	saveAuthSession,
} from '~/lib/actions/auth.session.server'
import { getDocumentTemplates } from '~/lib/actions/document-templates.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { PropertyDocumentsSettingsModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	const documentTemplates = getDocumentTemplates()
	const authSession = await getAuthSession(request.headers.get('Cookie'))

	const error = authSession.get('error')

	return data(
		{
			origin: getDomainUrl(request),
			error,
			documentTemplates,
		},
		{
			headers: {
				'Set-Cookie': await saveAuthSession(authSession),
			},
		},
	)
}

export const handle = {
	breadcrumb: 'Manage Documents',
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Manage Documents | ${params.propertySlug}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default PropertyDocumentsSettingsModule
