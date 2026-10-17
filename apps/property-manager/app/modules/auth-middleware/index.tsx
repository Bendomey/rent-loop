import { Outlet, useLoaderData } from 'react-router'
import { ChangePasswordModal } from './change-password-modal'
import { AuthProvider } from '~/providers/auth-provider'
import { ClientProvider } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth'

export function AuthMiddlewareModule() {
	const loaderData = useLoaderData<typeof loader>()

	return (
		<AuthProvider data={loaderData?.currentUser ?? undefined}>
			<ClientProvider data={loaderData?.clientUserData ?? undefined}>
				<Outlet />
				<ChangePasswordModal user={loaderData?.currentUser ?? undefined} />
			</ClientProvider>
		</AuthProvider>
	)
}
