import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId_.occupancy.applications.$applicationId.editor.$documentId'

export async function loader({ params }: Route.LoaderArgs) {
	const returnUrl = encodeURIComponent(
		`/properties/${params.propertyId}/occupancy/applications/${params.applicationId}/docs`,
	)
	return redirect(
		`/properties/${params.propertyId}/documents/${params.documentId}/editor?applicationId=${params.applicationId}&returnUrl=${returnUrl}`,
	)
}
