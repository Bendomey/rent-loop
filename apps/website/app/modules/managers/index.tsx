import {
	AnchorNav,
	BodyText,
	CTABand,
	CTAButton,
	Em,
	Eyebrow,
	FeatureCard,
	MarketingPage,
	RL,
	Section,
	SectionHeader,
} from '~/components/marketing'
import { BOOK_DEMO_URL, PROPERTY_MANAGER_APP_URL } from '~/lib/constants'

// ── Hero ─────────────────────────────────────────────────────
function Hero() {
	return (
		<div className="mx-auto max-w-[1280px] px-4 pt-8 pb-14 md:px-14 md:pt-14 md:pb-20">
			<div className="flex flex-col items-start gap-8 md:flex-row md:gap-16">
				<div className="flex-1 pt-2 md:pt-5">
					<Eyebrow>For property managers</Eyebrow>
					<div className="mt-5">
						<h1 className="font-rl-serif text-rl-ink m-0 text-[40px] leading-[1.05] font-normal tracking-[-0.8px] md:text-[70px] md:tracking-[-1.4px]">
							Akosua manages <Em>47 units.</Em>
							<br />
							From her phone. Mostly.
						</h1>
					</div>
					<BodyText size={17} color={RL.muted} maxWidth={500}>
						<div className="mt-6 leading-[1.6]">
							Two compounds, one block of apartments, and a short-let by the
							beach. Before Rentloop, it was three spreadsheets and a WhatsApp
							group called{' '}
							<span className="font-rl-mono text-rl-ink text-[14px]">
								"RENT 🚨"
							</span>
							. Now it's one tab. Sometimes one tap.
						</div>
					</BodyText>
					<div className="mt-8 flex flex-wrap gap-3">
						<CTAButton
							kind="primary"
							size="lg"
							href={`${PROPERTY_MANAGER_APP_URL}/apply`}
						>
							Start free trial
						</CTAButton>
						<CTAButton kind="outline" size="lg" href={BOOK_DEMO_URL}>
							Book a demo
						</CTAButton>
					</div>
					{/* Testimonial card */}
					<div className="border-rl-hairline font-rl-sans mt-10 flex max-w-[480px] items-center gap-4 rounded-2xl border bg-white px-5 py-[18px] shadow-[0_1px_0_rgba(0,0,0,0.02),0_12px_32px_-16px_rgba(0,0,0,0.08)]">
						<div
							className="font-rl-serif text-rl-crimson border-rl-hairline-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-[18px]"
							style={{
								background: `linear-gradient(135deg, ${RL.creamDeep}, ${RL.creamWarm})`,
							}}
						>
							AO
						</div>
						<div>
							<div className="text-rl-ink font-rl-serif text-[15px] leading-[1.4] italic">
								"I haven't sent a 'where's my rent' message since November."
							</div>
							<div className="text-rl-muted mt-1 text-[12.5px]">
								— Akosua O., property manager · Accra
							</div>
						</div>
					</div>
				</div>

				{/* Right column — hidden on mobile to keep hero clean */}
				<div className="relative hidden h-[620px] pt-3 md:block md:flex-1">
					<img
						src="/images/pm-main-dashboard.webp"
						alt=""
						className="h-full w-full rounded-[20px] object-cover object-left"
					/>
					{/* Phone overlap */}
					<div className="bg-rl-ink absolute -bottom-10 -left-10 h-[460px] w-[230px] rounded-[38px] border border-[rgba(0,0,0,0.5)] p-2 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.4)]">
						<div className="h-full w-full overflow-hidden rounded-[30px]">
							<img
								src="/images/pm-full-mobile-view.webp"
								alt=""
								className="h-full w-full object-cover object-top"
							/>
						</div>
					</div>
					{/* Floating notification */}
					<div className="border-rl-hairline font-rl-sans absolute top-6 -right-7 flex items-center gap-[14px] rounded-[14px] border bg-white px-[18px] py-[14px] shadow-[0_12px_36px_-10px_rgba(0,0,0,0.16)]">
						<div className="bg-rl-crimson-tint font-rl-serif text-rl-crimson flex h-9 w-9 items-center justify-center rounded-[10px] text-[18px]">
							✓
						</div>
						<div>
							<div className="text-rl-ink text-[13px] font-semibold">
								Akua just paid March rent
							</div>
							<div className="text-rl-muted text-[11.5px]">
								GH¢ 1,200 · 2 min ago
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

// ── Metric strip ─────────────────────────────────────────────
function MetricStrip() {
	const stats = [
		{ n: '1 → 1,000', l: 'units, same dashboard' },
		{ n: '< 3 min', l: 'to draft a rental agreement' },
		{ n: '2 modes', l: 'rental agreement or guest booking' },
		{ n: '98%', l: 'on-time rent collection' },
	]
	return (
		<div className="mx-auto max-w-[1280px] px-4 py-6 md:px-14 md:py-8">
			<div className="border-rl-hairline grid grid-cols-2 rounded-[18px] border bg-white px-2 py-7 md:grid-cols-4">
				{stats.map((s, i) => {
					const borderClass =
						i === 0
							? ''
							: i === 2
								? 'md:border-l md:border-rl-hairline-soft'
								: 'border-l border-rl-hairline-soft'
					return (
						<div key={i} className={`px-6 py-1 ${borderClass}`}>
							<div className="font-rl-serif text-rl-ink text-[30px] tracking-[-0.4px]">
								{s.n}
							</div>
							<div className="font-rl-sans text-rl-muted mt-1 text-[13px]">
								{s.l}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}

// ── Dashboard section ─────────────────────────────────────────
function DashboardSection() {
	return (
		<Section
			id="dashboard"
			eyebrow="Dashboard"
			title={
				<>
					The first screen <Em>tells</Em> the whole story.
				</>
			}
			body="The numbers that matter, in the order Akosua actually checks them. Open the app, glance, close the app, get on with your day."
		>
			<div className="grid grid-cols-1 gap-[18px]">
				<FeatureCard
					title="Analytics at a glance"
					body="Revenue, occupancy rate, active rentals, and month-over-month growth — laid out as tiles you can scan in under three seconds."
					bullets={[
						'Live revenue ticker',
						'Occupancy as % + visual donut',
						'Active vs. expiring rentals',
						'MoM growth, with trend arrows',
					]}
					placeholder="Dashboard — Analytics Hero"
					placeholderSub="stat tiles + KPI strip"
					image="/images/pm-analytics-at-glance.webp"
					span={2}
				/>
			</div>
			<div className="mt-[18px] grid grid-cols-1 gap-[18px] md:grid-cols-2">
				<FeatureCard
					title="Revenue trend chart"
					body="A clean line of cedis collected per month, broken down by property. Hover for the day. Click to drill into the ledger."
					placeholder="Dashboard — Revenue Chart"
					placeholderSub="line chart · per-property toggle"
					image="/images/pm-revenue-chart.webp"
				/>
				<FeatureCard
					title="Unit status, visualized"
					body="A donut of occupied, vacant, on-notice, and under-maintenance units. Tap a slice to jump to that filter."
					placeholder="Dashboard — Unit Status"
					placeholderSub="donut + legend + click-through"
					image="/images/pm-unit-distribution.webp"
				/>
			</div>
		</Section>
	)
}

// ── Properties section ────────────────────────────────────────
function PropertiesSection() {
	return (
		<Section
			id="properties"
			eyebrow="Property management"
			title={
				<>
					From <Em>a flat</Em> to a complex.
				</>
			}
			body="Rentloop handles a one-bedroom in East Legon and a 200-unit complex on the Spintex road with the same set of muscles."
		>
			<div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
				<FeatureCard
					title="Create & edit properties"
					body="Single-unit or multi-unit. Rental agreement mode for long stays, guest booking mode for short stays. Switch modes whenever your business does."
					bullets={[
						'Single or multi-unit',
						'Rental agreement or guest booking',
						'Photos, features, rules',
					]}
					placeholder="Properties — Editor"
					placeholderSub="property creation flow"
					image="/images/pm-create-property.webp"
				/>
				<FeatureCard
					title="Blocks (wings & sections)"
					body="Organize a big property into named blocks — wings, towers, sections, whatever your team calls them — for cleaner navigation and reporting."
					bullets={[
						'Group units logically',
						'Block-level reporting',
						'Permissions per block',
					]}
					placeholder="Properties — Blocks"
					placeholderSub="block manager UI"
					image="/images/pm-add-block.webp"
				/>
				<FeatureCard
					title="Manage units"
					body="Type, status, rent, images, features, rules — each unit has a full record, and bulk-edit handles the rest when you've got 40 of them."
					bullets={[
						'Status: occupied / vacant / hold',
						'Per-unit pricing',
						'Feature library',
					]}
					placeholder="Properties — Units"
					placeholderSub="unit list + detail drawer"
					image="/images/pm-add-unit.webp"
				/>
			</div>
		</Section>
	)
}

// ── Occupancy section ─────────────────────────────────────────
function OccupancySection() {
	return (
		<Section
			id="occupancy"
			eyebrow="Occupancy"
			title={
				<>
					Where <Em>tenants</Em> become residents.
				</>
			}
			body="Everything between 'I saw your ad' and 'I'm moving out' — applications, rental agreements, e-signatures, guest bookings, calendars."
		>
			<div className="grid grid-cols-1 gap-[18px]">
				<FeatureCard
					title="Rental application workflow"
					body="A guided pipeline that walks you from applicant details → unit selection → financials → documents → move-in. No more pasting from email."
					bullets={[
						'Applicant details with verification',
						'Unit selection + availability check',
						'Financials & deposit calculation',
						'Document upload & review',
						'Move-in checklist + handover',
					]}
					placeholder="Occupancy — Application Flow"
					placeholderSub="five-stage progress + side detail"
					image="/images/pm-rental-application.webp"
					span={2}
				/>
			</div>
			<div className="mt-[18px] grid grid-cols-1 gap-[18px] md:grid-cols-3">
				<FeatureCard
					title="Tenant directory"
					body="Searchable profiles with activity logs, payment history, and maintenance history side-by-side. The full picture, one click in."
					placeholder="Occupancy — Tenants"
					placeholderSub="directory list + profile"
					image="/images/pm-tenants.webp"
				/>
				<FeatureCard
					title="Agreement editor + e-signature"
					body="Write the rental agreement in a rich text editor, collect e-signatures from both sides, store the signed PDF forever."
					bullets={[
						'Rich text editor',
						'Template library',
						'E-signature built in',
					]}
					placeholder="Occupancy — Agreement Editor"
					placeholderSub="rich text + sign panel"
					image="/images/pm-rental-agreement-editor.webp"
				/>
				<FeatureCard
					title="Active rentals & bulk onboarding"
					body="See every active rental at a glance. New building? Onboard forty tenants in an afternoon with bulk import."
					bullets={[
						'Active rental registry',
						'CSV bulk import',
						'Auto-send invites',
					]}
					placeholder="Occupancy — Rentals"
					placeholderSub="rental table + bulk drawer"
					image="/images/pm-active-rentals.webp"
				/>
			</div>
			<div className="mt-[18px] grid grid-cols-1 gap-[18px] md:grid-cols-2">
				<FeatureCard
					title="Guest bookings"
					body="For short stays: check-in / check-out, cancellations, refunds, all without leaving Rentloop. Available on properties set to guest booking mode."
					bullets={[
						'Check-in / out flows',
						'Cancellation rules',
						'Guest booking mode only',
					]}
					placeholder="Occupancy — Bookings"
					placeholderSub="booking detail + status"
					image="/images/pm-guest-booking.webp"
				/>
				<FeatureCard
					title="Unit availability calendar"
					body="Month-grid view of what's booked, what's vacant, what's on-notice — across every property in your portfolio."
					bullets={[
						'Per-property or portfolio view',
						'Drag to set holds',
						'Color-coded statuses',
					]}
					placeholder="Occupancy — Calendar"
					placeholderSub="month grid · color legend"
					image="/images/pm-unit-availability.webp"
				/>
			</div>
		</Section>
	)
}

// ── Activities section ────────────────────────────────────────
function ActivitiesSection() {
	return (
		<Section
			id="activities"
			eyebrow="Activities"
			title={
				<>
					The <Em>day-to-day</Em>, finally organized.
				</>
			}
			body="Maintenance requests and announcements — the two things tenants will message you about today."
		>
			<div className="grid grid-cols-1 gap-[18px] md:grid-cols-[1.4fr_1fr]">
				<FeatureCard
					title="Maintenance board"
					body="Every request flows through four columns: New → In Progress → In Review → Resolved. Drag, assign, comment, attach photos. The leaky-faucet whodunnit is solved."
					bullets={[
						'Drag-and-drop board',
						'Photo attachments',
						'Internal comments',
						'Tenant-facing status updates',
						'SLA timers per column',
					]}
					placeholder="Activities — Maintenance Board"
					placeholderSub="board · 4 columns · cards"
					image="/images/pm-maintenance-board.webp"
					span={2}
				/>
				<FeatureCard
					title="Announcements"
					body="Broadcast per-property or globally. Save reusable templates for the things you announce every month (water tankers, fumigation, rent reminders)."
					bullets={[
						'Per-property or global',
						'Template library',
						'Scheduled sends',
						'Read receipts',
					]}
					placeholder="Activities — Announcements"
					placeholderSub="composer + template picker"
					image="/images/pm-announcement.webp"
				/>
			</div>
		</Section>
	)
}

// ── Financials section ────────────────────────────────────────
function FinancialsSection() {
	return (
		<Section
			id="financials"
			eyebrow="Financials"
			title={
				<>
					Every <Em>cedi</Em>, accounted for.
				</>
			}
			body="The boring but essential half — invoices, payments, expenses. Done in a way that doesn't make you wish you'd hired an accountant."
		>
			<div className="grid grid-cols-1 gap-[18px] md:grid-cols-2">
				<FeatureCard
					title="Invoice management"
					body="Create, void, send, and track invoices. Automatic generation for recurring rent. Manual creation for the one-offs. Mark paid when the bank statement clears."
					bullets={[
						'Auto-generate from rentals',
						'Track payments + balances',
						'Void with audit trail',
						'Send via in-app, email, or WhatsApp',
					]}
					placeholder="Financials — Invoices"
					placeholderSub="invoice list + detail · GH¢"
					image="/images/pm-single-invoice-page.webp"
				/>
				<FeatureCard
					title="Expense tracking"
					body="Log every expense — repairs, supplies, agent fees — categorized and tied to either a specific rental or a property. P&L by property is no longer a manual job."
					bullets={[
						'Per-rental or per-property',
						'Custom categories',
						'Receipt attachments',
						'Export to CSV / accountant',
					]}
					placeholder="Financials — Expenses"
					placeholderSub="expense list + category chart"
					image="/images/pm-expense-tracking.webp"
				/>
			</div>
		</Section>
	)
}

// ── Settings section ──────────────────────────────────────────
function SettingsSection() {
	return (
		<Section
			id="settings"
			eyebrow="Settings"
			title={
				<>
					Tuned for <Em>your</Em> business.
				</>
			}
			body="Org-wide settings + per-property overrides. Roles for the team. Document templates for the lawyer."
			divider={false}
		>
			<div className="grid grid-cols-1 gap-[18px] md:grid-cols-3">
				<FeatureCard
					title="Organization"
					body="General info, team members with ADMIN / MANAGER / STAFF roles, payment account routing, billing, and a library of document templates."
					bullets={[
						'3 role tiers',
						'Payment account routing',
						'Document template library',
						'Billing & invoices',
					]}
					placeholder="Settings — Organization"
					image="/images/pm-organization-level-settings.webp"
					placeholderSub="tabs · team · billing"
				/>
				<FeatureCard
					title="Property-level"
					body="The same settings, scoped to a property. Different agreement template per building? Different payment account per compound? Done."
					bullets={[
						'Per-property overrides',
						'Inherit from org by default',
						'Audit trail of changes',
					]}
					placeholder="Settings — Property"
					image="/images/pm-property-level-settings.webp"
					placeholderSub="scoped settings panel"
				/>
				<FeatureCard
					title="Personal account"
					body="Your profile, phone, password, two-factor, sessions. The hygiene stuff, in a place you can actually find."
					bullets={[
						'Profile + identity',
						'Password & 2FA',
						'Active sessions',
						'Notification preferences',
					]}
					placeholder="Settings — Account"
					image="/images/pm-profile-settings.webp"
					placeholderSub="profile · security"
				/>
			</div>
		</Section>
	)
}

// ── A day in the tabs ─────────────────────────────────────────
function DayInTheTabs() {
	const items = [
		{
			time: '07:14',
			t: 'Open the dashboard',
			s: 'Glance at the morning numbers. Three invoices paid overnight.',
		},
		{
			time: '09:02',
			t: 'Approve a maintenance request',
			s: 'A leaky faucet from unit 3B moves from New → In Progress.',
		},
		{
			time: '11:30',
			t: 'Send an announcement',
			s: 'Water tanker visit on Saturday. Picks the saved template, sends to one property.',
		},
		{
			time: '14:45',
			t: 'Draft a rental agreement',
			s: 'New tenant for 2A. Loads the template, fills five fields, sends for e-signature.',
		},
		{
			time: '17:20',
			t: 'Log an expense',
			s: 'GH¢ 240 for the plumber. Tagged to unit 3B, attached to the maintenance ticket.',
		},
		{
			time: '19:10',
			t: 'Close the laptop',
			s: 'No spreadsheets opened today.',
		},
	]
	return (
		<div className="mx-auto max-w-[1280px] px-4 pt-8 pb-14 md:px-14 md:pt-10 md:pb-20">
			<SectionHeader
				eyebrow="A day in the tabs"
				title={
					<>
						How a <Em>Tuesday</Em> goes now.
					</>
				}
				body="The point of Rentloop is everything you don't do anymore. Here's what's left."
				align="center"
				maxWidth={620}
			/>
			<div className="border-rl-hairline mx-auto mt-10 max-w-[820px] rounded-[20px] border bg-white py-2 md:mt-12">
				{items.map((it, i) => (
					<div
						key={i}
						className={`grid grid-cols-[70px_24px_1fr] gap-3 px-4 py-4 md:grid-cols-[90px_28px_1fr] md:gap-[18px] md:px-7 md:py-5 items-start${i < items.length - 1 ? 'border-rl-hairline-soft border-b' : ''}`}
					>
						<div className="font-rl-mono text-rl-crimson pt-[2px] text-[12px] tracking-[0.5px] md:text-[13px]">
							{it.time}
						</div>
						<div className="relative h-full">
							<div className="bg-rl-ink absolute top-[6px] left-1/2 h-[9px] w-[9px] -translate-x-1/2 rounded-full" />
							{i < items.length - 1 && (
								<div className="bg-rl-hairline absolute top-[18px] -bottom-5 left-1/2 w-px -translate-x-1/2" />
							)}
						</div>
						<div>
							<div className="font-rl-sans text-rl-ink text-[14.5px] font-semibold md:text-[15.5px]">
								{it.t}
							</div>
							<div className="font-rl-sans text-rl-muted mt-1 text-[13px] leading-[1.55] md:text-[14px]">
								{it.s}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

const anchorLinks = [
	{ id: 'dashboard', t: 'Dashboard' },
	{ id: 'properties', t: 'Properties' },
	{ id: 'occupancy', t: 'Occupancy' },
	{ id: 'activities', t: 'Activities' },
	{ id: 'financials', t: 'Financials' },
	{ id: 'settings', t: 'Settings' },
]

export function ManagersPage() {
	return (
		<MarketingPage current="managers">
			<Hero />
			<MetricStrip />
			<AnchorNav links={anchorLinks} />
			<DashboardSection />
			<PropertiesSection />
			<OccupancySection />
			<ActivitiesSection />
			<FinancialsSection />
			<SettingsSection />
			<DayInTheTabs />
			<div className="px-4 md:px-14">
				<div className="mx-auto max-w-[1280px]">
					<CTABand
						eyebrow="Ready when you are"
						title={
							<>
								Try it on <Em>one</Em> property.
								<br />
								Or all of them.
							</>
						}
						body="Free for 1 – 3 units, forever. No card, no calls, no nonsense. We made it easy because we had to use it ourselves."
						primary={
							<CTAButton
								kind="primary"
								size="lg"
								href={`${PROPERTY_MANAGER_APP_URL}/apply`}
							>
								Start free trial
							</CTAButton>
						}
						secondary={
							<CTAButton kind="outlineLight" size="lg" href={BOOK_DEMO_URL}>
								Book a demo
							</CTAButton>
						}
					/>
				</div>
			</div>
		</MarketingPage>
	)
}
