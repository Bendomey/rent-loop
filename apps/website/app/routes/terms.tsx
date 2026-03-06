import type { Route } from './+types/terms'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { TermsOfUse } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const url = getDisplayUrl({
		origin: loaderData.origin,
		path: location.pathname,
	})

	return getSocialMetas({
		url,
		origin: loaderData.origin,
		title: 'Terms of Use — RentLoop',
		description:
			'RentLoop Terms of Use — the rules and guidelines for using our platform.',
	})
}

export default TermsOfUse
