import { Link } from 'react-router'
import { APP_NAME } from '~/lib/constants'

interface Props {
	status?: number
	title?: string
	message?: string
}

export function NotFoundModule({ status = 404, title, message }: Props) {
	return (
		<>
			<main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
				<div className="text-center">
					<p className="text-base font-semibold text-rose-600">{status}</p>
					<h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">
						{title ?? 'Page not found'}
					</h1>
					<p className="mt-6 text-lg font-light text-pretty text-gray-500 sm:text-xl/8">
						{message || 'Sorry, we couldn’t find the page you’re looking for.'}
					</p>
					<div className="mt-10 flex items-center justify-center gap-x-6">
						<Link
							to="/"
							className="rounded-md bg-rose-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
						>
							Go back home
						</Link>
						<button
							onClick={() => window?.Tawk_API?.toggle()}
							className="cursor-pointer text-sm font-semibold text-gray-900"
						>
							Contact support <span aria-hidden="true">&rarr;</span>
						</button>
					</div>
				</div>
			</main>
			<footer className="mx-auto flex items-end justify-center">
				<Link prefetch="intent" to="/" className="-m-1.5 p-1.5">
					<div className="flex flex-row items-end">
						<span className="text-4xl font-extrabold text-rose-700">
							{APP_NAME.slice(0, 4)}
						</span>
						<span className="text-4xl font-extrabold">{APP_NAME.slice(4)}</span>
					</div>
				</Link>
			</footer>
		</>
	)
}
