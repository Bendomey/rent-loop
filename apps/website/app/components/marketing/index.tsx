import { useState } from 'react'
import { Link } from 'react-router'
import { ExternalLink } from '~/components/layout/ExternalLink'
import { APP_STORE_URL, PLAY_STORE_URL, PROPERTY_MANAGER_APP_URL } from '~/lib/constants'

// Raw token values — kept for the few places that need inline gradients / dynamic computed styles
export const RL = {
	cream: '#F5F4F1',
	creamDeep: '#EBE8E1',
	creamWarm: '#F0EDE5',
	ink: '#111110',
	inkSoft: '#3A3935',
	muted: 'rgba(17,17,16,0.55)',
	mutedSoft: 'rgba(17,17,16,0.42)',
	hairline: 'rgba(17,17,16,0.10)',
	hairlineSoft: 'rgba(17,17,16,0.06)',
	crimson: '#C8003A',
	crimsonTint: 'rgba(200,0,58,0.07)',
	crimsonTint2: 'rgba(200,0,58,0.13)',
	crimsonLight: '#FF6F8E',
	black: '#0A0A0A',
	green: '#1B9E5C',
} as const

// ── Top accent bar ───────────────────────────────────────────
export function TopBar() {
	return <div className="w-full h-1.5 bg-rl-black" />
}

// ── Logo ─────────────────────────────────────────────────────
export function MarketingLogo({ size = 22, mono = false }: { size?: number; mono?: boolean }) {
	return (
		<div className="font-rl-sans font-bold tracking-[-0.4px] leading-none" style={{ fontSize: size }}>
			<span className={mono ? '' : 'text-rl-crimson'}>rent</span>
			<span>loop</span>
		</div>
	)
}

// ── Nav ──────────────────────────────────────────────────────
export function MarketingNav({ current = 'home' }: { current?: string }) {
	const [open, setOpen] = useState(false)

	const navLinks = [
		{ to: '/tenants', label: 'For Tenants', key: 'tenants' },
		{ to: '/managers', label: 'For Managers', key: 'managers' },
		{ to: '/pricing', label: 'Pricing', key: 'pricing' },
		{ to: '/blog', label: 'Blog', key: 'blog' },
	]

	return (
		<div className="bg-rl-cream border-b border-rl-hairline-soft">
			{/* Main bar */}
			<div className="flex items-center justify-between px-4 md:px-14 py-[18px] md:py-[22px]">
				<Link to="/" className="no-underline text-inherit" onClick={() => setOpen(false)}>
					<MarketingLogo />
				</Link>

				{/* Desktop nav links */}
				<div className="hidden md:flex gap-9 items-center">
					{navLinks.map((l) => (
						<Link
							key={l.key}
							to={l.to}
							className={`font-rl-sans text-sm text-rl-ink no-underline whitespace-nowrap ${current === l.key ? 'font-semibold' : 'font-medium'}`}
						>
							{l.label}
						</Link>
					))}
				</div>

				<div className="flex items-center gap-3 md:gap-[18px]">
					<ExternalLink
						href={`${PROPERTY_MANAGER_APP_URL}/login`}
						className="hidden md:inline font-rl-sans text-sm font-medium text-rl-muted no-underline"
					>
						Log in
					</ExternalLink>
					<ExternalLink
						href={`${PROPERTY_MANAGER_APP_URL}/apply`}
						className="hidden md:inline-block bg-rl-ink text-white font-rl-sans font-semibold text-sm no-underline px-[18px] py-[11px] rounded-[10px] tracking-[0.1px]"
					>
						Start free trial
					</ExternalLink>

					{/* Hamburger — mobile only */}
					<button
						type="button"
						aria-label={open ? 'Close menu' : 'Open menu'}
						onClick={() => setOpen((v) => !v)}
						className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-lg bg-transparent border-none cursor-pointer p-1"
					>
						<span className={`block w-5 h-[1.5px] bg-rl-ink transition-transform duration-200 origin-center ${open ? 'translate-y-[6.5px] rotate-45' : ''}`} />
						<span className={`block w-5 h-[1.5px] bg-rl-ink transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
						<span className={`block w-5 h-[1.5px] bg-rl-ink transition-transform duration-200 origin-center ${open ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
					</button>
				</div>
			</div>

			{/* Mobile dropdown */}
			{open && (
				<div className="md:hidden border-t border-rl-hairline-soft px-4 py-4 flex flex-col gap-1">
					{navLinks.map((l) => (
						<Link
							key={l.key}
							to={l.to}
							onClick={() => setOpen(false)}
							className={`font-rl-sans text-[15px] text-rl-ink no-underline px-3 py-3 rounded-xl ${current === l.key ? 'font-semibold bg-rl-cream-deep' : 'font-medium'}`}
						>
							{l.label}
						</Link>
					))}
					<div className="mt-3 pt-3 border-t border-rl-hairline-soft flex flex-col gap-2">
						<ExternalLink
							href={`${PROPERTY_MANAGER_APP_URL}/login`}
							className="font-rl-sans text-[15px] font-medium text-rl-muted no-underline px-3 py-3"
						>
							Log in
						</ExternalLink>
						<ExternalLink
							href={`${PROPERTY_MANAGER_APP_URL}/apply`}
							className="bg-rl-ink text-white font-rl-sans font-semibold text-[14.5px] no-underline px-4 py-3 rounded-[11px] tracking-[0.1px] text-center"
						>
							Start free trial
						</ExternalLink>
					</div>
				</div>
			)}
		</div>
	)
}

// ── Footer ───────────────────────────────────────────────────
export function MarketingFooter() {
	const colLink = 'font-rl-sans text-sm text-white/75 no-underline block py-1 cursor-pointer'
	const colTitle = 'font-rl-sans text-[12.5px] font-semibold text-white/45 tracking-[1.2px] uppercase mb-[18px] m-0'

	return (
		<div className="bg-rl-black text-white px-4 md:px-14 pt-10 md:pt-16 pb-6 md:pb-8 rounded-t-3xl">
			<div className="grid grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-8 md:gap-10 pb-10 md:pb-14 border-b border-white/[0.08] max-w-[1280px] mx-auto">
				<div className="col-span-2 md:col-span-1">
					<MarketingLogo size={26} mono />
					<p className="font-rl-sans text-sm text-white/55 mt-4 max-w-[280px] leading-[1.55]">
						The rental platform that takes both sides seriously. Made in Accra.
					</p>
				</div>
				<div>
					<p className={colTitle}>Product</p>
					<Link to="/managers" className={colLink}>For Managers</Link>
					<Link to="/tenants" className={colLink}>For Tenants</Link>
					<Link to="/pricing" className={colLink}>Pricing</Link>
					<span className={colLink}>Changelog</span>
				</div>
				<div>
					<p className={colTitle}>Company</p>
					<span className={colLink}>About</span>
					<Link to="/blog" className={colLink}>Blog</Link>
					<span className={colLink}>Careers</span>
					<span className={colLink}>Contact</span>
				</div>
				<div>
					<p className={colTitle}>Support</p>
					<span className={colLink}>Help center</span>
					<span className={colLink}>Status</span>
					<span className={colLink}>Refer a friend</span>
					<span className={colLink}>WhatsApp us</span>
				</div>
				<div>
					<p className={colTitle}>Legal</p>
					<Link to="/privacy-policy" className={colLink}>Privacy</Link>
					<Link to="/terms" className={colLink}>Terms</Link>
					<span className={colLink}>Security</span>
				</div>
			</div>
			<div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center pt-6 md:pt-7 font-rl-sans text-[13px] text-white/45 max-w-[1280px] mx-auto">
				<span>© 2026 Rentloop, Ltd. · Accra, Ghana</span>
				<span>v2.4 · All systems normal</span>
			</div>
		</div>
	)
}

// ── Striped Placeholder ──────────────────────────────────────
// 100% dynamic (gradient params depend on props) — inline styles are intentional
interface PlaceholderProps {
	width?: string | number
	height?: string | number
	label: string
	sub?: string
	dark?: boolean
	radius?: number
	tone?: 'cream' | 'crimson' | 'cream-deep'
	style?: React.CSSProperties
}

export function Placeholder({ width = '100%', height, label, sub, dark, radius = 14, tone = 'cream', style }: PlaceholderProps) {
	const palette = dark
		? { bg: '#1A1A1A', stripe: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)', text: 'rgba(255,255,255,0.55)' }
		: tone === 'crimson'
			? { bg: '#F4DBE3', stripe: 'rgba(200,0,58,0.08)', border: 'rgba(200,0,58,0.20)', text: '#7E0024' }
			: tone === 'cream-deep'
				? { bg: RL.creamWarm, stripe: 'rgba(17,17,16,0.04)', border: 'rgba(17,17,16,0.10)', text: 'rgba(17,17,16,0.55)' }
				: { bg: RL.creamDeep, stripe: 'rgba(17,17,16,0.045)', border: 'rgba(17,17,16,0.10)', text: 'rgba(17,17,16,0.55)' }

	return (
		<div style={{
			width, height, borderRadius: radius,
			background: `repeating-linear-gradient(135deg, ${palette.bg} 0 16px, ${palette.stripe} 16px 32px)`,
			border: `1px solid ${palette.border}`,
			display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
			fontFamily: "'JetBrains Mono', ui-monospace, monospace",
			fontSize: 12, color: palette.text,
			letterSpacing: 0.6, padding: 20, textAlign: 'center', boxSizing: 'border-box',
			textTransform: 'uppercase', flexShrink: 0,
			...style,
		}}>
			<span style={{ fontWeight: 500 }}>{label}</span>
			{sub && (
				<span style={{
					fontSize: 10.5, opacity: 0.7, textTransform: 'none', letterSpacing: 0.3,
					fontFamily: "'DM Sans', system-ui, sans-serif",
				}}>{sub}</span>
			)}
		</div>
	)
}

// ── Type helpers ─────────────────────────────────────────────
export function Eyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
	return (
		<div
			className="font-rl-sans text-[12.5px] font-semibold tracking-[1.2px] uppercase text-rl-crimson"
			style={color ? { color } : undefined}
		>
			{children}
		</div>
	)
}

export function Em({ children, color }: { children: React.ReactNode; color?: string }) {
	return (
		<em
			className="italic font-rl-serif text-rl-crimson"
			style={color ? { color } : undefined}
		>
			{children}
		</em>
	)
}

// Dynamic typography — size/color/spacing come from props, so inline styles handle those values
export function BodyText({ size = 16, children, color, maxWidth, lh = 1.6, align = 'left' }: {
	size?: number; children: React.ReactNode; color?: string; maxWidth?: number; lh?: number
	align?: React.CSSProperties['textAlign']
}) {
	return (
		<div
			className="font-rl-sans m-0"
			style={{ fontSize: size, color: color ?? RL.muted, lineHeight: lh, maxWidth, textAlign: align }}
		>
			{children}
		</div>
	)
}

export function Headline({ size = 64, children, lh = 1.02, ls = -1.2, color, align = 'left' }: {
	size?: number | string; children: React.ReactNode; lh?: number; ls?: number; color?: string
	align?: React.CSSProperties['textAlign']
}) {
	return (
		<h1
			className="font-rl-serif font-normal m-0"
			style={{ fontSize: size, lineHeight: lh, letterSpacing: ls, color: color ?? RL.ink, textAlign: align }}
		>
			{children}
		</h1>
	)
}

export function SubHead({ size = 36, children, lh = 1.1, ls = -0.6, color, align = 'left' }: {
	size?: number | string; children: React.ReactNode; lh?: number; ls?: number; color?: string
	align?: React.CSSProperties['textAlign']
}) {
	return (
		<h2
			className="font-rl-serif font-normal m-0"
			style={{ fontSize: size, lineHeight: lh, letterSpacing: ls, color: color ?? RL.ink, textAlign: align }}
		>
			{children}
		</h2>
	)
}

export function SectionHeader({ eyebrow, title, body, align = 'left', maxWidth = 720, accent, dark = false }: {
	eyebrow: string; title: React.ReactNode; body?: string
	align?: 'left' | 'center'; maxWidth?: number; accent?: string; dark?: boolean
}) {
	return (
		<div
			className={`flex flex-col gap-4 ${align === 'center' ? 'items-center text-center mx-auto' : 'items-start'}`}
			style={{ maxWidth }}
		>
			<Eyebrow color={accent}>{eyebrow}</Eyebrow>
			<SubHead size="clamp(26px, 4vw, 48px)" ls={-1.2} color={dark ? '#fff' : undefined} align={align}>{title}</SubHead>
			{body && (
				<BodyText size={17} color={dark ? 'rgba(255,255,255,0.65)' : undefined} align={align} maxWidth={maxWidth}>
					{body}
				</BodyText>
			)}
		</div>
	)
}

// ── CTA Band ─────────────────────────────────────────────────
export function CTABand({ eyebrow = 'Get started', title, body, primary, secondary }: {
	eyebrow?: string; title: React.ReactNode; body?: string; primary: React.ReactNode; secondary?: React.ReactNode
}) {
	return (
		<div className="bg-rl-black text-white py-12 px-6 md:py-[88px] md:px-20 rounded-3xl my-10 relative overflow-hidden">
			{/* Radial glow accent — inline because it's a dynamic gradient */}
			<div
				className="absolute w-[360px] h-[360px] rounded-full pointer-events-none"
				style={{
					top: -120, right: -120,
					background: `radial-gradient(circle, rgba(200,0,58,0.2) 0%, transparent 60%)`,
				}}
			/>
			<div className="flex flex-col gap-[22px] items-center text-center max-w-[720px] mx-auto relative">
				<Eyebrow color={RL.crimsonLight}>{eyebrow}</Eyebrow>
				<Headline size="clamp(28px, 4.5vw, 56px)" ls={-1.2} color="#fff" align="center">{title}</Headline>
				{body && (
					<BodyText size={17} color="rgba(255,255,255,0.65)" align="center" maxWidth={520}>
						{body}
					</BodyText>
				)}
				<div className="flex flex-wrap gap-3 mt-2 justify-center">{primary}{secondary}</div>
			</div>
		</div>
	)
}

// ── CTA Buttons ──────────────────────────────────────────────
interface CTAButtonProps {
	kind?: 'primary' | 'dark' | 'light' | 'outline' | 'outlineLight' | 'ghost'
	size?: 'sm' | 'md' | 'lg'
	children: React.ReactNode
	href?: string
	onClick?: () => void
	style?: React.CSSProperties
}

const kindClass: Record<string, string> = {
	primary: 'bg-rl-crimson text-white border-none',
	dark: 'bg-rl-black text-white border-none',
	light: 'bg-white text-rl-ink border border-rl-hairline',
	outline: 'bg-transparent text-rl-ink border-[1.5px] border-rl-ink',
	outlineLight: 'bg-transparent text-white border-[1.5px] border-white/25',
	ghost: 'bg-transparent text-rl-ink border-none',
}
const sizeClass: Record<string, string> = {
	sm: 'py-2.5 px-4 text-[13.5px]',
	md: 'py-[13px] px-[22px] text-[14.5px]',
	lg: 'py-4 px-7 text-base',
}

export function CTAButton({ kind = 'primary', size = 'md', children, href, onClick, style }: CTAButtonProps) {
	const base = `font-rl-sans font-semibold tracking-[0.1px] inline-flex items-center gap-2 rounded-[11px] cursor-pointer whitespace-nowrap no-underline transition-[transform,opacity] duration-150 hover:opacity-90 hover:-translate-y-px ${kindClass[kind]} ${sizeClass[size]}`

	if (href) {
		return <a href={href} className={base} style={style}>{children}</a>
	}
	return (
		<button type="button" onClick={onClick} className={base} style={style}>
			{children}
		</button>
	)
}

// ── App store badges ─────────────────────────────────────────
export function AppStoreBadge() {
	return (
		<a href={APP_STORE_URL}
			className="bg-rl-ink text-white no-underline inline-flex items-center gap-3 py-[14px] pl-[18px] pr-[22px] rounded-xl font-rl-sans font-semibold"
		>
			<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
				<path d="M17.05 12.78c-.02-2.74 2.24-4.06 2.34-4.13-1.27-1.86-3.26-2.11-3.97-2.14-1.69-.17-3.3 1-4.16 1-.88 0-2.19-.98-3.6-.95-1.85.03-3.56 1.08-4.51 2.74-1.93 3.34-.49 8.27 1.38 10.98.92 1.32 2 2.8 3.41 2.75 1.37-.06 1.89-.89 3.54-.89s2.12.89 3.56.86c1.47-.02 2.4-1.34 3.3-2.67 1.04-1.53 1.47-3.01 1.49-3.09-.03-.01-2.86-1.1-2.88-4.36zM14.41 4.65C15.16 3.74 15.67 2.48 15.53 1.22c-1.08.05-2.39.72-3.16 1.63-.69.8-1.31 2.09-1.14 3.32 1.21.09 2.43-.62 3.18-1.52z" />
			</svg>
			<div className="text-left leading-[1.15]">
				<div className="text-[10px] opacity-70 font-medium">Download on the</div>
				<div className="text-[15px]">App Store</div>
			</div>
		</a>
	)
}

export function PlayStoreBadge() {
	return (
		<a href={PLAY_STORE_URL}
			className="bg-rl-ink text-white no-underline inline-flex items-center gap-3 py-[14px] pl-[18px] pr-[22px] rounded-xl font-rl-sans font-semibold"
		>
			<svg width="20" height="22" viewBox="0 0 22 24" fill="none" aria-hidden="true">
				<path d="M3 2.5v19l10-9.5L3 2.5z" fill="#34D399" />
				<path d="M13 12l3.5-3.3L20.5 11c.6.3.6 1.4 0 1.7l-4 2.3L13 12z" fill="#FBBF24" />
				<path d="M3 2.5l10 9.5-3.5 3.3L3 21.5V2.5z" fill="#60A5FA" />
			</svg>
			<div className="text-left leading-[1.15]">
				<div className="text-[10px] opacity-70 font-medium">Get it on</div>
				<div className="text-[15px]">Google Play</div>
			</div>
		</a>
	)
}

// ── Hairline divider ──────────────────────────────────────────
export function Hairline({ maxWidth = 1280 }: { maxWidth?: number }) {
	return <div className="h-px bg-rl-hairline-soft mx-auto" style={{ maxWidth }} />
}

// ── Section wrapper ───────────────────────────────────────────
export function Section({
	id, eyebrow, title, body, children, divider = true, accent,
}: {
	id: string; eyebrow: string; title: React.ReactNode; body?: string
	children: React.ReactNode; divider?: boolean; accent?: string
}) {
	return (
		<div id={id} className="px-4 md:px-14 pt-14 md:pt-[88px] pb-10 md:pb-14 max-w-[1280px] mx-auto scroll-mt-20">
			<SectionHeader eyebrow={eyebrow} title={title} body={body} maxWidth={680} accent={accent} />
			<div className="mt-10 md:mt-12">{children}</div>
			{divider && <div className="h-px bg-rl-hairline-soft mt-12 md:mt-14" />}
		</div>
	)
}

// ── Feature card ─────────────────────────────────────────────
export function FeatureCard({
	title, body, bullets, placeholder, placeholderSub, span = 1, dark = false,
}: {
	title: React.ReactNode; body: string; bullets?: string[]; placeholder: string; placeholderSub?: string; span?: number; dark?: boolean
}) {
	return (
		<div
			className={`flex flex-col gap-[18px] rounded-[20px] p-7 ${dark ? 'bg-white/[0.04] border border-white/10' : 'bg-white border border-rl-hairline'}`}
			style={{ gridColumn: `span ${span}` }}
		>
			<Placeholder height={span === 2 ? 280 : 200} label={placeholder} sub={placeholderSub} radius={12} dark={dark} />
			<div>
				<SubHead size={22} ls={-0.3} color={dark ? '#fff' : undefined}>{title}</SubHead>
				<BodyText size={14.5} color={dark ? 'rgba(255,255,255,0.65)' : undefined}>
					<div className="mt-2 leading-[1.55]">{body}</div>
				</BodyText>
				{bullets && (
					<ul className="list-none p-0 mt-3.5 flex flex-col gap-[7px]">
						{bullets.map((b, i) => (
							<li key={i} className="flex gap-2.5 items-start font-rl-sans text-[13.5px] text-rl-ink-soft leading-[1.5]">
								<span className="text-rl-crimson text-sm leading-[1.4]">→</span>
								<span>{b}</span>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}

// ── Anchor nav (sticky) ───────────────────────────────────────
export function AnchorNav({ links, label = "What's in it" }: {
	links: Array<{ id: string; t: string }>; label?: string
}) {
	return (
		<div className="sticky top-0 z-10 bg-rl-cream/85 backdrop-blur-xl border-t border-b border-rl-hairline-soft py-[14px] px-4 md:px-14 overflow-x-auto">
			<div className="max-w-[1280px] mx-auto flex items-center gap-1.5 whitespace-nowrap">
				<span className="font-rl-mono text-[11px] text-rl-crimson tracking-[1px] uppercase mr-3 shrink-0">
					{label} →
				</span>
				{links.map((l) => (
					<a
						key={l.id}
						href={`#${l.id}`}
						className="font-rl-sans text-[13px] font-medium text-rl-ink-soft no-underline px-3 py-1.5 rounded-lg hover:bg-white transition-colors shrink-0"
					>
						{l.t}
					</a>
				))}
			</div>
		</div>
	)
}

// ── Page wrapper ─────────────────────────────────────────────
export function MarketingPage({ current, children }: { current?: string; children: React.ReactNode }) {
	return (
		<div className="bg-rl-cream min-h-screen font-rl-sans">
			<TopBar />
			<MarketingNav current={current} />
			{children}
			<MarketingFooter />
		</div>
	)
}
