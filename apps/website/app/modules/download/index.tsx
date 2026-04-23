import {
	Disclosure,
	DisclosureButton,
	DisclosurePanel,
} from '@headlessui/react'
import {
	BellIcon,
	ChatBubbleLeftRightIcon,
	ClipboardDocumentCheckIcon,
	CreditCardIcon,
	DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { MinusSmallIcon, PlusSmallIcon } from '@heroicons/react/24/outline'
import { Footer } from '~/components/layout/footer'
import { Header } from '~/components/layout/header'
import { APP_STORE_URL, PLAY_STORE_URL } from '~/lib/constants'

export function DownloadModule() {
	return (
		<div>
			<Header />

			{/* Hero */}
			<div className="pt-24 pb-16">
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="mx-auto max-w-2xl text-center">
						<p className="text-base/7 font-semibold text-rose-600">
							For tenants
						</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance text-gray-950 sm:text-5xl">
							Rentloop in your{' '}
							<span className="font-[Shantell] text-rose-600 italic">
								pocket
							</span>
						</h1>
						<p className="mt-6 text-lg font-light text-gray-500">
							Pay rent, submit maintenance requests, track your application, and
							stay in touch with your landlord — all from your phone.
						</p>
					</div>

					<div className="mx-auto mt-12 flex max-w-sm flex-col items-center gap-4 sm:max-w-none sm:flex-row sm:justify-center">
						<a
							href={APP_STORE_URL}
							className="flex w-48 items-center justify-center gap-3 rounded-xl bg-gray-900 px-5 py-3 text-white transition-colors hover:bg-gray-700"
						>
							<AppleIcon className="size-7 shrink-0" />
							<div className="text-left">
								<p className="text-xs text-gray-400">Download on the</p>
								<p className="text-sm leading-tight font-semibold">App Store</p>
							</div>
						</a>

						<a
							href={PLAY_STORE_URL}
							className="flex w-48 items-center justify-center gap-3 rounded-xl bg-gray-900 px-5 py-3 text-white transition-colors hover:bg-gray-700"
						>
							<PlayStoreIcon className="size-7 shrink-0" />
							<div className="text-left">
								<p className="text-xs text-gray-400">Get it on</p>
								<p className="text-sm leading-tight font-semibold">
									Google Play
								</p>
							</div>
						</a>
					</div>

					<p className="mt-6 text-center text-sm text-gray-400">
						Coming soon — links will be live when the app launches.
					</p>
				</div>
			</div>

			{/* Features */}
			<div className="bg-white py-16 sm:py-24">
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="mx-auto max-w-2xl text-center">
						<p className="text-base/7 font-semibold text-rose-600">
							Built for tenants
						</p>
						<h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
							Everything you need as a{' '}
							<span className="font-[Shantell] text-rose-600 italic">
								tenant
							</span>
						</h2>
						<p className="mt-4 text-lg font-light text-gray-500">
							The Rentloop tenant app keeps you on top of your tenancy — from
							paying rent to tracking repair requests.
						</p>
					</div>

					<div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{features.map((feature) => (
							<div key={feature.title} className="flex flex-col gap-3">
								<div className="flex size-10 items-center justify-center rounded-lg bg-rose-50">
									<feature.icon
										className="size-5 text-rose-600"
										aria-hidden="true"
									/>
								</div>
								<h3 className="text-sm font-semibold text-gray-900">
									{feature.title}
								</h3>
								<p className="text-sm text-gray-500">{feature.description}</p>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* FAQ */}
			<div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
				<div className="mx-auto max-w-4xl">
					<h2 className="text-center text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
						Frequently asked{' '}
						<span className="font-[Shantell] text-rose-600 italic">
							questions
						</span>
					</h2>
					<dl className="mt-12">
						{faqs.map((faq) => (
							<Disclosure
								key={faq.question}
								as="div"
								className="mb-2 border border-gray-100 bg-white p-4"
							>
								<dt>
									<DisclosureButton className="group flex w-full items-start justify-between text-left text-gray-900">
										<span className="text-base/7 font-semibold">
											{faq.question}
										</span>
										<span className="ml-6 flex h-7 items-center">
											<PlusSmallIcon
												aria-hidden="true"
												className="size-6 group-data-open:hidden"
											/>
											<MinusSmallIcon
												aria-hidden="true"
												className="size-6 group-not-data-open:hidden"
											/>
										</span>
									</DisclosureButton>
								</dt>
								<DisclosurePanel as="dd" className="mt-2 pr-12">
									<p className="text-base/7 text-gray-600">{faq.answer}</p>
								</DisclosurePanel>
							</Disclosure>
						))}
					</dl>
				</div>
			</div>

			<Footer />
		</div>
	)
}

const features = [
	{
		title: 'Pay rent from anywhere',
		description:
			'Pay your rent in a few taps using mobile money or card. Get an instant confirmation and a record of every payment you have made.',
		icon: CreditCardIcon,
	},
	{
		title: 'Track your application',
		description:
			'Follow every step of your rental application in real time — from submission through to approval. No more chasing your landlord for updates.',
		icon: ClipboardDocumentCheckIcon,
	},
	{
		title: 'Submit maintenance requests',
		description:
			'Report a broken fixture or any issue in your unit directly from the app. Add photos and track the status until it is resolved.',
		icon: DocumentTextIcon,
	},
	{
		title: 'View your lease',
		description:
			'Access your lease agreement, key dates, and unit details at any time — no need to dig through emails or paperwork.',
		icon: DocumentTextIcon,
	},
	{
		title: 'Stay notified',
		description:
			'Receive push notifications for payment confirmations, maintenance updates, and important messages from your property manager.',
		icon: BellIcon,
	},
	{
		title: 'Message your landlord',
		description:
			'Send and receive messages with your property manager directly through the app, keeping all communication tied to your tenancy.',
		icon: ChatBubbleLeftRightIcon,
	},
]

const faqs = [
	{
		question: 'Who is the Rentloop mobile app for?',
		answer:
			'The Rentloop mobile app is designed for tenants. It lets you pay rent, track your rental application, submit maintenance requests, view your lease, and communicate with your property manager — all from your phone.',
	},
	{
		question: 'Is the app free to download?',
		answer:
			'Yes. The Rentloop tenant app is completely free to download and use on both iOS and Android. There are no fees for tenants.',
	},
	{
		question: 'Which platforms are supported?',
		answer:
			'The app is available for iOS (iPhone and iPad) and Android devices. It requires iOS 14 or later, or Android 8.0 or later.',
	},
	{
		question: 'How do I get access to the app?',
		answer:
			'Your property manager will send you an invitation once they add you as a tenant in Rentloop. You can then download the app and sign in with the credentials from your invitation.',
	},
	{
		question: 'Can I pay rent through the app?',
		answer:
			'Yes. You can pay rent directly through the app using mobile money or card. Each payment is recorded instantly so both you and your landlord have a clear payment history.',
	},
	{
		question: 'How do I submit a maintenance request?',
		answer:
			'Open the app, navigate to your unit, and tap "New Request". Describe the issue, attach photos if needed, and submit. You will receive notifications as your property manager reviews and updates the status.',
	},
	{
		question: 'Can I see the status of my rental application in the app?',
		answer:
			'Yes. If your landlord is using Rentloop to process applications, you can track each stage of your application in real time directly from the app.',
	},
	{
		question: 'What if I have multiple tenancies?',
		answer:
			'The app supports multiple active tenancies under a single account. You can switch between them easily if you rent more than one unit through Rentloop.',
	},
]

function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
			<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
		</svg>
	)
}

function PlayStoreIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" {...props}>
			<path d="M3 20.5v-17c0-.83 1-.97 1.4-.5l14 8.5c.38.23.38.77 0 1L4.4 21c-.4.47-1.4.33-1.4-.5zm2-14.27V17.77L16.01 12 5 6.23z" />
		</svg>
	)
}
