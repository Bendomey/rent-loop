import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId.financials._index'

export async function loader({ params }: Route.LoaderArgs) {
	return redirect(`/properties/${params.propertyId}/financials/rent-payments`)
}
