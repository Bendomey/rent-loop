import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { ExternalLink } from '~/components/layout/ExternalLink'
import { MarketingPage } from '~/components/marketing'
import { PROPERTY_MANAGER_APP_URL } from '~/lib/constants'

const INK = '#111110'
const MUTED = 'rgba(17,17,16,.58)'
const MICRO = 'rgba(17,17,16,.34)'
const HAIR = 'rgba(17,17,16,.11)'
const HAIRSOFT = 'rgba(17,17,16,.06)'
const CREAM = '#F5F4F1'
const CREAMDEEP = '#EDEAE3'
const CRIMSON = '#C8003A'
const GREEN = '#1B9E5C'
const BLUE = '#2E6CF6'
const ORANGE = '#E97B2A'
const BLACK = '#0A0A0A'
const BODY = '#2c2b28'

const APPLY_URL = `${PROPERTY_MANAGER_APP_URL}/apply`

const serif = "'DM Serif Display', Georgia, serif"
const mono = "'JetBrains Mono', ui-monospace, monospace"

const card: CSSProperties = {
	background: '#fff',
	border: `1px solid ${HAIR}`,
	borderRadius: 14,
}

const keyStyle: CSSProperties = {
	fontFamily: mono,
	fontSize: 14,
	letterSpacing: '.09em',
	textTransform: 'uppercase',
	color: '#55534e',
}

const twoGrid: CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
	gap: 18,
}

const thStyle: CSSProperties = {
	fontFamily: mono,
	fontSize: 13.5,
	letterSpacing: '.07em',
	textTransform: 'uppercase',
	color: '#55534e',
	textAlign: 'left',
	padding: '14px 18px',
	borderBottom: `1px solid ${HAIR}`,
}

const tdStyle: CSSProperties = {
	padding: '15px 18px',
	borderBottom: `1px solid ${HAIRSOFT}`,
	fontSize: 16.5,
}

function Logo({ size = 18 }: { size?: number }) {
	return (
		<div style={{ fontSize: size, fontWeight: 700, letterSpacing: '-.3px' }}>
			<span style={{ color: CRIMSON }}>rent</span>loop
		</div>
	)
}

function Dot({ c, s = 8 }: { c: string; s?: number }) {
	return (
		<span
			style={{
				width: s,
				height: s,
				borderRadius: '50%',
				background: c,
				flex: '0 0 auto',
				display: 'inline-block',
			}}
		/>
	)
}

function Chip({
	children,
	style,
}: {
	children: ReactNode
	style?: CSSProperties
}) {
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 8,
				border: `1px solid ${HAIR}`,
				background: '#fff',
				borderRadius: 999,
				padding: '9px 16px',
				fontSize: 15,
				fontWeight: 500,
				...style,
			}}
		>
			{children}
		</span>
	)
}

function Placeholder({
	children,
	height,
	maxWidth,
}: {
	children: ReactNode
	height: number
	maxWidth?: number
}) {
	return (
		<div
			style={{
				background:
					'repeating-linear-gradient(45deg,rgba(17,17,16,.05) 0 6px,transparent 6px 12px)',
				border: `1px dashed ${HAIR}`,
				borderRadius: 10,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: mono,
				fontSize: 14,
				color: '#55534e',
				textAlign: 'center',
				padding: 10,
				height,
				maxWidth,
			}}
		>
			{children}
		</div>
	)
}

function Column({ children }: { children: ReactNode }) {
	return (
		<div style={{ maxWidth: 700, margin: '0 auto', padding: '52px 0' }}>
			{children}
		</div>
	)
}

function Figure({
	children,
	tight = true,
	caption,
}: {
	children: ReactNode
	tight?: boolean
	caption?: ReactNode
}) {
	return (
		<div style={{ margin: '8px auto 34px', maxWidth: tight ? 920 : 1100 }}>
			{children}
			{caption && (
				<div
					style={{
						fontFamily: mono,
						fontSize: 14,
						lineHeight: 1.55,
						color: '#55534e',
						marginTop: 14,
						textAlign: 'center',
					}}
				>
					{caption}
				</div>
			)}
		</div>
	)
}

function Stage({
	children,
	variant = 'dark',
	style,
}: {
	children: ReactNode
	variant?: 'dark' | 'crimson'
	style?: CSSProperties
}) {
	const bg = variant === 'crimson' ? CRIMSON : BLACK
	return (
		<div
			style={{
				background: bg,
				borderRadius: 22,
				padding: 34,
				border: `1px solid ${bg}`,
				...style,
			}}
		>
			{children}
		</div>
	)
}

function H2({ children }: { children: ReactNode }) {
	return (
		<h2
			style={{
				fontFamily: serif,
				fontSize: 'clamp(29px,3.2vw,38px)',
				lineHeight: 1.13,
				letterSpacing: '-.8px',
				fontWeight: 400,
				margin: '0 0 20px',
				color: INK,
			}}
		>
			{children}
		</h2>
	)
}

function H3({ children }: { children: ReactNode }) {
	return (
		<h3
			style={{
				fontSize: 20,
				fontWeight: 600,
				letterSpacing: '-.2px',
				margin: '30px 0 12px',
				color: INK,
			}}
		>
			{children}
		</h3>
	)
}

function Num2({ children }: { children: ReactNode }) {
	return (
		<div
			style={{
				fontFamily: mono,
				fontSize: 14,
				fontWeight: 700,
				letterSpacing: '.09em',
				color: CRIMSON,
				textTransform: 'uppercase',
				marginBottom: 12,
			}}
		>
			{children}
		</div>
	)
}

function P({
	children,
	lead = false,
}: {
	children: ReactNode
	lead?: boolean
}) {
	return (
		<p
			style={{
				fontSize: lead ? 20 : 18.5,
				lineHeight: 1.62,
				color: BODY,
				marginBottom: 20,
			}}
		>
			{children}
		</p>
	)
}

function Quote({ children }: { children: ReactNode }) {
	return (
		<div
			style={{
				fontFamily: serif,
				fontSize: 26,
				lineHeight: 1.35,
				letterSpacing: '-.5px',
				color: INK,
				borderLeft: `3px solid ${CRIMSON}`,
				padding: '4px 0 4px 22px',
				margin: '8px 0 26px',
			}}
		>
			{children}
		</div>
	)
}

function PlainList({ items }: { items: ReactNode[] }) {
	return (
		<ul
			style={{
				listStyle: 'none',
				display: 'flex',
				flexDirection: 'column',
				gap: 13,
				margin: '4px 0 26px',
				padding: 0,
			}}
		>
			{items.map((item, i) => (
				<li
					key={i}
					style={{
						fontSize: 18.5,
						lineHeight: 1.5,
						color: BODY,
						paddingLeft: 20,
						position: 'relative',
					}}
				>
					<span
						style={{
							position: 'absolute',
							left: 0,
							top: 11,
							width: 7,
							height: 7,
							borderRadius: '50%',
							background: CRIMSON,
							opacity: 0.85,
						}}
					/>
					{item}
				</li>
			))}
		</ul>
	)
}

function Stat({
	big,
	txt,
	src,
	flush = false,
}: {
	big: string
	txt: ReactNode
	src: string
	flush?: boolean
}) {
	return (
		<div
			style={{
				background: CREAM,
				border: `1px solid ${HAIR}`,
				borderRadius: 16,
				padding: '24px 26px',
				margin: flush ? 0 : '6px 0 26px',
			}}
		>
			<div
				style={{
					fontFamily: serif,
					fontSize: 'clamp(32px,4.4vw,46px)',
					letterSpacing: '-1px',
					lineHeight: 1.05,
				}}
			>
				{big}
			</div>
			<div
				style={{ fontSize: 17, lineHeight: 1.5, color: BODY, marginTop: 10 }}
			>
				{txt}
			</div>
			<div
				style={{
					fontFamily: mono,
					fontSize: 14,
					color: '#55534e',
					marginTop: 12,
				}}
			>
				{src}
			</div>
		</div>
	)
}

function TableScroll({ children }: { children: ReactNode }) {
	return (
		<div
			style={{
				overflowX: 'auto',
				border: `1px solid ${HAIR}`,
				borderRadius: 14,
			}}
		>
			{children}
		</div>
	)
}

function ScaledShot({
	width,
	children,
}: {
	width: number
	children: ReactNode
}) {
	const boxRef = useRef<HTMLDivElement>(null)
	const shotRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const box = boxRef.current
		const shot = shotRef.current
		if (!box || !shot) return

		const fit = () => {
			const inner = shot.firstElementChild as HTMLElement | null
			if (!inner) return
			const k = Math.min(1, box.clientWidth / width)
			shot.style.transform = `scale(${k})`
			box.style.height = `${inner.offsetHeight * k}px`
		}

		const ro = new ResizeObserver(fit)
		ro.observe(box)
		fit()
		if (document.fonts) void document.fonts.ready.then(fit)
		return () => ro.disconnect()
	}, [width])

	return (
		<div ref={boxRef} style={{ position: 'relative', overflow: 'hidden' }}>
			<div ref={shotRef} style={{ transformOrigin: 'top left', width }}>
				{children}
			</div>
		</div>
	)
}

function Scrap({
	style,
	label,
	children,
}: {
	style: CSSProperties
	label?: string
	children: ReactNode
}) {
	return (
		<div
			style={{
				position: 'absolute',
				background: '#fff',
				border: `1px solid ${HAIR}`,
				borderRadius: 12,
				padding: '16px 18px',
				boxShadow: '0 14px 30px -20px rgba(17,17,16,.45)',
				...style,
			}}
		>
			{label && (
				<div
					style={{
						fontFamily: mono,
						fontSize: 14,
						letterSpacing: '.08em',
						textTransform: 'uppercase',
						color: '#55534e',
					}}
				>
					{label}
				</div>
			)}
			{children}
		</div>
	)
}

const TEN_THINGS: Array<[string, string]> = [
	['Properties and units', 'in one structure'],
	['Mobile Money and bank', 'matched to a person'],
	['Rent bills', 'raised on schedule'],
	['Tenant records', 'not a chat history'],
	['Repairs', 'with a status you can see'],
	['Agreements', 'signed and stored'],
	['Condition reports', 'dated, with photos'],
	['Reporting', 'revenue and occupancy'],
	['Access', 'the right person only'],
	['Tenant app', 'so he can check himself'],
]

function HeroCollage() {
	const scrapCell: CSSProperties = { padding: '9px 11px' }
	const scrapHead: CSSProperties = {
		...scrapCell,
		background: CREAM,
		fontWeight: 600,
	}
	const scrapRow: CSSProperties = {
		...scrapCell,
		borderTop: `1px solid ${HAIRSOFT}`,
	}
	return (
		<div style={{ width: 1060, height: 800, position: 'relative' }}>
			<Scrap
				label="tenants.xlsx · sheet 2"
				style={{ left: 6, top: 24, width: 300, transform: 'rotate(-3deg)' }}
			>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: '1.4fr 1fr 1fr',
						border: `1px solid ${HAIR}`,
						borderRadius: 8,
						overflow: 'hidden',
						marginTop: 12,
						fontSize: 16,
					}}
				>
					<div style={scrapHead}>Name</div>
					<div style={scrapHead}>Unit</div>
					<div style={scrapHead}>Paid?</div>
					<div style={scrapRow}>Gideon B.</div>
					<div style={scrapRow}>B12</div>
					<div style={scrapRow}>yes</div>
					<div style={scrapRow}>Akosua M.</div>
					<div style={scrapRow}>A4</div>
					<div style={{ ...scrapRow, color: CRIMSON }}>??</div>
					<div style={scrapRow}>Selorm T.</div>
					<div style={scrapRow}>A9</div>
					<div style={scrapRow}>part</div>
				</div>
			</Scrap>

			<Scrap
				label="SMS · MobileMoney"
				style={{ left: 300, top: 70, width: 290, transform: 'rotate(2.5deg)' }}
			>
				<div
					style={{
						fontSize: 17.5,
						lineHeight: 1.45,
						marginTop: 10,
						color: BODY,
					}}
				>
					Payment received GHS 1,500.00 from 024*** 4567. Ref 88213. Bal GHS
					22,410.00
				</div>
				<div style={{ fontSize: 16, color: CRIMSON, marginTop: 10 }}>
					Which unit was this for?
				</div>
			</Scrap>

			<Scrap
				label="WhatsApp · 11:42pm"
				style={{ left: 34, top: 250, width: 330, transform: 'rotate(1.5deg)' }}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						gap: 9,
						marginTop: 12,
					}}
				>
					<div
						style={{
							background: CREAM,
							borderRadius: '12px 12px 12px 3px',
							padding: '11px 13px',
							fontSize: 17,
							lineHeight: 1.4,
						}}
					>
						Madam, the bathroom pipe has not been flowing well for three weeks
						now
					</div>
					<div
						style={{
							background: CREAM,
							borderRadius: '12px 12px 12px 3px',
							padding: '11px 13px',
							fontSize: 17,
							lineHeight: 1.4,
							width: '82%',
						}}
					>
						Any news on the plumber?
					</div>
				</div>
			</Scrap>

			<Scrap
				label="Bank statement · Aug"
				style={{
					left: 356,
					top: 296,
					width: 266,
					transform: 'rotate(-2.5deg)',
				}}
			>
				<div style={{ marginTop: 10, fontSize: 16.5 }}>
					{[
						['14 AUG TRF', '1,500.00'],
						['18 AUG TRF', '2,150.00'],
						['21 AUG TRF', '900.00'],
					].map(([d, amt], i) => (
						<div
							key={d}
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								padding: '8px 0',
								borderBottom: i < 2 ? `1px solid ${HAIRSOFT}` : undefined,
							}}
						>
							<span style={{ color: MUTED }}>{d}</span>
							<span style={{ fontWeight: 600 }}>{amt}</span>
						</div>
					))}
				</div>
			</Scrap>

			<Scrap
				label="Notebook"
				style={{ left: 6, top: 492, width: 176, transform: 'rotate(2deg)' }}
			>
				<div
					style={{
						fontSize: 17.5,
						lineHeight: 1.6,
						marginTop: 10,
						color: BODY,
					}}
				>
					Plumber — 240
					<br />
					Paint for A4 — 90
					<br />
					Gate welding — 180
				</div>
			</Scrap>

			<Scrap
				style={{
					left: 206,
					top: 572,
					width: 172,
					height: 168,
					transform: 'rotate(-5deg)',
					background: CRIMSON,
					borderColor: CRIMSON,
				}}
			>
				<div
					style={{
						fontSize: 18,
						lineHeight: 1.45,
						color: '#fff',
						fontWeight: 500,
					}}
				>
					Ask Akosua again about September.
					<br />
					<br />
					Lease A9 ends soon?
				</div>
			</Scrap>

			<Scrap
				label="Inbox · 3 Jan 2024"
				style={{ left: 394, top: 620, width: 196, transform: 'rotate(4deg)' }}
			>
				<div style={{ fontSize: 17, fontWeight: 600, marginTop: 10 }}>
					RE: tenancy agreement
				</div>
				<div style={{ fontSize: 16, color: MUTED, marginTop: 6 }}>
					1 attachment · signed_final_v3.pdf
				</div>
			</Scrap>

			<div
				style={{
					position: 'absolute',
					left: 660,
					top: 26,
					width: 392,
					background: '#fff',
					border: `1px solid ${HAIR}`,
					borderRadius: 18,
					boxShadow: '0 34px 70px -34px rgba(17,17,16,.45)',
					padding: '28px 30px',
				}}
			>
				<div style={{ ...keyStyle, color: CRIMSON }}>
					What replaces all of it
				</div>
				<div
					style={{
						fontFamily: serif,
						fontSize: 34,
						lineHeight: 1.1,
						letterSpacing: '-.8px',
						margin: '12px 0 18px',
					}}
				>
					Ten things one app should answer
				</div>
				<div style={{ display: 'flex', flexDirection: 'column' }}>
					{TEN_THINGS.map(([label, suffix], i) => (
						<div
							key={label}
							style={{
								display: 'flex',
								gap: 14,
								alignItems: 'baseline',
								padding: '11px 0',
								borderTop: i === 0 ? undefined : `1px solid ${HAIRSOFT}`,
							}}
						>
							<span
								style={{
									fontFamily: mono,
									fontSize: 15,
									fontWeight: 700,
									color: CRIMSON,
									width: 22,
									flex: '0 0 auto',
								}}
							>
								{i + 1}
							</span>
							<span style={{ fontSize: 18, fontWeight: 600 }}>{label}</span>
							<span style={{ fontSize: 16.5, color: MUTED }}>{suffix}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

function BeforeAfterList({
	tone,
	label,
	title,
	children,
}: {
	tone: string
	label: string
	title: string
	children: ReactNode
}) {
	return (
		<div style={{ ...card, padding: '22px 24px' }}>
			<div style={{ ...keyStyle, color: tone }}>{label}</div>
			<div style={{ fontSize: 17, fontWeight: 600, margin: '10px 0 12px' }}>
				{title}
			</div>
			{children}
		</div>
	)
}

function UnitStatusRow({
	c,
	name,
	note,
	border,
}: {
	c: string
	name: string
	note: string
	border: boolean
}) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 12,
				paddingBottom: border ? 9 : 0,
				borderBottom: border ? `1px solid ${HAIRSOFT}` : undefined,
			}}
		>
			<Dot c={c} />
			<div style={{ flex: 1, fontSize: 16 }}>{name}</div>
			<span style={{ fontSize: 15, color: MUTED }}>{note}</span>
		</div>
	)
}

function PayChannelRow({
	c,
	label,
	count,
	border,
}: {
	c: string
	label: string
	count: string
	border: boolean
}) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 12,
				padding: '12px 0',
				borderBottom: border ? `1px solid ${HAIRSOFT}` : undefined,
			}}
		>
			<Dot c={c} />
			<div style={{ flex: 1, fontSize: 16 }}>{label}</div>
			<span style={{ fontSize: 15.5, color: MUTED }}>{count}</span>
		</div>
	)
}

function MatchedRow({
	amount,
	who,
	status,
	statusColor,
	statusBorder,
}: {
	amount: string
	who: string
	status: string
	statusColor: string
	statusBorder: string
}) {
	return (
		<div
			style={{
				...card,
				padding: '14px 16px',
				background: CREAM,
				display: 'flex',
				gap: 14,
				alignItems: 'center',
			}}
		>
			<div style={{ flex: 1 }}>
				<div style={{ fontSize: 16, fontWeight: 600 }}>{amount}</div>
				<div style={{ fontSize: 15, color: MUTED, marginTop: 2 }}>{who}</div>
			</div>
			<Chip
				style={{ fontSize: 14, color: statusColor, borderColor: statusBorder }}
			>
				{status}
			</Chip>
		</div>
	)
}

function StatusCard({
	label,
	labelColor,
	title,
	desc,
	borderColor,
}: {
	label: string
	labelColor?: string
	title: string
	desc: string
	borderColor?: string
}) {
	return (
		<div
			style={{
				...card,
				padding: '16px 18px',
				...(borderColor ? { borderColor } : {}),
			}}
		>
			<div
				style={{
					...keyStyle,
					fontSize: 13.5,
					...(labelColor ? { color: labelColor } : {}),
				}}
			>
				{label}
			</div>
			<div style={{ fontSize: 16, fontWeight: 600, marginTop: 10 }}>
				{title}
			</div>
			<div style={{ fontSize: 15, color: MUTED, marginTop: 4 }}>{desc}</div>
		</div>
	)
}

function SignRow({ text, border }: { text: string; border: boolean }) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 12,
				padding: '14px 0',
				borderBottom: border ? `1px solid ${HAIRSOFT}` : undefined,
			}}
		>
			<Dot c={GREEN} />
			<div style={{ flex: 1, fontSize: 16 }}>{text}</div>
		</div>
	)
}

function RecordCell({
	label,
	value,
	leftBorder,
	topBorder,
}: {
	label: string
	value: string
	leftBorder?: boolean
	topBorder?: boolean
}) {
	return (
		<div
			style={{
				padding: '16px 18px',
				borderLeft: leftBorder ? `1px solid ${HAIRSOFT}` : undefined,
				borderTop: topBorder ? `1px solid ${HAIRSOFT}` : undefined,
			}}
		>
			<div style={{ ...keyStyle, fontSize: 13.5 }}>{label}</div>
			<div style={{ fontSize: 16.5, fontWeight: 600, marginTop: 6 }}>
				{value}
			</div>
		</div>
	)
}

function ConditionChip({
	label,
	color,
	border,
}: {
	label: string
	color: string
	border: string
}) {
	return (
		<Chip style={{ fontSize: 14, color, borderColor: border }}>
			<Dot c={color} />
			{label}
		</Chip>
	)
}

export default function BestPropertyManagementAppInGhana() {
	return (
		<MarketingPage current="blog">
			<div
				style={{ maxWidth: 1180, margin: '0 auto' }}
				className="px-4 md:px-10"
			>
				{/* Header */}
				<div
					style={{ maxWidth: 700, margin: '0 auto', padding: '56px 0 44px' }}
				>
					<div
						style={{
							fontFamily: mono,
							fontSize: 14,
							fontWeight: 500,
							letterSpacing: '.11em',
							textTransform: 'uppercase',
							color: CRIMSON,
						}}
					>
						Blog · Buyer's guide
					</div>
					<h1
						style={{
							fontFamily: serif,
							fontSize: 'clamp(40px,5.2vw,68px)',
							lineHeight: 1.04,
							letterSpacing: '-1.4px',
							fontWeight: 400,
							margin: '18px 0 0',
							textWrap: 'balance',
						}}
					>
						10 things to look for in the best property management app in Ghana
					</h1>
					<p
						style={{
							fontSize: 21,
							lineHeight: 1.5,
							color: MUTED,
							marginTop: 22,
							maxWidth: 640,
						}}
					>
						From rent collection and tenant records to maintenance, reporting
						and digital agreements — the features that decide whether software
						actually reduces your workload.
					</p>
					<div
						style={{
							display: 'flex',
							gap: 14,
							alignItems: 'center',
							marginTop: 26,
							fontSize: 15.5,
							color: MUTED,
							flexWrap: 'wrap',
						}}
					>
						<span>15 September 2026</span>
						<span>·</span>
						<span>Marketing Team</span>
						<span>·</span>
						<span>14 min read</span>
					</div>
				</div>

				{/* Hero collage */}
				<Figure
					tight={false}
					caption="On the left, what most portfolios still run on. On the right, the ten questions this guide works through."
				>
					<Stage style={{ padding: 'clamp(18px,3vw,44px)' }}>
						<ScaledShot width={1060}>
							<HeroCollage />
						</ScaledShot>
					</Stage>
				</Figure>

				{/* Intro */}
				<div style={{ maxWidth: 700, margin: '0 auto', padding: '52px 0' }}>
					<P lead>
						Managing rental properties in Ghana is becoming increasingly
						complex. A landlord with one property can keep track of tenants,
						rent and repairs using WhatsApp and a spreadsheet. When the
						portfolio grows to 20, 50 or 100 units, the same approach becomes
						hard to hold together.
					</P>
					<P>
						One tenant sends a WhatsApp message about a leaking tap. Another
						transfers rent through Mobile Money. A third pays by bank transfer.
						Meanwhile an old rental agreement sits in an email inbox,
						maintenance expenses are in a notebook, and the landlord is reading
						bank statements to work out who has paid.
					</P>
					<P>
						This is where property management software in Ghana makes a real
						difference — and the need is particularly relevant in this market.
					</P>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
							gap: 14,
							margin: '6px 0 26px',
						}}
					>
						<Stat
							flush
							big="34.6%"
							txt="of households occupied rented dwellings nationally — rising to 46.0% in urban areas."
							src="Ghana Statistical Service · 2021 Census"
						/>
						<Stat
							flush
							big="47.6%"
							txt="of households in Greater Accra rent, one of the highest proportions in the country."
							src="Ghana Statistical Service · 2021 Census"
						/>
						<Stat
							flush
							big="1.8m"
							txt="units — the housing deficit put forward by government sources, showing the scale of the sector."
							src="Ministry of Finance · Ministry of Works & Housing"
						/>
					</div>
					<P>
						As more properties are developed and more people depend on rental
						housing, landlords and managers need better ways to organise their
						operations. So what exactly should you look for when choosing the
						best property management app in Ghana? Here are ten features that
						matter.
					</P>
				</div>

				{/* One */}
				<Column>
					<Num2>One</Num2>
					<H2>Property and unit management</H2>
					<P>
						The first thing to consider is how the software organises your
						properties. A basic contact list can hold tenant names and phone
						numbers; a proper rental management system connects the whole
						structure — from the site down to the payment.
					</P>
				</Column>
				<Figure caption="The best app works for a landlord with 3 units and a company with 200 — the same structure, more of it.">
					<Stage variant="crimson">
						<div
							style={{
								display: 'flex',
								flexWrap: 'wrap',
								alignItems: 'stretch',
								gap: 10,
							}}
						>
							{[
								'Property',
								'Block',
								'Unit',
								'Tenant',
								'Lease',
								'Payments',
								'Maintenance',
							].map((label) => (
								<div
									key={label}
									style={{
										...card,
										padding: '14px 18px',
										fontSize: 16,
										fontWeight: 600,
										...(label === 'Unit'
											? { borderColor: '#C8003A44', color: CRIMSON }
											: {}),
									}}
								>
									{label}
								</div>
							))}
						</div>
						<div style={{ ...twoGrid, marginTop: 18 }}>
							<BeforeAfterList
								tone={CRIMSON}
								label="Before"
								title="A 60-unit complex, six places to look"
							>
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: 9,
										fontSize: 16,
										color: BODY,
									}}
								>
									<div>One spreadsheet of tenant information</div>
									<div>Another spreadsheet for rent payments</div>
									<div>WhatsApp groups for tenant messages</div>
									<div>Separate folders for rental agreements</div>
									<div>Bank statements for payment checking</div>
									<div>Phone notes for maintenance requests</div>
								</div>
							</BeforeAfterList>
							<BeforeAfterList
								tone={GREEN}
								label="After"
								title="One workspace, one record per unit"
							>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: 9 }}
								>
									<UnitStatusRow
										c={GREEN}
										name="Unit B12 · occupied"
										note="rent paid"
										border
									/>
									<UnitStatusRow
										c={BLUE}
										name="Unit B13 · vacant"
										note="free to let"
										border
									/>
									<UnitStatusRow
										c={MICRO}
										name="Unit B14 · on hold"
										note="application in"
										border
									/>
									<UnitStatusRow
										c={ORANGE}
										name="Unit B15 · under repair"
										note="plumber assigned"
										border={false}
									/>
								</div>
							</BeforeAfterList>
						</div>
					</Stage>
				</Figure>

				{/* Two */}
				<Column>
					<Num2>Two</Num2>
					<H2>Support for the way Ghanaians actually pay</H2>
					<P>
						Rent collection is the heart of the job. An app can have excellent
						features, but if it does not support the payment methods your
						tenants use, it creates a problem instead of solving one. In Ghana
						that means Mobile Money and bank transfers first.
					</P>
					<Stat
						big="9.70 billion"
						txt="mobile money transactions in 2025, worth roughly GH¢4.54 trillion — across 80.5 million registered and 26.6 million active accounts."
						src="Bank of Ghana · Payment Systems Oversight Annual Report 2025"
					/>
					<P>
						That makes digital payment capability more than a convenience. It is
						part of operating a modern rental business.
					</P>
				</Column>
				<Figure
					caption={
						'This is what stops you asking a tenant "have you paid?" when the money is already in.'
					}
				>
					<Stage>
						<div style={twoGrid}>
							<div style={{ ...card, padding: '22px 24px' }}>
								<div style={keyStyle}>The scenario</div>
								<div
									style={{
										fontFamily: serif,
										fontSize: 26,
										letterSpacing: '-.5px',
										margin: '10px 0 4px',
									}}
								>
									25 tenants × GH₵ 1,500
								</div>
								<div style={{ fontSize: 17, color: MUTED }}>
									GH₵ 37,500 in rent to account for every month — arriving
									through three different channels.
								</div>
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										marginTop: 18,
									}}
								>
									<PayChannelRow
										c={ORANGE}
										label="Mobile Money"
										count="14 people"
										border
									/>
									<PayChannelRow
										c={INK}
										label="Bank transfer"
										count="8 people"
										border
									/>
									<PayChannelRow
										c={GREEN}
										label="Cash, recorded by hand"
										count="3 people"
										border={false}
									/>
								</div>
							</div>
							<div style={{ ...card, padding: '22px 24px' }}>
								<div style={keyStyle}>What the app should do</div>
								<div
									style={{
										fontSize: 17,
										fontWeight: 600,
										margin: '10px 0 14px',
									}}
								>
									Attach every payment to a person, a unit and a bill
								</div>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
								>
									<MatchedRow
										amount="GH₵ 1,500.00 · MTN MoMo"
										who="Gideon Bempong · Unit B12 · September rent"
										status="Matched"
										statusColor={GREEN}
										statusBorder="#1B9E5C44"
									/>
									<MatchedRow
										amount="GH₵ 1,500.00 · bank transfer"
										who="Akosua Mensah · Unit A4 · September rent"
										status="Matched"
										statusColor={GREEN}
										statusBorder="#1B9E5C44"
									/>
									<MatchedRow
										amount="GH₵ 750.00 · MTN MoMo"
										who="Part payment · needs you to confirm"
										status="Check it"
										statusColor={CRIMSON}
										statusBorder="#C8003A33"
									/>
								</div>
							</div>
						</div>
					</Stage>
				</Figure>

				{/* Three */}
				<Column>
					<Num2>Three</Num2>
					<H2>Automatic rent bills</H2>
					<P>
						Instead of writing bills by hand every month, look for software that
						raises them on their own, following each tenant's agreement. If rent
						is GH₵ 2,000 monthly, the bill appears on schedule — and extra
						charges show separately rather than being folded into one number.
					</P>
				</Column>
				<Figure caption="Nobody has to remember that Unit B12's rent is due on the 5th, or prepare 50 bills on the 1st.">
					<Stage variant="crimson">
						<div
							style={{
								...card,
								padding: '26px 28px',
								boxShadow: '0 20px 44px -28px rgba(17,17,16,.3)',
								maxWidth: 620,
								margin: '0 auto',
							}}
						>
							<div
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									gap: 14,
									justifyContent: 'space-between',
									alignItems: 'baseline',
								}}
							>
								<div>
									<div
										style={{
											fontFamily: serif,
											fontSize: 25,
											letterSpacing: '-.4px',
										}}
									>
										September bill
									</div>
									<div style={{ fontSize: 15.5, color: MUTED, marginTop: 4 }}>
										Unit B12 · Gideon Bempong · due 5 September 2026
									</div>
								</div>
								<Chip style={{ fontSize: 14, background: CREAM }}>
									Raised automatically
								</Chip>
							</div>
							<div
								style={{
									marginTop: 20,
									border: `1px solid ${HAIR}`,
									borderRadius: 12,
									overflow: 'hidden',
								}}
							>
								<table
									style={{
										width: '100%',
										borderCollapse: 'collapse',
										background: '#fff',
									}}
								>
									<tbody>
										<tr>
											<td style={tdStyle}>Base rent</td>
											<td
												style={{
													...tdStyle,
													textAlign: 'right',
													fontVariantNumeric: 'tabular-nums',
													fontWeight: 600,
													whiteSpace: 'nowrap',
												}}
											>
												GH₵ 2,000.00
											</td>
										</tr>
										<tr>
											<td style={tdStyle}>Utilities</td>
											<td
												style={{
													...tdStyle,
													textAlign: 'right',
													fontVariantNumeric: 'tabular-nums',
													fontWeight: 600,
													whiteSpace: 'nowrap',
												}}
											>
												GH₵ 150.00
											</td>
										</tr>
										<tr>
											<td
												style={{
													...tdStyle,
													borderBottom: 'none',
													background: CREAM,
													fontWeight: 700,
													borderTop: `1px solid ${HAIR}`,
												}}
											>
												Total
											</td>
											<td
												style={{
													...tdStyle,
													borderBottom: 'none',
													background: CREAM,
													fontWeight: 700,
													borderTop: `1px solid ${HAIR}`,
													textAlign: 'right',
													fontVariantNumeric: 'tabular-nums',
													whiteSpace: 'nowrap',
												}}
											>
												GH₵ 2,150.00
											</td>
										</tr>
									</tbody>
								</table>
							</div>
							<div
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									gap: 12,
									marginTop: 18,
									alignItems: 'center',
								}}
							>
								<Chip
									style={{ background: INK, color: '#fff', borderColor: INK }}
								>
									He paid — record it
								</Chip>
								<Chip>Add a one-off charge</Chip>
								<span style={{ fontSize: 15, color: MUTED }}>
									Cancelled bills keep a trail of who cancelled and when.
								</span>
							</div>
						</div>
					</Stage>
				</Figure>

				{/* Four */}
				<Column>
					<Num2>Four</Num2>
					<H2>Proper tenant records</H2>
					<P>
						Property management is not only about properties. You need to know
						who occupies each unit, what agreement they have, what they owe,
						what they have paid, and whether anything is unresolved. A complete
						tenant record should hold:
					</P>
					<PlainList
						items={[
							'Tenant profile and rental history',
							'Payment history and what is outstanding',
							'Rental agreements and application information',
							'Emergency contacts and employment information',
							'Maintenance history, announcements and notifications',
						]}
					/>
					<H3>Fifty tenants, one week</H3>
					<P>
						If even ten tenants get in touch in a week about rent, repairs,
						documents or a building notice, that is dozens of conversations to
						hold in your head. When it all lives in WhatsApp, details disappear
						into old threads.
					</P>
					<Quote>
						The aim is not to stop using WhatsApp. It is to make sure the
						official record of a tenancy does not depend on a chat history.
					</Quote>
				</Column>
				<Figure caption="Everything about one tenancy, attached to the tenant and the unit rather than to a phone.">
					<Stage>
						<div
							style={{
								...card,
								padding: '24px 26px',
								boxShadow: '0 20px 44px -28px rgba(17,17,16,.3)',
							}}
						>
							<div
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									gap: 18,
									alignItems: 'center',
								}}
							>
								<div
									style={{
										width: 52,
										height: 52,
										borderRadius: '50%',
										background: 'rgba(200,0,58,.13)',
										flex: '0 0 auto',
									}}
								/>
								<div style={{ flex: 1, minWidth: 200 }}>
									<div
										style={{
											fontFamily: serif,
											fontSize: 26,
											letterSpacing: '-.5px',
										}}
									>
										Gideon Bempong
									</div>
									<div style={{ fontSize: 15.5, color: MUTED, marginTop: 3 }}>
										Unit B12 · tenant since 1 September 2024 · 024 123 4567
									</div>
								</div>
								<Chip
									style={{
										fontSize: 14,
										color: GREEN,
										borderColor: '#1B9E5C44',
									}}
								>
									<Dot c={GREEN} />
									Up to date on rent
								</Chip>
							</div>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
									marginTop: 20,
									border: `1px solid ${HAIR}`,
									borderRadius: 12,
									overflow: 'hidden',
								}}
							>
								<RecordCell
									label="Agreement"
									value="Signed · ends 31 Aug 2027"
								/>
								<RecordCell
									label="Paid to date"
									value="GH₵ 43,000.00"
									leftBorder
								/>
								<RecordCell label="Still owes" value="GH₵ 0.00" leftBorder />
								<RecordCell
									label="Emergency contact"
									value="Esi Bempong · sister"
									topBorder
								/>
								<RecordCell
									label="Work"
									value="Teacher · payslip on file"
									leftBorder
									topBorder
								/>
								<RecordCell
									label="Repairs"
									value="3 asked for · 3 fixed"
									leftBorder
									topBorder
								/>
							</div>
						</div>
					</Stage>
				</Figure>

				{/* Five */}
				<Column>
					<Num2>Five</Num2>
					<H2>Maintenance that cannot get lost</H2>
					<P>
						Maintenance is the clearest reason landlords move off spreadsheets
						and messaging apps. "The bathroom pipe has not been flowing properly
						for three weeks" is easy to miss when it is buried under hundreds of
						messages. A proper system gives every request a defined path.
					</P>
				</Column>
				<Figure caption="Especially valuable when you work with plumbers, electricians and cleaners who are not on your staff.">
					<Stage variant="crimson">
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
								gap: 12,
							}}
						>
							<StatusCard
								label="New"
								title="Tenant reports it"
								desc="With photos, a category and a priority"
							/>
							<StatusCard
								label="In progress"
								title="Assigned to someone"
								desc="Your officer or an outside contractor"
							/>
							<StatusCard
								label="In review"
								title="Work done, being checked"
								desc="Photo of the finished job, cost logged"
							/>
							<StatusCard
								label="Resolved"
								labelColor={GREEN}
								title="Tenant confirms"
								desc="Stays on the unit's history"
								borderColor="#1B9E5C44"
							/>
						</div>
						<div style={{ ...card, marginTop: 16, padding: '22px 24px' }}>
							<div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
								40 requests in a 100-unit building — the questions a board
								answers without you searching
							</div>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))',
									gap: '10px 24px',
									marginTop: 12,
									fontSize: 16,
									color: BODY,
								}}
							>
								{[
									'Who reported it?',
									'When was it reported?',
									'Which room is affected?',
									'Who was assigned?',
									'Has the contractor been?',
									'Was a photo provided?',
									'Has the tenant confirmed the fix?',
									'What did it cost?',
								].map((q) => (
									<div key={q}>{q}</div>
								))}
							</div>
						</div>
					</Stage>
				</Figure>

				{/* Six */}
				<Column>
					<Num2>Six</Num2>
					<H2>Digital agreements and signatures</H2>
					<P>
						Rental agreements matter, yet much of the market still runs on
						printed paper. Look for templates you can edit, document uploads,
						electronic signatures, signed PDFs stored against the tenancy, and
						tenant access to their own copy.
					</P>
					<H3>Filling 20 vacant units</H3>
					<P>
						If every tenant needs a printed agreement, a wet signature, a scan
						and a file, the admin alone becomes a job. With digital agreements
						you start from an approved template, fill in the details, and send
						it to be signed. Later, instead of asking which folder holds the
						agreement for Apartment 14, you open the tenant.
					</P>
				</Column>
				<Figure caption="Start from a template, send it, watch it get signed — and never hunt for the copy again.">
					<Stage>
						<div style={twoGrid}>
							<div style={{ ...card, padding: '24px 26px' }}>
								<div style={keyStyle}>Template</div>
								<div
									style={{
										fontSize: 17,
										fontWeight: 600,
										margin: '10px 0 14px',
									}}
								>
									Tenancy agreement · 12 months
								</div>
								<div
									style={{ display: 'flex', flexDirection: 'column', gap: 9 }}
								>
									{[
										['100%', CREAMDEEP],
										['92%', CREAMDEEP],
										['56%', 'rgba(200,0,58,.13)'],
										['100%', CREAMDEEP],
										['78%', CREAMDEEP],
										['40%', 'rgba(200,0,58,.13)'],
										['88%', CREAMDEEP],
									].map(([w, bg], i) => (
										<div
											key={i}
											style={{
												height: 10,
												borderRadius: 3,
												background: bg,
												width: w,
											}}
										/>
									))}
								</div>
								<div style={{ fontSize: 15, color: MUTED, marginTop: 14 }}>
									Crimson lines are the details Rentloop fills in from the unit
									and the tenant.
								</div>
							</div>
							<div
								style={{
									...card,
									padding: '24px 26px',
									display: 'flex',
									flexDirection: 'column',
								}}
							>
								<div style={keyStyle}>Signing</div>
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										marginTop: 12,
									}}
								>
									<SignRow text="Sent to Gideon · 28 August" border />
									<SignRow text="Signed by Gideon · 29 August" border />
									<SignRow text="Signed by you · 29 August" border={false} />
								</div>
								<div
									style={{
										...card,
										padding: '16px 18px',
										background: CREAM,
										marginTop: 'auto',
										display: 'flex',
										gap: 14,
										alignItems: 'center',
									}}
								>
									<div style={{ flex: 1 }}>
										<div style={{ fontSize: 16, fontWeight: 600 }}>
											Signed agreement.pdf
										</div>
										<div style={{ fontSize: 15, color: MUTED, marginTop: 2 }}>
											Stored on the unit and on the tenant
										</div>
									</div>
									<Chip style={{ fontSize: 14 }}>Open it</Chip>
								</div>
							</div>
						</div>
					</Stage>
				</Figure>

				{/* Seven */}
				<Column>
					<Num2>Seven</Num2>
					<H2>Move-in checklists and condition reports</H2>
					<P>
						A good app also protects both sides by recording what state a unit
						was in when the tenant took it.
					</P>
				</Column>
				<Figure caption="The report is shared with the tenant and dated, so both of you hold the same record.">
					<TableScroll>
						<table
							style={{
								width: '100%',
								borderCollapse: 'collapse',
								background: '#fff',
							}}
						>
							<thead>
								<tr>
									<th style={thStyle}>Item</th>
									<th style={thStyle}>Condition</th>
									<th style={thStyle}>Evidence</th>
								</tr>
							</thead>
							<tbody>
								{[
									[
										'Bathroom sink',
										<ConditionChip
											key="c"
											label="Good"
											color={GREEN}
											border="#1B9E5C44"
										/>,
									],
									[
										'Bedroom wall',
										<ConditionChip
											key="c"
											label="Minor mark"
											color={ORANGE}
											border="#E97B2A55"
										/>,
									],
									[
										'Kitchen cabinet',
										<ConditionChip
											key="c"
											label="Good"
											color={GREEN}
											border="#1B9E5C44"
										/>,
									],
									[
										'Bathroom tap',
										<ConditionChip
											key="c"
											label="Needs attention"
											color={CRIMSON}
											border="#C8003A33"
										/>,
									],
								].map(([item, chip], i, arr) => (
									<tr key={item as string}>
										<td
											style={{
												...tdStyle,
												...(i === arr.length - 1
													? { borderBottom: 'none' }
													: {}),
											}}
										>
											{item}
										</td>
										<td
											style={{
												...tdStyle,
												...(i === arr.length - 1
													? { borderBottom: 'none' }
													: {}),
											}}
										>
											{chip}
										</td>
										<td
											style={{
												...tdStyle,
												...(i === arr.length - 1
													? { borderBottom: 'none' }
													: {}),
											}}
										>
											<Placeholder height={40} maxWidth={180}>
												photo
											</Placeholder>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</TableScroll>
				</Figure>
				<div style={{ maxWidth: 700, margin: '0 auto' }}>
					<P>
						Say a tenant moves in during January. Two years later they move out
						and there is a disagreement about whether damage was there before. A
						dated condition report is the reference point — neither side has to
						rely on memory. Across dozens of units, it makes handovers
						consistent.
					</P>
				</div>

				{/* Eight */}
				<Column>
					<Num2>Eight</Num2>
					<H2>Reporting you can act on</H2>
					<P>
						You should not have to wait until year end to know how a property is
						doing. Look for revenue, occupancy rate, active rentals, expiring
						leases, month-on-month change, revenue by property, unit status and
						expenses.
					</P>
					<H3>A 100-unit portfolio</H3>
					<P>
						85 units occupied, 10 vacant, 5 under maintenance. That is 85 ÷ 100
						= <b>85% occupancy</b>. Shown next to revenue and unit status, you
						immediately know that five units need attention and ten are ready to
						let. If the portfolio bills GH₵ 180,000 a month, you can compare
						against previous months and look property by property instead of
						assembling a spreadsheet.
					</P>
					<Quote>
						The point of analytics is not attractive charts. It is helping an
						owner decide something.
					</Quote>
				</Column>

				{/* Nine */}
				<Column>
					<Num2>Nine</Num2>
					<H2>Role-based access</H2>
					<P>
						As a portfolio grows, the owner stops doing everything alone — there
						may be an administrator, a property manager, maintenance staff,
						accountants, regional managers and support staff. Not everyone needs
						the same access. Someone updating a repair ticket does not need your
						financial records. Rentloop provides Admin, Manager and Staff tiers,
						assignable by property or block.
					</P>
				</Column>
				<Figure caption="Property-level permissions let the software match how the business is actually run.">
					<Stage variant="crimson">
						<div style={twoGrid}>
							<div style={{ ...card, padding: '22px 24px' }}>
								<div style={keyStyle}>The company</div>
								<div
									style={{
										fontFamily: serif,
										fontSize: 26,
										letterSpacing: '-.5px',
										margin: '10px 0 14px',
									}}
								>
									180 units, three locations
								</div>
								<div style={{ display: 'flex', flexDirection: 'column' }}>
									{[
										['East Legon', '60 units', true],
										['Spintex', '80 units', true],
										['Adenta', '40 units', false],
									].map(([loc, count, border]) => (
										<div
											key={loc as string}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 12,
												padding: '13px 0',
												borderBottom: border
													? `1px solid ${HAIRSOFT}`
													: undefined,
											}}
										>
											<div style={{ flex: 1, fontSize: 16.5 }}>{loc}</div>
											<b style={{ fontSize: 16 }}>{count}</b>
										</div>
									))}
								</div>
							</div>
							<div style={{ ...card, padding: '22px 24px' }}>
								<div style={keyStyle}>Who sees what</div>
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										marginTop: 12,
									}}
								>
									<RoleRow
										tint="rgba(200,0,58,.13)"
										name="Admin"
										desc="All three locations, money included"
										border
									/>
									<RoleRow
										tint={CREAMDEEP}
										name="Manager · Spintex"
										desc="One property, tenants and rent"
										border
									/>
									<RoleRow
										tint={CREAMDEEP}
										name="Staff · repairs"
										desc="Repair tickets only, no financial records"
										border={false}
									/>
								</div>
							</div>
						</div>
					</Stage>
				</Figure>

				{/* Ten */}
				<Column>
					<Num2>Ten</Num2>
					<H2>Don't forget the tenant's app</H2>
					<P>
						A platform should not only make life easier for the manager. A good
						tenant app gives residents what they need without calling you —
						their rent amount, upcoming payments, outstanding bills, payment
						history, repair requests and updates, agreements, announcements,
						condition reports and applications.
					</P>
				</Column>
				<Figure caption="A more transparent tenancy for him, and far fewer repeat questions for you.">
					<Stage
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
							gap: 22,
							alignItems: 'center',
						}}
					>
						<div>
							<div style={{ ...card, padding: '22px 24px' }}>
								<div style={keyStyle}>Two questions you stop answering</div>
								<div style={{ marginTop: 14, fontSize: 17.5, fontWeight: 600 }}>
									"When is my next rent payment due?"
								</div>
								<div style={{ fontSize: 16.5, color: MUTED, marginTop: 4 }}>
									It is on the first screen of his app.
								</div>
								<div style={{ marginTop: 18, fontSize: 17.5, fontWeight: 600 }}>
									"Has the plumber been assigned yet?"
								</div>
								<div style={{ fontSize: 16.5, color: MUTED, marginTop: 4 }}>
									He can see the status of his own request.
								</div>
							</div>
							<div style={{ ...card, padding: '22px 24px', marginTop: 14 }}>
								<div style={keyStyle}>He signs in with</div>
								<div style={{ fontSize: 17, fontWeight: 600, marginTop: 10 }}>
									His phone number and a one-time code
								</div>
								<div style={{ fontSize: 16, color: MUTED, marginTop: 4 }}>
									No password to forget, on iOS and Android.
								</div>
							</div>
						</div>
						<div style={{ display: 'flex', justifyContent: 'center' }}>
							<div
								style={{
									width: 300,
									border: '9px solid #0A0A0A',
									borderRadius: 38,
									background: '#fff',
									overflow: 'hidden',
									boxShadow: '0 26px 54px -30px rgba(17,17,16,.5)',
								}}
							>
								<div style={{ background: '#0A0A0A', height: 24 }} />
								<div style={{ padding: '18px 16px' }}>
									<Logo />
									<div style={{ fontSize: 14, color: MUTED, marginTop: 14 }}>
										Unit B12 · East Legon
									</div>
									<div
										style={{
											...card,
											padding: 14,
											marginTop: 10,
											background: CREAM,
										}}
									>
										<div style={{ fontSize: 14, color: MUTED }}>Next rent</div>
										<div
											style={{
												fontFamily: serif,
												fontSize: 25,
												letterSpacing: '-.5px',
												marginTop: 2,
											}}
										>
											GH₵ 2,150.00
										</div>
										<div style={{ fontSize: 14, color: MUTED }}>
											due 5 October 2026
										</div>
									</div>
									<Chip
										style={{
											marginTop: 12,
											width: '100%',
											justifyContent: 'center',
											background: CRIMSON,
											color: '#fff',
											borderColor: CRIMSON,
											fontSize: 15,
										}}
									>
										Pay with MoMo
									</Chip>
									<div
										style={{
											fontSize: 14.5,
											fontWeight: 600,
											margin: '18px 0 8px',
										}}
									>
										Your repair request
									</div>
									<div style={{ ...card, padding: '13px 14px' }}>
										<div style={{ fontSize: 15, fontWeight: 600 }}>
											Bathroom pipe
										</div>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 8,
												marginTop: 5,
											}}
										>
											<Dot c={ORANGE} />
											<span style={{ fontSize: 14, color: MUTED }}>
												In progress · plumber assigned
											</span>
										</div>
									</div>
									<div
										style={{
											fontSize: 14.5,
											fontWeight: 600,
											margin: '18px 0 8px',
										}}
									>
										Your payments
									</div>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											fontSize: 14.5,
											padding: '9px 0',
											borderBottom: `1px solid ${HAIRSOFT}`,
										}}
									>
										<span style={{ color: MUTED }}>5 Sep 2026</span>
										<span style={{ color: GREEN, fontWeight: 600 }}>Paid</span>
									</div>
									<div
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											fontSize: 14.5,
											padding: '9px 0',
										}}
									>
										<span style={{ color: MUTED }}>5 Aug 2026</span>
										<span style={{ color: GREEN, fontWeight: 600 }}>Paid</span>
									</div>
								</div>
							</div>
						</div>
					</Stage>
				</Figure>

				{/* The ten, at a glance */}
				<Column>
					<H2>The ten, at a glance</H2>
					<P>
						The right app should solve real operational problems rather than
						offer a long feature list.
					</P>
				</Column>
				<Figure>
					<TableScroll>
						<table
							style={{
								width: '100%',
								borderCollapse: 'collapse',
								background: '#fff',
							}}
						>
							<thead>
								<tr>
									<th style={thStyle}>What to look for</th>
									<th style={thStyle}>Why it matters</th>
								</tr>
							</thead>
							<tbody>
								{[
									[
										'Property and unit management',
										'Keeps the portfolio organised',
									],
									[
										'Mobile Money and bank payments',
										'Supports how tenants here actually pay',
									],
									['Automatic bills', 'Removes manual rent admin'],
									['Tenant records', 'Keeps the tenancy in one place'],
									['Maintenance tracking', 'Stops requests getting lost'],
									['Digital agreements', 'Makes paperwork manageable'],
									['Condition reports', 'Creates a dated record of the unit'],
									['Reporting', 'Shows revenue and occupancy as they move'],
									[
										'Role-based access',
										'Gives each person the right permissions',
									],
									['Tenant app', 'Lets residents serve themselves'],
								].map(([what, why], i, arr) => (
									<tr key={what}>
										<td
											style={{
												...tdStyle,
												fontWeight: 600,
												...(i === arr.length - 1
													? { borderBottom: 'none' }
													: {}),
											}}
										>
											{what}
										</td>
										<td
											style={{
												...tdStyle,
												...(i === arr.length - 1
													? { borderBottom: 'none' }
													: {}),
											}}
										>
											{why}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</TableScroll>
				</Figure>

				{/* Why this matters more as you grow */}
				<Column>
					<H2>Why this matters more as you grow</H2>
					<P>
						These problems become obvious as the number of units rises. Three
						landlords, for the sake of argument:
					</P>
				</Column>
				<Figure caption="At that scale a small administrative mistake moves a significant amount of money.">
					<Stage
						variant="crimson"
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))',
							gap: 14,
						}}
					>
						<GrowthCard
							label="Landlord A"
							units="3 units"
							text="Three tenants are manageable with phone calls, WhatsApp and a simple spreadsheet."
						/>
						<GrowthCard
							label="Landlord B"
							units="30 units"
							text="Thirty agreements, thirty payment records, repairs every week and constant messages."
						/>
						<GrowthCard
							label="Manager C"
							labelColor={CRIMSON}
							units="100 units"
							text="At GH₵ 1,800 average rent that is GH₵ 180,000 billed monthly — GH₵ 2.16 million a year."
							borderColor="#C8003A44"
						/>
					</Stage>
				</Figure>
				<div style={{ maxWidth: 700, margin: '0 auto' }}>
					<P>
						The value of property management software is therefore not only
						convenience. It is visibility, consistency and control.
					</P>
				</div>

				{/* Pricing */}
				<Column>
					<H2>What about pricing?</H2>
					<P>
						The cheapest option is not automatically the best, and the most
						expensive is not necessarily the most suitable. Judge cost against
						the size of your portfolio and the features you will actually use.
						Rentloop's current plans:
					</P>
				</Column>
				<Figure caption="Plan-cost arithmetic, not a return-on-investment claim.">
					<TableScroll>
						<table
							style={{
								width: '100%',
								borderCollapse: 'collapse',
								background: '#fff',
							}}
						>
							<thead>
								<tr>
									<th style={thStyle}>Plan</th>
									<th style={thStyle}>Portfolio</th>
									<th style={thStyle}>Price</th>
									<th style={thStyle}>Per unit, per month</th>
								</tr>
							</thead>
							<tbody>
								{[
									['Free', 'Up to 3 units', 'GHS 0', '—'],
									[
										'Starter',
										'Up to 50 units',
										'GHS 149 / month',
										'≈ GHS 2.98 at 50 units',
									],
									[
										'Growth',
										'Up to 100 units',
										'GHS 299 / month',
										'≈ GHS 2.99 at 100 units',
									],
									['Enterprise', '100+ units', 'Custom', '—'],
								].map(([plan, portfolio, price, per], i, arr) => {
									const last = i === arr.length - 1
									const cell: CSSProperties = {
										...tdStyle,
										...(last ? { borderBottom: 'none' } : {}),
									}
									return (
										<tr key={plan}>
											<td style={{ ...cell, fontWeight: 600 }}>{plan}</td>
											<td style={cell}>{portfolio}</td>
											<td style={{ ...cell, fontWeight: 600 }}>{price}</td>
											<td
												style={{
													...cell,
													...(per === '—' ? { color: MUTED } : {}),
												}}
											>
												{per}
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</TableScroll>
				</Figure>
				<div style={{ maxWidth: 700, margin: '0 auto' }}>
					<P>
						The more useful question is whether the software removes enough
						manual work, missed payments, communication gaps and record-keeping
						problems to justify what it costs.
					</P>
				</div>

				{/* Localisation */}
				<Column>
					<H2>Why localisation matters</H2>
					<P>
						Software built for another market does not always fit how renting
						works here. A platform serving Ghanaian landlords has to account for
						local payment behaviour, property structures and the way tenants and
						managers talk to each other — cedi transactions, Mobile Money, bank
						transfers, cash and offline payments, properties organised into
						blocks and units.
					</P>
					<Stat
						big="81%"
						txt="of adults had access to formal financial services in 2025, in a payment ecosystem that is becoming steadily more digital."
						src="Bank of Ghana · Payment Systems Oversight Annual Report 2025"
					/>
					<P>
						For a rental business that means an app which connects digital
						payments to rental records is considerably more useful than one
						designed around cash and manual bank reconciliation.
					</P>
				</Column>

				{/* Bigger picture */}
				<Column>
					<H2>The bigger picture</H2>
					<P>
						Ghana's housing market is under real pressure. The housing deficit
						has been estimated at around 1.8 million units, while the National
						Homeownership Fund notes that affordability, housing conditions and
						tenure security remain important challenges. The Ghana Statistical
						Service reports that 46% of urban households rent — rental housing
						carries a large share of urban Ghana.
					</P>
					<P>
						As the market grows and portfolios get more sophisticated, property
						management needs more than collecting rent and keeping a list of
						tenants. It needs systems that answer:
					</P>
					<PlainList
						items={[
							'Which units are occupied, and which are free?',
							'Which rents are outstanding?',
							'Which leases are expiring?',
							'Which repairs are unresolved?',
							'How much did each property earn, and what did it cost?',
							'Where is the signed agreement, and what condition was the unit in at move-in?',
						]}
					/>
				</Column>

				{/* Rentloop in one place */}
				<Column>
					<H2>Rentloop, in one place</H2>
					<P>
						Rentloop brings owners, managers, staff and tenants onto one
						platform. For managers: property and unit management, applications,
						agreements, e-signatures, rent bills, payment matching, expenses,
						maintenance, announcements, inspections, polls and reporting. For
						tenants: rent, bills, payments, repair requests, documents, property
						information, announcements and condition reports in their own app.
					</P>
					<P>
						The platform handles both long-term agreements and short-stay guest
						bookings, so different kinds of letting sit in one portfolio. For a
						manager coming from WhatsApp, spreadsheets and separate payment
						records, the point is having one record of truth for the property.
					</P>
				</Column>

				{/* Final checklist */}
				<Column>
					<H2>Final checklist</H2>
					<P>Before choosing a platform, ask these ten questions:</P>
					<ol
						style={{
							listStyle: 'none',
							display: 'flex',
							flexDirection: 'column',
							gap: 2,
							margin: '6px 0 24px',
							padding: 0,
						}}
					>
						{[
							'Can I manage all my properties and units from one place?',
							'Does it support Mobile Money, bank transfers and the other ways my tenants pay?',
							'Can it raise rent bills automatically?',
							'Can I keep complete tenant records?',
							'Can tenants submit and follow repair requests?',
							'Can I create, sign and store agreements digitally?',
							'Can I document the condition of a unit at move-in?',
							'Can I see revenue, occupancy and expenses clearly?',
							'Can I control what each team member can access?',
							'Does the tenant get a simple mobile experience?',
						].map((q, i) => (
							<li
								key={q}
								style={{
									display: 'flex',
									gap: 16,
									alignItems: 'flex-start',
									fontSize: 18,
									lineHeight: 1.5,
									padding: '16px 18px',
									background: '#fff',
									border: `1px solid ${HAIR}`,
									borderRadius: 12,
								}}
							>
								<span
									style={{
										fontFamily: mono,
										fontSize: 14,
										fontWeight: 700,
										color: CRIMSON,
										flex: '0 0 auto',
										paddingTop: 3,
									}}
								>
									{i + 1}
								</span>
								<span>{q}</span>
							</li>
						))}
					</ol>
					<P>
						If the answer to most of these is yes, you are looking at more than
						a rent collection tool. For a few units that means better
						organisation; for hundreds, it means a structured way to run the
						whole rental business.
					</P>
					<P>
						Instead of asking "where is that spreadsheet?", "has this tenant
						paid?" or "did anyone answer that repair request?", the information
						should already be where it belongs. Better organisation is not just
						about saving time — it is about having better control of the
						property business.
					</P>
				</Column>

				{/* CTA */}
				<div
					style={{
						background: BLACK,
						color: '#fff',
						borderRadius: 22,
						padding: 'clamp(34px,5vw,60px)',
						textAlign: 'center',
						margin: '20px auto 0',
						maxWidth: 1100,
					}}
				>
					<h3
						style={{
							fontFamily: serif,
							fontSize: 'clamp(30px,4vw,44px)',
							fontWeight: 400,
							letterSpacing: '-.8px',
							lineHeight: 1.1,
							margin: 0,
						}}
					>
						See it against your own portfolio
					</h3>
					<p
						style={{
							color: 'rgba(255,255,255,.7)',
							fontSize: 19,
							maxWidth: 560,
							margin: '16px auto 28px',
						}}
					>
						Add your properties, blocks and units and check the list above for
						yourself. The first 3 units are free, forever.
					</p>
					<ExternalLink
						href={APPLY_URL}
						className="bg-rl-crimson hover:bg-rl-crimson-deep inline-block rounded-full font-semibold text-white no-underline transition-colors"
						style={{ fontSize: 17, padding: '14px 26px' }}
					>
						Start free trial
					</ExternalLink>
				</div>

				{/* Sources */}
				<Column>
					<div style={keyStyle}>Sources</div>
					<ul
						style={{
							margin: '14px 0 0',
							padding: 0,
							listStyle: 'none',
							display: 'flex',
							flexDirection: 'column',
							gap: 12,
						}}
					>
						{[
							'Ghana Statistical Service, 2021 Population and Housing Census — housing characteristics, including tenure and holding arrangements.',
							'Ministry of Works, Housing and Water Resources, 10,720 Housing Units Under Development to Address Housing Deficit, 2024.',
							'Ministry of Finance, Ghana, 2024 Mid-Year Fiscal Policy Review — housing deficit and housing policy data.',
							'National Homeownership Fund, Affordable Housing Situation in Ghana — housing deficit, urbanisation and affordability context.',
							'Bank of Ghana, Payment Systems Oversight Annual Report 2025 — mobile money accounts, transaction volumes and values.',
							'Bank of Ghana, Financial Stability Review 2025 — digital payments and payment-system developments.',
						].map((s, i) => (
							<li
								key={i}
								style={{
									fontSize: 16,
									lineHeight: 1.5,
									color: BODY,
									paddingLeft: 18,
									position: 'relative',
								}}
							>
								<span style={{ position: 'absolute', left: 0, color: MICRO }}>
									—
								</span>
								{s}
							</li>
						))}
					</ul>
				</Column>
			</div>
		</MarketingPage>
	)
}

function RoleRow({
	tint,
	name,
	desc,
	border,
}: {
	tint: string
	name: string
	desc: string
	border: boolean
}) {
	return (
		<div
			style={{
				display: 'flex',
				gap: 12,
				alignItems: 'center',
				padding: '13px 0',
				borderBottom: border ? `1px solid ${HAIRSOFT}` : undefined,
			}}
		>
			<div
				style={{ width: 30, height: 30, borderRadius: '50%', background: tint }}
			/>
			<div style={{ flex: 1 }}>
				<div style={{ fontSize: 16.5, fontWeight: 600 }}>{name}</div>
				<div style={{ fontSize: 15, color: MUTED }}>{desc}</div>
			</div>
		</div>
	)
}

function GrowthCard({
	label,
	labelColor,
	units,
	text,
	borderColor,
}: {
	label: string
	labelColor?: string
	units: string
	text: string
	borderColor?: string
}) {
	return (
		<div
			style={{
				...card,
				padding: '22px 24px',
				...(borderColor ? { borderColor } : {}),
			}}
		>
			<div
				style={{ ...keyStyle, ...(labelColor ? { color: labelColor } : {}) }}
			>
				{label}
			</div>
			<div
				style={{
					fontFamily: serif,
					fontSize: 34,
					letterSpacing: '-.8px',
					margin: '8px 0 8px',
				}}
			>
				{units}
			</div>
			<div style={{ fontSize: 16.5, color: BODY }}>{text}</div>
		</div>
	)
}
