import {
	AdjustmentsHorizontalIcon,
	BuildingOffice2Icon,
	DocumentTextIcon,
	TableCellsIcon,
	UserCircleIcon,
	UsersIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {
	BackgroundIllustration,
	Button,
	CallToAction,
	CheckIcon,
	Container,
	FeatureCard,
	FeatureGrid,
	IconBadge,
	MarketingPage,
	Screenshot,
	SectionIntro,
} from '~/components/marketing'
import { BOOK_DEMO_URL, PROPERTY_MANAGER_APP_URL } from '~/lib/constants'

const APPLY_URL = `${PROPERTY_MANAGER_APP_URL}/apply`

function CheckList({
	items,
	dark = false,
	className,
}: {
	items: Array<string>
	dark?: boolean
	className?: string
}) {
	return (
		<ul
			role="list"
			className={clsx(
				'space-y-3 text-sm',
				dark ? 'text-gray-300' : 'text-gray-700',
				className,
			)}
		>
			{items.map((item) => (
				<li key={item} className="flex gap-3">
					<CheckIcon
						className={clsx(
							'h-6 w-6 flex-none',
							dark ? 'text-white' : 'text-brand-500',
						)}
					/>
					<span className="pt-0.5">{item}</span>
				</li>
			))}
		</ul>
	)
}

function ShowcaseRow({
	title,
	description,
	points,
	image,
	alt,
	dark = false,
	reverse = false,
	className,
}: {
	title: string
	description: string
	points?: Array<string>
	image: string
	alt: string
	dark?: boolean
	reverse?: boolean
	className?: string
}) {
	return (
		<div
			className={clsx(
				'mx-auto grid max-w-2xl grid-cols-1 items-center gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-12',
				className,
			)}
		>
			<div className={clsx('lg:col-span-4', reverse && 'lg:order-last')}>
				<h3
					className={clsx(
						'text-lg/6 font-semibold',
						dark ? 'text-white' : 'text-gray-900',
					)}
				>
					{title}
				</h3>
				<p
					className={clsx(
						'mt-2 text-sm',
						dark ? 'text-gray-400' : 'text-gray-700',
					)}
				>
					{description}
				</p>
				{points && <CheckList items={points} dark={dark} className="mt-6" />}
			</div>
			<Screenshot src={image} alt={alt} className="lg:col-span-8" />
		</div>
	)
}

function ScreenshotCard({
	title,
	description,
	points,
	image,
	alt,
}: {
	title: string
	description: string
	points?: Array<string>
	image: string
	alt: string
}) {
	return (
		<li>
			<Screenshot src={image} alt={alt} />
			<h3 className="mt-8 font-semibold text-gray-900">{title}</h3>
			<p className="mt-2 text-sm text-gray-700">{description}</p>
			{points && <CheckList items={points} className="mt-6" />}
		</li>
	)
}

function ScreenshotGrid({
	columns,
	children,
}: {
	columns: 2 | 3
	children: React.ReactNode
}) {
	return (
		<ul
			role="list"
			className={clsx(
				'mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:mt-20 lg:max-w-none',
				columns === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3',
			)}
		>
			{children}
		</ul>
	)
}

function Hero() {
	return (
		<div className="overflow-hidden py-20 sm:py-32">
			<Container>
				<div className="lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8">
					<div className="relative z-10 mx-auto max-w-2xl lg:col-span-5 lg:mx-0">
						<h1 className="text-4xl font-medium tracking-tight text-gray-900">
							Run the property. Not the paperwork.
						</h1>
						<p className="mt-6 text-lg text-gray-600">
							Compounds, apartment blocks, student hostels, short-lets by the
							beach. Rentloop holds the properties, the tenants, the rent, the
							maintenance and the records, so none of it lives in a WhatsApp
							group.
						</p>
						<div className="mt-8 flex flex-wrap gap-4">
							<Button href={APPLY_URL}>Start free</Button>
							<Button href={BOOK_DEMO_URL} variant="outline">
								Book a demo
							</Button>
						</div>
						<CheckList
							className="mt-10 sm:grid sm:grid-cols-2 sm:space-y-0 sm:gap-x-6 sm:gap-y-3"
							items={[
								'Free for up to 3 units, forever',
								'Long-term agreements and short stays',
								'Online, bank and cash payments',
								'Every payment invoiced, receipted and logged',
							]}
						/>
					</div>
					<div className="relative mt-16 sm:mt-20 lg:col-span-7 lg:mt-0">
						<BackgroundIllustration className="absolute top-1/2 left-1/2 h-[1026px] w-[1026px] -translate-x-1/2 -translate-y-1/2 mask-[linear-gradient(to_bottom,white_20%,transparent_75%)]" />
						<Screenshot
							src="/images/pm-dashboard-hero.webp"
							alt="Rentloop property manager dashboard showing revenue, outstanding rent and occupancy."
							className="relative"
						/>
					</div>
				</div>
			</Container>
		</div>
	)
}

function DashboardSection() {
	return (
		<section
			id="dashboard"
			aria-labelledby="dashboard-title"
			className="border-t border-gray-200 py-20 sm:py-32"
		>
			<Container>
				<SectionIntro
					id="dashboard-title"
					title="The first screen tells the whole story."
					description="The numbers that matter, in the order you actually check them. Open the app, glance, get on with your day."
				/>
				<ShowcaseRow
					className="mt-16 sm:mt-20"
					title="Analytics at a glance"
					description="Revenue, occupancy rate, active rentals and month-over-month growth, laid out as tiles you can scan in seconds."
					points={[
						'Live revenue',
						'Occupancy rate with a visual breakdown',
						'Active and expiring rentals',
						'Month-over-month growth with trends',
					]}
					image="/images/pm-analytics-at-glance.webp"
					alt="Dashboard analytics tiles showing revenue, occupancy and active rentals."
				/>
				<ScreenshotGrid columns={2}>
					<ScreenshotCard
						title="Revenue trend"
						description="Rent collected per month, broken down by property. Click through to the ledger behind any month."
						image="/images/pm-revenue-chart.webp"
						alt="Revenue trend line chart by month."
					/>
					<ScreenshotCard
						title="Unit status"
						description="Occupied, vacant, on-notice and under-maintenance units in one chart. Tap a slice to jump to that filter."
						image="/images/pm-unit-distribution.webp"
						alt="Donut chart of unit statuses across the portfolio."
					/>
				</ScreenshotGrid>
			</Container>
		</section>
	)
}

function PropertiesSection() {
	return (
		<section
			id="properties"
			aria-labelledby="properties-title"
			className="border-t border-gray-200 py-20 sm:py-32"
		>
			<Container>
				<SectionIntro
					id="properties-title"
					title="From a single flat to a 200-unit complex."
					description="Rentloop handles a one-bedroom in East Legon and a large complex on the Spintex road the same way."
				/>
				<ScreenshotGrid columns={3}>
					<ScreenshotCard
						title="Create and edit properties"
						description="Single-unit or multi-unit. Rental agreement mode for long stays, guest booking mode for short stays. Switch modes whenever your business does."
						image="/images/pm-create-property.webp"
						alt="Property creation form."
					/>
					<ScreenshotCard
						title="Blocks, wings and sections"
						description="Organize a big property into named blocks, whatever your team calls them, for cleaner navigation, reporting and per-block permissions."
						image="/images/pm-add-block.webp"
						alt="Adding a block to a property."
					/>
					<ScreenshotCard
						title="Manage units"
						description="Type, status, rent, images, features and rules. Every unit has a full record, and bulk edit handles the rest when you have 40 of them."
						image="/images/pm-add-unit.webp"
						alt="Adding a unit with pricing, features and status."
					/>
				</ScreenshotGrid>
			</Container>
		</section>
	)
}

function OccupancySection() {
	return (
		<section
			id="occupancy"
			aria-labelledby="occupancy-title"
			className="border-t border-gray-200 py-20 sm:py-32"
		>
			<Container>
				<SectionIntro
					id="occupancy-title"
					title="Where tenants become residents."
					description="Everything between “I saw your ad” and “I’m moving out”: applications, rental agreements, e-signatures, guest bookings and calendars."
				/>
				<ShowcaseRow
					className="mt-16 sm:mt-20"
					title="Rental application workflow"
					description="A guided pipeline from applicant to move-in. No more pasting details from email."
					points={[
						'Applicant details with verification',
						'Unit selection with availability check',
						'Financials and deposit calculation',
						'Document upload and review',
						'Move-in checklist and handover',
					]}
					image="/images/pm-rental-application.webp"
					alt="Rental application flow with progress steps."
				/>
				<FeatureGrid>
					<FeatureCard
						icon={<IconBadge icon={UsersIcon} />}
						name="Tenant directory"
						description="Searchable profiles with activity, payment history and maintenance history side by side. The full picture, one click in."
					/>
					<FeatureCard
						icon={<IconBadge icon={DocumentTextIcon} />}
						name="Agreements and e-signature"
						description="Write the rental agreement in a rich text editor or start from a template, collect e-signatures from both sides, and keep the signed PDF."
					/>
					<FeatureCard
						icon={<IconBadge icon={TableCellsIcon} />}
						name="Active rentals and bulk onboarding"
						description="See every active rental at a glance. New building? Import tenants in bulk from a CSV and send their invites automatically."
					/>
				</FeatureGrid>
				<ScreenshotGrid columns={2}>
					<ScreenshotCard
						title="Guest bookings"
						description="For short stays on properties in guest booking mode: check-in, check-out, cancellations and refunds without leaving Rentloop."
						image="/images/pm-guest-booking.webp"
						alt="Guest booking detail with check-in status."
					/>
					<ScreenshotCard
						title="Unit availability calendar"
						description="A month view of what is booked, vacant or on notice, per property or across your whole portfolio."
						image="/images/pm-unit-availability.webp"
						alt="Month calendar of unit availability."
					/>
				</ScreenshotGrid>
			</Container>
		</section>
	)
}

function ActivitiesSection() {
	return (
		<section
			id="activities"
			aria-labelledby="activities-title"
			className="bg-gray-900 py-20 sm:py-32"
		>
			<Container>
				<SectionIntro
					id="activities-title"
					dark
					title="The day-to-day, finally organized."
					description="Maintenance requests and announcements: the two things tenants will message you about today."
				/>
				<ShowcaseRow
					dark
					className="mt-16 sm:mt-20"
					title="Maintenance board"
					description="Every request moves through New, In Progress, In Review and Resolved. Drag, assign, comment and attach photos."
					points={[
						'Drag-and-drop board',
						'Photo attachments and internal comments',
						'Status updates tenants can see',
					]}
					image="/images/pm-maintenance-board.webp"
					alt="Maintenance board with four status columns."
				/>
				<ShowcaseRow
					dark
					reverse
					className="mt-16 sm:mt-20"
					title="Announcements"
					description="Broadcast to one property or all of them. Save templates for the things you announce every month, like water tankers, fumigation and rent reminders."
					points={[
						'Per-property or global',
						'Reusable templates',
						'Scheduled sends',
					]}
					image="/images/pm-announcement.webp"
					alt="Announcement composer with template picker."
				/>
			</Container>
		</section>
	)
}

function FinancialsSection() {
	return (
		<section
			id="financials"
			aria-labelledby="financials-title"
			className="py-20 sm:py-32"
		>
			<Container>
				<SectionIntro
					id="financials-title"
					title="Every payment, accounted for."
					description="Invoices, payments and expenses, done in a way that doesn’t make you wish you’d hired an accountant."
				/>
				<ScreenshotGrid columns={2}>
					<ScreenshotCard
						title="Invoices"
						description="Recurring rent invoices generate automatically; create one-offs by hand. Mark them paid when the money clears."
						points={[
							'Track payments and balances',
							'Void with an audit trail',
							'Send in-app, by email or on WhatsApp',
						]}
						image="/images/pm-single-invoice-page.webp"
						alt="Invoice detail page with payment status."
					/>
					<ScreenshotCard
						title="Expenses"
						description="Log repairs, supplies and agent fees, categorized and tied to a rental or a property. Profit and loss by property stops being a manual job."
						points={[
							'Custom categories',
							'Receipt attachments',
							'Export to CSV for your accountant',
						]}
						image="/images/pm-expense-tracking.webp"
						alt="Expense list with categories."
					/>
				</ScreenshotGrid>
			</Container>
		</section>
	)
}

function SettingsSection() {
	return (
		<section
			id="settings"
			aria-labelledby="settings-title"
			className="border-t border-gray-200 py-20 sm:py-32"
		>
			<Container>
				<SectionIntro
					id="settings-title"
					title="Tuned for your business."
					description="Organization-wide settings with per-property overrides, roles for your team and document templates."
				/>
				<FeatureGrid>
					<FeatureCard
						icon={<IconBadge icon={BuildingOffice2Icon} />}
						name="Organization"
						description="Team members with Admin, Manager and Staff roles, payment account routing, billing and a library of document templates."
					/>
					<FeatureCard
						icon={<IconBadge icon={AdjustmentsHorizontalIcon} />}
						name="Property level"
						description="The same settings, scoped to a property and inherited from the organization by default. A different agreement template or payment account per building is one change."
					/>
					<FeatureCard
						icon={<IconBadge icon={UserCircleIcon} />}
						name="Personal account"
						description="Profile, phone, password, two-factor authentication, active sessions and notification preferences, in a place you can find."
					/>
				</FeatureGrid>
			</Container>
		</section>
	)
}

const tuesday = [
	{
		time: '07:14',
		title: 'Open the dashboard',
		description: 'Three invoices were paid overnight.',
	},
	{
		time: '09:02',
		title: 'Approve a maintenance request',
		description: 'A leaky faucet in unit 3B moves from New to In Progress.',
	},
	{
		time: '11:30',
		title: 'Send an announcement',
		description:
			'Water tanker visit on Saturday. Pick the saved template, send it to one property.',
	},
	{
		time: '14:45',
		title: 'Draft a rental agreement',
		description:
			'New tenant for 2A. Load the template, fill in five fields, send for e-signature.',
	},
	{
		time: '17:20',
		title: 'Log an expense',
		description:
			'$240 for the plumber, tagged to unit 3B and attached to the maintenance ticket.',
	},
	{
		time: '19:10',
		title: 'Close the laptop',
		description: 'No spreadsheets opened today.',
	},
]

function TuesdaySection() {
	return (
		<section
			id="a-day"
			aria-labelledby="a-day-title"
			className="border-t border-gray-200 py-20 sm:py-32"
		>
			<Container>
				<SectionIntro
					id="a-day-title"
					align="center"
					title="How a Tuesday goes now."
					description="The point of Rentloop is everything you don’t do anymore. Here’s what’s left."
				/>
				<ol
					role="list"
					className="mx-auto mt-16 max-w-2xl divide-y divide-gray-200 border-y border-gray-200 sm:mt-20"
				>
					{tuesday.map((item) => (
						<li key={item.time} className="flex gap-x-6 py-6">
							<time className="w-12 flex-none pt-px text-sm font-semibold text-gray-500 tabular-nums">
								{item.time}
							</time>
							<div>
								<h3 className="text-sm font-semibold text-gray-900">
									{item.title}
								</h3>
								<p className="mt-1 text-sm text-gray-700">{item.description}</p>
							</div>
						</li>
					))}
				</ol>
			</Container>
		</section>
	)
}

export function ManagersPage() {
	return (
		<MarketingPage current="managers">
			<Hero />
			<DashboardSection />
			<PropertiesSection />
			<OccupancySection />
			<ActivitiesSection />
			<FinancialsSection />
			<SettingsSection />
			<TuesdaySection />
			<CallToAction
				title="Try it on one property. Or all of them."
				description="Free for up to 3 units, forever. No card, no calls. We made it easy because we use it ourselves."
				actions={
					<>
						<Button href={APPLY_URL} color="white">
							Start free
						</Button>
						<Button href={BOOK_DEMO_URL} variant="outline" color="white">
							Book a demo
						</Button>
					</>
				}
			/>
		</MarketingPage>
	)
}
