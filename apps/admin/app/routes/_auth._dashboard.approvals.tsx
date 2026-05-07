import type { Route } from './+types/_auth._dashboard.approvals'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { ApprovalsModule } from '~/modules'

export const handle = {
	breadcrumb: 'Approvals',
}

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
		title: 'Approvals',
	})
}

export default ApprovalsModule
