import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { Link } from 'react-router'
import { ExternalLink } from '~/components/layout/ExternalLink'
import { APP_NAME, PROPERTY_MANAGER_APP_URL } from '~/lib/constants'

const navigation = [
	{ name: 'Features', href: '/#features' },
	{ name: 'Pricing', href: '/pricing' },
	{ name: 'Blog', href: '#' },
]

export function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	return (
		<header className="absolute inset-x-0 top-0 z-50">
			<nav
				aria-label="Global"
				className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
			>
				<div className="flex lg:flex-1">
					<Link to="/">
						<div className="flex flex-row items-end">
							<span className="text-4xl font-extrabold text-rose-700">
								{APP_NAME.slice(0, 4)}
							</span>
							<span className="text-4xl font-extrabold">
								{APP_NAME.slice(4)}
							</span>
						</div>
					</Link>
				</div>
				<div className="flex lg:hidden">
					<button
						type="button"
						onClick={() => setMobileMenuOpen(true)}
						className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
					>
						<span className="sr-only">Open main menu</span>
						<Bars3Icon aria-hidden="true" className="size-6" />
					</button>
				</div>
				<div className="hidden lg:flex lg:gap-x-12">
					{navigation.map((item) => (
						<a
							key={item.name}
							href={item.href}
							className="text-sm/6 font-semibold text-gray-900"
						>
							{item.name}
						</a>
					))}
				</div>
				<div className="hidden lg:flex lg:flex-1 lg:justify-end">
					<ExternalLink
						href={`${PROPERTY_MANAGER_APP_URL}/login`}
						className="text-sm/6 font-semibold text-gray-900"
					>
						Log in <span aria-hidden="true">&rarr;</span>
					</ExternalLink>
				</div>
			</nav>
			<Dialog
				open={mobileMenuOpen}
				onClose={setMobileMenuOpen}
				className="lg:hidden"
			>
				<div className="fixed inset-0 z-50" />
				<DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
					<div className="flex items-center justify-between">
						<div className="flex flex-row items-end">
							<span className="text-4xl font-extrabold text-rose-700">
								{APP_NAME.slice(0, 4)}
							</span>
							<span className="text-4xl font-extrabold">
								{APP_NAME.slice(4)}
							</span>
						</div>
						<button
							type="button"
							onClick={() => setMobileMenuOpen(false)}
							className="-m-2.5 rounded-md p-2.5 text-gray-700"
						>
							<span className="sr-only">Close menu</span>
							<XMarkIcon aria-hidden="true" className="size-6" />
						</button>
					</div>
					<div className="mt-6 flow-root">
						<div className="-my-6 divide-y divide-gray-500/10">
							<div className="space-y-2 py-6">
								{navigation.map((item) => (
									<a
										key={item.name}
										href={item.href}
										className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
									>
										{item.name}
									</a>
								))}
							</div>
							<div className="py-6">
								<ExternalLink
									href={`${PROPERTY_MANAGER_APP_URL}/login`}
									className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
								>
									Log in
								</ExternalLink>
							</div>
						</div>
					</div>
				</DialogPanel>
			</Dialog>
		</header>
	)
}
