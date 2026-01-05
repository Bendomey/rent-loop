import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId.assets.blocks'
import { propertyContext } from '~/lib/actions/property.context.server'
import { NOT_FOUND_ROUTE } from '~/lib/constants'
import { getDomainUrl } from '~/lib/misc'

export const handle = {
	breadcrumb: 'Blocks',
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)

	if(clientUserProperty?.property?.type === 'SINGLE'){
		return redirect(NOT_FOUND_ROUTE)
	}

	return {
		origin: getDomainUrl(request),
		clientUserProperty,
	}
}