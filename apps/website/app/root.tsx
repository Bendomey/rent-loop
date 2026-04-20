import './app.css'

import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat.js'
import { useEffect } from 'react'
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useLocation,
} from 'react-router'
import type { Route } from './+types/root'
import { GoogleAnalytics } from './components/google-analytics'
import { TopbarLoader } from './components/top-bar-loader'
import { environmentVariables } from './lib/actions/env.server'
import { NotFoundModule } from './modules/404-page'
import { Providers } from './providers'
import { TAWK_HIDDEN_PATHS } from './lib/constants'

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
	{ rel: 'manifest', href: '/manifest.webmanifest' },
	{ rel: 'icon', href: '/favicon.ico' },
	{ rel: 'apple-touch-icon', href: '/favicon.ico' },
]

export async function loader() {
	const env = environmentVariables()

	return {
		ENV: {
			API_ADDRESS: env.API_ADDRESS,
			GOOGLE_ANALYTICS_ID: env.GOOGLE_ANALYTICS_ID,
		},
	}
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="scroll-smooth">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#f43f5e" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<TopbarLoader />
				<script>
					{`
						var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
						Tawk_API.onChatMinimized=function(){
							var hiddenPaths=['/tenants/apply','/tenant-applications'];
							var onHiddenPage=hiddenPaths.some(function(p){return window.location.pathname.startsWith(p);});
							if(onHiddenPage){Tawk_API.hideWidget();}
						};
						(function(){
							var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
							s1.async=true;
							s1.src='https://embed.tawk.to/690490aed8bd2d195501b220/1j8stab0n';
							s1.charset='UTF-8';
							s1.setAttribute('crossorigin','*');
							s0.parentNode.insertBefore(s1,s0);
						})();
						`}
				</script>
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}


function TawkVisibility() {
	const location = useLocation()

	useEffect(() => {
		if (typeof window === 'undefined') return

		const shouldHide = TAWK_HIDDEN_PATHS.some((path) =>
			location.pathname.startsWith(path),
		)

		const apply = () => {
			if (!window.Tawk_API) return false
			if (shouldHide && typeof window.Tawk_API.hideWidget === 'function') {
				window.Tawk_API.hideWidget()
				return true
			} else if (
				!shouldHide &&
				typeof window.Tawk_API.showWidget === 'function'
			) {
				window.Tawk_API.showWidget()
				return true
			}
			return false
		}

		if (!apply()) {
			window.Tawk_API = window.Tawk_API || ({} as typeof window.Tawk_API)
			const prev = window.Tawk_API.onLoad
			window.Tawk_API.onLoad = function () {
				prev?.()
				apply()
			}
		}
	}, [location.pathname])

	return null
}

export default function App() {
	const { ENV } = useLoaderData<typeof loader>()

	if (typeof window !== 'undefined') {
		window.ENV = ENV
	}
	return (
		<Providers>
			<GoogleAnalytics gaId={ENV.GOOGLE_ANALYTICS_ID} />
			<TawkVisibility />
			<Outlet />
		</Providers>
	)
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = 'Oops!'
	let details = 'An unexpected error occurred.'
	let status = 500

	if (isRouteErrorResponse(error)) {
		status = error.status
		if (error.status === 403) {
			message = 'Forbidden'
			details = "You don't have permission to access this page."
		} else if (error.status === 404) {
			message = 'Not Found'
			details = 'The requested page could not be found.'
		} else {
			message = 'Error'
			details = error.statusText || details
		}
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		message = error.message
		details = error.stack || details
	}

	return <NotFoundModule title={message} message={details} status={status} />
}
