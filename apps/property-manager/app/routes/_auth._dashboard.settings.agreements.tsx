import type { Route } from './+types/_auth._dashboard.settings.agreements'
import { getAgreementsForServer } from '~/api/agreements'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { APP_NAME } from '~/lib/constants'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { AgreementsModule } from '~/modules/settings/agreements'

export async function loader({ request }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')

	const agreements = await getAgreementsForServer({ baseUrl, authToken })

	return {
		origin: getDomainUrl(request),
		agreements: agreements ?? [],
	}
}

export const handle = {
	breadcrumb: 'Agreements',
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: `Legal Agreements | ${APP_NAME}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default AgreementsModule
