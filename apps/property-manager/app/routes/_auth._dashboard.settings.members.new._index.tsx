import { redirect } from 'react-router'
import type { Route } from './+types/_auth._dashboard.settings.members.new._index'
import { linkClientUserPropertyForServer } from '~/api/client-user-properties/server'
import { createClientUser } from '~/api/client-users'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { replaceNullUndefinedWithUndefined } from '~/lib/actions/utils.server'
import { getErrorMessage } from '~/lib/error-messages'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { NewMemberModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export const handle = {
	breadcrumb: 'New',
}

export async function action({ request }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const clientId = safeString(authSession.get('selectedClientId'))

	let formData = await request.formData()
	const name = formData.get('name') as string
	const phone = formData.get('phone') as string
	const email = formData.get('email') as string
	const role = formData.get('role') as ClientUser['role']
	const propertyAssignmentsRaw = formData.get('property_assignments') as string
	const propertyAssignments: {
		property_id: string
		role: ClientUserProperty['role']
	}[] = propertyAssignmentsRaw ? JSON.parse(propertyAssignmentsRaw) : []

	const apiConfig = { baseUrl, authToken: authSession.get('authToken') }

	try {
		const member = await createClientUser(
			clientId,
			replaceNullUndefinedWithUndefined({
				name,
				phone,
				email,
				role,
			}),
			apiConfig,
		)

		if (!member) {
			throw new Error('Member creation returned no data')
		}

		if (propertyAssignments.length > 0) {
			await Promise.all(
				propertyAssignments.map(({ property_id, role: propertyRole }) =>
					linkClientUserPropertyForServer(
						clientId,
						{ property_id, role: propertyRole, client_user_ids: [member.id] },
						apiConfig,
					),
				),
			)
		}

		return redirect('/settings/members')
	} catch (e) {
		if (e instanceof Error) {
			return { error: getErrorMessage(e.message, 'Failed to create member') }
		}

		return { error: 'Failed to create member' }
	}
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	const meta = getSocialMetas({
		title: 'Create New Member',
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})

	return meta
}

export default NewMemberModule
