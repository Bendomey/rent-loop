import type { Route } from './+types/_auth._dashboard.settings.customer-support-access._index'
import { linkClientUserPropertyForServer } from '~/api/client-user-properties/server'
import { createClientUser } from '~/api/client-users/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { CUSTOMER_SUPPORT_ACCOUNT } from '~/lib/constants'
import { getErrorMessage } from '~/lib/error-messages'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { CustomerSupportAccessModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export const handle = {
	breadcrumb: 'Customer Support Access',
}

export async function action({ request }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const clientId = safeString(authSession.get('selectedClientId'))
	const apiConfig = { baseUrl, authToken: authSession.get('authToken') }

	const formData = await request.formData()
	const existingMemberId = formData.get('existing_member_id') as string
	const propertyIdsRaw = formData.get('property_ids') as string
	const propertyIds: string[] = propertyIdsRaw ? JSON.parse(propertyIdsRaw) : []

	try {
		let memberId = existingMemberId

		if (existingMemberId) {
			// For now, we've not implemented activate/suspend client user functionality,
			// so we won't be activating the existing member.
			// If we implement that in the future, we can uncomment the line below to activate the existing member.
			// await activateClientUserForServer(clientId, existingMemberId, apiConfig)
		} else {
			const member = await createClientUser(
				clientId,
				{
					name: CUSTOMER_SUPPORT_ACCOUNT.NAME,
					email: CUSTOMER_SUPPORT_ACCOUNT.EMAIL,
					phone: CUSTOMER_SUPPORT_ACCOUNT.PHONE,
					role: 'STAFF',
				},
				apiConfig,
			)

			if (!member) {
				throw new Error('Failed to grant access')
			}

			memberId = member.id
		}

		if (propertyIds.length > 0) {
			await Promise.all(
				propertyIds.map((propertyId) =>
					linkClientUserPropertyForServer(
						clientId,
						{
							property_id: propertyId,
							role: 'MANAGER',
							client_user_ids: [memberId],
						},
						apiConfig,
					),
				),
			)
		}

		return { success: true }
	} catch (e) {
		if (e instanceof Error) {
			return { error: getErrorMessage(e.message, 'Failed to grant access') }
		}

		return { error: 'Failed to grant access' }
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		title: 'Customer Support Access',
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default CustomerSupportAccessModule
