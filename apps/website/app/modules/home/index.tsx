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
import { BOOK_DEMO_URL, PROPERTY_MANAGER_APP_URL } from '~/lib/constants'

// ── Hero · Two Doors ─────────────────────────────────────────
function Hero() {
	return (
		<div className="mx-auto flex max-w-[1280px] flex-col items-center px-4 pt-8 pb-14 md:px-14 md:pt-14 md:pb-24">
			<div className="mb-[22px] flex items-center gap-2.5">
				<span className="font-rl-sans text-rl-crimson flex items-center gap-2 text-[12.5px] font-semibold tracking-[1.2px] uppercase">
					<span className="bg-rl-crimson h-1.5 w-1.5 rounded-full" />
					One platform · two front doors
				</span>
			</div>

			<h1 className="font-rl-serif text-rl-ink m-0 text-center text-[42px] leading-[1.05] font-normal tracking-[-1.0px] sm:text-[64px] md:text-[88px] md:leading-[1.02] md:tracking-[-2.2px]">
				Renting, <Em>finally</Em>
				<br />
				figured out.
			</h1>

			<BodyText
				size={18}
				color={RL.muted}
				align="center"
				maxWidth={620}
				lh={1.55}
			>
				<div className="mt-[22px]">
					Rentloop is the rental platform built for the way you actually live
					and work. One side for the people who own buildings. One side for the
					people who live in them.
				</div>
			</BodyText>

			{/* Two doors */}
			<div className="mt-10 flex w-full max-w-[1080px] flex-col gap-5 md:mt-14 md:flex-row">
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
							src="/images/project-screenshot.webp"
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

			<div className="font-rl-sans text-rl-muted-soft mt-8 flex flex-wrap items-center justify-center gap-7 text-[13.5px]">
				<span>✓ 1 – 3 units free, forever</span>
				<span>✓ No card required</span>
				<span>✓ No per-unit fees</span>
			</div>
		</div>
	)
}

// ── How it works ─────────────────────────────────────────────
function HowItWorks() {
	const steps = [
		{
			n: '01',
			t: 'Set up your properties',
			s: 'Single unit or 200. Rental agreement for long stays, guest booking for short stays — Rentloop handles both.',
		},
		{
			n: '02',
			t: 'Invite the people',
			s: 'Bulk-invite tenants, draft a rental agreement, collect e-signatures, all from one place.',
		},
		{
			n: '03',
			t: 'Get paid. Sleep well.',
			s: "Rent collects itself. Maintenance tracks itself. You're free to do the rest of your life.",
		},
	]
	return (
		<div className="mx-auto max-w-[1280px] px-4 pt-8 pb-14 md:px-14 md:pt-10 md:pb-20">
			<SectionHeader
				eyebrow="How rentloop works"
				title={
					<>
						Three steps from <Em>messy</Em> to <Em>managed.</Em>
					</>
				}
				body="The short version. The long version is on the role pages."
				align="center"
				maxWidth={680}
			/>
			<div className="mt-10 grid grid-cols-1 gap-5 md:mt-14 md:grid-cols-3">
				{steps.map((s, i) => (
					<div
						key={i}
						className="border-rl-hairline relative rounded-[20px] border bg-white px-7 pt-7 pb-8"
						style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.02)' }}
					>
						<div className="font-rl-mono text-rl-crimson mb-[18px] text-[12.5px] tracking-[1px]">
							STEP {s.n}
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
						src="/images/project-screenshot.webp"
						alt=""
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
			<Hairline />
			<HowItWorks />
			<Hairline />
			<ManagerPreview />
			<TenantPreview />
			<PricingStrip />
			<div className="px-4 md:px-14">
				<div className="mx-auto max-w-[1280px]">
					<CTABand
						eyebrow="The whole rental loop"
						title={
							<>
								One platform. <Em>Two sides.</Em> Zero spreadsheets.
							</>
						}
						body="Whether you're collecting rent or paying it — start the part of Rentloop that's for you."
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
