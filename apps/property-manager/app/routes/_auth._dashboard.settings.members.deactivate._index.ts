import type { Route } from './+types/_auth._dashboard.settings.members.new._index'
import { deactivateClientUser } from '~/api/client-users'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { replaceNullUndefinedWithUndefined } from '~/lib/actions/utils.server'

export async function action({ request }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))

	let formData = await request.formData()

	const id = formData.get('id') as string
	const reason = formData.get('reason') as string

	try {
		const member = await deactivateClientUser(
			replaceNullUndefinedWithUndefined({
				id,
				reason,
			}),
			{
				baseUrl,
				authToken: authSession.get('authToken'),
			},
		)

		if (!member) {
			throw new Error('Member deactivation returned no data')
		}
	} catch {
		return { error: 'Failed to deactivate member' }
	}
}
