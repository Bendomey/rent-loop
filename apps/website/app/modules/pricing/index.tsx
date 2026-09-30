import {
	ArrowTrendingUpIcon,
	ArrowsRightLeftIcon,
	BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import {
	Button,
	CallToAction,
	Container,
	Faqs,
	FeatureCard,
	FeatureGrid,
	IconBadge,
	MarketingPage,
	PricingSection,
	SectionIntro,
} from '~/components/marketing'
import { getApplyUrl } from '~/lib/apply-url'
import { BOOK_DEMO_URL, ENTERPRISE_ACCOUNT_REQUEST_URL } from '~/lib/constants'
import { billingFaqs, plans } from '~/lib/plans'

export function PricingModule() {
	return (
		<MarketingPage current="pricing">
			<PricingSection
				medium="pricing_plan_card"
				as="h1"
				title="Pick the plan that fits. Change it anytime."
				description="Choose a plan and billing interval when you sign up. Start free on up to 3 units, and move up whenever your portfolio outgrows it."
			/>
			<SwitchingPlans />
			<Faqs
				faqs={billingFaqs}
				title="Billing questions"
				description="How plans, units and payments work. Still unsure? Book a demo and we'll walk you through it."
			/>
			<CallToAction
				title="Start free today"
				description="Up to 3 units on the Free plan, no card required. Upgrade when you're ready."
				actions={
					<>
						<Button
							color="brand"
							href={getApplyUrl({
								plan: plans[0],
								medium: 'pricing_cta',
								campaign: 'get_started_free',
							})}
						>
							Get started free
						</Button>
						<Button variant="outline" color="white" href={BOOK_DEMO_URL}>
							Book a demo
						</Button>
					</>
				}
			/>
		</MarketingPage>
	)
}

function SwitchingPlans() {
	return (
		<section aria-labelledby="switching-plans-title" className="py-20 sm:py-32">
			<Container>
				<SectionIntro
					id="switching-plans-title"
					title="Switching plans is painless"
					description="You never lose what you've already paid for."
				/>
				<FeatureGrid>
					<FeatureCard
						icon={<IconBadge icon={ArrowTrendingUpIcon} />}
						name="Upgrade anytime"
						description="Upgrades take effect right away, and the unused time on your current plan is credited against the new one."
					/>
					<FeatureCard
						icon={<IconBadge icon={ArrowsRightLeftIcon} />}
						name="Downgrade or switch at renewal"
						description="Downgrades and moves between monthly and yearly billing apply at your next renewal, so you keep everything until then."
					/>
					<FeatureCard
						icon={<IconBadge icon={BuildingOffice2Icon} />}
						name="Enterprise, 100+ units"
						description={
							<>
								Custom pricing, dedicated infrastructure, priority support and
								hands-on onboarding for larger portfolios.{' '}
								<a
									href={ENTERPRISE_ACCOUNT_REQUEST_URL}
									target="_blank"
									rel="noopener noreferrer"
									className="hover:text-brand-500 font-semibold text-gray-900"
								>
									Contact us <span aria-hidden="true">→</span>
								</a>
							</>
						}
					/>
				</FeatureGrid>
			</Container>
		</section>
	)
}
