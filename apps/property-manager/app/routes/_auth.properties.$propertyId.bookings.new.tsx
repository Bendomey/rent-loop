import type { Route } from './+types/_auth.properties.$propertyId.bookings.new'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDomainUrl } from '~/lib/misc'
import { NewBookingModule } from '~/modules'

export async function loader({ request, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)
	return { origin: getDomainUrl(request), clientUserProperty }
}

export const handle = { breadcrumb: 'New Booking' }

export default NewBookingModule
