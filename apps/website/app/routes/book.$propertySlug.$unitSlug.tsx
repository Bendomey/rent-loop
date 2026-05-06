import type { Route } from './+types/book.$propertySlug.$unitSlug'
import { getUnitForBookingPageServer } from '~/api/bookings/server'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { BookModule } from '~/modules'

export async function loader({ params, request }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	try {
		const unit = await getUnitForBookingPageServer(
			params.propertySlug,
			params.unitSlug,
			{ baseUrl },
		)

		if (unit?.status === 'Unit.Status.Unavailable') {
			throw new Response(null, { status: 404, statusText: 'Not Found' })
		}

		return { unit, origin: getDomainUrl(request) }
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: `Book ${loaderData.unit.name}${loaderData.unit.property?.name ? ` at ${loaderData.unit.property.name}` : ''}`,
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
		images: loaderData.unit.images?.map((img) => img) ?? [],
		description: `Book ${loaderData.unit.name} for your next stay${loaderData.unit.property?.name ? ` at ${loaderData.unit.property.name}` : ''}. Check availability and make a reservation online today!`,
		keywords: [
			loaderData.unit.name,
			loaderData.unit.property?.name ?? 'rentals',
			'booking',
			'reservation',
		].join(', '),
	})
}

export default function BookingPage({ loaderData }: Route.ComponentProps) {
	return <BookModule unit={loaderData.unit} />
}
