export function ComingSoonModule() {
	return (
		<div className="flex h-screen flex-col bg-white pt-16 pb-12">
			<main className="mx-auto flex w-full max-w-7xl grow flex-col justify-center px-6 lg:px-8">
				<div className="flex shrink-0 justify-center">
					<a href="#" className="inline-flex">
						<span className="sr-only">Rentloop</span>
						<img
							alt=""
							src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=rose&shade=600"
							className="h-12 w-auto"
						/>
					</a>
				</div>
				<div className="py-16">
					<div className="text-center">
						<p className="text-base font-semibold text-rose-600">404</p>
						<h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
							Coming Soon.
						</h1>
						<p className="mt-2 text-base text-gray-500">
							We're working hard to launch this feature. Stay tuned!
						</p>
						<div className="mt-6">
							<a
								href="/"
								className="text-base font-medium text-rose-600 hover:text-rose-500"
							>
								Go back home
								<span aria-hidden="true"> &rarr;</span>
							</a>
						</div>
					</div>
				</div>
			</main>
			<footer className="mx-auto w-full max-w-7xl shrink-0 px-6 lg:px-8">
				<nav className="flex justify-center space-x-4">
					<button
						onClick={() => window?.Tawk_API?.toggle()}
						className="text-sm font-medium text-gray-500 hover:text-gray-600"
					>
						Contact Support
					</button>
				</nav>
			</footer>
		</div>
	)
}
