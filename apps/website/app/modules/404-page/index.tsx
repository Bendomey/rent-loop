import { Button, Container, MarketingPage } from '~/components/marketing'

interface Props {
	status?: number
	title?: string
	message?: string
}

export function NotFoundModule({ status = 404, title, message }: Props) {
	return (
		<MarketingPage>
			<Container className="py-20 sm:py-32">
				<div className="mx-auto max-w-2xl text-center">
					<p className="text-sm font-semibold text-gray-500">{status}</p>
					<h1 className="mt-2 text-4xl font-medium tracking-tight break-words text-gray-900">
						{title ?? 'Page not found'}
					</h1>
					<p className="mt-4 text-lg break-words text-gray-600">
						{message || 'Sorry, we couldn’t find the page you’re looking for.'}
					</p>
					<div className="mt-8 flex items-center justify-center gap-x-6">
						<Button href="/">Go back home</Button>
						<button
							type="button"
							onClick={() => window?.Tawk_API?.toggle()}
							className="cursor-pointer text-sm font-semibold text-gray-900"
						>
							Contact support <span aria-hidden="true">→</span>
						</button>
					</div>
				</div>
			</Container>
		</MarketingPage>
	)
}
