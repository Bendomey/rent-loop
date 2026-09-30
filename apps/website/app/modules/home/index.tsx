import {
	BanknotesIcon,
	BuildingOffice2Icon,
	ChartBarIcon,
	DevicePhoneMobileIcon,
	DocumentTextIcon,
	WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import { Link } from 'react-router'
import { Hero } from './hero'
import { PrimaryFeatures } from './primary-features'
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
	Screenshot,
	SectionIntro,
} from '~/components/marketing'
import {
	BOOK_DEMO_URL,
	PROPERTY_MANAGER_APP_URL,
	WHATSAPP_URL,
} from '~/lib/constants'
import { billingFaqs } from '~/lib/plans'

const secondaryFeatures = [
	{
		name: 'Properties, blocks and units',
		description:
			'Organise buildings the way they actually are — properties, blocks and units. A single flat or two hundred, long-let or short stay.',
		icon: BuildingOffice2Icon,
	},
	{
		name: 'Agreements with e-signatures',
		description:
			'Write rental agreements in the built-in editor and have tenants sign them electronically. No printing, no chasing signatures.',
		icon: DocumentTextIcon,
	},
	{
		name: 'Rent, invoices and expenses',
		description:
			'Invoices go out on schedule in your currency. Online and bank payments are logged against the right tenant, and you can record cash you took in person.',
		icon: BanknotesIcon,
	},
	{
		name: 'A maintenance board',
		description:
			'New, in progress, in review, resolved. Every request keeps its photos, notes and history attached to the unit.',
		icon: WrenchScrewdriverIcon,
	},
	{
		name: 'The record keeps itself',
		description:
			'Payments, expenses, documents and activity stay attached to the right property, so the answer is there when someone asks.',
		icon: ChartBarIcon,
	},
	{
		name: 'An app for your tenants',
		description: (
			<>
				Tenants pay rent, raise issues and find their paperwork on their phone,
				instead of scrolling back through WhatsApp.{' '}
				<Link to="/tenants" className="font-semibold text-gray-900">
					See the tenant app <span aria-hidden="true">→</span>
				</Link>
			</>
		),
		icon: DevicePhoneMobileIcon,
	},
]

function SecondaryFeatures() {
	return (
		<section
			id="secondary-features"
			aria-label="Features for running a rental business"
			className="py-20 sm:py-32"
		>
			<Container>
				<SectionIntro
					align="center"
					title="Built for how renting actually works."
					description="Everything a landlord or property manager deals with after the keys change hands, in one place instead of five."
				/>
				<FeatureGrid>
					{secondaryFeatures.map((feature) => (
						<FeatureCard
							key={feature.name}
							icon={<IconBadge icon={feature.icon} />}
							name={feature.name}
							description={feature.description}
						/>
					))}
				</FeatureGrid>
			</Container>
		</section>
	)
}

function Dashboard() {
	return (
		<section
			aria-labelledby="dashboard-title"
			className="border-t border-gray-200 py-20 sm:py-32"
		>
			<Container>
				<div className="lg:flex lg:items-end lg:justify-between lg:gap-x-8">
					<SectionIntro
						id="dashboard-title"
						title="A dashboard for every part of the building."
						description="Revenue, occupancy, outstanding rent and open requests — at a glance, on every device."
					/>
					<div className="mt-8 flex-none lg:mt-0">
						<Button href="/managers" variant="outline">
							See the property manager portal
						</Button>
					</div>
				</div>
				<Screenshot
					src="/images/pm-dashboard-hero.webp"
					alt="The Rentloop dashboard showing revenue, outstanding rent, active leases and occupancy rate."
					className="mt-16 sm:mt-20"
				/>
			</Container>
		</section>
	)
}

export function Home() {
	return (
		<MarketingPage current="home">
			<Hero />
			<PrimaryFeatures />
			<SecondaryFeatures />
			<Dashboard />
			<CallToAction
				title="Start free on up to 3 units."
				description="No card and nothing to cancel. Add your first property today and invite your tenants when you’re ready."
				actions={
					<>
						<Button href={`${PROPERTY_MANAGER_APP_URL}/apply`} color="white">
							Start free
						</Button>
						<Button href={BOOK_DEMO_URL} variant="outline" color="white">
							Book a demo
						</Button>
					</>
				}
			/>
			<PricingSection medium="home_pricing" />
			<Faqs
				faqs={billingFaqs.filter(
					(faq) =>
						faq.question !== 'How do I choose a plan?' &&
						faq.question !== 'What payment methods do you accept?',
				)}
				description={
					<>
						Anything else? Take a look at{' '}
						<Link to="/pricing" className="text-gray-900 underline">
							pricing
						</Link>{' '}
						or{' '}
						<a href={WHATSAPP_URL} className="text-gray-900 underline">
							send us a message on WhatsApp
						</a>
						.
					</>
				}
			/>
		</MarketingPage>
	)
}
