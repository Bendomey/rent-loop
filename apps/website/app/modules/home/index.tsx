import { Link } from 'react-router'
import {
	BodyText,
	CTABand,
	CTAButton,
	Em,
	Eyebrow,
	Hairline,
	Headline,
	MarketingPage,
	Placeholder,
	RL,
	SectionHeader,
	SubHead,
} from '~/components/marketing'
import { customers } from '~/content/customers'
import { BOOK_DEMO_URL, PROPERTY_MANAGER_APP_URL } from '~/lib/constants'

// ── Hero ─────────────────────────────────────────────────────
function Hero() {
	return (
		<div className="mx-auto flex max-w-[1280px] flex-col items-center px-4 pt-8 pb-14 md:px-14 md:pt-14 md:pb-20">
			<Eyebrow>Property management software</Eyebrow>

			<div className="mt-5">
				<Headline
					size="clamp(40px, 7vw, 84px)"
					lh={1.04}
					ls={-2}
					align="center"
				>
					Property management
					<br />
					software, built to <Em>Scale.</Em>
				</Headline>
			</div>

			<BodyText
				size={18}
				color={RL.muted}
				align="center"
				maxWidth={640}
				lh={1.55}
			>
				<div className="mt-6">
					Rentloop puts properties, tenants, rent, maintenance and rental
					records in one place — so your rental business stops living in
					WhatsApp, spreadsheets and bank statements.
				</div>
			</BodyText>

			<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
				<CTAButton
					kind="primary"
					size="lg"
					href={`${PROPERTY_MANAGER_APP_URL}/apply`}
				>
					Start free
				</CTAButton>
				<CTAButton kind="outline" size="lg" href={BOOK_DEMO_URL}>
					Book a demo
				</CTAButton>
			</div>

			<Link
				to="/tenants"
				className="font-rl-sans text-rl-muted hover:text-rl-ink mt-5 text-[14px] no-underline"
			>
				I rent a place →
			</Link>

			<div className="font-rl-sans text-rl-muted-soft mt-7 flex flex-wrap items-center justify-center gap-7 text-[13.5px]">
				<span>✓ 1 – 3 units free, forever</span>
				<span>✓ No card required</span>
				<span>✓ No per-unit fees</span>
			</div>

			<div className="relative mt-12 w-full md:mt-16">
				<img
					src="/images/pm-dashboard-hero.webp"
					alt="The Rentloop property manager dashboard showing revenue, outstanding rent, active leases and occupancy rate in Ghana cedis."
					className="border-rl-hairline w-full rounded-[20px] border object-cover shadow-[0_40px_90px_-30px_rgba(0,0,0,0.28)]"
				/>
				<div className="bg-rl-ink absolute -bottom-8 -left-4 hidden h-[340px] w-[170px] rounded-[30px] border border-black/50 p-1.5 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.4)] md:block lg:-left-10 lg:h-[420px] lg:w-[210px]">
					<div className="h-full w-full overflow-hidden rounded-[24px]">
						<img
							src="/images/pm-full-mobile-view.webp"
							alt=""
							className="h-full w-full object-cover object-top"
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

// ── Customer band ─────────────────────────────────────────────
function CustomerBand() {
	if (customers.length === 0) return null
	return (
		<div className="mx-auto max-w-[1280px] px-4 py-8 md:px-14 md:py-10">
			<div className="font-rl-sans text-rl-muted-soft text-center text-[13px] tracking-[0.4px] uppercase">
				Trusted by property managers in Ghana
			</div>
			<div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
				{customers.map((c) => (
					<div key={c.name} className="text-center">
						<div className="font-rl-serif text-rl-ink text-[20px] tracking-[-0.3px]">
							{c.name}
						</div>
						{c.detail && (
							<div className="font-rl-sans text-rl-muted mt-0.5 text-[12.5px]">
								{c.detail}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	)
}

// ── Problem ───────────────────────────────────────────────────
function Problem() {
	const places = [
		{
			t: 'WhatsApp',
			s: 'Rent reminders, complaints and receipts, buried six months deep.',
		},
		{
			t: 'Spreadsheets',
			s: 'One per property, none of them current.',
		},
		{
			t: 'Bank statements',
			s: 'Payments you still match to a tenant by hand.',
		},
		{
			t: 'Paper agreements',
			s: 'Signed, filed somewhere, hard to produce when it matters.',
		},
		{
			t: 'Photos on your phone',
			s: 'The leaking tap, the meter reading, the move-in condition.',
		},
	]
	return (
		<div className="mx-auto max-w-[1280px] px-4 py-10 md:px-14 md:py-16">
			<SectionHeader
				eyebrow="The problem"
				title={
					<>
						Property management without the <Em>WhatsApp</Em> chaos.
					</>
				}
				body="Right now your rental business lives in five places. None of them talk to each other."
				align="center"
				maxWidth={700}
			/>
			<div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-5">
				{places.map((p, i) => (
					<div
						key={i}
						className="border-rl-hairline rounded-[18px] border bg-white px-6 py-7"
					>
						<div className="font-rl-serif text-rl-ink text-[19px] tracking-[-0.3px]">
							{p.t}
						</div>
						<BodyText size={13.5} color={RL.muted} lh={1.5}>
							<div className="mt-2">{p.s}</div>
						</BodyText>
					</div>
				))}
			</div>
			<div className="mt-9 flex justify-center">
				<BodyText size={17} color={RL.muted} align="center" maxWidth={620}>
					Rentloop brings the whole rental lifecycle into one place — and keeps
					it there.
				</BodyText>
			</div>
		</div>
	)
}

// ── Lifecycle ─────────────────────────────────────────────────
function Lifecycle() {
	const stages = [
		{
			n: '01',
			t: 'Fill your portfolio',
			s: 'Properties, blocks, units and availability — a single unit or two hundred, long-let or short stay.',
		},
		{
			n: '02',
			t: 'Run the tenancy',
			s: 'Applications, rental agreements, e-signatures, invoices, payments and maintenance requests.',
		},
		{
			n: '03',
			t: 'Keep the record',
			s: 'Every payment, expense, document and activity stays attached to the right property.',
		},
	]
	return (
		<div className="mx-auto max-w-[1280px] px-4 pt-8 pb-14 md:px-14 md:pt-10 md:pb-20">
			<SectionHeader
				eyebrow="The rental loop"
				title={
					<>
						Everything that happens <Em>after</Em> someone rents your property.
					</>
				}
				body="Application, agreement, move-in, rent, maintenance, renewal, move-out. Rentloop covers the whole loop, not just the paperwork at the start."
				align="center"
				maxWidth={720}
			/>
			<div className="mt-10 grid grid-cols-1 gap-5 md:mt-14 md:grid-cols-3">
				{stages.map((s, i) => (
					<div
						key={i}
						className="border-rl-hairline relative rounded-[20px] border bg-white px-7 pt-7 pb-8"
						style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.02)' }}
					>
						<div className="font-rl-mono text-rl-crimson mb-[18px] text-[12.5px] tracking-[1px]">
							STAGE {s.n}
						</div>
						<SubHead size={26} ls={-0.4}>
							{s.t}
						</SubHead>
						<BodyText size={14.5} color={RL.muted} lh={1.55}>
							<div className="mt-3">{s.s}</div>
						</BodyText>
						{i < 2 && (
							<div className="bg-rl-cream border-rl-hairline font-rl-sans text-rl-ink absolute top-1/2 right-[-16px] z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border text-sm md:flex">
								→
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	)
}

// ── Two doors ─────────────────────────────────────────────────
function TwoDoors() {
	return (
		<div className="mx-auto max-w-[1280px] px-4 py-10 md:px-14 md:py-16">
			<SectionHeader
				eyebrow="Two ways in"
				title={
					<>
						One platform. <Em>Two</Em> experiences.
					</>
				}
				body="One workspace for the people who run buildings. One app for the people who live in them."
				align="center"
				maxWidth={680}
			/>
			<div className="mt-10 flex w-full flex-col gap-5 md:mt-14 md:flex-row">
				{/* Manager door — white */}
				<Link
					to="/managers"
					className="border-rl-hairline flex flex-1 cursor-pointer flex-col gap-4 rounded-3xl border bg-white p-8 pb-7 text-inherit no-underline transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px]"
					style={{
						boxShadow:
							'0 1px 0 rgba(0,0,0,0.02), 0 14px 36px -16px rgba(0,0,0,0.10)',
					}}
				>
					<div className="flex items-center justify-between">
						<Eyebrow>I manage properties</Eyebrow>
						<span className="font-rl-sans text-rl-muted-soft text-lg">→</span>
					</div>
					<SubHead size={34} ls={-0.8}>
						The dashboard that <Em>does</Em> the chasing.
					</SubHead>
					<BodyText size={15} color={RL.muted}>
						Rentals, rent, maintenance, applications — all in one place, on
						every device.
					</BodyText>
					<div className="mt-2">
						<img
							src="/images/pm-dashboard-hero.webp"
							alt=""
							className="h-[200px] w-full rounded-[14px] object-cover object-top"
						/>
					</div>
					<div className="mt-1.5 flex flex-wrap gap-2.5">
						<CTAButton
							kind="primary"
							href={`${PROPERTY_MANAGER_APP_URL}/apply`}
						>
							Start free trial
						</CTAButton>
						<CTAButton kind="outline" href={BOOK_DEMO_URL}>
							Book a demo
						</CTAButton>
					</div>
				</Link>

				{/* Tenant door — black */}
				<Link
					to="/tenants"
					className="bg-rl-black relative flex flex-1 cursor-pointer flex-col gap-4 overflow-hidden rounded-3xl p-8 pb-7 text-white no-underline transition-transform duration-200 hover:-translate-y-[3px]"
				>
					{/* Radial glow */}
					<div
						className="pointer-events-none absolute h-[280px] w-[280px] rounded-full"
						style={{
							top: -100,
							right: -100,
							background: `radial-gradient(circle, rgba(200,0,58,0.2) 0%, transparent 60%)`,
						}}
					/>
					<div className="relative flex items-center justify-between">
						<Eyebrow color={RL.crimsonLight}>I rent a place</Eyebrow>
						<span className="font-rl-sans text-lg text-white/40">→</span>
					</div>
					<SubHead size={34} ls={-0.8} color="#fff">
						Your rental, in your <Em color={RL.crimsonLight}>pocket.</Em>
					</SubHead>
					<BodyText size={15} color="rgba(255,255,255,0.65)">
						Pay rent, raise issues, find your paperwork. Without the WhatsApp
						scroll-back.
					</BodyText>
					<div className="mt-2">
						<img
							src="/images/tenant-app.webp"
							alt=""
							className="h-[200px] w-full rounded-[14px] object-cover object-top"
						/>
					</div>
					<div className="mt-1.5 flex flex-wrap gap-2.5">
						<CTAButton kind="light">Download app</CTAButton>
						<CTAButton kind="outlineLight">How it works</CTAButton>
					</div>
				</Link>
			</div>
		</div>
	)
}

// ── Manager preview ───────────────────────────────────────────
function ManagerPreview() {
	const bigTile = {
		t: 'Property dashboard',
		s: 'Revenue, occupancy, growth — at a glance.',
		lbl: 'Dashboard · Overview',
	}
	const smallTiles = [
		{
			t: 'Maintenance board',
			s: 'New → In Progress → In Review → Resolved.',
			lbl: 'Maintenance · Board',
			image: '/images/pm-maintenance-board.webp',
		},
		{
			t: 'Agreement editor + e-sign',
			s: 'Rich text editor, with built-in e-signatures.',
			lbl: 'Agreement editor · rich text',
			image: '/images/pm-rental-agreement-editor.webp',
		},
		{
			t: 'Invoices & expenses',
			s: 'Track every cedi, per rental or property.',
			lbl: 'Financials · Ledger',
			image: '/images/pm-invoice-payment.webp',
		},
	]
	return (
		<div className="mx-auto max-w-[1280px] px-4 py-10 md:px-14 md:py-16">
			<div className="mb-7 flex flex-col gap-6 md:mb-9 md:flex-row md:items-end md:justify-between md:gap-10">
				<div className="max-w-[620px]">
					<Eyebrow>For property managers</Eyebrow>
					<div className="mt-3.5">
						<SubHead size="clamp(28px, 4.5vw, 52px)" ls={-1.2}>
							A dashboard for <Em>every</Em>
							<br />
							part of the building.
						</SubHead>
					</div>
				</div>
				<Link to="/managers" className="shrink-0 no-underline">
					<CTAButton kind="outline">See the full portal →</CTAButton>
				</Link>
			</div>

			<div className="grid grid-cols-1 gap-[18px] md:grid-cols-[1.4fr_1fr]">
				{/* Big tile */}
				<div className="border-rl-hairline flex flex-col gap-[18px] rounded-[20px] border bg-white p-7">
					<img
						src="/images/pm-dashboard-hero.webp"
						alt="Rentloop dashboard showing revenue, occupancy and active leases."
						className="h-[340px] w-full rounded-[14px] object-cover object-top"
					/>
					<div>
						<SubHead size={24} ls={-0.4}>
							{bigTile.t}
						</SubHead>
						<BodyText size={14.5} color={RL.muted}>
							<div className="mt-1.5">{bigTile.s}</div>
						</BodyText>
					</div>
				</div>

				{/* Small tiles column */}
				<div className="grid grid-cols-1 gap-[18px] sm:grid-cols-3 md:grid-cols-1 md:grid-rows-3">
					{smallTiles.map((tile, i) => (
						<div
							key={i}
							className="border-rl-hairline flex flex-col gap-[18px] rounded-[20px] border bg-white p-[22px] md:grid md:items-center"
							style={{ gridTemplateColumns: '140px 1fr' }}
						>
							{tile.image ? (
								<img
									src={tile.image}
									alt=""
									className="h-[110px] w-[140px] shrink-0 rounded-xl object-cover object-center"
								/>
							) : (
								<Placeholder height={110} label={tile.lbl} radius={12} />
							)}
							<div>
								<SubHead size={20} ls={-0.3}>
									{tile.t}
								</SubHead>
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
		{
			t: 'Pay rent',
			s: "See what's due, what's paid, and the line items behind every invoice.",
			icon: '⌶',
		},
		{
			t: 'Submit maintenance',
			s: "Snap a photo, describe the issue, track every step till it's fixed.",
			icon: '✦',
		},
		{
			t: 'Find your paperwork',
			s: 'Rental agreement, ID, condition reports, announcements — all in one tap.',
			icon: '◆',
		},
	]
	return (
		<div className="bg-rl-black relative mx-4 my-6 max-w-[1280px] overflow-hidden rounded-3xl px-6 py-10 text-white md:mx-14 md:mx-auto md:my-10 md:px-14 md:py-16">
			{/* Radial glow */}
			<div
				className="pointer-events-none absolute rounded-full"
				style={{
					top: -200,
					left: -160,
					width: 500,
					height: 500,
					background: `radial-gradient(circle, rgba(200,0,58,0.13) 0%, transparent 60%)`,
				}}
			/>
			<div className="relative flex flex-col gap-8 md:flex-row md:gap-14">
				<div className="flex-1 pt-3">
					<Eyebrow color={RL.crimsonLight}>For tenants</Eyebrow>
					<div className="mt-4">
						<SubHead size="clamp(28px, 4.5vw, 52px)" ls={-1.2} color="#fff">
							All the rent stuff.
							<br />
							<Em color={RL.crimsonLight}>One calm</Em> app.
						</SubHead>
					</div>
					<BodyText size={17} color="rgba(255,255,255,0.65)" maxWidth={420}>
						<div className="mt-5">
							Pay rent, submit a maintenance request, find your move-in
							checklist — without scrolling back through six months of WhatsApp.
						</div>
					</BodyText>

					<div className="mt-8 flex flex-col gap-3.5">
						{features.map((f, i) => (
							<div key={i} className="flex items-start gap-3.5">
								<div
									className="font-rl-serif flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[18px]"
									style={{
										background: 'rgba(255,255,255,0.06)',
										border: '1px solid rgba(255,255,255,0.10)',
										color: RL.crimsonLight,
									}}
								>
									{f.icon}
								</div>
								<div>
									<div className="font-rl-sans text-[15px] font-semibold text-white">
										{f.t}
									</div>
									<div className="font-rl-sans mt-0.5 text-[13.5px] leading-[1.5] text-white/60">
										{f.s}
									</div>
								</div>
							</div>
						))}
					</div>

					<div className="mt-9 flex flex-wrap gap-3">
						<CTAButton kind="light">Download app</CTAButton>
						<Link to="/tenants" className="no-underline">
							<CTAButton kind="outlineLight">See the tenant page →</CTAButton>
						</Link>
					</div>
				</div>

				{/* Phone mockup */}
				<div
					className="mt-6 flex justify-center md:mt-0"
					style={{ flex: '0 0 auto' }}
				>
					<div
						className="rounded-[44px] p-2"
						style={{
							width: 280,
							height: 560,
							background: '#0a0a0a',
							boxShadow:
								'0 40px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
							border: '1px solid rgba(255,255,255,0.08)',
						}}
					>
						<div className="h-full w-full overflow-hidden rounded-[36px]">
							<img
								src="/images/tenant-app.webp"
								alt=""
								className="h-full w-full object-cover object-top"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

// ── Built for Ghana ───────────────────────────────────────────
function BuiltForGhana() {
	const facts = [
		{ t: 'Cedis', s: 'Every invoice, expense and report in GH₵.' },
		{ t: 'Mobile Money', s: 'The way most of your tenants already pay.' },
		{ t: 'Bank transfer', s: 'Logged against the right tenant and unit.' },
		{ t: 'Cash and offline', s: 'Record a payment you took in person.' },
		{
			t: 'Long-let and short stay',
			s: 'Rental agreements and guest bookings in one portfolio.',
		},
		{
			t: 'Compounds and blocks',
			s: 'Properties, blocks and units, the way buildings are actually organised here.',
		},
	]
	return (
		<div className="mx-auto max-w-[1280px] px-4 py-10 md:px-14 md:py-16">
			<SectionHeader
				eyebrow="Built for Ghana"
				title={
					<>
						Built for how renting <Em>actually</Em> works here.
					</>
				}
				body="Not a foreign product with the currency swapped out."
				align="center"
				maxWidth={680}
			/>
			<div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-14 md:grid-cols-3">
				{facts.map((f, i) => (
					<div
						key={i}
						className="border-rl-hairline rounded-[18px] border bg-white px-6 py-7"
					>
						<div className="font-rl-serif text-rl-ink text-[20px] tracking-[-0.3px]">
							{f.t}
						</div>
						<BodyText size={13.5} color={RL.muted} lh={1.5}>
							<div className="mt-2">{f.s}</div>
						</BodyText>
					</div>
				))}
			</div>
		</div>
	)
}

// ── Pricing strip ─────────────────────────────────────────────
function PricingStrip() {
	return (
		<div className="mx-auto max-w-[1280px] px-4 py-10 md:px-14 md:py-16">
			<div className="border-rl-hairline flex flex-col items-start justify-between gap-6 rounded-[20px] border bg-white px-6 py-8 md:flex-row md:items-center md:px-12 md:py-10">
				<div>
					<div className="font-rl-mono text-rl-muted mb-3 text-[11px] font-semibold tracking-[0.8px] uppercase">
						Pricing
					</div>
					<div className="font-rl-serif text-rl-ink text-[26px] leading-[1.15] tracking-[-0.4px] md:text-[32px]">
						Free for 1 – 3 units.
						<br />
						<span className="text-rl-muted-soft">
							Flat monthly after that. No per-unit fees.
						</span>
					</div>
				</div>
				<Link to="/pricing" className="shrink-0 no-underline">
					<CTAButton kind="outline" size="lg">
						See full pricing →
					</CTAButton>
				</Link>
			</div>
		</div>
	)
}

// ── Home page ─────────────────────────────────────────────────
export function Home() {
	return (
		<MarketingPage current="home">
			<Hero />
			<CustomerBand />
			<Hairline />
			<Problem />
			<Hairline />
			<Lifecycle />
			<ManagerPreview />
			<TwoDoors />
			<TenantPreview />
			<BuiltForGhana />
			<PricingStrip />
			<div className="px-4 md:px-14">
				<div className="mx-auto max-w-[1280px]">
					<CTABand
						eyebrow="Get started"
						title={
							<>
								Your properties have enough problems.
								<br />
								Your <Em color={RL.crimsonLight}>software</Em> shouldn't be one.
							</>
						}
						body="Start free on 1 – 3 units. No card, no per-unit fees."
						primary={
							<CTAButton
								kind="primary"
								size="lg"
								href={`${PROPERTY_MANAGER_APP_URL}/apply`}
							>
								Start free
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
