import clsx from 'clsx'
import {
	BackgroundIllustration,
	Button,
	Container,
	ManagerHomeScreen,
	PhoneFrame,
} from '~/components/marketing'
import { BOOK_DEMO_URL, PROPERTY_MANAGER_APP_URL } from '~/lib/constants'

const rentalTypes = [
	{ name: 'Apartments', className: 'font-bold tracking-tight' },
	{ name: 'Student housing', className: 'font-semibold tracking-tight' },
	{ name: 'Short stays', className: 'font-bold tracking-tight' },
	{ name: 'Commercial', className: 'font-semibold tracking-tight' },
	{ name: 'Estates', className: 'font-bold tracking-tight' },
	{ name: 'Hostels', className: 'font-bold tracking-tight max-sm:hidden' },
]

function PlayIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
			<circle cx="12" cy="12" r="11.5" stroke="#D4D4D4" />
			<path
				d="M9.5 14.382V9.618a.5.5 0 0 1 .724-.447l4.764 2.382a.5.5 0 0 1 0 .894l-4.764 2.382a.5.5 0 0 1-.724-.447Z"
				fill="#A3A3A3"
				stroke="#A3A3A3"
			/>
		</svg>
	)
}

export function Hero() {
	return (
		<div className="overflow-hidden py-20 sm:py-32 lg:pb-32 xl:pb-36">
			<Container>
				<div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
					<div className="relative z-10 mx-auto max-w-2xl lg:col-span-7 lg:max-w-none lg:pt-6 xl:col-span-6">
						<h1 className="text-4xl font-medium tracking-tight text-gray-900">
							Property management, without the WhatsApp chaos.
						</h1>
						<p className="mt-6 text-lg text-gray-600">
							Rentloop keeps your properties, tenants, rent and maintenance
							together, so your rental business stops living in WhatsApp,
							spreadsheets and bank statements. Tenants pay online, and every
							payment lands against the right unit.
						</p>
						<div className="mt-8 flex flex-wrap gap-x-6 gap-y-4">
							<Button href={`${PROPERTY_MANAGER_APP_URL}/apply`}>
								Start free
							</Button>
							<Button href={BOOK_DEMO_URL} variant="outline">
								<PlayIcon className="h-6 w-6 flex-none" />
								<span className="ml-2.5">Book a demo</span>
							</Button>
						</div>
					</div>
					<div className="relative mt-10 sm:mt-20 lg:col-span-5 lg:row-span-2 lg:mt-0 xl:col-span-6">
						<BackgroundIllustration className="absolute top-4 left-1/2 h-[1026px] w-[1026px] -translate-x-1/3 mask-[linear-gradient(to_bottom,white_20%,transparent_75%)] stroke-gray-300/70 sm:top-16 sm:-translate-x-1/2 lg:-top-16 lg:ml-12 xl:-top-14 xl:ml-0" />
						<div className="-mx-4 h-[448px] mask-[linear-gradient(to_bottom,white_60%,transparent)] px-9 sm:mx-0 lg:absolute lg:-inset-x-10 lg:-top-10 lg:-bottom-20 lg:h-auto lg:px-0 lg:pt-10 xl:-bottom-32">
							<PhoneFrame className="mx-auto max-w-[366px]" light>
								<ManagerHomeScreen />
							</PhoneFrame>
						</div>
					</div>
					<div className="relative -mt-4 lg:col-span-7 lg:mt-0 xl:col-span-6">
						<p className="text-center text-sm font-semibold text-gray-900 lg:text-left">
							Built for every kind of rental
						</p>
						<ul
							role="list"
							className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-x-10 gap-y-8 lg:mx-0 lg:justify-start"
						>
							{rentalTypes.map((rail) => (
								<li
									key={rail.name}
									className={clsx(
										'flex h-8 items-center text-xl whitespace-nowrap text-gray-400 sm:text-2xl',
										rail.className,
									)}
								>
									{rail.name}
								</li>
							))}
						</ul>
					</div>
				</div>
			</Container>
		</div>
	)
}
