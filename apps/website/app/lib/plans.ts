export type BillingInterval = 'monthly' | 'yearly'

export interface Plan {
	name: string
	slug: string
	range: string
	maxUnits: number
	priceMonthly: number
	priceYearly: number
	description: string
	highlighted: boolean
	cta: string
	features: string[]
}

export const YEARLY_DISCOUNT_LABEL = 'Save 17%'

const freePlanFeatures = [
	'Tenant management',
	'Rental tracking',
	'Maintenance requests',
	'Rent collection & payment tracking',
]

const paidPlanFeatures = [
	...freePlanFeatures,
	'Analytics & reporting',
	'Document management',
	'Team member access',
	'Email & chat support',
]

export const plans: Plan[] = [
	{
		name: 'Free',
		slug: 'free',
		range: 'Up to 3 units',
		maxUnits: 3,
		priceMonthly: 0,
		priceYearly: 0,
		description:
			'Everything you need to run a handful of units, at no cost. No card required.',
		highlighted: false,
		cta: 'Get started free',
		features: freePlanFeatures,
	},
	{
		name: 'Starter',
		slug: 'starter',
		range: 'Up to 50 units',
		maxUnits: 50,
		priceMonthly: 149,
		priceYearly: 1490,
		description:
			'For growing portfolios that need reporting, documents and a team.',
		highlighted: true,
		cta: 'Choose Starter',
		features: paidPlanFeatures,
	},
	{
		name: 'Growth',
		slug: 'growth',
		range: 'Up to 100 units',
		maxUnits: 100,
		priceMonthly: 299,
		priceYearly: 2990,
		description:
			'The same full feature set, with room for a much larger portfolio.',
		highlighted: false,
		cta: 'Choose Growth',
		features: paidPlanFeatures,
	},
]

export function formatPlanPrice(amount: number): string {
	return `GHS ${amount.toLocaleString('en-GH')}`
}

export function planPrice(plan: Plan, interval: BillingInterval): number {
	return interval === 'yearly' ? plan.priceYearly : plan.priceMonthly
}

export const billingFaqs = [
	{
		question: 'How do I choose a plan?',
		answer:
			'You pick your plan and billing interval when you create your account. The Free plan activates immediately — no card needed. For Starter or Growth you are taken to checkout, and your subscription activates as soon as payment is confirmed.',
	},
	{
		question: 'What counts as a unit?',
		answer:
			'Each individually rentable space counts as one unit — a single apartment, a self-contained, a chamber and hall, a hostel room, a commercial space, or a standalone house. Common areas and shared facilities do not count.',
	},
	{
		question: 'What happens when I upgrade?',
		answer:
			'Upgrades take effect immediately. We work out the unused time left on your current plan and credit it against the new one, so you only pay the difference. For example, moving from Starter Monthly to Growth Monthly with 15 days left leaves roughly GHS 74.50 of unused credit, so you pay about GHS 224.50 today and your new plan starts right away.',
	},
	{
		question: 'What happens when I downgrade?',
		answer:
			'Downgrades are scheduled for your next renewal date rather than applied straight away. You keep full access to your current plan until then, and the cheaper plan starts on the day your current period ends. Nothing you have already paid for is lost.',
	},
	{
		question: 'Can I switch between monthly and yearly?',
		answer:
			'Yes. Switching between monthly and yearly billing takes effect at your next renewal, so there is no proration to work out. Yearly billing costs the equivalent of ten months — about 17% less than paying monthly.',
	},
	{
		question: 'Can I hit my unit limit?',
		answer:
			'Each plan has a maximum unit count: 3 on Free, 50 on Starter, and 100 on Growth. When you reach it, Rentloop will prompt you to upgrade before you can add more units. Nothing you already have is affected.',
	},
	{
		question: 'What payment methods do you accept?',
		answer:
			'We accept Mobile Money from MTN, Telecel and AirtelTigo, along with bank transfer and card payments. Everything is billed in Ghana cedis, and renewals are collected automatically on your billing date.',
	},
	{
		question: 'What happens if I cancel?',
		answer:
			'You keep full access until the end of the period you have paid for, then your account returns to the Free plan. If you have more than 3 units at that point, your account becomes read-only — you can still view and export all of your data, but you cannot create new units, leases or tenants until you subscribe again. Nothing is ever deleted.',
	},
	{
		question: 'Is there a long-term contract?',
		answer:
			'No. Monthly plans are month-to-month and yearly plans run for a year. You can cancel at any time and you will not be charged again after your current period ends.',
	},
]
