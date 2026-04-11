import type { Route } from './+types/_auth._dashboard.settings.members.$memberId._index'
import { getClientUserPropertiesForServer } from '~/api/client-user-properties/server'
import { getClientUserForServer } from '~/api/client-users'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { EditMemberModule } from '~/modules'

export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	const clientId = safeString(authSession.get('selectedClientId'))
	const apiConfig = { baseUrl, authToken }

	try {
		const [member, memberProperties] = await Promise.all([
			getClientUserForServer(clientId, params.memberId, apiConfig),
			getClientUserPropertiesForServer(
				clientId,
				{
					filters: { client_user_id: params.memberId },
					pagination: { page: 1, per: 100 },
					populate: ['Property'],
				},
				apiConfig,
			),
		])

		if (!member) throw new Response(null, { status: 404 })

		return {
			origin: getDomainUrl(request),
			member,
			memberProperties: memberProperties?.rows ?? [],
		}
	} catch {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
	}
}

export const handle = {
	breadcrumb: 'Edit Member',
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: `Edit Member | ${safeString(loaderData?.member?.user?.name)}`,
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default EditMemberModule
