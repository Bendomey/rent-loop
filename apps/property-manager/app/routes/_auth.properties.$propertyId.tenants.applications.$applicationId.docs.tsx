import type { Route } from './+types/_auth.properties.$propertyId.tenants.applications.$applicationId.docs'
import { getDocumentTemplates } from '~/lib/actions/document-templates.server'
import { PropertyTenantApplicationDocs } from '~/modules'

export const handle = {
	breadcrumb: 'Docs Setup',
}

export async function loader({}: Route.LoaderArgs) {
	const documentTemplates = getDocumentTemplates()
	return { documentTemplates }
}

export default PropertyTenantApplicationDocs
