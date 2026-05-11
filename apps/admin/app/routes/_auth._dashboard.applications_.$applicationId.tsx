import type { Route } from './+types/_auth._dashboard.applications_.$applicationId'
import { getClientApplicationByIdForServer } from '~/api/client-applications/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { ApplicationDetailModule } from '~/modules'

export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')

	try {
		const application = await getClientApplicationByIdForServer(
			params.applicationId,
			{ baseUrl, authToken },
		)
		return { origin: getDomainUrl(request), application }
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export const handle = {
	breadcrumb: (data: Awaited<ReturnType<typeof loader>>) =>
		data?.application?.name ?? 'Application',
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
		title: loaderData.application?.name ?? 'Application',
	})
}

export default ApplicationDetailModule
