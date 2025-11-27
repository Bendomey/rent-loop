import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId.settings._index'
import { propertyContext } from '~/lib/actions/property.context.server'

export async function loader({ params, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)
	if (clientUserProperty?.role === 'MANAGER') {
		return redirect(`/properties/${params.propertyId}/settings/general`)
	}

	return redirect(`/properties/${params.propertyId}/settings/my-account`)
}
