import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId.assets._index'

export async function loader({ params }: Route.LoaderArgs) {
	return redirect(`/properties/${params.propertyId}/assets/units`)
}
