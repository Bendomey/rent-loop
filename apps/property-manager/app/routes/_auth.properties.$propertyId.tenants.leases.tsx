import type { Route } from './+types/_auth.properties.$propertyId.tenants.leases'
import { propertyContext } from '~/lib/actions/property.context.server'

export const handle = {
	breadcrumb: 'Leases',
}

export async function loader({ context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)

	// confirm property has lease mode enabled
	if (!clientUserProperty?.property?.modes?.includes('LEASE')) {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}
