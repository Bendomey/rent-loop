import type { Route } from './+types/_auth._dashboard.activities.announcements.$announcementId._index'
import { getAnnouncementForServer } from '~/api/announcements/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { AnnouncementDetailModule } from '~/modules'

export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')

	try {
		const announcement = await getAnnouncementForServer(params.announcementId, {
			authToken,
			baseUrl,
		})
		return {
			origin: getDomainUrl(request),
			announcement,
		}
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export const handle = {
	breadcrumb: (data: Awaited<ReturnType<typeof loader>>) =>
		data?.announcement?.title ?? 'Announcement',
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: loaderData?.announcement?.title ?? 'Announcement',
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
	})
}

export default AnnouncementDetailModule
