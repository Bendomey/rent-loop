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

function Logo({ size = 19 }: { size?: number }) {
	return (
		<div style={{ fontSize: size, fontWeight: 700, letterSpacing: '-.4px' }}>
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
}: {
	children: ReactNode
	height: number
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
	variant = 'cream',
	style,
}: {
	children: ReactNode
	variant?: 'cream' | 'deep' | 'black'
	style?: CSSProperties
}) {
	const bg =
		variant === 'black' ? BLACK : variant === 'deep' ? CREAMDEEP : CREAM
	return (
		<div
			style={{
				background: bg,
				borderRadius: 22,
				padding: 34,
				border: `1px solid ${variant === 'black' ? BLACK : HAIR}`,
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
				fontSize: 'clamp(30px,3.4vw,40px)',
				lineHeight: 1.12,
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

function PlainList({ items }: { items: ReactNode[] }) {
	return (
		<ul
			style={{
				listStyle: 'none',
				display: 'flex',
				flexDirection: 'column',
				gap: 14,
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

function Tile({ title, desc }: { title: string; desc: string }) {
	return (
		<div style={{ ...card, padding: 18 }}>
			<div style={{ fontSize: 17, fontWeight: 600 }}>{title}</div>
			<div
				style={{ fontSize: 14.5, color: MUTED, marginTop: 5, lineHeight: 1.45 }}
			>
				{desc}
			</div>
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

function UnitChip({ label, c }: { label: string; c?: string }) {
	return (
		<Chip
			style={{
				fontSize: 13.5,
				padding: '6px 11px',
				...(c ? {} : { color: MUTED }),
			}}
		>
			{c && <Dot c={c} />}
			{label}
		</Chip>
	)
}

function BlockCard({
	name,
	sub,
	units,
}: {
	name: string
	sub: string
	units: Array<[string, string | undefined]>
}) {
	return (
		<div style={{ ...card, padding: '18px 20px' }}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<div style={{ fontSize: 18, fontWeight: 600 }}>{name}</div>
				<Chip
					style={{
						fontSize: 13.5,
						padding: '6px 12px',
						color: GREEN,
						borderColor: '#1B9E5C44',
					}}
				>
					<Dot c={GREEN} />
					Active
				</Chip>
			</div>
			<div style={{ fontSize: 14.5, color: MUTED, marginTop: 5 }}>{sub}</div>
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
				{units.map(([label, c]) => (
					<UnitChip key={label} label={label} c={c} />
				))}
			</div>
		</div>
	)
}

function HeroDashboard() {
	const navItem = (label: string, active = false) => (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 10,
				padding: '9px 10px',
				borderRadius: active ? 9 : 0,
				background: active ? 'rgba(200,0,58,.07)' : undefined,
				fontSize: 14.5,
				fontWeight: active ? 600 : 400,
				color: active ? CRIMSON : MUTED,
			}}
		>
			<Dot c={active ? CRIMSON : MICRO} />
			{label}
		</div>
	)

	return (
		<div
			style={{
				...card,
				width: 1060,
				display: 'flex',
				height: 610,
				boxShadow:
					'0 26px 60px -30px rgba(17,17,16,.35),0 2px 6px rgba(17,17,16,.05)',
				overflow: 'hidden',
			}}
		>
			<div
				style={{
					width: 214,
					borderRight: `1px solid ${HAIR}`,
					padding: '20px 16px',
					display: 'flex',
					flexDirection: 'column',
					gap: 6,
					flex: '0 0 auto',
				}}
			>
				<div style={{ margin: '2px 6px 16px' }}>
					<Logo />
				</div>
				<div style={{ ...keyStyle, margin: '0 6px 8px' }}>
					Cantonments court
				</div>
				{navItem('Overview')}
				{navItem('Blocks & units', true)}
				{navItem('People')}
				{navItem('Rent')}
				{navItem('Repairs')}
				<div
					style={{
						marginTop: 'auto',
						borderTop: `1px solid ${HAIRSOFT}`,
						padding: '14px 8px 4px',
					}}
				>
					<div style={{ ...keyStyle, fontSize: 13 }}>Your plan</div>
					<div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 6 }}>
						Starter · 30 of 50 units
					</div>
				</div>
			</div>

			<div
				style={{
					flex: 1,
					minWidth: 0,
					display: 'flex',
					flexDirection: 'column',
					background: CREAM,
				}}
			>
				<div
					style={{
						height: 56,
						background: '#fff',
						borderBottom: `1px solid ${HAIR}`,
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						padding: '0 24px',
						fontSize: 14.5,
						color: MUTED,
						flex: '0 0 auto',
					}}
				>
					<span>Cantonments court</span>
					<span style={{ color: MICRO }}>›</span>
					<span style={{ color: INK, fontWeight: 600 }}>
						Blocks &amp; units
					</span>
				</div>
				<div
					style={{
						padding: '26px 24px',
						display: 'flex',
						flexDirection: 'column',
						gap: 18,
					}}
				>
					<div
						style={{
							display: 'flex',
							flexWrap: 'wrap',
							gap: 16,
							alignItems: 'flex-end',
							justifyContent: 'space-between',
						}}
					>
						<div>
							<div
								style={{
									fontFamily: serif,
									fontSize: 31,
									letterSpacing: '-.7px',
								}}
							>
								Two blocks, 30 units
							</div>
							<div style={{ fontSize: 16, color: MUTED, marginTop: 7 }}>
								One address. Everything a tenant rents sits inside a block.
							</div>
						</div>
						<Chip style={{ background: INK, color: '#fff', borderColor: INK }}>
							Add a unit
						</Chip>
					</div>
					<div
						style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
					>
						<BlockCard
							name="Block A"
							sub="Front tower · 12 units"
							units={[
								['A1', GREEN],
								['A2', GREEN],
								['A3', BLUE],
								['A4', GREEN],
								['A5', ORANGE],
								['+7 more', undefined],
							]}
						/>
						<BlockCard
							name="Block B"
							sub="Back tower · 18 units"
							units={[
								['B1', GREEN],
								['B2', BLUE],
								['B3', GREEN],
								['B4', GREEN],
								['B5', MICRO],
								['+13 more', undefined],
							]}
						/>
					</div>
					<div
						style={{
							...card,
							padding: '18px 20px',
							display: 'flex',
							flexWrap: 'wrap',
							gap: 18,
							alignItems: 'center',
						}}
					>
						<div style={{ flex: 1, minWidth: 230 }}>
							<div style={{ fontSize: 17, fontWeight: 600 }}>
								Unit A3 · Two-bedroom apartment
							</div>
							<div style={{ fontSize: 14.5, color: MUTED, marginTop: 4 }}>
								Available · GH₵ 2,400.00 monthly · up to 4 people
							</div>
						</div>
						<Chip style={{ fontSize: 14, background: CREAM }}>
							Duplicate this unit
						</Chip>
					</div>
				</div>
			</div>
		</div>
	)
}

function LevelCard({
	level,
	title,
	desc,
	chip,
	chipStyle,
	indent,
	crimson = false,
}: {
	level: string
	title: string
	desc: string
	chip: string
	chipStyle?: CSSProperties
	indent: number | string
	crimson?: boolean
}) {
	return (
		<div
			style={{
				...card,
				padding: '18px 22px',
				display: 'flex',
				flexWrap: 'wrap',
				gap: 14,
				alignItems: 'center',
				marginLeft: indent,
				...(crimson ? { borderColor: '#C8003A44' } : {}),
			}}
		>
			<span
				style={{
					...keyStyle,
					width: 74,
					...(crimson ? { color: CRIMSON } : {}),
				}}
			>
				{level}
			</span>
			<div style={{ flex: 1, minWidth: 200 }}>
				<div style={{ fontSize: 19, fontWeight: 600 }}>{title}</div>
				<div style={{ fontSize: 15.5, color: MUTED, marginTop: 3 }}>{desc}</div>
			</div>
			<Chip style={{ fontSize: 14, background: CREAM, ...chipStyle }}>
				{chip}
			</Chip>
		</div>
	)
}

function NestedRow({
	c,
	text,
	indent,
	muted = false,
}: {
	c: string
	text: string
	indent: number
	muted?: boolean
}) {
	return (
		<div
			style={{
				display: 'flex',
				gap: 10,
				alignItems: 'center',
				fontSize: 16,
				marginLeft: indent,
				...(muted ? { color: MUTED } : {}),
			}}
		>
			<Dot c={c} />
			{text}
		</div>
	)
}

function PropertyTypeCard({
	type,
	title,
	desc,
	cardTitle,
	rows,
	footer,
}: {
	type: string
	title: string
	desc: string
	cardTitle: string
	rows: ReactNode
	footer: string
}) {
	return (
		<Stage style={{ padding: 26 }}>
			<div style={{ ...keyStyle, color: CRIMSON }}>{type}</div>
			<div
				style={{
					fontFamily: serif,
					fontSize: 27,
					letterSpacing: '-.4px',
					margin: '8px 0 6px',
				}}
			>
				{title}
			</div>
			<p style={{ fontSize: 16.5, margin: '0 0 18px', color: MUTED }}>{desc}</p>
			<div style={{ ...card, padding: 18 }}>
				<div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
					{cardTitle}
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
					{rows}
				</div>
			</div>
			<p style={{ fontSize: 16.5, margin: '18px 0 0', color: MUTED }}>
				{footer}
			</p>
		</Stage>
	)
}

function BlocksExample({
	label,
	chips,
	note,
}: {
	label: string
	chips: string[]
	note: string
}) {
	return (
		<div style={{ ...card, padding: 20 }}>
			<div style={keyStyle}>{label}</div>
			<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
				{chips.map((c) => (
					<Chip key={c} style={{ fontSize: 14.5 }}>
						{c}
					</Chip>
				))}
			</div>
			<div style={{ fontSize: 15.5, color: MUTED, marginTop: 12 }}>{note}</div>
		</div>
	)
}

function UnitCell({
	label,
	value,
	leftBorder,
	topBorder,
}: {
	label: string
	value: ReactNode
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

function PortfolioCard({
	label,
	title,
	body,
	chips,
}: {
	label: string
	title: string
	body: string
	chips: ReactNode
}) {
	return (
		<div style={{ ...card, padding: '24px 26px' }}>
			<div style={keyStyle}>{label}</div>
			<div
				style={{
					fontFamily: serif,
					fontSize: 24,
					letterSpacing: '-.4px',
					margin: '10px 0 8px',
				}}
			>
				{title}
			</div>
			<p style={{ fontSize: 16.5, margin: '0 0 16px', color: BODY }}>{body}</p>
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{chips}</div>
		</div>
	)
}

const thStyle: CSSProperties = {
	fontFamily: mono,
	fontSize: 13.5,
	letterSpacing: '.07em',
	textTransform: 'uppercase',
	color: '#55534e',
	textAlign: 'left',
	padding: '14px 16px',
	borderBottom: `1px solid ${HAIR}`,
	whiteSpace: 'nowrap',
}

function planChip(label: string, enterprise = false): ReactNode {
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 7,
				fontSize: 14.5,
				fontWeight: 600,
				borderRadius: 999,
				padding: '6px 12px',
				background: enterprise ? 'rgba(200,0,58,.07)' : CREAM,
				color: enterprise ? CRIMSON : INK,
				whiteSpace: 'nowrap',
			}}
		>
			{label}
		</span>
	)
}

export default function UnderstandingAssetManagement() {
	const chip = (label: string, style?: CSSProperties) => (
		<Chip style={{ fontSize: 14, background: CREAM, ...style }}>{label}</Chip>
	)

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
						Blog · How it works
					</div>
					<h1
						style={{
							fontFamily: serif,
							fontSize: 'clamp(42px,5.6vw,72px)',
							lineHeight: 1.03,
							letterSpacing: '-1.5px',
							fontWeight: 400,
							margin: '18px 0 0',
							textWrap: 'balance',
						}}
					>
						Understanding asset management in Rentloop
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
						How Rentloop organises your portfolio with properties, blocks, and
						units — and why your plan is set by your total unit count alone.
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
						<span>22 March 2026</span>
						<span>·</span>
						<span>Marketing Team</span>
						<span>·</span>
						<span>8 min read</span>
					</div>
				</div>

				{/* Hero dashboard */}
				<Figure
					tight={false}
					caption="One property, two blocks, 30 units — and the plan you need is decided by that last number only."
				>
					<Stage variant="black" style={{ padding: 'clamp(18px,3vw,44px)' }}>
						<ScaledShot width={1060}>
							<HeroDashboard />
						</ScaledShot>
					</Stage>
				</Figure>

				{/* Intro */}
				<div style={{ maxWidth: 700, margin: '0 auto', padding: '52px 0' }}>
					<P lead>
						When you start managing rentals in Rentloop, the first thing to
						understand is how your portfolio is organised. Rentloop uses three
						levels: properties, then blocks, then units. Once this clicks,
						everything else — adding tenants, reading your bill — makes complete
						sense.
					</P>
				</div>
				<Figure caption="Every unit belongs to a block; every block belongs to a property. A single family home and a 200-unit complex use the same three levels.">
					<Stage variant="deep">
						<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
							<LevelCard
								level="Level 1"
								title="Property"
								desc="A physical location you own or manage"
								chip="Free to create"
								indent={0}
							/>
							<LevelCard
								level="Level 2"
								title="Block"
								desc="A building, wing, or section within that property"
								chip="Free to create"
								indent="clamp(0px,4vw,48px)"
							/>
							<LevelCard
								level="Level 3"
								title="Unit"
								desc="The individual rentable space a tenant actually occupies"
								chip="This is what you pay for"
								chipStyle={{
									background: 'rgba(200,0,58,.07)',
									color: CRIMSON,
									borderColor: '#C8003A33',
								}}
								indent="clamp(0px,8vw,96px)"
								crimson
							/>
						</div>
					</Stage>
				</Figure>

				{/* Two types of properties */}
				<Column>
					<H2>Two types of properties</H2>
					<P>
						When you create a property in Rentloop, the first decision is its
						type. Everything that follows — whether you set up blocks by hand or
						not — comes out of that one choice.
					</P>
				</Column>
				<Figure caption="Single for a whole house let to one family; Multi for anywhere several tenants rent different parts of the same place.">
					<div style={twoGrid}>
						<PropertyTypeCard
							type="Type one"
							title="Single property"
							desc="A complete housing space rented to one family as a whole — a standalone house, a villa, a compound, a self-contained bungalow."
							cardTitle="Rentloop builds the rest for you"
							rows={
								<>
									<NestedRow
										c={INK}
										text="Property · House in East Legon"
										indent={0}
									/>
									<NestedRow
										c={MICRO}
										text="Main block · created for you, hidden"
										indent={20}
										muted
									/>
									<NestedRow
										c={CRIMSON}
										text="1 unit · created for you"
										indent={40}
									/>
								</>
							}
							footer="You never manage blocks. The property is effectively the unit."
						/>
						<PropertyTypeCard
							type="Type two"
							title="Multi property"
							desc="One place divided into separate spaces rented independently — apartment complexes, hostels, office buildings, mixed-use developments."
							cardTitle="You build it to match the real layout"
							rows={
								<>
									<NestedRow
										c={INK}
										text="Property · Complex in Tema"
										indent={0}
									/>
									<NestedRow c={INK} text="Block A · 12 units" indent={20} />
									<NestedRow c={INK} text="Block B · 18 units" indent={20} />
									<NestedRow
										c={CRIMSON}
										text="30 units · added or duplicated by you"
										indent={40}
									/>
								</>
							}
							footer="Full control over how your portfolio is structured."
						/>
					</div>
				</Figure>

				{/* What is a property? */}
				<Column>
					<H2>What is a property?</H2>
					<P>
						A property represents a physical location — a site or address where
						your rental assets sit. One property can hold a single building or
						several buildings at the same location. The test is simple: a
						property is what you'd call one site or address in the real world.
					</P>
					<PlainList
						items={[
							<>
								<b style={{ fontWeight: 600, color: INK }}>
									A single family house in East Legon
								</b>{' '}
								— one property, one rentable unit
							</>,
							<>
								<b style={{ fontWeight: 600, color: INK }}>
									An apartment complex in Cantonments with two towers
								</b>{' '}
								— one property, two blocks, dozens of units
							</>,
							<>
								<b style={{ fontWeight: 600, color: INK }}>
									A hostel near a university campus
								</b>{' '}
								— one property, floors or sections as blocks, individual rooms
								as units
							</>,
							<>
								<b style={{ fontWeight: 600, color: INK }}>An office park</b> —
								one property, several office blocks, individual offices as units
							</>,
						]}
					/>
				</Column>

				{/* What are blocks? */}
				<Column>
					<H2>What are blocks?</H2>
					<P>
						Blocks are how you organise units inside a Multi property. They map
						to the physical divisions of the place — buildings, towers, wings,
						floors, or any grouping that means something to you and your
						officers.
					</P>
				</Column>
				<Figure
					caption={
						'From the blocks list you open a block and manage its units directly. For Single properties a hidden "Main" block is made for you — you never see it.'
					}
				>
					<Stage>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))',
								gap: 14,
							}}
						>
							<BlocksExample
								label="Apartment complex"
								chips={['Block A', 'Block B']}
								note="Two separate buildings"
							/>
							<BlocksExample
								label="Large hostel"
								chips={['Ground floor', 'First floor']}
								note="One block per floor"
							/>
							<BlocksExample
								label="Shopping complex"
								chips={['North wing', 'South wing']}
								note="Blocks by section"
							/>
						</div>
						<div
							style={{
								...card,
								marginTop: 16,
								padding: '20px 22px',
								display: 'flex',
								flexWrap: 'wrap',
								gap: 20,
								alignItems: 'center',
							}}
						>
							<div style={{ flex: 1, minWidth: 230 }}>
								<div style={{ fontSize: 17, fontWeight: 600 }}>
									Every block carries its own details
								</div>
								<div style={{ fontSize: 15.5, color: MUTED, marginTop: 4 }}>
									Name, description, unit count, and a status you set
								</div>
							</div>
							<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
								<Chip
									style={{
										fontSize: 14,
										color: GREEN,
										borderColor: '#1B9E5C44',
									}}
								>
									<Dot c={GREEN} />
									Active
								</Chip>
								<Chip style={{ fontSize: 14 }}>
									<Dot c={MICRO} />
									Inactive
								</Chip>
								<Chip style={{ fontSize: 14 }}>
									<Dot c={ORANGE} />
									Maintenance
								</Chip>
							</div>
						</div>
					</Stage>
				</Figure>

				{/* What are units? */}
				<Column>
					<H2>What are units?</H2>
					<P>
						Units are the actual spaces tenants rent. Each unit belongs to a
						block, carries its own settings, and counts towards your plan.
						Rentloop supports five types, covering both residential and
						commercial lettings.
					</P>
				</Column>
				<Figure>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
							gap: 14,
						}}
					>
						<Tile
							title="Apartment"
							desc="A multi-room unit inside a shared building, with separate living and sleeping areas"
						/>
						<Tile
							title="House"
							desc="A standalone building with its own entrance, yard, or compound"
						/>
						<Tile
							title="Studio"
							desc="A single open-plan room combining bedroom and living space"
						/>
						<Tile
							title="Office"
							desc="A workspace for professional or business use"
						/>
						<Tile
							title="Retail"
							desc="A shopfront or commercial space for selling goods or services"
						/>
					</div>
				</Figure>
				<Figure caption="One unit, one set of terms. Tenants see the features and description, so they know exactly what they are renting.">
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
									gap: 14,
									alignItems: 'baseline',
									justifyContent: 'space-between',
								}}
							>
								<div
									style={{
										fontFamily: serif,
										fontSize: 25,
										letterSpacing: '-.4px',
									}}
								>
									Unit A3 · Block A
								</div>
								<Chip
									style={{
										fontSize: 14,
										color: BLUE,
										borderColor: '#2E6CF644',
									}}
								>
									<Dot c={BLUE} />
									Available
								</Chip>
							</div>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))',
									marginTop: 20,
									border: `1px solid ${HAIR}`,
									borderRadius: 12,
									overflow: 'hidden',
								}}
							>
								<UnitCell
									label="Status"
									value="Draft · Available · Occupied · Maintenance"
								/>
								<UnitCell
									label="Rent fee"
									value={
										<>
											GH₵ 2,400.00{' '}
											<span style={{ fontWeight: 400, color: MUTED }}>
												· GHS, USD or EUR
											</span>
										</>
									}
									leftBorder
								/>
								<UnitCell
									label="How often"
									value={
										<>
											Monthly{' '}
											<span style={{ fontWeight: 400, color: MUTED }}>
												· daily to annual
											</span>
										</>
									}
									leftBorder
								/>
								<UnitCell label="Max occupants" value="4 people" topBorder />
								<UnitCell
									label="Features"
									value="2 bedrooms · balcony · own meter"
									leftBorder
									topBorder
								/>
								<div
									style={{
										padding: '16px 18px',
										borderLeft: `1px solid ${HAIRSOFT}`,
										borderTop: `1px solid ${HAIRSOFT}`,
									}}
								>
									<div style={{ ...keyStyle, fontSize: 13.5 }}>Photos</div>
									<div style={{ marginTop: 6 }}>
										<Placeholder height={44}>unit photos go here</Placeholder>
									</div>
								</div>
							</div>
							<div
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									gap: 12,
									marginTop: 20,
									alignItems: 'center',
								}}
							>
								<Chip
									style={{ background: INK, color: '#fff', borderColor: INK }}
								>
									Save this unit
								</Chip>
								<Chip>Duplicate it</Chip>
								<span style={{ fontSize: 15.5, color: MUTED }}>
									Duplicating is one click — useful when a block is full of
									similar units.
								</span>
							</div>
						</div>
					</Stage>
				</Figure>

				{/* How billing is based on units */}
				<Column>
					<H2>How billing is based on units</H2>
					<P lead>
						This is the most important thing to understand about the price: your
						plan is set by your total unit count, not by how many properties or
						blocks you have.
					</P>
					<P>
						Properties and blocks are free containers — make as many as you
						need. What decides your plan is the total number of units across
						your whole portfolio.
					</P>
				</Column>
				<Figure
					tight={false}
					caption="Three properties and three blocks still cost nothing — because that is only 3 units."
				>
					<div
						style={{
							overflowX: 'auto',
							border: `1px solid ${HAIR}`,
							borderRadius: 14,
						}}
					>
						<table
							style={{
								width: '100%',
								borderCollapse: 'collapse',
								background: '#fff',
								fontSize: 16,
							}}
						>
							<thead>
								<tr>
									<th style={thStyle}>Who you are</th>
									<th style={{ ...thStyle, textAlign: 'center' }}>
										Properties
									</th>
									<th style={{ ...thStyle, textAlign: 'center' }}>Blocks</th>
									<th style={{ ...thStyle, textAlign: 'center' }}>Units</th>
									<th style={thStyle}>Plan</th>
									<th style={thStyle}>Monthly cost</th>
								</tr>
							</thead>
							<tbody>
								{[
									[
										'Renting out a single house',
										'1',
										'1 (auto)',
										'1',
										planChip('Free'),
										'GHS 0',
									],
									[
										'3 houses in different locations',
										'3',
										'3 (auto)',
										'3',
										planChip('Free'),
										'GHS 0',
									],
									[
										'Small apartment block, 8 units',
										'1',
										'1',
										'8',
										planChip('Starter'),
										'GHS 149',
									],
									[
										'Two complexes, 30 units each',
										'2',
										'4',
										'60',
										planChip('Growth'),
										'GHS 299',
									],
									[
										'Large hostel, 120 rooms',
										'1',
										'6',
										'120',
										planChip('Enterprise', true),
										'Custom',
									],
								].map(([who, props, blocks, units, plan, cost], i, arr) => {
									const last = i === arr.length - 1
									const td: CSSProperties = {
										padding: 16,
										borderBottom: last ? 'none' : `1px solid ${HAIRSOFT}`,
										verticalAlign: 'top',
									}
									const num: CSSProperties = {
										...td,
										fontVariantNumeric: 'tabular-nums',
										color: MUTED,
										textAlign: 'center',
										width: '1%',
									}
									return (
										<tr key={who as string}>
											<td style={{ ...td, fontWeight: 500, minWidth: 190 }}>
												{who}
											</td>
											<td style={num}>{props}</td>
											<td style={num}>{blocks}</td>
											<td style={num}>{units}</td>
											<td style={td}>{plan}</td>
											<td style={{ ...td, fontWeight: 600 }}>{cost}</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				</Figure>
				<div style={{ maxWidth: 700, margin: '0 auto' }}>
					<P>
						Free covers up to 3 units at no cost. Starter covers up to 50 units
						at GHS 149/month or GHS 1,490/year, and Growth covers up to 100
						units at GHS 299/month or GHS 2,990/year. Above 100 units, reach out
						for a custom Enterprise plan. You pick your plan when you sign up
						and can change it whenever your portfolio changes.
					</P>
				</div>

				{/* Four portfolios */}
				<Column>
					<H2>Four portfolios, four setups</H2>
				</Column>
				<Figure>
					<div style={twoGrid}>
						<PortfolioCard
							label="The individual landlord"
							title="Kofi · three houses in Accra"
							body="Three Single properties, each let to a different family. Every one auto-creates its own unit. He tracks rent, repairs and lease papers for all three from one dashboard."
							chips={
								<>
									{chip('3 properties')}
									{chip('3 units')}
									<Chip
										style={{
											fontSize: 14,
											color: GREEN,
											borderColor: '#1B9E5C44',
										}}
									>
										Free · GHS 0
									</Chip>
								</>
							}
						/>
						<PortfolioCard
							label="The apartment complex owner"
							title="Ama · a complex in Tema"
							body="One Multi property, two blocks — Building A with 12 apartments, Building B with 18. Her 30 units sit well inside Starter's 50-unit limit."
							chips={
								<>
									{chip('1 property')}
									{chip('2 blocks · 30 units')}
									<Chip style={{ fontSize: 14 }}>Starter · GHS 149</Chip>
								</>
							}
						/>
						<PortfolioCard
							label="The mixed-use developer"
							title="An office park on three floors"
							body="Ground floor of 8 retail units, a first floor of 12 offices, a second floor of 10 studios. One Multi property, three blocks, residential and commercial types side by side."
							chips={
								<>
									{chip('1 property')}
									{chip('3 blocks · 30 units')}
									<Chip style={{ fontSize: 14 }}>Starter · GHS 149</Chip>
								</>
							}
						/>
						<PortfolioCard
							label="The university hostel"
							title="90 rooms across three floors"
							body="One Multi property, a block per floor, 30 rooms in each. At 90 units the portfolio fits inside Growth's 100-unit limit; past 100 they would move to Enterprise."
							chips={
								<>
									{chip('1 property')}
									{chip('3 blocks · 90 units')}
									<Chip style={{ fontSize: 14 }}>Growth · GHS 299</Chip>
								</>
							}
						/>
					</div>
				</Figure>

				{/* Getting started */}
				<Column>
					<H2>Getting started</H2>
					<P>
						Setting up your portfolio takes minutes. When you create a property,
						the wizard walks you through choosing Single or Multi, adding the
						details and address, and getting to the dashboard.
					</P>
					<P>
						From there, Multi properties let you add blocks and units one by one
						— or duplicate a unit to speed things up. When you outgrow your
						plan's unit limit, upgrading takes effect immediately, and the
						unused time on your current plan is credited against the new one.
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
						Start building your portfolio today
					</h3>
					<p
						style={{
							color: 'rgba(255,255,255,.7)',
							fontSize: 19,
							maxWidth: 520,
							margin: '16px auto 28px',
						}}
					>
						Create your account, choose Single or Multi, and add your first
						units. The first 3 units are free, forever.
					</p>
					<ExternalLink
						href={APPLY_URL}
						className="bg-rl-crimson hover:bg-rl-crimson-deep inline-block rounded-full font-semibold text-white no-underline transition-colors"
						style={{ fontSize: 17, padding: '14px 26px' }}
					>
						Create your account
					</ExternalLink>
				</div>
			</div>
		</MarketingPage>
	)
}
