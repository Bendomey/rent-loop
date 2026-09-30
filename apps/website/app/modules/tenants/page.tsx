import {
	ArrowsRightLeftIcon,
	BanknotesIcon,
	BuildingOfficeIcon,
	ClipboardDocumentCheckIcon,
	ClipboardDocumentListIcon,
	DevicePhoneMobileIcon,
	DocumentTextIcon,
	HomeIcon,
	MegaphoneIcon,
	ShieldCheckIcon,
	UserCircleIcon,
	WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useState } from 'react'
import { Link } from 'react-router'
import {
	AppStoreLink,
	BackgroundIllustration,
	Button,
	CallToAction,
	CheckIcon,
	CircleBackground,
	Container,
	FeatureCard,
	FeatureGrid,
	IconBadge,
	MarketingPage,
	PhoneFrame,
	PlayStoreLink,
	SectionIntro,
	TenantHomeScreen,
	TenantInvoiceScreen,
	TenantMaintenanceScreen,
	TenantPaymentsScreen,
} from '~/components/marketing'

function Hero() {
	return (
		<div className="overflow-hidden py-20 sm:py-32 lg:pb-32 xl:pb-36">
			<Container>
				<div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
					<div className="relative z-10 mx-auto max-w-2xl lg:col-span-7 lg:max-w-none lg:pt-6 xl:col-span-6">
						<h1 className="text-4xl font-medium tracking-tight text-gray-900">
							Your rental, in your pocket.
						</h1>
						<p className="mt-6 text-lg text-gray-600">
							Pay rent, raise maintenance issues and find your move-in checklist
							in the app your landlord gave you. No more digging through
							WhatsApp for receipts.
						</p>
						<div className="mt-8 flex flex-wrap gap-x-6 gap-y-4">
							<PlayStoreLink />
							<AppStoreLink />
						</div>
					</div>
					<div className="relative mt-10 sm:mt-20 lg:col-span-5 lg:row-span-2 lg:mt-0 xl:col-span-6">
						<BackgroundIllustration className="absolute top-4 left-1/2 h-[1026px] w-[1026px] -translate-x-1/3 mask-[linear-gradient(to_bottom,white_20%,transparent_75%)] stroke-gray-300/70 sm:top-16 sm:-translate-x-1/2 lg:-top-16 lg:ml-12 xl:-top-14 xl:ml-0" />
						<div className="-mx-4 h-[448px] mask-[linear-gradient(to_bottom,white_60%,transparent)] px-9 sm:mx-0 lg:absolute lg:-inset-x-10 lg:-top-10 lg:-bottom-20 lg:h-auto lg:px-0 lg:pt-10 xl:-bottom-32">
							<PhoneFrame className="mx-auto max-w-[366px]" light>
								<TenantHomeScreen />
							</PhoneFrame>
						</div>
					</div>
					<div className="relative -mt-4 lg:col-span-7 lg:mt-0 xl:col-span-6">
						<ul
							role="list"
							className="mx-auto flex max-w-2xl flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-gray-700 lg:mx-0 lg:justify-start"
						>
							{[
								'Free for tenants',
								'Phone-number login',
								'No password to forget',
							].map((item) => (
								<li key={item} className="flex items-center gap-2">
									<CheckIcon className="text-brand-500 h-6 w-6 flex-none" />
									{item}
								</li>
							))}
						</ul>
					</div>
				</div>
			</Container>
		</div>
	)
}

const features = [
	{
		name: 'Pay rent',
		description:
			'See your outstanding balance, what’s due next and every invoice you’ve already paid, all in one list.',
		icon: BanknotesIcon,
		screen: TenantPaymentsScreen,
	},
	{
		name: 'Maintenance requests',
		description:
			'Snap a photo, describe the issue and watch it move from New to Resolved. Every status change and comment is logged, and updates arrive as notifications.',
		icon: WrenchScrewdriverIcon,
		screen: TenantMaintenanceScreen,
	},
	{
		name: 'Itemised invoices',
		description:
			'Open any invoice to see the line items, what you’ve paid so far and when the rest is due. Log a bank transfer or cash payment and your manager confirms it.',
		icon: DocumentTextIcon,
		screen: TenantInvoiceScreen,
	},
]

function FeaturesDesktop() {
	const [selectedIndex, setSelectedIndex] = useState(0)
	const SelectedScreen = features[selectedIndex]!.screen

	function onKeyDown(event: React.KeyboardEvent) {
		const step =
			event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
		if (!step) return
		event.preventDefault()
		const next = (selectedIndex + step + features.length) % features.length
		setSelectedIndex(next)
		document.getElementById(`tenant-feature-tab-${next}`)?.focus()
	}

	return (
		<div className="grid grid-cols-12 items-center gap-8 lg:gap-16 xl:gap-24">
			<div
				role="tablist"
				aria-orientation="vertical"
				onKeyDown={onKeyDown}
				className="relative z-10 order-last col-span-6 space-y-6"
			>
				{features.map((feature, featureIndex) => (
					<div
						key={feature.name}
						className={clsx(
							'relative rounded-2xl transition-colors',
							featureIndex === selectedIndex
								? 'bg-gray-800'
								: 'hover:bg-gray-800/30',
						)}
					>
						<div className="relative z-10 p-8">
							<IconBadge icon={feature.icon} dark />
							<h3 className="mt-6 text-lg font-semibold text-white">
								<button
									type="button"
									role="tab"
									id={`tenant-feature-tab-${featureIndex}`}
									aria-selected={featureIndex === selectedIndex}
									aria-controls="tenant-feature-panel"
									tabIndex={featureIndex === selectedIndex ? 0 : -1}
									onClick={() => setSelectedIndex(featureIndex)}
									className="text-left focus:outline-none"
								>
									<span className="absolute inset-0 rounded-2xl" />
									{feature.name}
								</button>
							</h3>
							<p className="mt-2 text-sm text-gray-400">
								{feature.description}
							</p>
						</div>
					</div>
				))}
			</div>
			<div className="relative col-span-6">
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
					<CircleBackground color="#c8003a" className="animate-spin-slower" />
				</div>
				<PhoneFrame className="z-10 mx-auto w-full max-w-[366px]" light>
					<div
						role="tabpanel"
						id="tenant-feature-panel"
						aria-labelledby={`tenant-feature-tab-${selectedIndex}`}
						className="col-start-1 row-start-1 flex"
					>
						<SelectedScreen />
					</div>
				</PhoneFrame>
			</div>
		</div>
	)
}

function FeaturesMobile() {
	return (
		<div className="space-y-6">
			{features.map((feature, featureIndex) => (
				<div
					key={feature.name}
					className="relative overflow-hidden rounded-2xl bg-gray-800 px-5 py-6"
				>
					<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
						<CircleBackground
							color="#c8003a"
							className={featureIndex % 2 === 1 ? 'rotate-180' : undefined}
						/>
					</div>
					<PhoneFrame className="relative mx-auto w-full max-w-[366px]" light>
						<feature.screen />
					</PhoneFrame>
					<div className="absolute inset-x-0 bottom-0 bg-gray-800/95 p-6 backdrop-blur-sm sm:p-10">
						<IconBadge icon={feature.icon} dark />
						<h3 className="mt-6 text-sm font-semibold text-white sm:text-lg">
							{feature.name}
						</h3>
						<p className="mt-2 text-sm text-gray-400">{feature.description}</p>
					</div>
				</div>
			))}
		</div>
	)
}

function PrimaryFeatures() {
	return (
		<section
			id="features"
			aria-labelledby="tenant-features-title"
			className="bg-gray-900 py-20 sm:py-32"
		>
			<Container>
				<SectionIntro
					id="tenant-features-title"
					dark
					title="Everything you open the app for."
					description="If your landlord uses Rentloop, here’s what’s waiting for you when you install."
				/>
			</Container>
			<Container className="mt-16 md:hidden">
				<FeaturesMobile />
			</Container>
			<Container className="hidden md:mt-20 md:block">
				<FeaturesDesktop />
			</Container>
		</section>
	)
}

const moreFeatures = [
	{
		name: 'Phone-number login',
		description:
			'Enter your number, get a one-time code and you’re in. No password to forget, no email to mistype.',
		icon: DevicePhoneMobileIcon,
	},
	{
		name: 'Rental at a glance',
		description:
			'Rent, status, move-in date and your next payment on the home screen, with pay, report and view one tap away.',
		icon: HomeIcon,
	},
	{
		name: 'Multiple rentals',
		description: 'Got two places? Switch between them from a single login.',
		icon: ArrowsRightLeftIcon,
	},
	{
		name: 'Announcements',
		description:
			'From rent reminders to the water tanker schedule, with the full history to scroll back through.',
		icon: MegaphoneIcon,
	},
	{
		name: 'Your profile',
		description:
			'Personal info, ID, employment and emergency contact, kept up to date in one place.',
		icon: UserCircleIcon,
	},
	{
		name: 'Unit details',
		description:
			'Photos of your place, the feature list and the house rules, handy for guests.',
		icon: BuildingOfficeIcon,
	},
	{
		name: 'Condition reports and disputes',
		description:
			'Review the move-in checklist your landlord shared, and raise a dispute if something is off.',
		icon: ClipboardDocumentCheckIcon,
	},
	{
		name: 'Application status',
		description:
			'Applied for a place? Follow your application through each stage in real time.',
		icon: ClipboardDocumentListIcon,
	},
	{
		name: 'Account safety',
		description:
			'Log out of a lost phone, or delete your account whenever you want. Your data, your call.',
		icon: ShieldCheckIcon,
	},
]

function MoreFeatures() {
	return (
		<section
			id="more"
			aria-labelledby="tenant-more-title"
			className="py-20 sm:py-32"
		>
			<Container>
				<SectionIntro
					id="tenant-more-title"
					align="center"
					title="The rest of your rental life."
					description="Everything else lives behind the More tab. Yes, even deleting your account."
				/>
				<FeatureGrid>
					{moreFeatures.map((feature) => (
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

const pitch =
	'Hi, I found this rental platform that handles rent collection, maintenance and rental agreements in one place. The first 3 units are free. Want me to send the demo? Their site has a section for managers: rentloopapp.com/managers'

const pitchPoints = [
	{
		name: 'No more “did you get it?”',
		description:
			'Every receipt in one place, with a paper trail you both share.',
	},
	{
		name: 'A real maintenance ticket',
		description: 'Not a WhatsApp message that scrolls away by Thursday.',
	},
	{
		name: 'Gentle rent reminders',
		description: 'Push notifications instead of guilt-trip phone calls.',
	},
	{
		name: 'Free for up to 3 units',
		description: 'Your landlord pays nothing until they go past 3 units.',
	},
]

function LandlordPitch() {
	const [copied, setCopied] = useState(false)

	function copyPitch() {
		void navigator.clipboard.writeText(pitch).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		})
	}

	return (
		<section
			id="landlord"
			aria-labelledby="tenant-landlord-title"
			className="border-t border-gray-200 py-20 sm:py-32"
		>
			<Container>
				<div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
					<div className="lg:col-span-6">
						<SectionIntro
							id="tenant-landlord-title"
							title="Landlord still on WhatsApp? Send them this page."
							description="Tenants don’t pick the rent platform, landlords do. So here’s everything you need to make the case."
						/>
						<ul role="list" className="mt-10 max-w-2xl space-y-6">
							{pitchPoints.map((point) => (
								<li key={point.name} className="flex gap-3">
									<CheckIcon className="text-brand-500 h-6 w-6 flex-none" />
									<p className="text-sm text-gray-700">
										<span className="font-semibold text-gray-900">
											{point.name}.
										</span>{' '}
										{point.description}
									</p>
								</li>
							))}
						</ul>
					</div>
					<div className="mt-16 max-w-2xl lg:col-span-6 lg:mt-0">
						<div className="rounded-2xl border border-gray-200 p-8">
							<h3 className="font-semibold text-gray-900">
								The pitch, ready to send
							</h3>
							<p className="mt-4 text-sm text-gray-700">{pitch}</p>
							<div className="mt-8 flex flex-wrap gap-3">
								<Button
									href={`https://wa.me/?text=${encodeURIComponent(pitch)}`}
								>
									Send via WhatsApp
								</Button>
								<Button variant="outline" onClick={copyPitch}>
									{copied ? 'Copied' : 'Copy the pitch'}
								</Button>
								<Button
									variant="outline"
									href={`mailto:?subject=${encodeURIComponent('Check out this rental platform')}&body=${encodeURIComponent(pitch)}`}
								>
									Email it instead
								</Button>
							</div>
						</div>
						<p className="mt-6 text-sm text-gray-600">
							Want to read the manager pitch yourself?{' '}
							<Link
								to="/managers"
								className="hover:text-brand-600 font-semibold text-gray-900"
							>
								See the manager page <span aria-hidden="true">→</span>
							</Link>
						</p>
					</div>
				</div>
			</Container>
		</section>
	)
}

export function TenantsPage() {
	return (
		<MarketingPage current="tenants">
			<Hero />
			<PrimaryFeatures />
			<MoreFeatures />
			<LandlordPitch />
			<CallToAction
				title="Get the Rentloop app"
				description="Free for tenants. Sign in with your phone number and a one-time code, no password needed."
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
