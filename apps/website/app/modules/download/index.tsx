import {
	BellIcon,
	ChatBubbleLeftRightIcon,
	ClipboardDocumentCheckIcon,
	CreditCardIcon,
	DocumentTextIcon,
	WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import {
	AppStoreLink,
	BackgroundIllustration,
	CallToAction,
	Container,
	Faqs,
	FeatureCard,
	FeatureGrid,
	IconBadge,
	MarketingPage,
	PhoneFrame,
	PlayStoreLink,
	SectionIntro,
	TenantHomeScreen,
} from '~/components/marketing'

export function DownloadModule() {
	return (
		<MarketingPage>
			<Hero />
			<section
				aria-labelledby="features-title"
				className="border-t border-gray-200 py-20 sm:py-32"
			>
				<Container>
					<SectionIntro
						id="features-title"
						title="Everything you need as a tenant"
						description="From paying rent to tracking repairs, the Rentloop app keeps your tenancy in one place."
					/>
					<FeatureGrid>
						{features.map((feature) => (
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
			<Faqs faqs={faqs} />
			<CallToAction
				title="Get the app"
				description="Free for tenants on Android and iPhone. Your property manager sends the invite."
				actions={
					<>
						<PlayStoreLink color="white" />
						<AppStoreLink color="white" />
					</>
				}
			/>
		</MarketingPage>
	)
}

function Hero() {
	return (
		<div className="overflow-hidden py-20 sm:py-32 lg:pb-32 xl:pb-36">
			<Container>
				<div className="lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8">
					<div className="relative z-10 mx-auto max-w-2xl lg:col-span-7 lg:max-w-none xl:col-span-6">
						<h1 className="text-4xl font-medium tracking-tight text-gray-900">
							Your rental, in your pocket.
						</h1>
						<p className="mt-6 text-lg text-gray-600">
							Pay rent, submit maintenance requests, track your application and
							stay in touch with your landlord, all from your phone.
						</p>
						<div className="mt-8 flex flex-wrap gap-x-6 gap-y-4">
							<PlayStoreLink />
							<AppStoreLink />
						</div>
						<p className="mt-4 text-sm text-gray-500">
							Free on Android. The iPhone app is coming soon.
						</p>
					</div>
					<div className="relative mt-10 sm:mt-20 lg:col-span-5 lg:mt-0 xl:col-span-6">
						<BackgroundIllustration className="absolute top-4 left-1/2 h-[1026px] w-[1026px] -translate-x-1/3 mask-[linear-gradient(to_bottom,white_20%,transparent_75%)] sm:top-16 sm:-translate-x-1/2 lg:-top-16 lg:ml-12 xl:-top-14 xl:ml-0" />
						<div className="-mx-4 h-[448px] mask-[linear-gradient(to_bottom,white_60%,transparent)] px-9 sm:mx-0 lg:h-[560px] lg:px-0">
							<PhoneFrame className="mx-auto max-w-[366px]" light>
								<TenantHomeScreen />
							</PhoneFrame>
						</div>
					</div>
				</div>
			</Container>
		</div>
	)
}

const features = [
	{
		name: 'Pay rent from anywhere',
		description:
			'Pay in a few taps online, with an instant confirmation and a record of every payment.',
		icon: CreditCardIcon,
	},
	{
		name: 'Track your application',
		description:
			'Follow every step of your rental application, from submission to approval. No more chasing for updates.',
		icon: ClipboardDocumentCheckIcon,
	},
	{
		name: 'Submit maintenance requests',
		description:
			'Report an issue in your unit, add photos, and follow its status until it is resolved.',
		icon: WrenchScrewdriverIcon,
	},
	{
		name: 'View your rental',
		description:
			'Your rental agreement, key dates and unit details, always at hand. No digging through emails or paperwork.',
		icon: DocumentTextIcon,
	},
	{
		name: 'Stay notified',
		description:
			'Push notifications for payment confirmations, maintenance updates and messages from your property manager.',
		icon: BellIcon,
	},
	{
		name: 'Message your landlord',
		description:
			'Talk to your property manager in the app, with every conversation tied to your tenancy.',
		icon: ChatBubbleLeftRightIcon,
	},
]

const faqs = [
	{
		question: 'Who is the Rentloop mobile app for?',
		answer:
			'Tenants. It lets you pay rent, track your rental application, submit maintenance requests, view your rental and talk to your property manager, all from your phone.',
	},
	{
		question: 'Is the app free to download?',
		answer:
			'Yes. The Rentloop tenant app is free to download and use. There are no fees for tenants.',
	},
	{
		question: 'Which platforms are supported?',
		answer:
			'iOS (iPhone and iPad) and Android. The app requires iOS 14 or later, or Android 8.0 or later.',
	},
	{
		question: 'How do I get access to the app?',
		answer:
			'Your property manager sends you an invitation once they add you as a tenant in Rentloop. Download the app and sign in with the details from your invitation.',
	},
	{
		question: 'Can I pay rent through the app?',
		answer:
			'Yes, online. Each payment is recorded instantly, so you and your landlord share a clear payment history.',
	},
	{
		question: 'How do I submit a maintenance request?',
		answer:
			'Open the app, go to your unit and tap "New Request". Describe the issue, attach photos if needed and submit. You will be notified as your property manager updates the status.',
	},
	{
		question: 'Can I see the status of my rental application?',
		answer:
			'Yes. If your landlord processes applications in Rentloop, you can follow each stage of your application in the app.',
	},
	{
		question: 'What if I have multiple tenancies?',
		answer:
			'One account supports multiple active tenancies. You can switch between them if you rent more than one unit through Rentloop.',
	},
]
