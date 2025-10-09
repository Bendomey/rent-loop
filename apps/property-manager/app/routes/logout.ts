import { redirect } from 'react-router'
import { type Route } from './+types/logout'
import { deleteAuthSession, getAuthSession } from '~/lib/actions/session.server'

export async function action({ request }: Route.ActionArgs) {
	const session = await getAuthSession(request.headers.get('Cookie'))

	return redirect('/login', {
		headers: {
			'Set-Cookie': await deleteAuthSession(session),
		},
	})
}
