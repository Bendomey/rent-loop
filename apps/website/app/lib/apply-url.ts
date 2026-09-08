import { PROPERTY_MANAGER_APP_URL } from './constants'
import type { BillingInterval, Plan } from './plans'

const UTM_SOURCE = 'rentloop_website'

interface ApplyUrlOptions {
	plan?: Plan
	interval?: BillingInterval
	medium: string
	campaign?: string
}

export function getApplyUrl({
	plan,
	interval,
	medium,
	campaign = 'plan_selection',
}: ApplyUrlOptions): string {
	const params = new URLSearchParams()

	if (plan) {
		params.set('plan', plan.slug)
		// The free plan activates immediately and has no price to bill, so an
		// interval on it would be meaningless downstream.
		if (interval && plan.priceMonthly > 0) {
			params.set('billing_interval', interval)
		}
	}

	params.set('utm_source', UTM_SOURCE)
	params.set('utm_medium', medium)
	params.set('utm_campaign', campaign)

	if (plan) {
		params.set(
			'utm_content',
			plan.priceMonthly > 0 && interval
				? `${plan.slug}_${interval}`
				: plan.slug,
		)
	}

	return `${PROPERTY_MANAGER_APP_URL}/apply?${params.toString()}`
}
