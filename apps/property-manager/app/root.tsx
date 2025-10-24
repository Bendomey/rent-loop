import './app.css'

import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import 'dayjs/locale/en-gb.js'
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from 'react-router'
import type { Route } from './+types/root'

import { TopbarLoader } from './components/top-bar-loader'
import { Toaster } from './components/ui/sonner'
import { getAuthSession } from './lib/actions/auth.session.server'
import { environmentVariables } from './lib/actions/env.server'
import { Providers } from './providers'

dayjs.locale('en-gb')
dayjs.extend(localizedFormat)

export const links: Route.LinksFunction = () => [
	{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
	{
		rel: 'preconnect',
		href: 'https://fonts.gstatic.com',
		crossOrigin: 'anonymous',
	},
	{
		rel: 'stylesheet',
		href: 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Shantell+Sans:ital,wght@0,300..800;1,300..800&display=swap',
	},
]

export async function loader({ request }: Route.LoaderArgs) {
	const env = environmentVariables()
	const authSession = await getAuthSession(request.headers.get('Cookie'))

	return {
		ENV: {
			NODE_ENV: env.NODE_ENV,
			API_ADDRESS: env.API_ADDRESS,
			AUTH_TOKEN: authSession.get('authToken'),
		},
	}
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<TopbarLoader />
				<Toaster position="top-center" />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}

export default function App() {
	const { ENV } = useLoaderData<typeof loader>()

	if (typeof window !== 'undefined') {
		window.ENV = ENV
	}
	return (
		<Providers>
			<Outlet />
		</Providers>
	)
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = 'Oops!'
	let details = 'An unexpected error occurred.'
	let stack: string | undefined

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? '404' : 'Error'
		details =
			error.status === 404
				? 'The requested page could not be found.'
				: error.statusText || details
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message
		stack = error.stack
	}

	return (
		<main className="container mx-auto p-4 pt-16">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full overflow-x-auto p-4">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	)
}
