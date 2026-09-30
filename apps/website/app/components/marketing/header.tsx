import {
	Popover,
	PopoverBackdrop,
	PopoverButton,
	PopoverPanel,
} from '@headlessui/react'
import clsx from 'clsx'
import { Link } from 'react-router'
import { Button } from './button'
import { Container, Logo } from './primitives'
import { PROPERTY_MANAGER_APP_URL } from '~/lib/constants'

export const primaryNavigation = [
	{ key: 'managers', label: 'For managers', href: '/managers' },
	{ key: 'tenants', label: 'For tenants', href: '/tenants' },
	{ key: 'pricing', label: 'Pricing', href: '/pricing' },
	{ key: 'blog', label: 'Blog', href: '/blog' },
]

function MenuIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
			<path
				d="M5 6h14M5 18h14M5 12h14"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

function ChevronUpIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
			<path
				d="M17 14l-5-5-5 5"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function NavLinks({ current }: { current?: string }) {
	return primaryNavigation.map((item) => (
		<Link
			key={item.key}
			to={item.href}
			className={clsx(
				'-mx-3 -my-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-100 hover:text-gray-900',
				current === item.key ? 'text-gray-900' : 'text-gray-700',
			)}
		>
			{item.label}
		</Link>
	))
}

export function MarketingHeader({ current }: { current?: string }) {
	return (
		<header>
			<nav>
				<Container className="relative z-50 flex justify-between py-8">
					<div className="relative z-10 flex items-center gap-16">
						<Link to="/" aria-label="Home">
							<Logo />
						</Link>
						<div className="hidden lg:flex lg:gap-10">
							<NavLinks current={current} />
						</div>
					</div>
					<div className="flex items-center gap-6">
						<Popover className="lg:hidden">
							<PopoverButton
								className="relative z-10 -m-2 inline-flex items-center rounded-lg stroke-gray-900 p-2 hover:bg-gray-200/50 hover:stroke-gray-600 focus:not-data-focus:outline-hidden active:stroke-gray-900"
								aria-label="Toggle site navigation"
							>
								{({ open }) =>
									open ? (
										<ChevronUpIcon className="h-6 w-6" />
									) : (
										<MenuIcon className="h-6 w-6" />
									)
								}
							</PopoverButton>
							<PopoverBackdrop
								transition
								className="fixed inset-0 z-0 bg-gray-300/60 backdrop-blur-sm transition duration-200 data-closed:opacity-0"
							/>
							<PopoverPanel
								transition
								className="absolute inset-x-0 top-0 z-0 origin-top rounded-b-2xl bg-white px-6 pt-32 pb-6 shadow-2xl shadow-gray-900/20 transition duration-200 data-closed:-translate-y-8 data-closed:opacity-0"
							>
								{({ close }) => (
									<>
										<div className="space-y-4">
											{primaryNavigation.map((item) => (
												<Link
													key={item.key}
													to={item.href}
													onClick={() => close()}
													className="block text-base/7 tracking-tight text-gray-700"
												>
													{item.label}
												</Link>
											))}
										</div>
										<div className="mt-8 flex flex-col gap-4">
											<Button
												href={`${PROPERTY_MANAGER_APP_URL}/login`}
												variant="outline"
											>
												Log in
											</Button>
											<Button href={`${PROPERTY_MANAGER_APP_URL}/apply`}>
												Start free
											</Button>
										</div>
									</>
								)}
							</PopoverPanel>
						</Popover>
						<div className="flex items-center gap-6 max-lg:hidden">
							<Button
								href={`${PROPERTY_MANAGER_APP_URL}/login`}
								variant="outline"
							>
								Log in
							</Button>
							<Button href={`${PROPERTY_MANAGER_APP_URL}/apply`}>
								Start free
							</Button>
						</div>
					</div>
				</Container>
			</nav>
		</header>
	)
}
