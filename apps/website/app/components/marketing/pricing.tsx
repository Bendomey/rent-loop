import { Radio, RadioGroup } from '@headlessui/react'
import clsx from 'clsx'
import { useState } from 'react'
import { Button } from './button'
import { CheckIcon, Container, Logomark, SectionIntro } from './primitives'
import { getApplyUrl } from '~/lib/apply-url'
import { ENTERPRISE_ACCOUNT_REQUEST_URL } from '~/lib/constants'
import {
	type BillingInterval,
	type Plan,
	YEARLY_DISCOUNT_LABEL,
	formatPlanPrice,
	plans,
} from '~/lib/plans'

const intervals: Array<{ value: BillingInterval; label: string }> = [
	{ value: 'monthly', label: 'Monthly' },
	{ value: 'yearly', label: 'Yearly' },
]

function PlanCard({
	plan,
	interval,
	medium,
}: {
	plan: Plan
	interval: BillingInterval
	medium: string
}) {
	const featured = plan.highlighted
	const isFree = plan.priceMonthly === 0

	return (
		<section
			className={clsx(
				'flex flex-col overflow-hidden rounded-3xl p-6 shadow-lg shadow-gray-900/5',
				featured ? 'order-first bg-gray-900 lg:order-none' : 'bg-white',
			)}
		>
			<h3
				className={clsx(
					'flex items-center text-sm font-semibold',
					featured ? 'text-white' : 'text-gray-900',
				)}
			>
				<Logomark
					className={clsx(
						'h-6 w-6 flex-none rounded-md',
						!featured && 'grayscale',
						plan.slug === 'free' && 'opacity-40',
					)}
				/>
				<span className="ml-4">{plan.name}</span>
				<span
					className={clsx(
						'ml-auto text-xs font-medium',
						featured ? 'text-gray-400' : 'text-gray-500',
					)}
				>
					{plan.range}
				</span>
			</h3>
			<p
				className={clsx(
					'relative mt-5 flex items-baseline gap-x-2 text-3xl tracking-tight',
					featured ? 'text-white' : 'text-gray-900',
				)}
			>
				{isFree ? (
					formatPlanPrice(0)
				) : (
					<>
						<span>
							{formatPlanPrice(
								interval === 'yearly' ? plan.priceYearly : plan.priceMonthly,
							)}
						</span>
						<span
							className={clsx(
								'text-sm tracking-normal',
								featured ? 'text-gray-400' : 'text-gray-500',
							)}
						>
							/{interval === 'yearly' ? 'year' : 'month'}
						</span>
					</>
				)}
			</p>
			<p
				className={clsx(
					'mt-3 text-sm',
					featured ? 'text-gray-300' : 'text-gray-700',
				)}
			>
				{plan.description}
			</p>
			<div className="order-last mt-6">
				<ul
					role="list"
					className={clsx(
						'-my-2 divide-y text-sm',
						featured
							? 'divide-gray-800 text-gray-300'
							: 'divide-gray-200 text-gray-700',
					)}
				>
					{plan.features.map((feature) => (
						<li key={feature} className="flex py-2">
							<CheckIcon
								className={clsx(
									'h-6 w-6 flex-none',
									featured ? 'text-white' : 'text-brand-500',
								)}
							/>
							<span className="ml-4">{feature}</span>
						</li>
					))}
				</ul>
			</div>
			<Button
				href={getApplyUrl({ plan, interval, medium })}
				color={featured ? 'brand' : 'gray'}
				className="mt-6"
			>
				{plan.cta}
			</Button>
		</section>
	)
}

export function PricingSection({
	medium,
	as = 'h2',
	title = 'Simple pricing that grows with you.',
	description = 'Start free on up to 3 units. Move up when your portfolio outgrows it, and change plans whenever you like.',
}: {
	medium: string
	as?: 'h1' | 'h2'
	title?: React.ReactNode
	description?: React.ReactNode
}) {
	const [interval, setInterval] = useState<BillingInterval>('monthly')

	return (
		<section
			id="pricing"
			aria-labelledby="pricing-title"
			className="border-t border-gray-200 bg-gray-100 py-20 sm:py-32"
		>
			<Container>
				<SectionIntro
					id="pricing-title"
					as={as}
					align="center"
					title={title}
					description={description}
				/>

				<div className="mt-8 flex flex-col items-center gap-3">
					<div className="relative">
						<RadioGroup
							value={interval}
							onChange={setInterval}
							className="grid grid-cols-2"
						>
							{intervals.map((option) => (
								<Radio
									key={option.value}
									value={option.value}
									className={clsx(
										'data-focus:outline-brand-500 cursor-pointer border border-gray-300 px-[calc(--spacing(3)-1px)] py-[calc(--spacing(2)-1px)] text-sm text-gray-700 outline-2 outline-offset-2 transition-colors hover:border-gray-400 data-focus:outline',
										option.value === 'monthly'
											? 'rounded-l-lg'
											: '-ml-px rounded-r-lg',
									)}
								>
									{option.label}
								</Radio>
							))}
						</RadioGroup>
						<div
							aria-hidden="true"
							className={clsx(
								'bg-brand-500 pointer-events-none absolute inset-0 z-10 grid grid-cols-2 overflow-hidden rounded-lg transition-all duration-300',
								interval === 'monthly'
									? '[clip-path:inset(0_50%_0_0)]'
									: '[clip-path:inset(0_0_0_calc(50%-1px))]',
							)}
						>
							{intervals.map((option) => (
								<div
									key={option.value}
									className={clsx(
										'py-2 text-center text-sm font-semibold text-white',
										option.value === 'yearly' && '-ml-px',
									)}
								>
									{option.label}
								</div>
							))}
						</div>
					</div>
					<p className="text-sm text-gray-500">
						Yearly billing: {YEARLY_DISCOUNT_LABEL.toLowerCase()}, two months
						free.
					</p>
				</div>

				<div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 items-start gap-x-8 gap-y-10 sm:mt-20 lg:max-w-none lg:grid-cols-3">
					{plans.map((plan) => (
						<PlanCard
							key={plan.slug}
							plan={plan}
							interval={interval}
							medium={medium}
						/>
					))}
				</div>

				<p className="mt-10 text-center text-sm text-gray-600">
					Managing more than 100 units?{' '}
					<a
						href={ENTERPRISE_ACCOUNT_REQUEST_URL}
						className="font-semibold text-gray-900 underline"
					>
						Talk to us about Enterprise
					</a>
					.
				</p>
			</Container>
		</section>
	)
}
