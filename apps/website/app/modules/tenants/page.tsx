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
		<div className="mx-auto max-w-[1280px] px-4 pt-8 pb-14 md:px-14 md:pt-10 md:pb-20">
			<div className="flex flex-col items-start gap-8 md:flex-row md:gap-12">
				<div className="flex-1 pt-4 md:pt-10">
					<Eyebrow>For tenants</Eyebrow>
					<div className="mt-5">
						<h1 className="font-rl-serif text-rl-ink m-0 text-[42px] leading-[1.05] font-normal tracking-[-1.0px] md:text-[80px] md:leading-[1.02] md:tracking-[-1.8px]">
							Your rental,
							<br />
							in <Em>your pocket.</Em>
						</h1>
					</div>
					<BodyText size={17.5} color={RL.muted} maxWidth={480}>
						<div className="mt-6 leading-[1.6]">
							Pay rent, raise maintenance issues, find your move-in checklist —
							all on the app your landlord (hopefully) gave you. No more digging
							through WhatsApp for receipts.
						</div>
					</BodyText>
					<div className="mt-8 flex flex-wrap gap-3">
						<AppStoreBadge />
						<PlayStoreBadge />
					</div>
					<div className="font-rl-sans text-rl-muted-soft mt-[22px] flex flex-wrap gap-[22px] text-[13.5px]">
						<span>✓ Free for tenants</span>
						<span>✓ Phone-number login</span>
						<span>✓ No password to forget</span>
					</div>
				</div>

				{/* Phone trio — hidden on mobile to keep hero clean */}
				<div
					className="relative hidden h-[660px] items-start justify-center pt-[30px] md:flex"
					style={{ flex: 1.1 }}
				>
					{[
						{
							x: -170,
							y: 60,
							rot: -8,
							label: 'HOME',
							sub: 'rent · stats · activity',
							radius: 30,
							w: 220,
							h: 450,
						},
						{
							x: 0,
							y: 0,
							rot: 0,
							label: 'PAY RENT',
							sub: 'invoice list · pay flow',
							radius: 32,
							w: 240,
							h: 490,
						},
						{
							x: 170,
							y: 60,
							rot: 8,
							label: 'MAINTENANCE',
							sub: 'submit · timeline',
							radius: 30,
							w: 220,
							h: 450,
						},
					].map((p, i) => (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: `calc(50% + ${p.x}px - ${p.w / 2}px)`,
								top: p.y,
								width: p.w,
								height: p.h,
								background: RL.ink,
								borderRadius: i === 1 ? 42 : 38,
								padding: 8,
								transform: `rotate(${p.rot}deg)`,
								boxShadow:
									'0 30px 60px -20px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.04)',
								zIndex: i === 1 ? 2 : 1,
							}}
						>
							<div
								style={{
									width: '100%',
									height: '100%',
									borderRadius: p.radius,
									overflow: 'hidden',
								}}
							>
								<img
									src={
										i === 0
											? '/images/tenant-payment.webp'
											: i === 1
												? '/images/tenant-app.webp'
												: '/images/tenant-request.webp'
									}
									alt=""
									style={{
										width: '100%',
										height: '100%',
										objectFit: 'cover',
										objectPosition: 'top',
									}}
								/>
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
		{
			t: 'Phone-number login',
			s: "Enter your number, get an OTP, you're in. No password to forget, no email to mistype.",
		},
		{
			t: 'Rental at a glance',
			s: 'Rent, status, move-in date, next payment — all on the home screen. Tap for the details.',
		},
		{
			t: 'Pay & track invoices',
			s: "See what's due, what you've paid, and the line items behind every invoice in cedis.",
		},
		{
			t: 'Submit maintenance',
			s: 'Snap photos, describe the issue, watch it move from New to Resolved.',
		},
		{
			t: 'Your paperwork, organized',
			s: 'Rental agreement, ID, condition reports, announcements — all in one tap, never in your inbox.',
		},
		{
			t: 'Multiple rentals',
			s: 'Got two places? Switch between them from a single login.',
		},
	]
	return (
		<div
			id="inside"
			className="mx-auto max-w-[1280px] scroll-mt-20 px-4 pt-14 pb-10 md:px-14 md:pt-[88px] md:pb-14"
		>
			<SectionHeader
				eyebrow="Already on rentloop"
				title={
					<>
						What's <Em>inside</Em> the app.
					</>
				}
				body="If your landlord uses Rentloop, here's everything waiting for you when you install."
				align="center"
				maxWidth={620}
			/>
			<div className="mt-10 grid grid-cols-1 gap-[18px] sm:grid-cols-2 md:mt-12 md:grid-cols-3">
				{items.map((it, i) => (
					<div
						key={i}
						className="border-rl-hairline rounded-[18px] border bg-white px-[26px] py-6"
					>
						<div className="font-rl-mono text-rl-crimson mb-3 text-[11px] tracking-[1px]">
							{String(i + 1).padStart(2, '0')}
						</div>
						<div className="font-rl-serif text-rl-ink mb-2 text-[22px] tracking-[-0.3px]">
							{it.t}
						</div>
						<BodyText size={14} color={RL.muted} lh={1.55}>
							{it.s}
						</BodyText>
					</div>
				))}
			</div>
		</div>
	)
}

// ── Tenant section (phone + text, alternating) ─────────────────
interface TenantBullet {
	t: string
	s: string
}
interface SecondaryPhone {
	side: 'left' | 'right'
	label: string
	sub: string
	image?: string
}

function TenantSection({
	id,
	eyebrow,
	title,
	body,
	bullets,
	phoneLabel,
	phoneSub,
	phoneImage,
	flip = false,
	secondaryPhones,
}: {
	id: string
	eyebrow: string
	title: React.ReactNode
	body: string
	bullets?: TenantBullet[]
	phoneLabel: string
	phoneSub: string
	phoneImage?: string
	flip?: boolean
	secondaryPhones?: SecondaryPhone[]
}) {
	const phoneEl = (
		<div className="relative flex min-h-[400px] flex-1 justify-center md:min-h-[580px]">
			<div className="bg-rl-ink relative z-[2] h-[440px] w-[220px] rounded-[42px] p-2 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.30),0_0_0_1px_rgba(0,0,0,0.04)] md:h-[530px] md:w-[260px]">
				<div className="h-full w-full overflow-hidden rounded-[34px]">
					{phoneImage ? (
						<img
							src={phoneImage}
							alt=""
							className="h-full w-full object-cover object-top"
						/>
					) : (
						<Placeholder
							height="100%"
							label={phoneLabel}
							sub={phoneSub}
							radius={34}
						/>
					)}
				</div>
			</div>
			{/* Secondary phones hidden on mobile to avoid overflow */}
			{secondaryPhones?.map((p, i) => (
				<div
					key={i}
					className="hidden md:block"
					style={{
						position: 'absolute',
						left: p.side === 'left' ? 'calc(50% - 220px)' : 'auto',
						right: p.side === 'right' ? 'calc(50% - 220px)' : 'auto',
						top: 40,
						width: 200,
						height: 420,
						background: RL.ink,
						borderRadius: 32,
						padding: 7,
						transform: `rotate(${p.side === 'left' ? -6 : 6}deg)`,
						boxShadow: '0 20px 40px -16px rgba(0,0,0,0.25)',
						zIndex: 1,
					}}
				>
					<div
						style={{
							width: '100%',
							height: '100%',
							borderRadius: 25,
							overflow: 'hidden',
						}}
					>
						{p.image ? (
							<img
								src={p.image}
								alt=""
								style={{
									width: '100%',
									height: '100%',
									objectFit: 'cover',
									objectPosition: 'top',
								}}
							/>
						) : (
							<Placeholder
								height="100%"
								label={p.label}
								sub={p.sub}
								radius={25}
							/>
						)}
					</div>
				</div>
			))}
		</div>
	)

	const textEl = (
		<div className="flex max-w-[480px] flex-1 flex-col justify-center gap-[18px]">
			<Eyebrow>{eyebrow}</Eyebrow>
			<SubHead size={44} ls={-1.0}>
				{title}
			</SubHead>
			<BodyText size={16.5} color={RL.muted} lh={1.6}>
				{body}
			</BodyText>
			{bullets && (
				<ul className="mt-[6px] flex list-none flex-col gap-3 p-0">
					{bullets.map((b, i) => (
						<li
							key={i}
							className="font-rl-sans text-rl-ink-soft flex items-start gap-[14px] text-[14.5px] leading-[1.5]"
						>
							<span className="bg-rl-crimson-tint text-rl-crimson font-rl-mono flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] text-[11px] font-semibold">
								{String(i + 1).padStart(2, '0')}
							</span>
							<span>
								<strong className="text-rl-ink font-semibold">{b.t}.</strong>{' '}
								{b.s}
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	)

	return (
		<div
			id={id}
			className="mx-auto flex max-w-[1280px] scroll-mt-20 flex-col gap-10 px-4 py-10 md:flex-row md:gap-16 md:px-14 md:py-16"
		>
			{flip ? (
				<>
					{phoneEl}
					{textEl}
				</>
			) : (
				<>
					{textEl}
					{phoneEl}
				</>
			)}
		</div>
	)
}

// ── Account grid ──────────────────────────────────────────────
function AccountGrid() {
	const items = [
		{
			t: 'Edit your full profile',
			s: 'Personal info, ID, employment, emergency contact — kept up to date in one place.',
			icon: '◆',
		},
		{
			t: 'View rental details',
			s: 'Dates, terms, monthly rent, frequency — and download the signed PDF whenever you need it.',
			icon: '✦',
		},
		{
			t: 'All your announcements',
			s: 'From rent reminders to the Saturday water tanker schedule, scrollable history.',
			icon: '◐',
		},
		{
			t: 'Unit details',
			s: 'Photos of your place, the feature list, and the house rules. Helpful for guests and arguments.',
			icon: '⌂',
		},
		{
			t: 'Condition reports + disputes',
			s: 'Review the move-in checklist your landlord shared. Raise a dispute if something is off.',
			icon: '✓',
		},
		{
			t: 'Application status',
			s: 'If you applied for a place, watch your application move through the stages in real time.',
			icon: '◯',
		},
		{
			t: 'Refer a friend',
			s: 'Tell another tenant. We help more landlords come on, which means less spreadsheet pain for everyone.',
			icon: '★',
		},
		{
			t: 'Account safety',
			s: 'Logout from a stolen phone. Delete your account when you want to. Your data, your call.',
			icon: '◑',
		},
	]
	return (
		<div
			id="account"
			className="mx-auto max-w-[1280px] scroll-mt-20 px-4 pt-14 pb-14 md:px-14 md:pt-[88px] md:pb-20"
		>
			<SectionHeader
				eyebrow="More & account"
				title={
					<>
						The rest of <Em>your</Em> rental life.
					</>
				}
				body="Everything else lives behind the More tab. Yes, even the part where you can delete your account."
				align="center"
				maxWidth={640}
			/>
			<div className="mt-10 grid grid-cols-2 gap-4 md:mt-12 md:grid-cols-4">
				{items.map((it, i) => (
					<div
						key={i}
						className="border-rl-hairline flex flex-col gap-3 rounded-2xl border bg-white p-5 md:p-6"
					>
						<div className="bg-rl-crimson-tint text-rl-crimson font-rl-serif flex h-10 w-10 items-center justify-center rounded-[10px] text-[20px]">
							{it.icon}
						</div>
						<div className="font-rl-serif text-rl-ink text-[17px] tracking-[-0.2px] md:text-[19px]">
							{it.t}
						</div>
						<BodyText size={13.5} color={RL.muted} lh={1.5}>
							{it.s}
						</BodyText>
					</div>
				))}
			</div>
		</div>
	)
}

// ── Auth callout ──────────────────────────────────────────────
function AuthCallout() {
	return (
		<div className="px-4 pb-14 md:px-14 md:pb-[88px]">
			<div className="border-rl-hairline mx-auto flex max-w-[1280px] flex-col items-start gap-8 rounded-[20px] border bg-white px-6 py-8 md:flex-row md:items-center md:justify-between md:gap-12 md:px-12 md:py-10">
				<div className="max-w-[540px]">
					<Eyebrow>Login</Eyebrow>
					<div className="mt-3">
						<SubHead size={36} ls={-0.6}>
							Sign in with your <Em>phone number.</Em>
						</SubHead>
					</div>
					<BodyText size={15.5} color={RL.muted}>
						<div className="mt-3">
							Enter your number. Get a one-time code. You're in. No passwords to
							forget, no email to mistype. It's how renting should have always
							worked.
						</div>
					</BodyText>
				</div>
				<div className="bg-rl-cream border-rl-hairline-soft flex w-full flex-col gap-[10px] rounded-[14px] border p-[22px] md:w-auto md:min-w-[320px]">
					<div className="font-rl-sans text-rl-muted text-[12px] font-semibold tracking-[0.4px]">
						PHONE NUMBER
					</div>
					<div className="border-rl-hairline font-rl-mono text-rl-ink flex items-center gap-[10px] rounded-[10px] border bg-white px-4 py-[14px] text-[15.5px]">
						<span className="text-rl-muted">🇬🇭 +233</span>
						<span className="text-rl-ink tracking-[1px]">54 123 4567</span>
						<span className="text-rl-green ml-auto text-[12px]">✓</span>
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

	const pitch = `Hi — I found this rental platform that handles rent collection, maintenance, and rental agreements in one place. The first 1 – 3 units are free. Want me to send the demo? Their site has a section for managers: rentloopapp.com/managers`

	const pitchPoints = [
		{
			t: 'No more "did you get it?"',
			s: 'Every receipt is in one place, with a paper trail you both share.',
		},
		{
			t: 'A real maintenance ticket',
			s: 'Not a WhatsApp message that scrolls away by Thursday.',
		},
		{
			t: 'Gentle rent reminders',
			s: 'Push notifications instead of guilt-trip phone calls.',
		},
		{
			t: '1 – 3 units free',
			s: 'For your landlord. They pay nothing until they go past 3 units.',
		},
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
			className="bg-rl-black relative mx-auto mt-6 max-w-[1280px] scroll-mt-[60px] overflow-hidden rounded-3xl px-4 py-14 text-white md:mt-10 md:px-14 md:py-[88px]"
		>
			<div
				className="pointer-events-none absolute rounded-full"
				style={{
					top: -180,
					right: -160,
					width: 480,
					height: 480,
					background: `radial-gradient(circle, ${RL.crimson}33 0%, transparent 60%)`,
				}}
			/>
			<div
				className="pointer-events-none absolute rounded-full"
				style={{
					bottom: -180,
					left: -160,
					width: 480,
					height: 480,
					background: `radial-gradient(circle, ${RL.crimsonLight}22 0%, transparent 60%)`,
				}}
			/>

			<div className="relative mx-auto max-w-[720px] text-center">
				<div className="font-rl-sans text-rl-crimson-light text-[12.5px] font-semibold tracking-[1.2px] uppercase">
					Landlord still on WhatsApp?
				</div>
				<div className="mt-[22px]">
					<h2 className="font-rl-serif m-0 text-center text-[38px] leading-[1.04] font-normal tracking-[-1.0px] text-white md:text-[72px] md:tracking-[-1.6px]">
						<Em color={RL.crimsonLight}>Send them</Em> this page.
					</h2>
				</div>
				<BodyText
					size={17.5}
					color="rgba(255,255,255,0.65)"
					align="center"
					maxWidth={580}
				>
					<div className="mx-auto mt-[22px]">
						Tenants don't pick the rent platform — landlords do. So we made a
						kit to help you make the case. Every receipt in one place. A real
						maintenance ticket. Rent reminders that aren't a guilt trip.
					</div>
				</BodyText>
			</div>

			{/* Pitch points */}
			<div className="relative mx-auto mt-10 grid max-w-[1100px] grid-cols-1 gap-4 sm:grid-cols-2 md:mt-14 md:grid-cols-4">
				{pitchPoints.map((p, i) => (
					<div
						key={i}
						className="rounded-2xl border border-white/10 bg-white/[0.04] px-[22px] pt-[22px] pb-6"
					>
						<div className="font-rl-mono text-rl-crimson-light mb-3 text-[11px] tracking-[1px]">
							{String(i + 1).padStart(2, '0')}
						</div>
						<div className="font-rl-serif mb-[10px] text-[22px] leading-[1.15] text-white">
							{p.t}
						</div>
						<BodyText size={13.5} color="rgba(255,255,255,0.6)" lh={1.5}>
							{p.s}
						</BodyText>
					</div>
				))}
			</div>

			{/* WhatsApp pitch template */}
			<div className="relative mx-auto mt-10 max-w-[720px] rounded-[20px] border border-white/10 bg-white/[0.04] px-6 py-6 md:mt-14 md:px-9 md:py-8">
				<div className="font-rl-mono mb-4 flex items-center gap-[10px] text-[11px] tracking-[1px] text-white/45 uppercase">
					<span className="inline-block h-2 w-2 rounded-full bg-[#25D366]" />
					The pitch · copy & paste
				</div>
				<div className="font-rl-serif mb-6 text-[18px] leading-[1.5] text-white/[0.92] italic md:text-[22px]">
					"{pitch}"
				</div>
				<div className="flex flex-wrap gap-3">
					<a
						href={waUrl}
						className="font-rl-sans inline-flex cursor-pointer items-center gap-2 rounded-[11px] bg-[#25D366] px-[22px] py-[13px] text-[14.5px] font-semibold text-[#0a0a0a] no-underline"
					>
						<span className="text-base">✉</span>
						Send via WhatsApp
					</a>
					<CTAButton kind="light" onClick={handleCopy}>
						{copied ? '✓ Copied!' : 'Copy the pitch'}
					</CTAButton>
					<a
						href={mailUrl}
						className="font-rl-sans inline-flex cursor-pointer items-center rounded-[11px] border-[1.5px] border-white/25 bg-transparent px-[22px] py-[13px] text-[14.5px] font-semibold text-white no-underline"
					>
						Email it instead
					</a>
				</div>
			</div>

			{/* Cross-link to managers */}
			<div className="mt-10 flex flex-col flex-wrap gap-6 border-t border-white/[0.08] pt-8 md:mt-14 md:flex-row md:items-center md:justify-between">
				<div className="max-w-[480px]">
					<div className="font-rl-serif text-[24px] leading-[1.2] tracking-[-0.4px] text-white md:text-[28px]">
						Want to read the manager pitch yourself?
					</div>
					<div className="font-rl-sans mt-[6px] text-[14.5px] text-white/60">
						Same product, viewed from the dashboard side. Makes the conversation
						easier.
					</div>
				</div>
				<Link to="/managers" className="no-underline">
					<CTAButton kind="primary" size="lg">
						See the manager page →
					</CTAButton>
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
				title={
					<>
						The first screen <Em>knows</Em> what you came for.
					</>
				}
				body="Open the app, see what you owe, what's just been paid, and what's happening at your place — without scrolling for it."
				bullets={[
					{
						t: 'Rental overview',
						s: 'Rent amount, status, move-in date, frequency — visible from the home screen',
					},
					{
						t: 'Upcoming payment card',
						s: 'How much is due, when, and a one-tap path to pay it',
					},
					{
						t: 'Payment & maintenance stats',
						s: 'A clean summary of your activity to date',
					},
					{
						t: 'Quick actions',
						s: 'Pay rent, report an issue, view your rental — the three things you actually open the app for',
					},
					{
						t: 'Announcements & checklist',
						s: 'Latest building announcement + your condition report, both on-screen',
					},
					{
						t: 'Multiple rentals',
						s: 'Switch between rentals from a single login',
					},
				]}
				phoneLabel="HOME"
				phoneSub="rental · payment · activity"
				phoneImage="/images/tenant-app.webp"
				secondaryPhones={[
					{
						side: 'left',
						label: 'ANNOUNCEMENTS',
						sub: 'building updates',
						image: '/images/tenant-announcement.webp',
					},
				]}
			/>
			<TenantSection
				id="payments"
				eyebrow="Payments"
				title={
					<>
						Every <Em>cedi</Em>, paid & filed.
					</>
				}
				body="A clean list of what's outstanding and what's done. Pay in the app, or log a bank transfer manually — Rentloop tracks both."
				bullets={[
					{
						t: 'View invoices',
						s: 'Outstanding and paid, sorted by date, filterable by month or property',
					},
					{
						t: 'Invoice detail',
						s: 'Full line items — base rent, utilities, deposits — so you can check the math',
					},
					{
						t: 'Record an offline payment',
						s: 'Bank transfer? Cash? Log it with a reference. Your manager confirms on their end',
					},
					{
						t: 'Balance summary',
						s: "Always know what you owe vs. what you've overpaid. No more guessing",
					},
				]}
				phoneLabel="PAY RENT"
				phoneSub="invoice list · pay flow"
				phoneImage="/images/tenant-payment.webp"
				flip
				secondaryPhones={[
					{
						side: 'right',
						label: 'INVOICE',
						sub: 'line items detail',
						image: '/images/tenant-single-payment.webp',
					},
				]}
			/>
			<TenantSection
				id="maintenance"
				eyebrow="Maintenance"
				title={
					<>
						From <Em>leaky tap</Em> to "all fixed."
					</>
				}
				body="Submit a request with a photo, watch it move through the board your manager is using. Status updates land as notifications, not whispered promises."
				bullets={[
					{
						t: 'See all requests',
						s: "Filter by status, priority, and category. Everything you've ever asked for, in one place",
					},
					{
						t: 'Create a new request',
						s: "Snap a photo, pick the room, write a sentence — that's the whole flow",
					},
					{
						t: 'Activity timeline',
						s: 'Every status change, every comment, every photo from the contractor — logged',
					},
				]}
				phoneLabel="MAINTENANCE"
				phoneSub="request list · new request"
				phoneImage="/images/maintenance-requests.webp"
				secondaryPhones={[
					{
						side: 'left',
						label: 'TIMELINE',
						sub: 'request activity log',
						image: '/images/tenant-single-maintenance.webp',
					},
				]}
			/>
			<AccountGrid />
			<AuthCallout />
			<Rally />
		</MarketingPage>
	)
}
