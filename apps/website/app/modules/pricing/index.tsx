import {
	Disclosure,
	DisclosureButton,
	DisclosurePanel,
} from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/20/solid'
import {
	ArrowPathIcon,
	MinusSmallIcon,
	PlusSmallIcon,
} from '@heroicons/react/24/outline'
import { Footer } from '~/components/layout/footer'
import { Header } from '~/components/layout/header'
import { PROPERTY_MANAGER_APP_URL } from '~/lib/constants'

export function PricingModule() {
	return (
		<div>
			<Header />

			{/* Hero */}
			<div className="pt-24 pb-16">
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="mx-auto max-w-2xl text-center">
						<p className="text-base/7 font-semibold text-rose-600">Pricing</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance text-gray-950 sm:text-5xl">
							Simple pricing that{' '}
							<span className="font-[Shantell] text-rose-600 italic">
								grows
							</span>{' '}
							with you
						</h1>
						<p className="mt-6 text-lg font-light text-gray-500">
							Simple flat monthly plans — no per-unit fees. Create your account,
							add your units, and your plan updates automatically as your
							portfolio crosses each threshold.
						</p>
						<a
							href={`${PROPERTY_MANAGER_APP_URL}/apply`}
							className="mt-8 inline-block rounded-md bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-rose-500"
						>
							Get started free
						</a>
					</div>
				</div>
			</div>

			{/* Auto-calculation callout */}
			<div className="pb-10">
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="mx-auto flex max-w-4xl items-start gap-4 rounded-2xl bg-rose-50 px-8 py-6 ring-1 ring-rose-100">
						<ArrowPathIcon className="mt-0.5 size-6 shrink-0 text-rose-600" />
						<div>
							<p className="text-sm font-semibold text-gray-900">
								No plan selection needed — it's automatic
							</p>
							<p className="mt-1 text-sm text-gray-600">
								You don't choose a tier. When you sign up and start adding
								units, Rentloop automatically applies the right rate based on
								your total unit count. As your portfolio grows or shrinks, your
								billing updates at the start of the next cycle.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Pricing tiers — billing reference */}
			<div className="pb-16">
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<p className="mb-8 text-center text-sm font-medium tracking-wide text-gray-500 uppercase">
						Billing rates by unit count
					</p>
					<div className="mx-auto grid max-w-md grid-cols-1 gap-8 lg:max-w-4xl lg:grid-cols-3">
						{tiers.map((tier) => (
							<div
								key={tier.name}
								className={`relative flex flex-col rounded-2xl p-8 ${
									tier.highlighted
										? 'bg-white shadow-lg ring-2 ring-rose-600'
										: 'bg-white ring-1 ring-gray-200'
								}`}
							>
								{tier.highlighted && (
									<div className="absolute -top-4 left-1/2 -translate-x-1/2">
										<span className="rounded-full bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
											Most Common
										</span>
									</div>
								)}

								<div className="mb-6">
									<h2 className="text-lg font-semibold text-gray-900">
										{tier.name}
									</h2>
									<p className="mt-1 text-sm text-gray-500">{tier.range}</p>
									<div className="mt-4 flex items-baseline gap-x-1">
										<span className="text-4xl font-bold tracking-tight text-gray-900">
											{tier.price}
										</span>
										<span className="text-sm font-medium text-gray-500">
											{tier.priceSuffix}
										</span>
									</div>
									<p className="mt-3 text-sm text-gray-600">
										{tier.description}
									</p>
								</div>

								<ul className="flex flex-col gap-y-3">
									{allFeatures.map((feature) => (
										<li key={feature} className="flex items-start gap-x-3">
											<CheckIcon className="mt-0.5 size-5 shrink-0 text-rose-600" />
											<span className="text-sm text-gray-600">{feature}</span>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>

					{/* Enterprise banner */}
					<div className="mx-auto mt-8 max-w-4xl rounded-2xl bg-gray-50 p-8 ring-1 ring-gray-200 lg:flex lg:items-center lg:justify-between">
						<div>
							<h2 className="text-xl font-semibold text-gray-900">
								Enterprise
							</h2>
							<p className="mt-1 text-sm font-medium text-rose-600">
								150+ units
							</p>
							<p className="mt-2 max-w-xl text-sm text-gray-600">
								Large portfolio? Let's talk. We offer custom pricing, dedicated
								infrastructure, priority support, and white-glove onboarding
								tailored to your needs.
							</p>
						</div>
						<div className="mt-6 lg:mt-0 lg:shrink-0">
							<a
								href="mailto:hello@rentloopapp.com"
								className="inline-block rounded-md bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
							>
								Contact us
							</a>
						</div>
					</div>
				</div>
			</div>

			{/* Billing FAQ */}
			<div className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
				<div className="mx-auto max-w-4xl">
					<h2 className="text-center text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
						Billing <span className="font-[Shantell] text-rose-600">FAQ</span>
					</h2>
					<dl className="mt-16">
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

const allFeatures = [
	'Tenant management',
	'Lease tracking',
	'Maintenance requests',
	'Rent collection & payment tracking',
	'Analytics & reporting',
	'Document management',
	'Team member access',
	'Email & chat support',
]

const tiers = [
	{
		name: 'Free',
		range: 'Up to 5 units',
		price: 'GH₵ 0',
		priceSuffix: '/month',
		description:
			'Automatically applied when your portfolio has 5 units or fewer.',
		highlighted: false,
	},
	{
		name: 'Starter',
		range: '6 – 50 units',
		price: 'GH₵ 70',
		priceSuffix: '/month',
		description:
			'Flat monthly rate applied automatically once you add a 6th unit.',
		highlighted: true,
	},
	{
		name: 'Growth',
		range: '51 – 150 units',
		price: 'GH₵ 200',
		priceSuffix: '/month',
		description: 'Flat monthly rate applied automatically at 51 units.',
		highlighted: false,
	},
]

const faqs = [
	{
		question: 'Do I need to choose a pricing plan?',
		answer:
			'No. There is nothing to select. You simply create an account, add your properties and units, and Rentloop automatically applies the correct billing rate based on your total unit count. As your portfolio grows or shrinks, your rate updates at the start of the next billing cycle.',
	},
	{
		question: 'How does billing work?',
		answer:
			'You pay a flat monthly fee based on your total unit count, not per unit. If you have 20 units you pay GH₵ 70/month. If you have 80 units you pay GH₵ 70/month. Your plan updates automatically as you add or remove units.',
	},
	{
		question: 'What counts as a unit?',
		answer:
			'Each individually rentable space counts as one unit — a single apartment, a room, a commercial space, or a standalone house. Common areas and shared facilities do not count.',
	},
	{
		question: 'What happens when I cross a tier threshold?',
		answer:
			'When your unit count crosses into a new plan range (e.g. from 50 to 51 units, or from 150 to custom), the new flat monthly rate applies from the next billing cycle. You do not pay two different rates within a single cycle.',
	},
	{
		question: 'Is there a long-term contract?',
		answer:
			'No. Rentloop is month-to-month. You can cancel anytime and you will not be charged after your current billing period ends.',
	},
	{
		question: 'What payment methods do you accept?',
		answer:
			'We accept mobile money (MTN, Vodafone, AirtelTigo), bank transfer, and card payments. Invoices are issued monthly.',
	},
]
