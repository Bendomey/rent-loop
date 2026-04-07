import { data, Form, redirect, useLoaderData } from 'react-router'
import type { Route } from './+types/_auth.select-client'
import { userContext } from '~/lib/actions/auth.context.server'
import {
	getAuthSession,
	saveAuthSession,
} from '~/lib/actions/auth.session.server'

export async function loader({ request, context }: Route.LoaderArgs) {
	const userData = context.get(userContext)
	if (!userData) return redirect('/login')

	const clientUsers = userData.user.client_users ?? []

	// If only one client, auto-select and redirect
	if (clientUsers.length === 1) {
		const session = await getAuthSession(request.headers.get('Cookie'))
		const clientUser = clientUsers[0]
		if (clientUser?.client_id) {
			session.set('selectedClientId', clientUser.client_id)
			return redirect('/', {
				headers: { 'Set-Cookie': await saveAuthSession(session) },
			})
		}
	}

	return data({ clientUsers })
}

export async function action({ request }: Route.ActionArgs) {
	const session = await getAuthSession(request.headers.get('Cookie'))
	const form = await request.formData()
	const selectedClientId = form.get('client_id')

	if (!selectedClientId || typeof selectedClientId !== 'string') {
		return data({ error: 'Please select a client.' })
	}

	session.set('selectedClientId', selectedClientId)

	return redirect('/', {
		headers: { 'Set-Cookie': await saveAuthSession(session) },
	})
}

export default function SelectClientPage() {
	const { clientUsers } = useLoaderData<typeof loader>()

	return (
		<div className="bg-background flex min-h-screen items-center justify-center">
			<div className="w-full max-w-sm space-y-6 p-6">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Select workspace
					</h1>
					<p className="text-muted-foreground text-sm">
						Choose which workspace you want to continue with.
					</p>
				</div>
				<Form method="post" className="space-y-3">
					{clientUsers.map((cu: ClientUser) => (
						<button
							key={cu.client_id}
							type="submit"
							name="client_id"
							value={cu.client_id}
							className="bg-card hover:bg-accent flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors"
						>
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium">
									{cu.client?.name ?? cu.client_id}
								</p>
								<p className="text-muted-foreground text-xs capitalize">
									{cu.role.toLowerCase()}
								</p>
							</div>
						</button>
					))}
				</Form>
			</div>
		</div>
	)
}
