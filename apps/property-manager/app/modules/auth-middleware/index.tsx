import { Outlet, useLoaderData } from 'react-router'
import { AuthProvider } from '~/providers/auth-provider'
import type { loader } from '~/routes/_auth'

export function AuthMiddlewareModule() {
	const loaderData = useLoaderData<typeof loader>()

	return (
		<AuthProvider
			data={loaderData?.currentUserData ?? undefined}
			clientUserProperties={loaderData?.clientUserProperties}
		>
			<Outlet />
		</AuthProvider>
	)
}
