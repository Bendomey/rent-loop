import {
	BanknotesIcon,
	UserPlusIcon,
	WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import {
	CircleBackground,
	Container,
	IconBadge,
	ManagerApplicationsScreen,
	ManagerMaintenanceScreen,
	ManagerMoneyScreen,
	PhoneFrame,
	SectionIntro,
} from '~/components/marketing'

const features = [
	{
		name: 'Know who has paid, without checking your bank app',
		description:
			'Invoices go out on time and every online, bank or cash payment lands against the right tenant and unit. Outstanding rent is one tap away.',
		icon: BanknotesIcon,
		screen: ManagerMoneyScreen,
	},
	{
		name: 'Maintenance that doesn’t get lost in a chat',
		description:
			'Tenants report issues with photos from their app. You move each request from new to resolved, and everyone can see where it stands.',
		icon: WrenchScrewdriverIcon,
		screen: ManagerMaintenanceScreen,
	},
	{
		name: 'From application to signed agreement',
		description:
			'Applicants apply online, you review them in one place, and the rental agreement is signed electronically before move-in.',
		icon: UserPlusIcon,
		screen: ManagerApplicationsScreen,
	},
]

function FeaturesDesktop() {
	const [selectedIndex, setSelectedIndex] = useState(0)
	const SelectedScreen = features[selectedIndex]!.screen

	return (
		<div className="grid grid-cols-12 items-center gap-8 lg:gap-16 xl:gap-24">
			<div
				role="tablist"
				aria-orientation="vertical"
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
									aria-selected={featureIndex === selectedIndex}
									onClick={() => setSelectedIndex(featureIndex)}
									className="text-left focus:outline-hidden"
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
						key={selectedIndex}
						role="tabpanel"
						className="animate-fade-in col-start-1 row-start-1 flex opacity-0"
					>
						<SelectedScreen />
					</div>
				</PhoneFrame>
			</div>
		</div>
	)
}

function FeaturesMobile() {
	const [activeIndex, setActiveIndex] = useState(0)
	const slideContainerRef = useRef<HTMLDivElement>(null)
	const slideRefs = useRef<Array<HTMLDivElement>>([])

	useEffect(() => {
		const observer = new window.IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && entry.target instanceof HTMLDivElement) {
						setActiveIndex(slideRefs.current.indexOf(entry.target))
						break
					}
				}
			},
			{ root: slideContainerRef.current, threshold: 0.6 },
		)
		for (const slide of slideRefs.current) {
			if (slide) observer.observe(slide)
		}
		return () => observer.disconnect()
	}, [])

	return (
		<>
			<div
				ref={slideContainerRef}
				className="-mb-4 flex snap-x snap-mandatory -space-x-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-4 [scrollbar-width:none] sm:-space-x-6 [&::-webkit-scrollbar]:hidden"
			>
				{features.map((feature, featureIndex) => (
					<div
						key={feature.name}
						ref={(ref) => {
							if (ref) slideRefs.current[featureIndex] = ref
						}}
						className="w-full flex-none snap-center px-4 sm:px-6"
					>
						<div className="relative transform overflow-hidden rounded-2xl bg-gray-800 px-5 py-6">
							<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
								<CircleBackground
									color="#c8003a"
									className={featureIndex % 2 === 1 ? 'rotate-180' : undefined}
								/>
							</div>
							<PhoneFrame
								className="relative mx-auto w-full max-w-[366px]"
								light
							>
								<feature.screen />
							</PhoneFrame>
							<div className="absolute inset-x-0 bottom-0 bg-gray-800/95 p-6 backdrop-blur-sm sm:p-10">
								<IconBadge icon={feature.icon} dark />
								<h3 className="mt-6 text-sm font-semibold text-white sm:text-lg">
									{feature.name}
								</h3>
								<p className="mt-2 text-sm text-gray-400">
									{feature.description}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
			<div className="mt-6 flex justify-center gap-3">
				{features.map((feature, featureIndex) => (
					<button
						type="button"
						key={feature.name}
						className={clsx(
							'relative h-0.5 w-4 rounded-full',
							featureIndex === activeIndex ? 'bg-gray-300' : 'bg-gray-500',
						)}
						aria-label={`Go to slide ${featureIndex + 1}`}
						onClick={() =>
							slideRefs.current[featureIndex]?.scrollIntoView({
								block: 'nearest',
								inline: 'nearest',
							})
						}
					>
						<span className="absolute -inset-x-1.5 -inset-y-3" />
					</button>
				))}
			</div>
		</>
	)
}

export function PrimaryFeatures() {
	return (
		<section
			id="features"
			aria-label="What Rentloop does for property managers"
			className="bg-gray-900 py-20 sm:py-32"
		>
			<Container>
				<SectionIntro
					dark
					className="lg:max-w-3xl"
					title="Everything that happens after someone rents your property."
					description="Application, agreement, move-in, rent, maintenance, renewal, move-out. Rentloop covers the whole loop, not just the paperwork at the start — on the web and on your phone."
				/>
			</Container>
			<div className="mt-16 md:hidden">
				<FeaturesMobile />
			</div>
			<Container className="hidden md:mt-20 md:block">
				<FeaturesDesktop />
			</Container>
		</section>
	)
}
