import { useState } from 'react'
import { Link } from 'react-router'
import pkg from '../../../package.json'
import { ExternalLink } from '~/components/layout/ExternalLink'
import {
	APP_NAME,
	APP_STORE_URL,
	CONTACT_US_URL,
	PLAY_STORE_URL,
	PROPERTY_MANAGER_APP_URL,
	WHATSAPP_URL,
} from '~/lib/constants'

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
	return <div className="bg-rl-black h-1.5 w-full" />
}

// ── Logo ─────────────────────────────────────────────────────
export function MarketingLogo({
	size = 22,
}: {
	size?: number
	mono?: boolean
}) {
	return (
		<div className="flex flex-row items-end" style={{ fontSize: size }}>
			<span className="text-rl-crimson text-4xl font-extrabold">
				{APP_NAME.slice(0, 4)}
			</span>
			<span className="text-4xl font-extrabold">{APP_NAME.slice(4)}</span>
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
		<div className="border-rl-hairline-soft border-b">
			{/* Main bar */}
			<div className="flex items-center justify-between px-4 py-[18px] md:px-14 md:py-[22px]">
				<Link
					to="/"
					className="text-inherit no-underline"
					onClick={() => setOpen(false)}
				>
					<MarketingLogo />
				</Link>

				{/* Desktop nav links */}
				<div className="hidden items-center gap-9 md:flex">
					{navLinks.map((l) => (
						<Link
							key={l.key}
							to={l.to}
							className={`font-rl-sans text-rl-ink text-sm whitespace-nowrap no-underline ${current === l.key ? 'font-semibold' : 'font-medium'}`}
						>
							{l.label}
						</Link>
					))}
				</div>

				<div className="flex items-center gap-3 md:gap-[18px]">
					<ExternalLink
						href={`${PROPERTY_MANAGER_APP_URL}/login`}
						className="font-rl-sans text-rl-muted hidden text-sm font-medium no-underline md:inline"
					>
						Log in
					</ExternalLink>
					<ExternalLink
						href={`${PROPERTY_MANAGER_APP_URL}/apply`}
						className="bg-rl-crimson font-rl-sans hidden rounded-[10px] px-[18px] py-[11px] text-sm font-semibold tracking-[0.1px] text-white no-underline md:inline-block"
					>
						Start free trial
					</ExternalLink>

					{/* Hamburger — mobile only */}
					<button
						type="button"
						aria-label={open ? 'Close menu' : 'Open menu'}
						onClick={() => setOpen((v) => !v)}
						className="flex h-9 w-9 cursor-pointer flex-col items-center justify-center gap-[5px] rounded-lg border-none bg-transparent p-1 md:hidden"
					>
						<span
							className={`bg-rl-ink block h-[1.5px] w-5 origin-center transition-transform duration-200 ${open ? 'translate-y-[6.5px] rotate-45' : ''}`}
						/>
						<span
							className={`bg-rl-ink block h-[1.5px] w-5 transition-opacity duration-200 ${open ? 'opacity-0' : ''}`}
						/>
						<span
							className={`bg-rl-ink block h-[1.5px] w-5 origin-center transition-transform duration-200 ${open ? '-translate-y-[6.5px] -rotate-45' : ''}`}
						/>
					</button>
				</div>
			</div>

			{/* Mobile dropdown */}
			{open && (
				<div className="border-rl-hairline-soft flex flex-col gap-1 border-t px-4 py-4 md:hidden">
					{navLinks.map((l) => (
						<Link
							key={l.key}
							to={l.to}
							onClick={() => setOpen(false)}
							className={`font-rl-sans text-rl-ink rounded-xl px-3 py-3 text-[15px] no-underline ${current === l.key ? 'bg-rl-cream-deep font-semibold' : 'font-medium'}`}
						>
							{l.label}
						</Link>
					))}
					<div className="border-rl-hairline-soft mt-3 flex flex-col gap-2 border-t pt-3">
						<ExternalLink
							href={`${PROPERTY_MANAGER_APP_URL}/login`}
							className="font-rl-sans text-rl-muted px-3 py-3 text-[15px] font-medium no-underline"
						>
							Log in
						</ExternalLink>
						<ExternalLink
							href={`${PROPERTY_MANAGER_APP_URL}/apply`}
							className="bg-rl-crimson font-rl-sans rounded-[11px] px-4 py-3 text-center text-[14.5px] font-semibold tracking-[0.1px] text-white no-underline"
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
	const colLink =
		'font-rl-sans text-sm text-white/75 no-underline block py-1 cursor-pointer'
	const colTitle =
		'font-rl-sans text-[12.5px] font-semibold text-white/45 tracking-[1.2px] uppercase mb-[18px] m-0'

	return (
		<div className="bg-rl-black rounded-t-3xl px-4 pt-10 pb-6 text-white md:px-14 md:pt-16 md:pb-8">
			<div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-8 border-b border-white/[0.08] pb-10 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] md:gap-10 md:pb-14">
				<div className="col-span-2 md:col-span-1">
					<MarketingLogo size={26} mono />
					<p className="font-rl-sans mt-4 max-w-[280px] text-sm leading-[1.55] text-white/55">
						The rental platform that takes both sides seriously. Made in Accra.
					</p>
				</div>
				<div>
					<p className={colTitle}>Product</p>
					<Link to="/managers" className={colLink}>
						For Managers
					</Link>
					<Link to="/tenants" className={colLink}>
						For Tenants
					</Link>
					<Link to="/pricing" className={colLink}>
						Pricing
					</Link>
				</div>
				<div>
					<p className={colTitle}>Company</p>
					<span className={colLink}>About</span>
					<Link to="/blog" className={colLink}>
						Blog
					</Link>
					{/* <span className={colLink}>Careers</span> */}
					<ExternalLink href={CONTACT_US_URL} className={colLink}>
						Contact
					</ExternalLink>
				</div>
				<div>
					<p className={colTitle}>Support</p>
					<button
						type="button"
						onClick={() => (window as any)?.Tawk_API?.toggle()}
						className={`${colLink} border-none bg-transparent p-0 text-left`}
					>
						Help center
					</button>
					{/* <span className={colLink}>Status</span> */}
					{/* <span className={colLink}>Refer a friend</span> */}
					<ExternalLink href={WHATSAPP_URL} className={colLink}>
						WhatsApp us
					</ExternalLink>
				</div>
				<div>
					<p className={colTitle}>Legal</p>
					<Link to="/privacy-policy" className={colLink}>
						Privacy
					</Link>
					<Link to="/terms" className={colLink}>
						Terms
					</Link>
					{/* <span className={colLink}>Security</span> */}
				</div>
			</div>
			<div className="font-rl-sans mx-auto flex max-w-[1280px] flex-col gap-4 pt-6 text-[13px] text-white/45 md:flex-row md:items-center md:justify-between md:pt-7">
				<span>© 2026 Rentloop, Ltd. · Accra, Ghana</span>
				<div className="flex items-center gap-4">
					<a
						href="https://www.instagram.com/rentloop_app"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Instagram"
						className="text-white/45 transition-colors hover:text-white/80"
					>
						<svg
							fill="currentColor"
							viewBox="0 0 24 24"
							className="size-[18px]"
						>
							<path
								fillRule="evenodd"
								d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
								clipRule="evenodd"
							/>
						</svg>
					</a>
					<a
						href="https://www.tiktok.com/@rentekloop_app1"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="TikTok"
						className="text-white/45 transition-colors hover:text-white/80"
					>
						<svg
							fill="currentColor"
							viewBox="0 0 24 24"
							className="size-[18px]"
						>
							<path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.77 1.53V6.77a4.85 4.85 0 01-1-.08z" />
						</svg>
					</a>
					<a
						href="https://www.facebook.com/rentloop"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Facebook"
						className="text-white/45 transition-colors hover:text-white/80"
					>
						<svg
							fill="currentColor"
							viewBox="0 0 24 24"
							className="size-[18px]"
						>
							<path
								fillRule="evenodd"
								d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
								clipRule="evenodd"
							/>
						</svg>
					</a>
					<a
						href="https://x.com/rentloopapp"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="X"
						className="text-white/45 transition-colors hover:text-white/80"
					>
						<svg
							fill="currentColor"
							viewBox="0 0 24 24"
							className="size-[18px]"
						>
							<path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
						</svg>
					</a>
					<a
						href="https://wa.me/233201080802"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="WhatsApp"
						className="text-white/45 transition-colors hover:text-white/80"
					>
						<svg
							fill="currentColor"
							viewBox="0 0 24 24"
							className="size-[18px]"
						>
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
						</svg>
					</a>
				</div>
				<span>v{pkg.version} · All systems normal</span>
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

export function Placeholder({
	width = '100%',
	height,
	label,
	sub,
	dark,
	radius = 14,
	tone = 'cream',
	style,
}: PlaceholderProps) {
	const palette = dark
		? {
				bg: '#1A1A1A',
				stripe: 'rgba(255,255,255,0.05)',
				border: 'rgba(255,255,255,0.10)',
				text: 'rgba(255,255,255,0.55)',
			}
		: tone === 'crimson'
			? {
					bg: '#F4DBE3',
					stripe: 'rgba(200,0,58,0.08)',
					border: 'rgba(200,0,58,0.20)',
					text: '#7E0024',
				}
			: tone === 'cream-deep'
				? {
						bg: RL.creamWarm,
						stripe: 'rgba(17,17,16,0.04)',
						border: 'rgba(17,17,16,0.10)',
						text: 'rgba(17,17,16,0.55)',
					}
				: {
						bg: RL.creamDeep,
						stripe: 'rgba(17,17,16,0.045)',
						border: 'rgba(17,17,16,0.10)',
						text: 'rgba(17,17,16,0.55)',
					}

	return (
		<div
			style={{
				width,
				height,
				borderRadius: radius,
				background: `repeating-linear-gradient(135deg, ${palette.bg} 0 16px, ${palette.stripe} 16px 32px)`,
				border: `1px solid ${palette.border}`,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 6,
				fontFamily: "'JetBrains Mono', ui-monospace, monospace",
				fontSize: 12,
				color: palette.text,
				letterSpacing: 0.6,
				padding: 20,
				textAlign: 'center',
				boxSizing: 'border-box',
				textTransform: 'uppercase',
				flexShrink: 0,
				...style,
			}}
		>
			<span style={{ fontWeight: 500 }}>{label}</span>
			{sub && (
				<span
					style={{
						fontSize: 10.5,
						opacity: 0.7,
						textTransform: 'none',
						letterSpacing: 0.3,
						fontFamily: "'DM Sans', system-ui, sans-serif",
					}}
				>
					{sub}
				</span>
			)}
		</div>
	)
}

// ── Type helpers ─────────────────────────────────────────────
export function Eyebrow({
	children,
	color,
}: {
	children: React.ReactNode
	color?: string
}) {
	return (
		<div
			className="font-rl-sans text-rl-crimson text-[12.5px] font-semibold tracking-[1.2px] uppercase"
			style={color ? { color } : undefined}
		>
			{children}
		</div>
	)
}

export function Em({
	children,
	color,
}: {
	children: React.ReactNode
	color?: string
}) {
	return (
		<em
			className="font-rl-serif text-rl-crimson italic"
			style={color ? { color } : undefined}
		>
			{children}
		</em>
	)
}

// Dynamic typography — size/color/spacing come from props, so inline styles handle those values
export function BodyText({
	size = 16,
	children,
	color,
	maxWidth,
	lh = 1.6,
	align = 'left',
}: {
	size?: number
	children: React.ReactNode
	color?: string
	maxWidth?: number
	lh?: number
	align?: React.CSSProperties['textAlign']
}) {
	return (
		<div
			className="font-rl-sans m-0"
			style={{
				fontSize: size,
				color: color ?? RL.muted,
				lineHeight: lh,
				maxWidth,
				textAlign: align,
			}}
		>
			{children}
		</div>
	)
}

export function Headline({
	size = 64,
	children,
	lh = 1.02,
	ls = -1.2,
	color,
	align = 'left',
}: {
	size?: number | string
	children: React.ReactNode
	lh?: number
	ls?: number
	color?: string
	align?: React.CSSProperties['textAlign']
}) {
	return (
		<h1
			className="font-rl-serif m-0 font-normal"
			style={{
				fontSize: size,
				lineHeight: lh,
				letterSpacing: ls,
				color: color ?? RL.ink,
				textAlign: align,
			}}
		>
			{children}
		</h1>
	)
}

export function SubHead({
	size = 36,
	children,
	lh = 1.1,
	ls = -0.6,
	color,
	align = 'left',
}: {
	size?: number | string
	children: React.ReactNode
	lh?: number
	ls?: number
	color?: string
	align?: React.CSSProperties['textAlign']
}) {
	return (
		<h2
			className="font-rl-serif m-0 font-normal"
			style={{
				fontSize: size,
				lineHeight: lh,
				letterSpacing: ls,
				color: color ?? RL.ink,
				textAlign: align,
			}}
		>
			{children}
		</h2>
	)
}

export function SectionHeader({
	eyebrow,
	title,
	body,
	align = 'left',
	maxWidth = 720,
	accent,
	dark = false,
}: {
	eyebrow: string
	title: React.ReactNode
	body?: string
	align?: 'left' | 'center'
	maxWidth?: number
	accent?: string
	dark?: boolean
}) {
	return (
		<div
			className={`flex flex-col gap-4 ${align === 'center' ? 'mx-auto items-center text-center' : 'items-start'}`}
			style={{ maxWidth }}
		>
			<Eyebrow color={accent}>{eyebrow}</Eyebrow>
			<SubHead
				size="clamp(26px, 4vw, 48px)"
				ls={-1.2}
				color={dark ? '#fff' : undefined}
				align={align}
			>
				{title}
			</SubHead>
			{body && (
				<BodyText
					size={17}
					color={dark ? 'rgba(255,255,255,0.65)' : undefined}
					align={align}
					maxWidth={maxWidth}
				>
					{body}
				</BodyText>
			)}
		</div>
	)
}

// ── CTA Band ─────────────────────────────────────────────────
export function CTABand({
	eyebrow = 'Get started',
	title,
	body,
	primary,
	secondary,
}: {
	eyebrow?: string
	title: React.ReactNode
	body?: string
	primary: React.ReactNode
	secondary?: React.ReactNode
}) {
	return (
		<div className="bg-rl-black relative my-10 overflow-hidden rounded-3xl px-6 py-12 text-white md:px-20 md:py-[88px]">
			{/* Radial glow accent — inline because it's a dynamic gradient */}
			<div
				className="pointer-events-none absolute h-[360px] w-[360px] rounded-full"
				style={{
					top: -120,
					right: -120,
					background: `radial-gradient(circle, rgba(200,0,58,0.2) 0%, transparent 60%)`,
				}}
			/>
			<div className="relative mx-auto flex max-w-[720px] flex-col items-center gap-[22px] text-center">
				<Eyebrow color={RL.crimsonLight}>{eyebrow}</Eyebrow>
				<Headline
					size="clamp(28px, 4.5vw, 56px)"
					ls={-1.2}
					color="#fff"
					align="center"
				>
					{title}
				</Headline>
				{body && (
					<BodyText
						size={17}
						color="rgba(255,255,255,0.65)"
						align="center"
						maxWidth={520}
					>
						{body}
					</BodyText>
				)}
				<div className="mt-2 flex flex-wrap justify-center gap-3">
					{primary}
					{secondary}
				</div>
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

export function CTAButton({
	kind = 'primary',
	size = 'md',
	children,
	href,
	onClick,
	style,
}: CTAButtonProps) {
	const base = `font-rl-sans font-semibold tracking-[0.1px] inline-flex items-center gap-2 rounded-[11px] cursor-pointer whitespace-nowrap no-underline transition-[transform,opacity] duration-150 hover:opacity-90 hover:-translate-y-px ${kindClass[kind]} ${sizeClass[size]}`

	if (href) {
		return (
			<a href={href} className={base} style={style}>
				{children}
			</a>
		)
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
		<a
			href={APP_STORE_URL}
			className="bg-rl-ink font-rl-sans inline-flex items-center gap-3 rounded-xl py-[14px] pr-[22px] pl-[18px] font-semibold text-white no-underline"
		>
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="#fff"
				aria-hidden="true"
			>
				<path d="M17.05 12.78c-.02-2.74 2.24-4.06 2.34-4.13-1.27-1.86-3.26-2.11-3.97-2.14-1.69-.17-3.3 1-4.16 1-.88 0-2.19-.98-3.6-.95-1.85.03-3.56 1.08-4.51 2.74-1.93 3.34-.49 8.27 1.38 10.98.92 1.32 2 2.8 3.41 2.75 1.37-.06 1.89-.89 3.54-.89s2.12.89 3.56.86c1.47-.02 2.4-1.34 3.3-2.67 1.04-1.53 1.47-3.01 1.49-3.09-.03-.01-2.86-1.1-2.88-4.36zM14.41 4.65C15.16 3.74 15.67 2.48 15.53 1.22c-1.08.05-2.39.72-3.16 1.63-.69.8-1.31 2.09-1.14 3.32 1.21.09 2.43-.62 3.18-1.52z" />
			</svg>
			<div className="text-left leading-[1.15]">
				<div className="text-[10px] font-medium opacity-70">
					Download on the
				</div>
				<div className="text-[15px]">App Store</div>
			</div>
		</a>
	)
}

export function PlayStoreBadge() {
	return (
		<a
			href={PLAY_STORE_URL}
			className="bg-rl-ink font-rl-sans inline-flex items-center gap-3 rounded-xl py-[14px] pr-[22px] pl-[18px] font-semibold text-white no-underline"
		>
			<svg
				width="20"
				height="22"
				viewBox="0 0 22 24"
				fill="none"
				aria-hidden="true"
			>
				<path d="M3 2.5v19l10-9.5L3 2.5z" fill="#34D399" />
				<path
					d="M13 12l3.5-3.3L20.5 11c.6.3.6 1.4 0 1.7l-4 2.3L13 12z"
					fill="#FBBF24"
				/>
				<path d="M3 2.5l10 9.5-3.5 3.3L3 21.5V2.5z" fill="#60A5FA" />
			</svg>
			<div className="text-left leading-[1.15]">
				<div className="text-[10px] font-medium opacity-70">Get it on</div>
				<div className="text-[15px]">Google Play</div>
			</div>
		</a>
	)
}

// ── Hairline divider ──────────────────────────────────────────
export function Hairline({ maxWidth = 1280 }: { maxWidth?: number }) {
	return (
		<div className="bg-rl-hairline-soft mx-auto h-px" style={{ maxWidth }} />
	)
}

// ── Section wrapper ───────────────────────────────────────────
export function Section({
	id,
	eyebrow,
	title,
	body,
	children,
	divider = true,
	accent,
}: {
	id: string
	eyebrow: string
	title: React.ReactNode
	body?: string
	children: React.ReactNode
	divider?: boolean
	accent?: string
}) {
	return (
		<div
			id={id}
			className="mx-auto max-w-[1280px] scroll-mt-20 px-4 pt-14 pb-10 md:px-14 md:pt-[88px] md:pb-14"
		>
			<SectionHeader
				eyebrow={eyebrow}
				title={title}
				body={body}
				maxWidth={680}
				accent={accent}
			/>
			<div className="mt-10 md:mt-12">{children}</div>
			{divider && <div className="bg-rl-hairline-soft mt-12 h-px md:mt-14" />}
		</div>
	)
}

// ── Feature card ─────────────────────────────────────────────
export function FeatureCard({
	title,
	body,
	bullets,
	placeholder,
	placeholderSub,
	image,
	span = 1,
	dark = false,
}: {
	title: React.ReactNode
	body: string
	bullets?: string[]
	placeholder: string
	placeholderSub?: string
	image?: string
	span?: number
	dark?: boolean
}) {
	const imgHeight = span === 2 ? 280 : 200
	return (
		<div
			className={`flex flex-col gap-[18px] rounded-[20px] p-7 ${dark ? 'border border-white/10 bg-white/[0.04]' : 'border-rl-hairline border bg-white'}`}
			style={{ gridColumn: `span ${span}` }}
		>
			{image ? (
				<img
					src={image}
					alt=""
					className="w-full rounded-xl object-cover object-center"
					style={{ height: imgHeight }}
				/>
			) : (
				<Placeholder
					height={imgHeight}
					label={placeholder}
					sub={placeholderSub}
					radius={12}
					dark={dark}
				/>
			)}
			<div>
				<SubHead size={22} ls={-0.3} color={dark ? '#fff' : undefined}>
					{title}
				</SubHead>
				<BodyText
					size={14.5}
					color={dark ? 'rgba(255,255,255,0.65)' : undefined}
				>
					<div className="mt-2 leading-[1.55]">{body}</div>
				</BodyText>
				{bullets && (
					<ul className="mt-3.5 flex list-none flex-col gap-[7px] p-0">
						{bullets.map((b, i) => (
							<li
								key={i}
								className="font-rl-sans text-rl-ink-soft flex items-start gap-2.5 text-[13.5px] leading-[1.5]"
							>
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
export function AnchorNav({
	links,
	label = "What's in it",
}: {
	links: Array<{ id: string; t: string }>
	label?: string
}) {
	return (
		<div className="bg-rl-cream/85 border-rl-hairline-soft sticky top-0 z-10 overflow-x-auto border-t border-b px-4 py-[14px] backdrop-blur-xl md:px-14">
			<div className="mx-auto flex max-w-[1280px] items-center gap-1.5 whitespace-nowrap">
				<span className="font-rl-mono text-rl-crimson mr-3 shrink-0 text-[11px] tracking-[1px] uppercase">
					{label} →
				</span>
				{links.map((l) => (
					<a
						key={l.id}
						href={`#${l.id}`}
						className="font-rl-sans text-rl-ink-soft shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium no-underline transition-colors hover:bg-white"
					>
						{l.t}
					</a>
				))}
			</div>
		</div>
	)
}

// ── Page wrapper ─────────────────────────────────────────────
export function MarketingPage({
	current,
	children,
}: {
	current?: string
	children: React.ReactNode
}) {
	return (
		<div className="font-rl-sans min-h-screen">
			<TopBar />
			<MarketingNav current={current} />
			{children}
			<MarketingFooter />
		</div>
	)
}
