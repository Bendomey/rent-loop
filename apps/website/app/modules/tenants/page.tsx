import { useState } from 'react'
import { Link } from 'react-router'
import {
	AnchorNav,
	AppStoreBadge,
	BodyText,
	CTAButton,
	Em,
	Eyebrow,
	MarketingPage,
	Placeholder,
	PlayStoreBadge,
	RL,
	SectionHeader,
	SubHead,
} from '~/components/marketing'

// ── Hero · Phone trio ─────────────────────────────────────────
function Hero() {
	return (
		<div className="px-4 md:px-14 pt-8 md:pt-10 pb-14 md:pb-20 max-w-[1280px] mx-auto">
			<div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
				<div className="flex-1 pt-4 md:pt-10">
					<Eyebrow>For tenants</Eyebrow>
					<div className="mt-5">
						<h1 className="font-rl-serif font-normal text-[42px] md:text-[80px] leading-[1.05] md:leading-[1.02] tracking-[-1.0px] md:tracking-[-1.8px] text-rl-ink m-0">
							Your lease,<br />
							in <Em>your pocket.</Em>
						</h1>
					</div>
					<BodyText size={17.5} color={RL.muted} maxWidth={480}>
						<div className="mt-6 leading-[1.6]">
							Pay rent, raise maintenance issues, find your move-in checklist — all on the app
							your landlord (hopefully) gave you. No more digging through WhatsApp for receipts.
						</div>
					</BodyText>
					<div className="flex flex-wrap gap-3 mt-8">
						<AppStoreBadge />
						<PlayStoreBadge />
					</div>
					<div className="font-rl-sans text-[13.5px] text-rl-muted-soft mt-[22px] flex gap-[22px] flex-wrap">
						<span>✓ Free for tenants</span>
						<span>✓ Phone-number login</span>
						<span>✓ No password to forget</span>
					</div>
				</div>

				{/* Phone trio — hidden on mobile to keep hero clean */}
				<div
					className="hidden md:flex relative h-[660px] justify-center items-start pt-[30px]"
					style={{ flex: 1.1 }}
				>
					{[
						{ x: -170, y: 60, rot: -8, label: 'HOME', sub: 'rent · stats · activity', radius: 30, w: 220, h: 450 },
						{ x: 0, y: 0, rot: 0, label: 'PAY RENT', sub: 'invoice list · pay flow', radius: 32, w: 240, h: 490 },
						{ x: 170, y: 60, rot: 8, label: 'MAINTENANCE', sub: 'submit · timeline', radius: 30, w: 220, h: 450 },
					].map((p, i) => (
						<div key={i} style={{
							position: 'absolute',
							left: `calc(50% + ${p.x}px - ${p.w / 2}px)`,
							top: p.y,
							width: p.w, height: p.h,
							background: RL.ink, borderRadius: i === 1 ? 42 : 38, padding: 8,
							transform: `rotate(${p.rot}deg)`,
							boxShadow: '0 30px 60px -20px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.04)',
							zIndex: i === 1 ? 2 : 1,
						}}>
							<div style={{ width: '100%', height: '100%', borderRadius: p.radius, overflow: 'hidden' }}>
								<Placeholder height="100%" label={p.label} sub={p.sub} radius={p.radius} dark />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

// ── Inside overview ───────────────────────────────────────────
function InsideOverview() {
	const items = [
		{ t: 'Phone-number login', s: "Enter your number, get an OTP, you're in. No password to forget, no email to mistype." },
		{ t: 'Lease at a glance', s: 'Rent, status, move-in date, next payment — all on the home screen. Tap for the details.' },
		{ t: 'Pay & track invoices', s: "See what's due, what you've paid, and the line items behind every invoice in cedis." },
		{ t: 'Submit maintenance', s: 'Snap photos, describe the issue, watch it move from New to Resolved.' },
		{ t: 'Your paperwork, organized', s: 'Lease, ID, condition reports, announcements — all in one tap, never in your inbox.' },
		{ t: 'Multiple leases', s: 'Got two rentals? Switch between them from a single login.' },
	]
	return (
		<div id="inside" className="px-4 md:px-14 pt-14 md:pt-[88px] pb-10 md:pb-14 max-w-[1280px] mx-auto scroll-mt-20">
			<SectionHeader
				eyebrow="Already on rentloop"
				title={<>What's <Em>inside</Em> the app.</>}
				body="If your landlord uses Rentloop, here's everything waiting for you when you install."
				align="center"
				maxWidth={620}
			/>
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[18px] mt-10 md:mt-12">
				{items.map((it, i) => (
					<div key={i} className="bg-white rounded-[18px] px-[26px] py-6 border border-rl-hairline">
						<div className="font-rl-mono text-[11px] text-rl-crimson tracking-[1px] mb-3">
							{String(i + 1).padStart(2, '0')}
						</div>
						<div className="font-rl-serif text-[22px] text-rl-ink tracking-[-0.3px] mb-2">{it.t}</div>
						<BodyText size={14} color={RL.muted} lh={1.55}>{it.s}</BodyText>
					</div>
				))}
			</div>
		</div>
	)
}

// ── Tenant section (phone + text, alternating) ─────────────────
interface TenantBullet { t: string; s: string }
interface SecondaryPhone { side: 'left' | 'right'; label: string; sub: string }

function TenantSection({
	id, eyebrow, title, body, bullets, phoneLabel, phoneSub, flip = false, secondaryPhones,
}: {
	id: string; eyebrow: string; title: React.ReactNode; body: string
	bullets?: TenantBullet[]; phoneLabel: string; phoneSub: string; flip?: boolean; secondaryPhones?: SecondaryPhone[]
}) {
	const phoneEl = (
		<div className="flex-1 flex justify-center relative min-h-[400px] md:min-h-[580px]">
			<div className="w-[220px] md:w-[260px] h-[440px] md:h-[530px] bg-rl-ink rounded-[42px] p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.30),0_0_0_1px_rgba(0,0,0,0.04)] z-[2] relative">
				<div className="w-full h-full rounded-[34px] overflow-hidden">
					<Placeholder height="100%" label={phoneLabel} sub={phoneSub} radius={34} />
				</div>
			</div>
			{/* Secondary phones hidden on mobile to avoid overflow */}
			{secondaryPhones?.map((p, i) => (
				<div key={i} className="hidden md:block" style={{
					position: 'absolute',
					left: p.side === 'left' ? 'calc(50% - 220px)' : 'auto',
					right: p.side === 'right' ? 'calc(50% - 220px)' : 'auto',
					top: 40,
					width: 200, height: 420, background: RL.ink, borderRadius: 32, padding: 7,
					transform: `rotate(${p.side === 'left' ? -6 : 6}deg)`,
					boxShadow: '0 20px 40px -16px rgba(0,0,0,0.25)',
					zIndex: 1,
				}}>
					<div style={{ width: '100%', height: '100%', borderRadius: 25, overflow: 'hidden' }}>
						<Placeholder height="100%" label={p.label} sub={p.sub} radius={25} />
					</div>
				</div>
			))}
		</div>
	)

	const textEl = (
		<div className="flex-1 flex flex-col justify-center gap-[18px] max-w-[480px]">
			<Eyebrow>{eyebrow}</Eyebrow>
			<SubHead size={44} ls={-1.0}>{title}</SubHead>
			<BodyText size={16.5} color={RL.muted} lh={1.6}>{body}</BodyText>
			{bullets && (
				<ul className="list-none p-0 mt-[6px] flex flex-col gap-3">
					{bullets.map((b, i) => (
						<li key={i} className="flex gap-[14px] items-start font-rl-sans text-[14.5px] text-rl-ink-soft leading-[1.5]">
							<span className="w-[22px] h-[22px] rounded-[6px] bg-rl-crimson-tint text-rl-crimson font-rl-mono text-[11px] flex items-center justify-center font-semibold shrink-0">
								{String(i + 1).padStart(2, '0')}
							</span>
							<span><strong className="text-rl-ink font-semibold">{b.t}.</strong> {b.s}</span>
						</li>
					))}
				</ul>
			)}
		</div>
	)

	return (
		<div id={id} className="px-4 md:px-14 py-10 md:py-16 max-w-[1280px] mx-auto scroll-mt-20 flex flex-col md:flex-row gap-10 md:gap-16">
			{flip ? <>{phoneEl}{textEl}</> : <>{textEl}{phoneEl}</>}
		</div>
	)
}

// ── Account grid ──────────────────────────────────────────────
function AccountGrid() {
	const items = [
		{ t: 'Edit your full profile', s: 'Personal info, ID, employment, emergency contact — kept up to date in one place.', icon: '◆' },
		{ t: 'View lease details', s: 'Dates, terms, monthly rent, frequency — and download the signed PDF whenever you need it.', icon: '✦' },
		{ t: 'All your announcements', s: 'From rent reminders to the Saturday water tanker schedule, scrollable history.', icon: '◐' },
		{ t: 'Unit details', s: 'Photos of your place, the feature list, and the house rules. Helpful for guests and arguments.', icon: '⌂' },
		{ t: 'Condition reports + disputes', s: 'Review the move-in checklist your landlord shared. Raise a dispute if something is off.', icon: '✓' },
		{ t: 'Application status', s: 'If you applied for a place, watch your application move through the stages in real time.', icon: '◯' },
		{ t: 'Refer a friend', s: 'Tell another tenant. We help more landlords come on, which means less spreadsheet pain for everyone.', icon: '★' },
		{ t: 'Account safety', s: 'Logout from a stolen phone. Delete your account when you want to. Your data, your call.', icon: '◑' },
	]
	return (
		<div id="account" className="px-4 md:px-14 pt-14 md:pt-[88px] pb-14 md:pb-20 max-w-[1280px] mx-auto scroll-mt-20">
			<SectionHeader
				eyebrow="More & account"
				title={<>The rest of <Em>your</Em> rental life.</>}
				body="Everything else lives behind the More tab. Yes, even the part where you can delete your account."
				align="center"
				maxWidth={640}
			/>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 md:mt-12">
				{items.map((it, i) => (
					<div key={i} className="bg-white rounded-2xl p-5 md:p-6 border border-rl-hairline flex flex-col gap-3">
						<div className="w-10 h-10 rounded-[10px] bg-rl-crimson-tint text-rl-crimson flex items-center justify-center font-rl-serif text-[20px]">
							{it.icon}
						</div>
						<div className="font-rl-serif text-[17px] md:text-[19px] text-rl-ink tracking-[-0.2px]">{it.t}</div>
						<BodyText size={13.5} color={RL.muted} lh={1.5}>{it.s}</BodyText>
					</div>
				))}
			</div>
		</div>
	)
}

// ── Auth callout ──────────────────────────────────────────────
function AuthCallout() {
	return (
		<div className="px-4 md:px-14 pb-14 md:pb-[88px]">
			<div className="max-w-[1280px] mx-auto bg-white border border-rl-hairline rounded-[20px] px-6 md:px-12 py-8 md:py-10 flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12 md:justify-between">
				<div className="max-w-[540px]">
					<Eyebrow>Login</Eyebrow>
					<div className="mt-3">
						<SubHead size={36} ls={-0.6}>Sign in with your <Em>phone number.</Em></SubHead>
					</div>
					<BodyText size={15.5} color={RL.muted}>
						<div className="mt-3">
							Enter your number. Get a one-time code. You're in. No passwords to forget, no email to mistype.
							It's how renting should have always worked.
						</div>
					</BodyText>
				</div>
				<div className="flex flex-col gap-[10px] bg-rl-cream p-[22px] rounded-[14px] w-full md:w-auto md:min-w-[320px] border border-rl-hairline-soft">
					<div className="font-rl-sans text-[12px] text-rl-muted font-semibold tracking-[0.4px]">PHONE NUMBER</div>
					<div className="bg-white border border-rl-hairline rounded-[10px] px-4 py-[14px] font-rl-mono text-[15.5px] text-rl-ink flex items-center gap-[10px]">
						<span className="text-rl-muted">🇬🇭 +233</span>
						<span className="text-rl-ink tracking-[1px]">54 123 4567</span>
						<span className="ml-auto text-rl-green text-[12px]">✓</span>
					</div>
					<CTAButton kind="primary">Send me an OTP →</CTAButton>
				</div>
			</div>
		</div>
	)
}

// ── Rally section ─────────────────────────────────────────────
function Rally() {
	const [copied, setCopied] = useState(false)

	const pitch = `Hi — I found this rental platform that handles rent collection, maintenance, and lease docs in one place. It's free up to 5 units. Want me to send the demo? Their site has a section for managers: rentloopapp.com/managers`

	const pitchPoints = [
		{ t: 'No more "did you get it?"', s: 'Every receipt is in one place, with a paper trail you both share.' },
		{ t: 'A real maintenance ticket', s: 'Not a WhatsApp message that scrolls away by Thursday.' },
		{ t: 'Gentle rent reminders', s: 'Push notifications instead of guilt-trip phone calls.' },
		{ t: 'Free up to 5 units', s: "For your landlord. They'll pay nothing to try it on your place." },
	]

	function handleCopy() {
		void navigator.clipboard.writeText(pitch).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		})
	}

	const waUrl = `https://wa.me/?text=${encodeURIComponent(pitch)}`
	const mailUrl = `mailto:?subject=Check out this rental platform&body=${encodeURIComponent(pitch)}`

	return (
		<div
			id="rally"
			className="bg-rl-black text-white py-14 md:py-[88px] px-4 md:px-14 mt-6 md:mt-10 rounded-3xl max-w-[1280px] mx-auto relative overflow-hidden scroll-mt-[60px]"
		>
			<div
				className="absolute rounded-full pointer-events-none"
				style={{ top: -180, right: -160, width: 480, height: 480, background: `radial-gradient(circle, ${RL.crimson}33 0%, transparent 60%)` }}
			/>
			<div
				className="absolute rounded-full pointer-events-none"
				style={{ bottom: -180, left: -160, width: 480, height: 480, background: `radial-gradient(circle, ${RL.crimsonLight}22 0%, transparent 60%)` }}
			/>

			<div className="relative text-center max-w-[720px] mx-auto">
				<div className="font-rl-sans text-[12.5px] font-semibold text-rl-crimson-light tracking-[1.2px] uppercase">
					Landlord still on WhatsApp?
				</div>
				<div className="mt-[22px]">
					<h2 className="font-rl-serif font-normal text-[38px] md:text-[72px] tracking-[-1.0px] md:tracking-[-1.6px] text-white text-center leading-[1.04] m-0">
						<Em color={RL.crimsonLight}>Send them</Em> this page.
					</h2>
				</div>
				<BodyText size={17.5} color="rgba(255,255,255,0.65)" align="center" maxWidth={580}>
					<div className="mt-[22px] mx-auto">
						Tenants don't pick the rent platform — landlords do. So we made a kit to help you make the case.
						Every receipt in one place. A real maintenance ticket. Rent reminders that aren't a guilt trip.
					</div>
				</BodyText>
			</div>

			{/* Pitch points */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-10 md:mt-14 max-w-[1100px] mx-auto relative">
				{pitchPoints.map((p, i) => (
					<div key={i} className="bg-white/[0.04] border border-white/10 rounded-2xl px-[22px] pt-[22px] pb-6">
						<div className="font-rl-mono text-[11px] text-rl-crimson-light tracking-[1px] mb-3">
							{String(i + 1).padStart(2, '0')}
						</div>
						<div className="font-rl-serif text-[22px] text-white leading-[1.15] mb-[10px]">{p.t}</div>
						<BodyText size={13.5} color="rgba(255,255,255,0.6)" lh={1.5}>{p.s}</BodyText>
					</div>
				))}
			</div>

			{/* WhatsApp pitch template */}
			<div className="mt-10 md:mt-14 max-w-[720px] mx-auto bg-white/[0.04] border border-white/10 rounded-[20px] px-6 md:px-9 py-6 md:py-8 relative">
				<div className="font-rl-mono text-[11px] text-white/45 tracking-[1px] uppercase mb-4 flex items-center gap-[10px]">
					<span className="w-2 h-2 rounded-full bg-[#25D366] inline-block" />
					The pitch · copy & paste
				</div>
				<div className="font-rl-serif text-[18px] md:text-[22px] italic text-white/[0.92] leading-[1.5] mb-6">
					"{pitch}"
				</div>
				<div className="flex gap-3 flex-wrap">
					<a
						href={waUrl}
						className="bg-[#25D366] text-[#0a0a0a] px-[22px] py-[13px] rounded-[11px] font-rl-sans font-semibold text-[14.5px] cursor-pointer inline-flex items-center gap-2 no-underline"
					>
						<span className="text-base">✉</span>
						Send via WhatsApp
					</a>
					<CTAButton kind="light" onClick={handleCopy}>
						{copied ? '✓ Copied!' : 'Copy the pitch'}
					</CTAButton>
					<a
						href={mailUrl}
						className="bg-transparent text-white border-[1.5px] border-white/25 px-[22px] py-[13px] rounded-[11px] font-rl-sans font-semibold text-[14.5px] cursor-pointer inline-flex items-center no-underline"
					>
						Email it instead
					</a>
				</div>
			</div>

			{/* Cross-link to managers */}
			<div className="mt-10 md:mt-14 pt-8 border-t border-white/[0.08] flex flex-col md:flex-row md:items-center md:justify-between gap-6 flex-wrap">
				<div className="max-w-[480px]">
					<div className="font-rl-serif text-[24px] md:text-[28px] text-white tracking-[-0.4px] leading-[1.2]">
						Want to read the manager pitch yourself?
					</div>
					<div className="font-rl-sans text-[14.5px] text-white/60 mt-[6px]">
						Same product, viewed from the dashboard side. Makes the conversation easier.
					</div>
				</div>
				<Link to="/managers" className="no-underline">
					<CTAButton kind="primary" size="lg">See the manager page →</CTAButton>
				</Link>
			</div>
		</div>
	)
}

const anchorLinks = [
	{ id: 'inside', t: "What's in the app" },
	{ id: 'home', t: 'Home' },
	{ id: 'payments', t: 'Payments' },
	{ id: 'maintenance', t: 'Maintenance' },
	{ id: 'account', t: 'Account' },
	{ id: 'rally', t: 'Not on rentloop yet?' },
]

export function TenantsPage() {
	return (
		<MarketingPage current="tenants">
			<Hero />
			<AnchorNav links={anchorLinks} label="Jump to" />
			<InsideOverview />
			<TenantSection
				id="home"
				eyebrow="Home dashboard"
				title={<>The first screen <Em>knows</Em> what you came for.</>}
				body="Open the app, see what you owe, what's just been paid, and what's happening at your place — without scrolling for it."
				bullets={[
					{ t: 'Lease overview', s: 'Rent amount, status, move-in date, frequency — visible from the home screen' },
					{ t: 'Upcoming payment card', s: 'How much is due, when, and a one-tap path to pay it' },
					{ t: 'Payment & maintenance stats', s: 'A clean summary of your activity to date' },
					{ t: 'Quick actions', s: 'Pay rent, report an issue, view your lease — the three things you actually open the app for' },
					{ t: 'Announcements & checklist', s: 'Latest building announcement + your condition report, both on-screen' },
					{ t: 'Multiple leases', s: 'Switch between rentals from a single login' },
				]}
				phoneLabel="HOME"
				phoneSub="lease · payment · activity"
				secondaryPhones={[{ side: 'left', label: 'WELCOME', sub: 'Good morning, Benjamin' }]}
			/>
			<TenantSection
				id="payments"
				eyebrow="Payments"
				title={<>Every <Em>cedi</Em>, paid & filed.</>}
				body="A clean list of what's outstanding and what's done. Pay in the app, or log a bank transfer manually — Rentloop tracks both."
				bullets={[
					{ t: 'View invoices', s: 'Outstanding and paid, sorted by date, filterable by month or property' },
					{ t: 'Invoice detail', s: 'Full line items — base rent, utilities, deposits — so you can check the math' },
					{ t: 'Record an offline payment', s: "Bank transfer? Cash? Log it with a reference. Your manager confirms on their end" },
					{ t: 'Balance summary', s: "Always know what you owe vs. what you've overpaid. No more guessing" },
				]}
				phoneLabel="PAY RENT"
				phoneSub="invoice list · pay flow"
				flip
				secondaryPhones={[{ side: 'right', label: 'INVOICE', sub: 'line items detail' }]}
			/>
			<TenantSection
				id="maintenance"
				eyebrow="Maintenance"
				title={<>From <Em>leaky tap</Em> to "all fixed."</>}
				body="Submit a request with a photo, watch it move through the kanban your manager is using. Status updates land as notifications, not whispered promises."
				bullets={[
					{ t: 'See all requests', s: "Filter by status, priority, and category. Everything you've ever asked for, in one place" },
					{ t: 'Create a new request', s: "Snap a photo, pick the room, write a sentence — that's the whole flow" },
					{ t: 'Activity timeline', s: 'Every status change, every comment, every photo from the contractor — logged' },
				]}
				phoneLabel="MAINTENANCE"
				phoneSub="request list · new request"
				secondaryPhones={[{ side: 'left', label: 'TIMELINE', sub: 'request activity log' }]}
			/>
			<AccountGrid />
			<AuthCallout />
			<Rally />
		</MarketingPage>
	)
}
