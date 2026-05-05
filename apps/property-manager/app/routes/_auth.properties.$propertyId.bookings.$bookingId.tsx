import type { Route } from './+types/_auth.properties.$propertyId.bookings.$bookingId'
import { getBookingForServer } from '~/api/bookings/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { BookingDetailModule } from '~/modules'

export async function loader({ request, context, params }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	const clientId = safeString(authSession.get('selectedClientId'))

	try {
		const booking = await getBookingForServer(
			clientId,
			safeString(clientUserProperty?.property_id),
			params.bookingId,
			{
				authToken,
				baseUrl,
			},
		)
		return { origin: getDomainUrl(request), clientUserProperty, booking }
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export const handle = {
	breadcrumb: (data: Awaited<ReturnType<typeof loader>>) =>
		data?.booking?.code ?? 'Booking',
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
	return getSocialMetas({
		title: `${loaderData?.booking?.code ?? 'Booking'} | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
	})
}

export default BookingDetailModule
