import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { NotFoundModule } from "./modules";
import { Providers } from "./providers";
import { getAuthSession } from "./lib/actions/auth.session.server";
import { environmentVariables } from "./lib/actions/env.server";
import { TopbarLoader } from "./components/top-bar-loader";



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

export async function loader({ request }: Route.LoaderArgs) {
	const env = environmentVariables()
	const authSession = await getAuthSession(request.headers.get('Cookie'))

	return {
		ENV: {
			API_ADDRESS: env.API_ADDRESS,
			AUTH_TOKEN: authSession.get('authToken'),
			GOOGLE_MAPS_API_KEY: env.GOOGLE_MAPS_API_KEY,
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
        <TopbarLoader />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
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
  let message = "Oops!";
  let details = "An unexpected error occurred.";
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


  return <NotFoundModule status={status} title={message} message={details} />
}
