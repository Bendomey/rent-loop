import type { Route } from './+types/_auth.properties.$propertyId.occupancy.bookings'
import { propertyContext } from '~/lib/actions/property.context.server'

export async function loader({ context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)

	// confirm property has booking mode enabled
	if (!clientUserProperty?.property?.modes?.includes('BOOKING')) {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export const handle = { breadcrumb: 'Bookings' }
