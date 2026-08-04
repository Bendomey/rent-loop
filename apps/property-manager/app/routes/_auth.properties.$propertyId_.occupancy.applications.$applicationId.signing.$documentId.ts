import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId_.occupancy.applications.$applicationId.signing.$documentId'

export async function loader({ params }: Route.LoaderArgs) {
	return redirect(
		`/properties/${params.propertyId}/documents/${params.documentId}/signing?applicationId=${params.applicationId}`,
	)
}
