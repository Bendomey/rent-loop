import type { Route } from './+types/pricing'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { PricingModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: 'Pricing | RentLoop',
		description:
			'Simple, transparent pricing for property managers. Start free with up to 5 units. Scale as you grow with plans from GH₵ 8–10 per unit per month.',
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default PricingModule
