import type { Route } from './+types/_auth._dashboard.activities.announcements.new._index'
import { getAnnouncementForServer } from '~/api/announcements/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { resolveAuthToken } from '~/lib/actions/auth.token.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { NewAnnouncementModule } from '~/modules'

export const handle = {
	breadcrumb: 'New',
}

export async function loader({ request, context }: Route.LoaderArgs) {
	const origin = getDomainUrl(request)
	const sourceId = new URL(request.url).searchParams.get('announcement_id')

	if (!sourceId) return { origin, sourceAnnouncement: null }

	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = await resolveAuthToken(request, context)
	const clientId = safeString(authSession.get('selectedClientId'))

	try {
		const sourceAnnouncement = await getAnnouncementForServer(
			clientId,
			sourceId,
			{
				authToken,
				baseUrl,
			},
		)
		return { origin, sourceAnnouncement: sourceAnnouncement ?? null }
	} catch {
		return { origin, sourceAnnouncement: null }
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: 'New Announcement',
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
	})
}

export default NewAnnouncementModule
