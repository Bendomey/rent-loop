import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertySlug.settings._index'

export async function loader({ params }: Route.LoaderArgs) {
	return redirect(`/properties/${params.propertySlug}/settings/general`)
}
