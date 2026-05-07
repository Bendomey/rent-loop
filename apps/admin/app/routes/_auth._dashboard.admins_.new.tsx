import { redirect } from 'react-router'
import type { Route } from './+types/_auth._dashboard.admins.new'
import { createAdminForServer } from '~/api/admins/server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { NewAdminModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return { origin: getDomainUrl(request) }
}

export async function action({ request }: Route.ActionArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')

	const body = await request.formData()
	const name = String(body.get('name') ?? '').trim()
	const email = String(body.get('email') ?? '').trim()

	try {
		await createAdminForServer({ name, email }, { baseUrl, authToken })
		return redirect('/admins')
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : 'Failed to create admin'
		return { error: message }
	}
}

export const handle = {
	breadcrumb: 'Create Admin',
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
		origin: loaderData.origin,
		title: 'Create Admin',
	})
}

export default NewAdminModule
