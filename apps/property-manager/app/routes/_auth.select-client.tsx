import { Building2, HardHat, Home, LogOut, Network, User } from 'lucide-react'
import { data, Form, redirect, useLoaderData } from 'react-router'
import type { Route } from './+types/_auth.select-client'
import { userContext } from '~/lib/actions/auth.context.server'
import {
	getAuthSession,
	saveAuthSession,
} from '~/lib/actions/auth.session.server'
import { APP_NAME } from '~/lib/constants'

const CLIENT_ICON: Record<string, React.ReactNode> = {
	LANDLORD: <Home className="size-5" />,
	PROPERTY_MANAGER: <Building2 className="size-5" />,
	DEVELOPER: <HardHat className="size-5" />,
	AGENCY: <Network className="size-5" />,
	INDIVIDUAL: <User className="size-5" />,
	COMPANY: <Building2 className="size-5" />,
}

const SUB_TYPE_LABEL: Record<string, string> = {
	LANDLORD: 'Landlord',
	PROPERTY_MANAGER: 'Property Manager',
	DEVELOPER: 'Developer',
	AGENCY: 'Agency',
}

function getClientIcon(client?: Client) {
	if (!client) return <Building2 className="size-5" />
	return (
		CLIENT_ICON[client.sub_type] ??
		CLIENT_ICON[client.type] ?? <Building2 className="size-5" />
	)
}

function getClientSubTypeLabel(client?: Client) {
	if (!client) return null
	return SUB_TYPE_LABEL[client.sub_type] ?? null
}

function openTawk() {
	const tawk = (
		window as unknown as {
			Tawk_API?: { maximize?: () => void }
		}
	).Tawk_API
	tawk?.maximize?.()
}

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

	const url = new URL(request.url)
	const returnTo = url.searchParams.get('return_to') || '/'

	return redirect(returnTo, {
		headers: { 'Set-Cookie': await saveAuthSession(session) },
	})
}

export default function SelectClientPage() {
	const { clientUsers } = useLoaderData<typeof loader>()

	return (
		<div className="bg-background flex min-h-screen flex-col">
			{/* Header */}
			<header className="px-6 pt-4">
				<div className="mx-auto flex max-w-screen-lg items-center justify-between">
					<div className="flex items-end">
						<span className="text-4xl font-extrabold text-rose-700 dark:text-rose-500">
							{APP_NAME.slice(0, 4)}
						</span>
						<span className="text-4xl font-extrabold">{APP_NAME.slice(4)}</span>
					</div>
					<Form method="post" action="/logout">
						<button
							type="submit"
							className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
						>
							<LogOut className="size-4" />
							Logout
						</button>
					</Form>
				</div>
			</header>

			{/* Main */}
			<main className="flex flex-1 items-center justify-center px-6 py-12">
				<div className="w-full max-w-sm space-y-6">
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
								<div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-md">
									{getClientIcon(cu.client)}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<p className="truncate font-medium">
											{cu.client?.name ?? cu.client_id}
										</p>
										<span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase">
											{cu.role}
										</span>
									</div>
									<p className="text-muted-foreground text-xs">
										{getClientSubTypeLabel(cu.client) ?? cu.role.toLowerCase()}
									</p>
								</div>
							</button>
						))}
					</Form>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t px-6 py-4">
				<p className="text-muted-foreground text-center text-sm">
					Don&apos;t see your workspace?{' '}
					<button
						type="button"
						onClick={openTawk}
						className="text-foreground underline underline-offset-4 hover:no-underline"
					>
						Reach out to us
					</button>
				</p>
			</footer>
		</div>
	)
}
