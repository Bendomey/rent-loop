import { redirect } from 'react-router'
import type { Route } from './+types/_auth._dashboard.settings.members.new._index'
import { createClientUser } from '~/api/client-users'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { replaceNullUndefinedWithUndefined } from '~/lib/actions/utils.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
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

	let formData = await request.formData()
	const name = formData.get('name') as string
	const phone = formData.get('phone') as string
	const email = formData.get('email') as string
	const role = formData.get('role') as ClientUser['role']

	try {
		const member = await createClientUser(
			replaceNullUndefinedWithUndefined({
				name,
				phone,
				email,
				role,
			}),
			{
				baseUrl,
				authToken: authSession.get('authToken'),
			},
		)

		if (!member) {
			throw new Error('Member creation returned no data')
		}
		return redirect(`/settings/members/${member.id}`)
	} catch {
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
