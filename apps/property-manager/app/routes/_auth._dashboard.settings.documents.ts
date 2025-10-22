import type { Route } from './+types/_auth._dashboard.settings.documents'
import { getDocumentTemplates } from '~/lib/actions/document-templates.server'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { DocumentsModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	const documentTemplates = getDocumentTemplates()
	return {
		origin: getDomainUrl(request),
		documentTemplates,
	}
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
