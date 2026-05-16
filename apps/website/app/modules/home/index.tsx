import { Link } from 'react-router'
import {
	BodyText,
	CTABand,
	CTAButton,
	Em,
	Eyebrow,
	Hairline,
	MarketingPage,
	Placeholder,
	RL,
	SectionHeader,
	SubHead,
} from '~/components/marketing'
import { PROPERTY_MANAGER_APP_URL } from '~/lib/constants'

// ── Hero · Two Doors ─────────────────────────────────────────
function Hero() {
	return (
		<div className="px-4 md:px-14 pt-8 md:pt-14 pb-14 md:pb-24 max-w-[1280px] mx-auto flex flex-col items-center">
			<div className="flex items-center gap-2.5 mb-[22px]">
				<span className="font-rl-sans text-[12.5px] font-semibold text-rl-crimson tracking-[1.2px] uppercase flex items-center gap-2">
					<span className="w-1.5 h-1.5 rounded-full bg-rl-crimson" />
					One platform · two front doors
				</span>
			</div>

			<h1 className="font-rl-serif font-normal m-0 text-center text-[42px] sm:text-[64px] md:text-[88px] leading-[1.05] md:leading-[1.02] tracking-[-1.0px] md:tracking-[-2.2px] text-rl-ink">
				Renting, <Em>finally</Em><br />figured out.
			</h1>

			<BodyText size={18} color={RL.muted} align="center" maxWidth={620} lh={1.55}>
				<div className="mt-[22px]">
					Rentloop is the rental platform built for the way you actually live and work.
					One side for the people who own buildings. One side for the people who live in them.
				</div>
			</BodyText>

			{/* Two doors */}
			<div className="flex flex-col md:flex-row gap-5 mt-10 md:mt-14 w-full max-w-[1080px]">
				{/* Manager door — white */}
				<Link
					to="/managers"
					className="flex-1 bg-white border border-rl-hairline rounded-3xl p-8 pb-7 flex flex-col gap-4 no-underline text-inherit cursor-pointer transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px]"
					style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 14px 36px -16px rgba(0,0,0,0.10)' }}
				>
					<div className="flex items-center justify-between">
						<Eyebrow>I manage properties</Eyebrow>
						<span className="font-rl-sans text-lg text-rl-muted-soft">→</span>
					</div>
					<SubHead size={34} ls={-0.8}>
						The dashboard that <Em>does</Em> the chasing.
					</SubHead>
					<BodyText size={15} color={RL.muted}>
						Leases, rent, maintenance, applications — all in one place, on every device.
					</BodyText>
					<div className="mt-2">
						<Placeholder height={200} label="PM Dashboard preview" sub="overview · revenue chart · unit status" radius={14} />
					</div>
					<div className="flex flex-wrap gap-2.5 mt-1.5">
						<CTAButton kind="primary" href={`${PROPERTY_MANAGER_APP_URL}/apply`}>Start free trial</CTAButton>
						<CTAButton kind="outline">Book a demo</CTAButton>
					</div>
				</Link>

				{/* Tenant door — black */}
				<Link
					to="/tenants"
					className="flex-1 bg-rl-black text-white rounded-3xl p-8 pb-7 flex flex-col gap-4 no-underline cursor-pointer relative overflow-hidden transition-transform duration-200 hover:-translate-y-[3px]"
				>
					{/* Radial glow */}
					<div
						className="absolute w-[280px] h-[280px] rounded-full pointer-events-none"
						style={{
							top: -100, right: -100,
							background: `radial-gradient(circle, rgba(200,0,58,0.2) 0%, transparent 60%)`,
						}}
					/>
					<div className="flex items-center justify-between relative">
						<Eyebrow color={RL.crimsonLight}>I rent a place</Eyebrow>
						<span className="font-rl-sans text-lg text-white/40">→</span>
					</div>
					<SubHead size={34} ls={-0.8} color="#fff">
						Your lease, in your <Em color={RL.crimsonLight}>pocket.</Em>
					</SubHead>
					<BodyText size={15} color="rgba(255,255,255,0.65)">
						Pay rent, raise issues, find your paperwork. Without the WhatsApp scroll-back.
					</BodyText>
					<div className="mt-2">
						<Placeholder height={200} label="Tenant App preview" sub="home · invoices · maintenance" radius={14} dark />
					</div>
					<div className="flex flex-wrap gap-2.5 mt-1.5">
						<CTAButton kind="light">Download app</CTAButton>
						<CTAButton kind="outlineLight">How it works</CTAButton>
					</div>
				</Link>
			</div>

			<div className="flex gap-7 items-center flex-wrap justify-center mt-8 font-rl-sans text-[13.5px] text-rl-muted-soft">
				<span>✓ 14-day free trial</span>
				<span>✓ Free up to 5 units, forever</span>
				<span>✓ No card required</span>
			</div>
		</div>
	)
}

// ── How it works ─────────────────────────────────────────────
function HowItWorks() {
	const steps = [
		{ n: '01', t: 'Set up your properties', s: 'Single unit or 200. Multi-block, lease or short-stay — Rentloop handles it.' },
		{ n: '02', t: 'Invite the people', s: 'Bulk-invite tenants, draft a lease, collect e-signatures, all from one place.' },
		{ n: '03', t: 'Get paid. Sleep well.', s: "Rent collects itself. Maintenance has a kanban. You're free to do the rest of your life." },
	]
	return (
		<div className="px-4 md:px-14 pt-8 md:pt-10 pb-14 md:pb-20 max-w-[1280px] mx-auto">
			<SectionHeader
				eyebrow="How rentloop works"
				title={<>Three steps from <Em>messy</Em> to <Em>managed.</Em></>}
				body="The short version. The long version is on the role pages."
				align="center"
				maxWidth={680}
			/>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10 md:mt-14">
				{steps.map((s, i) => (
					<div
						key={i}
						className="bg-white rounded-[20px] px-7 pt-7 pb-8 border border-rl-hairline relative"
						style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.02)' }}
					>
						<div className="font-rl-mono text-[12.5px] text-rl-crimson tracking-[1px] mb-[18px]">
							STEP {s.n}
						</div>
						<SubHead size={26} ls={-0.4}>{s.t}</SubHead>
						<BodyText size={14.5} color={RL.muted} lh={1.55}>
							<div className="mt-3">{s.s}</div>
						</BodyText>
						{i < 2 && (
							<div className="hidden md:flex absolute right-[-16px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-rl-cream border border-rl-hairline items-center justify-center font-rl-sans text-sm text-rl-ink z-10">→</div>
						)}
					</div>
				))}
			</div>
		</div>
	)
}

// ── Manager preview ───────────────────────────────────────────
function ManagerPreview() {
	const bigTile = { t: 'Property dashboard', s: 'Revenue, occupancy, growth — at a glance.', lbl: 'Dashboard · Overview' }
	const smallTiles = [
		{ t: 'Maintenance kanban', s: 'New → In Progress → In Review → Resolved.', lbl: 'Maintenance · Board' },
		{ t: 'Lease editor + e-sign', s: 'Lexical-powered, with built-in e-signatures.', lbl: 'Lease editor · Lexical' },
		{ t: 'Invoices & expenses', s: 'Track every cedi, per lease or property.', lbl: 'Financials · Ledger' },
	]
	return (
		<div className="px-4 md:px-14 py-10 md:py-16 max-w-[1280px] mx-auto">
			<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-10 mb-7 md:mb-9">
				<div className="max-w-[620px]">
					<Eyebrow>For property managers</Eyebrow>
					<div className="mt-3.5">
						<SubHead size="clamp(28px, 4.5vw, 52px)" ls={-1.2}>
							A dashboard for <Em>every</Em><br />
							part of the building.
						</SubHead>
					</div>
				</div>
				<Link to="/managers" className="no-underline shrink-0">
					<CTAButton kind="outline">See the full portal →</CTAButton>
				</Link>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-[18px]">
				{/* Big tile */}
				<div className="bg-white rounded-[20px] p-7 border border-rl-hairline flex flex-col gap-[18px]">
					<Placeholder height={340} label={bigTile.lbl} sub="hero dashboard · stat tiles + revenue + unit donut" radius={14} />
					<div>
						<SubHead size={24} ls={-0.4}>{bigTile.t}</SubHead>
						<BodyText size={14.5} color={RL.muted}>
							<div className="mt-1.5">{bigTile.s}</div>
						</BodyText>
					</div>
				</div>

				{/* Small tiles column */}
				<div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 md:grid-rows-3 gap-[18px]">
					{smallTiles.map((tile, i) => (
						<div
							key={i}
							className="bg-white rounded-[20px] p-[22px] border border-rl-hairline flex flex-col md:grid md:items-center gap-[18px]"
							style={{ gridTemplateColumns: '140px 1fr' }}
						>
							<Placeholder height={110} label={tile.lbl} radius={12} />
							<div>
								<SubHead size={20} ls={-0.3}>{tile.t}</SubHead>
								<BodyText size={13.5} color={RL.muted}>
									<div className="mt-1">{tile.s}</div>
								</BodyText>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

// ── Tenant preview ────────────────────────────────────────────
function TenantPreview() {
	const features = [
		{ t: 'Pay rent', s: "See what's due, what's paid, and the line items behind every invoice.", icon: '⌶' },
		{ t: 'Submit maintenance', s: "Snap a photo, describe the issue, track every step till it's fixed.", icon: '✦' },
		{ t: 'Find your paperwork', s: 'Lease, ID, condition reports, announcements — all in one tap.', icon: '◆' },
	]
	return (
		<div className="bg-rl-black text-white rounded-3xl mx-4 md:mx-14 px-6 md:px-14 py-10 md:py-16 my-6 md:my-10 max-w-[1280px] md:mx-auto relative overflow-hidden">
			{/* Radial glow */}
			<div
				className="absolute rounded-full pointer-events-none"
				style={{
					top: -200, left: -160, width: 500, height: 500,
					background: `radial-gradient(circle, rgba(200,0,58,0.13) 0%, transparent 60%)`,
				}}
			/>
			<div className="flex flex-col md:flex-row gap-8 md:gap-14 relative">
				<div className="flex-1 pt-3">
					<Eyebrow color={RL.crimsonLight}>For tenants</Eyebrow>
					<div className="mt-4">
						<SubHead size="clamp(28px, 4.5vw, 52px)" ls={-1.2} color="#fff">
							All the rent stuff.<br />
							<Em color={RL.crimsonLight}>One calm</Em> app.
						</SubHead>
					</div>
					<BodyText size={17} color="rgba(255,255,255,0.65)" maxWidth={420}>
						<div className="mt-5">
							Pay rent, submit a maintenance request, find your move-in checklist — without scrolling
							back through six months of WhatsApp.
						</div>
					</BodyText>

					<div className="flex flex-col gap-3.5 mt-8">
						{features.map((f, i) => (
							<div key={i} className="flex gap-3.5 items-start">
								<div
									className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 font-rl-serif text-[18px]"
									style={{
										background: 'rgba(255,255,255,0.06)',
										border: '1px solid rgba(255,255,255,0.10)',
										color: RL.crimsonLight,
									}}
								>{f.icon}</div>
								<div>
									<div className="font-rl-sans text-[15px] font-semibold text-white">{f.t}</div>
									<div className="font-rl-sans text-[13.5px] text-white/60 mt-0.5 leading-[1.5]">{f.s}</div>
								</div>
							</div>
						))}
					</div>

					<div className="flex flex-wrap gap-3 mt-9">
						<CTAButton kind="light">Download app</CTAButton>
						<Link to="/tenants" className="no-underline">
							<CTAButton kind="outlineLight">See the tenant page →</CTAButton>
						</Link>
					</div>
				</div>

				{/* Phone mockup */}
				<div className="flex justify-center mt-6 md:mt-0" style={{ flex: '0 0 auto' }}>
					<div
						className="rounded-[44px] p-2"
						style={{
							width: 280, height: 560,
							background: '#0a0a0a',
							boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
							border: '1px solid rgba(255,255,255,0.08)',
						}}
					>
						<div className="w-full h-full rounded-[36px] overflow-hidden">
							<Placeholder height="100%" label="Tenant home screen" sub="lease · payment · activity" radius={36} dark />
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

// ── Pricing strip ─────────────────────────────────────────────
function PricingStrip() {
	const tiers = [
		{ name: 'Free', price: 'GH¢ 0', sub: 'forever', units: 'Up to 5 units', highlight: false, cta: 'Get started' },
		{ name: 'Growth', price: 'GH¢ 49', sub: 'per month', units: 'Up to 50 units', highlight: true, cta: 'Start free trial' },
		{ name: 'Scale', price: 'Talk to us', sub: 'tailored', units: 'Unlimited units', highlight: false, cta: 'Talk to sales' },
	]
	return (
		<div className="px-4 md:px-14 py-12 md:py-20 max-w-[1280px] mx-auto">
			<SectionHeader
				eyebrow="Pricing"
				title={<>Free to start. <Em>Fair</Em> as you grow.</>}
				body="Per-property pricing, not per-tenant. We grow when you grow."
				align="center"
				maxWidth={640}
			/>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-[18px] mt-10 md:mt-12">
				{tiers.map((t, i) => (
					<div
						key={i}
						className={`rounded-[20px] p-7 relative overflow-hidden ${t.highlight ? 'bg-rl-ink text-white border-none' : 'bg-white text-rl-ink border border-rl-hairline'}`}
					>
						{t.highlight && (
							<div
								className="absolute top-[18px] right-[18px] font-rl-mono text-[10px] text-rl-crimson-light tracking-[0.8px] uppercase py-1 px-2 rounded-[6px]"
								style={{ background: RL.crimsonTint2 }}
							>
								Most picked
							</div>
						)}
						<div className={`font-rl-sans text-sm font-semibold tracking-[0.6px] uppercase ${t.highlight ? 'text-white/60' : 'text-rl-muted'}`}>
							{t.name}
						</div>
						<div className="flex items-baseline gap-2 mt-4">
							<span className="font-rl-serif text-[44px] tracking-[-1px]">{t.price}</span>
							<span className={`font-rl-sans text-sm ${t.highlight ? 'text-white/50' : 'text-rl-muted-soft'}`}>/ {t.sub}</span>
						</div>
						<div className={`font-rl-sans text-sm mt-3 ${t.highlight ? 'text-white/75' : 'text-rl-muted'}`}>{t.units}</div>
						<Link to="/pricing" className="no-underline block w-full mt-6">
							<CTAButton
								kind={t.highlight ? 'primary' : 'outline'}
								style={{ width: '100%', justifyContent: 'center' }}
							>
								{t.cta}
							</CTAButton>
						</Link>
					</div>
				))}
			</div>
		</div>
	)
}

// ── Home page ─────────────────────────────────────────────────
export function Home() {
	return (
		<MarketingPage current="home">
			<Hero />
			<Hairline />
			<HowItWorks />
			<Hairline />
			<ManagerPreview />
			<TenantPreview />
			<PricingStrip />
			<div className="px-4 md:px-14">
				<div className="max-w-[1280px] mx-auto">
					<CTABand
						eyebrow="The whole rental loop"
						title={<>One platform. <Em>Two sides.</Em> Zero spreadsheets.</>}
						body="Whether you're collecting rent or paying it — start the part of Rentloop that's for you."
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
