import type { Route } from './+types/bookings.track.$trackingCode'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { BookTrackModule } from '~/modules'

export function loader({ request }: Route.LoaderArgs) {
	return { origin: getDomainUrl(request) }
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: 'Track Your Booking',
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
	})
}

export default function BookingTrackPage({ params }: Route.ComponentProps) {
	return <BookTrackModule trackingCode={params.trackingCode} />
}
