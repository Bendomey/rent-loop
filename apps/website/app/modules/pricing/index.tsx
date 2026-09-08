import {
	Disclosure,
	DisclosureButton,
	DisclosurePanel,
} from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/20/solid'
import {
	ArrowsRightLeftIcon,
	MinusSmallIcon,
	PlusSmallIcon,
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { ExternalLink } from '~/components/layout/ExternalLink'
import { MarketingFooter, MarketingNav, TopBar } from '~/components/marketing'
import {
	ENTERPRISE_ACCOUNT_REQUEST_URL,
	PROPERTY_MANAGER_APP_URL,
} from '~/lib/constants'
import {
	type BillingInterval,
	YEARLY_DISCOUNT_LABEL,
	billingFaqs,
	formatPlanPrice,
	planPrice,
	plans,
} from '~/lib/plans'

export function PricingModule() {
	const [interval, setInterval] = useState<BillingInterval>('monthly')

	return (
		<div>
			<TopBar />
			<MarketingNav current="pricing" />

			<div className="pt-12 pb-16">
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="mx-auto max-w-2xl text-center">
						<p className="text-base/7 font-semibold text-rose-600">Pricing</p>
						<h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance text-gray-950 sm:text-5xl">
							Pick the plan that{' '}
							<span className="font-[Shantell] text-rose-600 italic">fits</span>
							. Change it anytime.
						</h1>
						<p className="mt-6 text-lg font-light text-gray-500">
							Choose a plan and a billing interval when you sign up. Start free
							on up to 3 units, and move up whenever your portfolio outgrows it.
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

			<div className="pb-10">
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="mx-auto flex max-w-4xl items-start gap-4 rounded-2xl bg-rose-50 px-8 py-6 ring-1 ring-rose-100">
						<ArrowsRightLeftIcon className="mt-0.5 size-6 shrink-0 text-rose-600" />
						<div>
							<p className="text-sm font-semibold text-gray-900">
								Switching plans is painless
							</p>
							<p className="mt-1 text-sm text-gray-600">
								Upgrade whenever you need more room — it takes effect right
								away, and the unused time on your current plan is credited
								against the new one. Downgrades and switches between monthly and
								yearly take effect at your next renewal, so you keep everything
								you have already paid for.
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="pb-16">
				<div className="mx-auto max-w-7xl px-6 lg:px-8">
					<div className="mb-10 flex justify-center">
						<div
							role="radiogroup"
							aria-label="Billing interval"
							className="inline-flex items-center gap-1 rounded-full bg-gray-100 p-1"
						>
							{intervals.map((option) => {
								const selected = interval === option.value
								return (
									<button
										key={option.value}
										type="button"
										role="radio"
										aria-checked={selected}
										onClick={() => setInterval(option.value)}
										className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition ${
											selected
												? 'bg-white text-gray-900 shadow-sm'
												: 'text-gray-500 hover:text-gray-900'
										}`}
									>
										{option.label}
										{option.badge ? (
											<span
												className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
													selected
														? 'bg-rose-600 text-white'
														: 'bg-rose-100 text-rose-700'
												}`}
											>
												{option.badge}
											</span>
										) : null}
									</button>
								)
							})}
						</div>
					</div>

					<div className="mx-auto grid max-w-md grid-cols-1 gap-8 lg:max-w-4xl lg:grid-cols-3">
						{plans.map((tier) => {
							const price = formatPlanPrice(planPrice(tier, interval))
							return (
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
												Most Popular
											</span>
										</div>
									)}

									<div className="mb-6">
										<h2 className="text-lg font-semibold text-gray-900">
											{tier.name}
										</h2>
										<p className="mt-1 text-sm text-gray-500">{tier.range}</p>
										<div className="mt-4 flex items-baseline gap-x-1">
											<span className="text-4xl font-bold tracking-tight text-gray-900 lg:text-3xl">
												{price}
											</span>
											<span className="text-sm font-medium text-gray-500">
												{interval === 'yearly' ? '/year' : '/month'}
											</span>
										</div>
										<p className="mt-3 text-sm text-gray-600">
											{tier.description}
										</p>
									</div>

									<ul className="flex flex-col gap-y-3">
										{tier.features.map((feature) => (
											<li key={feature} className="flex items-start gap-x-3">
												<CheckIcon className="mt-0.5 size-5 shrink-0 text-rose-600" />
												<span className="text-sm text-gray-600">{feature}</span>
											</li>
										))}
									</ul>

									<a
										href={`${PROPERTY_MANAGER_APP_URL}/apply`}
										className={`mt-8 block rounded-md px-5 py-2.5 text-center text-sm font-semibold ${
											tier.highlighted
												? 'bg-rose-600 text-white hover:bg-rose-500'
												: 'bg-gray-900 text-white hover:bg-gray-700'
										}`}
									>
										{tier.cta}
									</a>
								</div>
							)
						})}
					</div>

					<div className="mx-auto mt-8 max-w-4xl rounded-2xl bg-white p-8 ring-1 ring-gray-200 lg:flex lg:items-center lg:justify-between">
						<div>
							<h2 className="text-xl font-semibold text-gray-900">
								Enterprise
							</h2>
							<p className="mt-1 text-sm font-medium text-rose-600">
								100+ units
							</p>
							<p className="mt-2 max-w-xl text-sm text-gray-600">
								Larger than Growth? Let's talk. We offer custom pricing,
								dedicated infrastructure, priority support, and white-glove
								onboarding tailored to your needs.
							</p>
						</div>
						<div className="mt-6 lg:mt-0 lg:shrink-0">
							<ExternalLink
								href={ENTERPRISE_ACCOUNT_REQUEST_URL}
								className="inline-block rounded-md bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
							>
								Contact us
							</ExternalLink>
						</div>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
				<div className="mx-auto max-w-4xl">
					<h2 className="text-center text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
						Billing <span className="font-[Shantell] text-rose-600">FAQ</span>
					</h2>
					<dl className="mt-16">
						{billingFaqs.map((faq) => (
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

			<MarketingFooter />
		</div>
	)
}

const intervals: {
	value: BillingInterval
	label: string
	badge?: string
}[] = [
	{ value: 'monthly', label: 'Monthly' },
	{ value: 'yearly', label: 'Yearly', badge: YEARLY_DISCOUNT_LABEL },
]
