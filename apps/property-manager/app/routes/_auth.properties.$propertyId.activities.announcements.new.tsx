import type { Route } from './+types/_auth.properties.$propertyId.activities.announcements.new'
import { getPropertyAnnouncementForServer } from '~/api/announcements/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { NewPropertyAnnouncementModule } from '~/modules'

export const handle = {
	breadcrumb: 'New Announcement',
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: 'New Announcement',
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
	})
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
	const clientUserProperty = context.get(propertyContext)
	if (clientUserProperty?.role !== 'MANAGER') {
		throw new Response(null, { status: 403, statusText: 'Unauthorized' })
	}

	const origin = getDomainUrl(request)
	const sourceId = new URL(request.url).searchParams.get('announcement_id')

	if (!sourceId) return { origin, sourceAnnouncement: null }

	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	const clientId = safeString(authSession.get('selectedClientId'))

	try {
		const sourceAnnouncement = await getPropertyAnnouncementForServer(
			clientId,
			params.propertyId,
			sourceId,
			{ authToken, baseUrl },
		)
		return { origin, sourceAnnouncement: sourceAnnouncement ?? null }
	} catch {
		return { origin, sourceAnnouncement: null }
	}
}

export default NewPropertyAnnouncementModule
