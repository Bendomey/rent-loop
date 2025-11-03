import { data } from 'react-router'
import type { Route } from './+types/_auth._dashboard.settings.documents'
import {
	getAuthSession,
	saveAuthSession,
} from '~/lib/actions/auth.session.server'
import { getDocumentTemplates } from '~/lib/actions/document-templates.server'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { DocumentsModule } from '~/modules'

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
	breadcrumb: 'Documents',
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Manage Documents | ${APP_NAME}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default DocumentsModule
