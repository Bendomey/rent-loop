import type { Route } from './+types/_auth.properties.$propertyId.assets.blocks'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDomainUrl } from '~/lib/misc'

export const handle = {
	breadcrumb: 'Blocks',
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)

	if (clientUserProperty?.property?.type === 'SINGLE') {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}

	return {
		origin: getDomainUrl(request),
		clientUserProperty,
	}
}
