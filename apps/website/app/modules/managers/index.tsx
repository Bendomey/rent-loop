import {
	AnchorNav,
	BodyText,
	CTABand,
	CTAButton,
	Em,
	Eyebrow,
	FeatureCard,
	MarketingPage,
	Placeholder,
	RL,
	Section,
	SectionHeader,
	SubHead,
} from '~/components/marketing'
import { PROPERTY_MANAGER_APP_URL } from '~/lib/constants'

// ── Hero ─────────────────────────────────────────────────────
function Hero() {
	return (
		<div className="px-4 md:px-14 pt-8 md:pt-14 pb-14 md:pb-20 max-w-[1280px] mx-auto">
			<div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
				<div className="flex-1 pt-2 md:pt-5">
					<Eyebrow>For property managers</Eyebrow>
					<div className="mt-5">
						<h1 className="font-rl-serif font-normal text-[40px] md:text-[70px] leading-[1.05] tracking-[-0.8px] md:tracking-[-1.4px] text-rl-ink m-0">
							Akosua manages <Em>47 units.</Em><br />
							From her phone. Mostly.
						</h1>
					</div>
					<BodyText size={17} color={RL.muted} maxWidth={500}>
						<div className="mt-6 leading-[1.6]">
							Two compounds, one block of apartments, and a short-let by the beach.
							Before Rentloop, it was three spreadsheets and a WhatsApp group called{' '}
							<span className="font-rl-mono text-rl-ink text-[14px]">"RENT 🚨"</span>.
							Now it's one tab. Sometimes one tap.
						</div>
					</BodyText>
					<div className="flex flex-wrap gap-3 mt-8">
						<CTAButton kind="primary" size="lg" href={`${PROPERTY_MANAGER_APP_URL}/apply`}>Start free trial</CTAButton>
						<CTAButton kind="outline" size="lg">Book a demo</CTAButton>
					</div>
					{/* Testimonial card */}
					<div className="mt-10 px-5 py-[18px] bg-white border border-rl-hairline rounded-2xl font-rl-sans max-w-[480px] flex gap-4 items-center shadow-[0_1px_0_rgba(0,0,0,0.02),0_12px_32px_-16px_rgba(0,0,0,0.08)]">
						<div
							className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center font-rl-serif text-[18px] text-rl-crimson border border-rl-hairline-soft"
							style={{ background: `linear-gradient(135deg, ${RL.creamDeep}, ${RL.creamWarm})` }}
						>AO</div>
						<div>
							<div className="text-[15px] text-rl-ink italic font-rl-serif leading-[1.4]">
								"I haven't sent a 'where's my rent' message since November."
							</div>
							<div className="text-[12.5px] text-rl-muted mt-1">— Akosua O., property manager · Accra</div>
						</div>
					</div>
				</div>

				{/* Right column — hidden on mobile to keep hero clean */}
				<div className="hidden md:block md:flex-1 relative h-[620px] pt-3">
					<Placeholder height="100%" label="Photo · Manager at her desk" sub="real lifestyle photography" radius={20} />
					{/* Phone overlap */}
					<div className="absolute -bottom-10 -left-10 w-[230px] h-[460px] bg-rl-ink rounded-[38px] p-2 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.4)] border border-[rgba(0,0,0,0.5)]">
						<div className="w-full h-full rounded-[30px] overflow-hidden">
							<Placeholder height="100%" label="PM portal · mobile" sub="dashboard on the go" radius={30} />
						</div>
					</div>
					{/* Floating notification */}
					<div className="absolute top-6 -right-7 bg-white rounded-[14px] px-[18px] py-[14px] shadow-[0_12px_36px_-10px_rgba(0,0,0,0.16)] border border-rl-hairline font-rl-sans flex items-center gap-[14px]">
						<div className="w-9 h-9 rounded-[10px] bg-rl-crimson-tint flex items-center justify-center font-rl-serif text-rl-crimson text-[18px]">✓</div>
						<div>
							<div className="text-[13px] text-rl-ink font-semibold">Akua just paid March rent</div>
							<div className="text-[11.5px] text-rl-muted">GH¢ 1,200 · 2 min ago</div>
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
		{ n: '< 3 min', l: 'to draft a lease' },
		{ n: '4 modes', l: 'lease, booking, mixed, multi-block' },
		{ n: '98%', l: 'on-time rent collection' },
	]
	return (
		<div className="px-4 md:px-14 py-6 md:py-8 max-w-[1280px] mx-auto">
			<div className="grid grid-cols-2 md:grid-cols-4 bg-white rounded-[18px] border border-rl-hairline py-7 px-2">
				{stats.map((s, i) => {
					const borderClass =
						i === 0 ? '' :
						i === 2 ? 'md:border-l md:border-rl-hairline-soft' :
						'border-l border-rl-hairline-soft'
					return (
						<div key={i} className={`px-6 py-1 ${borderClass}`}>
							<div className="font-rl-serif text-[30px] text-rl-ink tracking-[-0.4px]">{s.n}</div>
							<div className="font-rl-sans text-[13px] text-rl-muted mt-1">{s.l}</div>
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
			title={<>The first screen <Em>tells</Em> the whole story.</>}
			body="The numbers that matter, in the order Akosua actually checks them. Open the app, glance, close the app, get on with your day."
		>
			<div className="grid grid-cols-1 gap-[18px]">
				<FeatureCard
					title="Analytics at a glance"
					body="Revenue, occupancy rate, active leases, and month-over-month growth — laid out as tiles you can scan in under three seconds."
					bullets={['Live revenue ticker', 'Occupancy as % + visual donut', 'Active vs. expiring leases', 'MoM growth, with trend arrows']}
					placeholder="Dashboard — Analytics Hero"
					placeholderSub="stat tiles + KPI strip"
					span={2}
				/>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] mt-[18px]">
				<FeatureCard
					title="Revenue trend chart"
					body="A clean line of cedis collected per month, broken down by property. Hover for the day. Click to drill into the ledger."
					placeholder="Dashboard — Revenue Chart"
					placeholderSub="line chart · per-property toggle"
				/>
				<FeatureCard
					title="Unit status, visualized"
					body="A donut of occupied, vacant, on-notice, and under-maintenance units. Tap a slice to jump to that filter."
					placeholder="Dashboard — Unit Status"
					placeholderSub="donut + legend + click-through"
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
			title={<>From <Em>a flat</Em> to a complex.</>}
			body="Rentloop handles a one-bedroom in East Legon and a 200-unit complex on the Spintex road with the same set of muscles."
		>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
				<FeatureCard
					title="Create & edit properties"
					body="Single-unit or multi-unit. Lease mode for residential, booking mode for short-stays. Switch modes whenever your business does."
					bullets={['Single or multi-unit', 'Lease or booking', 'Photos, features, rules']}
					placeholder="Properties — Editor"
					placeholderSub="property creation flow"
				/>
				<FeatureCard
					title="Blocks (wings & sections)"
					body="Organize a big property into named blocks — wings, towers, sections, whatever your team calls them — for cleaner navigation and reporting."
					bullets={['Group units logically', 'Block-level reporting', 'Permissions per block']}
					placeholder="Properties — Blocks"
					placeholderSub="block manager UI"
				/>
				<FeatureCard
					title="Manage units"
					body="Type, status, rent, images, features, rules — each unit has a full record, and bulk-edit handles the rest when you've got 40 of them."
					bullets={['Status: occupied / vacant / hold', 'Per-unit pricing', 'Feature library']}
					placeholder="Properties — Units"
					placeholderSub="unit list + detail drawer"
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
			title={<>Where <Em>tenants</Em> become residents.</>}
			body="Everything between 'I saw your ad' and 'I'm moving out' — applications, leases, signatures, bookings, calendars."
		>
			<div className="grid grid-cols-1 gap-[18px]">
				<FeatureCard
					title="Rental application workflow"
					body="A guided pipeline that walks you from applicant details → unit selection → financials → documents → move-in. No more pasting from email."
					bullets={['Applicant details with verification', 'Unit selection + availability check', 'Financials & deposit calculation', 'Document upload & review', 'Move-in checklist + handover']}
					placeholder="Occupancy — Application Flow"
					placeholderSub="five-stage progress + side detail"
					span={2}
				/>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-[18px] mt-[18px]">
				<FeatureCard
					title="Tenant directory"
					body="Searchable profiles with activity logs, payment history, and maintenance history side-by-side. The full picture, one click in."
					placeholder="Occupancy — Tenants"
					placeholderSub="directory list + profile"
				/>
				<FeatureCard
					title="Lease editor + e-signature"
					body="Write the lease in a Lexical-powered rich editor, collect e-signatures from both sides, store the signed PDF forever."
					bullets={['Lexical rich text', 'Template library', 'E-signature built in']}
					placeholder="Occupancy — Lease Editor"
					placeholderSub="rich text + sign panel"
				/>
				<FeatureCard
					title="Active leases & bulk onboarding"
					body="See every active lease at a glance. New building? Onboard forty tenants in an afternoon with bulk import."
					bullets={['Active lease registry', 'CSV bulk import', 'Auto-send invites']}
					placeholder="Occupancy — Leases"
					placeholderSub="lease table + bulk drawer"
				/>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] mt-[18px]">
				<FeatureCard
					title="Guest bookings"
					body="For short-stays: check-in / check-out, cancellations, refunds, all without leaving Rentloop. Available in booking-mode properties."
					bullets={['Check-in / out flows', 'Cancellation rules', 'Booking-mode only']}
					placeholder="Occupancy — Bookings"
					placeholderSub="booking detail + status"
				/>
				<FeatureCard
					title="Unit availability calendar"
					body="Month-grid view of what's booked, what's vacant, what's on-notice — across every property in your portfolio."
					bullets={['Per-property or portfolio view', 'Drag to set holds', 'Color-coded statuses']}
					placeholder="Occupancy — Calendar"
					placeholderSub="month grid · color legend"
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
			title={<>The <Em>day-to-day</Em>, finally organized.</>}
			body="Maintenance requests and announcements — the two things tenants will message you about today."
		>
			<div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-[18px]">
				<FeatureCard
					title="Maintenance kanban"
					body="Every request flows through four columns: New → In Progress → In Review → Resolved. Drag, assign, comment, attach photos. The leaky-faucet whodunnit is solved."
					bullets={['Drag-and-drop kanban', 'Photo attachments', 'Internal comments', 'Tenant-facing status updates', 'SLA timers per column']}
					placeholder="Activities — Maintenance Board"
					placeholderSub="kanban · 4 columns · cards"
					span={2}
				/>
				<FeatureCard
					title="Announcements"
					body="Broadcast per-property or globally. Save reusable templates for the things you announce every month (water tankers, fumigation, rent reminders)."
					bullets={['Per-property or global', 'Template library', 'Scheduled sends', 'Read receipts']}
					placeholder="Activities — Announcements"
					placeholderSub="composer + template picker"
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
			title={<>Every <Em>cedi</Em>, accounted for.</>}
			body="The boring but essential half — invoices, payments, expenses. Done in a way that doesn't make you wish you'd hired an accountant."
		>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
				<FeatureCard
					title="Invoice management"
					body="Create, void, send, and track invoices. Automatic generation for recurring rent. Manual creation for the one-offs. Mark paid when the bank statement clears."
					bullets={['Auto-generate from leases', 'Track payments + balances', 'Void with audit trail', 'Send via in-app, email, or WhatsApp']}
					placeholder="Financials — Invoices"
					placeholderSub="invoice list + detail · GH¢"
				/>
				<FeatureCard
					title="Expense tracking"
					body="Log every expense — repairs, supplies, agent fees — categorized and tied to either a specific lease or a property. P&L by property is no longer a manual job."
					bullets={['Per-lease or per-property', 'Custom categories', 'Receipt attachments', 'Export to CSV / accountant']}
					placeholder="Financials — Expenses"
					placeholderSub="expense list + category chart"
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
			title={<>Tuned for <Em>your</Em> business.</>}
			body="Org-wide settings + per-property overrides. Roles for the team. Document templates for the lawyer."
			divider={false}
		>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
				<FeatureCard
					title="Organization"
					body="General info, team members with ADMIN / MANAGER / STAFF roles, payment account routing, billing, and a library of document templates."
					bullets={['3 role tiers', 'Payment account routing', 'Document template library', 'Billing & invoices']}
					placeholder="Settings — Organization"
					placeholderSub="tabs · team · billing"
				/>
				<FeatureCard
					title="Property-level"
					body="The same settings, scoped to a property. Different lease template per building? Different payment account per compound? Done."
					bullets={['Per-property overrides', 'Inherit from org by default', 'Audit trail of changes']}
					placeholder="Settings — Property"
					placeholderSub="scoped settings panel"
				/>
				<FeatureCard
					title="Personal account"
					body="Your profile, phone, password, two-factor, sessions. The hygiene stuff, in a place you can actually find."
					bullets={['Profile + identity', 'Password & 2FA', 'Active sessions', 'Notification preferences']}
					placeholder="Settings — Account"
					placeholderSub="profile · security"
				/>
			</div>
		</Section>
	)
}

// ── A day in the tabs ─────────────────────────────────────────
function DayInTheTabs() {
	const items = [
		{ time: '07:14', t: 'Open the dashboard', s: 'Glance at the morning numbers. Three invoices paid overnight.' },
		{ time: '09:02', t: 'Approve a maintenance request', s: 'A leaky faucet from unit 3B moves from New → In Progress.' },
		{ time: '11:30', t: 'Send an announcement', s: 'Water tanker visit on Saturday. Picks the saved template, sends to one property.' },
		{ time: '14:45', t: 'Draft a lease', s: 'New tenant for 2A. Loads the template, fills five fields, sends for e-signature.' },
		{ time: '17:20', t: 'Log an expense', s: 'GH¢ 240 for the plumber. Tagged to unit 3B, attached to the maintenance ticket.' },
		{ time: '19:10', t: 'Close the laptop', s: 'No spreadsheets opened today.' },
	]
	return (
		<div className="px-4 md:px-14 pt-8 md:pt-10 pb-14 md:pb-20 max-w-[1280px] mx-auto">
			<SectionHeader
				eyebrow="A day in the tabs"
				title={<>How a <Em>Tuesday</Em> goes now.</>}
				body="The point of Rentloop is everything you don't do anymore. Here's what's left."
				align="center"
				maxWidth={620}
			/>
			<div className="mt-10 md:mt-12 bg-white rounded-[20px] border border-rl-hairline py-2 max-w-[820px] mx-auto">
				{items.map((it, i) => (
					<div
						key={i}
						className={`grid grid-cols-[70px_24px_1fr] md:grid-cols-[90px_28px_1fr] gap-3 md:gap-[18px] px-4 md:px-7 py-4 md:py-5 items-start${i < items.length - 1 ? ' border-b border-rl-hairline-soft' : ''}`}
					>
						<div className="font-rl-mono text-[12px] md:text-[13px] text-rl-crimson tracking-[0.5px] pt-[2px]">{it.time}</div>
						<div className="relative h-full">
							<div className="absolute left-1/2 top-[6px] w-[9px] h-[9px] rounded-full bg-rl-ink -translate-x-1/2" />
							{i < items.length - 1 && (
								<div className="absolute left-1/2 top-[18px] -bottom-5 w-px bg-rl-hairline -translate-x-1/2" />
							)}
						</div>
						<div>
							<div className="font-rl-sans text-[14.5px] md:text-[15.5px] font-semibold text-rl-ink">{it.t}</div>
							<div className="font-rl-sans text-[13px] md:text-[14px] text-rl-muted mt-1 leading-[1.55]">{it.s}</div>
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
				<div className="max-w-[1280px] mx-auto">
					<CTABand
						eyebrow="Ready when you are"
						title={<>Try it on <Em>one</Em> property.<br />Or all of them.</>}
						body="Free up to 5 units, forever. No card, no calls, no nonsense. We made it easy because we had to use it ourselves."
						primary={
							<CTAButton kind="primary" size="lg" href={`${PROPERTY_MANAGER_APP_URL}/apply`}>
								Start free trial
							</CTAButton>
						}
						secondary={<CTAButton kind="outlineLight" size="lg">Book a demo</CTAButton>}
					/>
				</div>
			</div>
		</MarketingPage>
	)
}
