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
const BODY = '#2c2b28'

const APPLY_URL = `${PROPERTY_MANAGER_APP_URL}/apply`

const serif = "'DM Serif Display', Georgia, serif"
const mono = "'JetBrains Mono', ui-monospace, monospace"

const card: CSSProperties = {
	background: '#fff',
	border: `1px solid ${HAIR}`,
	borderRadius: 14,
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

function Num({ children }: { children: ReactNode }) {
	return (
		<span
			style={{
				width: 26,
				height: 26,
				borderRadius: '50%',
				background: CRIMSON,
				color: '#fff',
				fontSize: 14,
				fontWeight: 700,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flex: '0 0 auto',
			}}
		>
			{children}
		</span>
	)
}

function Placeholder({ children, height }: { children: ReactNode; height: number }) {
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
		<div
			style={{
				margin: '8px auto 34px',
				maxWidth: tight ? 920 : 1100,
			}}
		>
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
	deep = false,
	style,
}: {
	children: ReactNode
	deep?: boolean
	style?: CSSProperties
}) {
	return (
		<div
			style={{
				background: deep ? CREAMDEEP : CREAM,
				borderRadius: 22,
				padding: 34,
				border: `1px solid ${HAIR}`,
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

function ScaledShot({ width, children }: { width: number; children: ReactNode }) {
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

function DashboardShot() {
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

	const statCard = (label: string, value: string, sub: string) => (
		<div style={{ ...card, padding: '16px 18px' }}>
			<div style={{ fontSize: 14, color: MUTED }}>{label}</div>
			<div
				style={{
					fontFamily: serif,
					fontSize: 29,
					letterSpacing: '-.6px',
					marginTop: 4,
				}}
			>
				{value}
			</div>
			<div style={{ fontSize: 13.5, color: MUTED }}>{sub}</div>
		</div>
	)

	const owesRow = (
		name: string,
		meta: string,
		amount: string,
		late: boolean,
		border: boolean,
	) => (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 16,
				padding: '15px 0',
				borderTop: border ? `1px solid ${HAIRSOFT}` : undefined,
				marginTop: border ? 12 : 0,
			}}
		>
			<div style={{ flex: 1 }}>
				<div style={{ fontSize: 16.5, fontWeight: 600 }}>{name}</div>
				<div style={{ fontSize: 14, color: MUTED, marginTop: 2 }}>{meta}</div>
			</div>
			<div
				style={{
					fontSize: 18,
					fontWeight: 700,
					fontVariantNumeric: 'tabular-nums',
					color: late ? CRIMSON : INK,
				}}
			>
				{amount}
			</div>
			<Chip style={{ background: CREAM, fontSize: 14, padding: '8px 14px' }}>
				He paid — record it
			</Chip>
		</div>
	)

	return (
		<div
			style={{
				...card,
				width: 1060,
				display: 'flex',
				height: 600,
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
				<div
					style={{
						fontFamily: mono,
						fontSize: 14,
						letterSpacing: '.09em',
						textTransform: 'uppercase',
						color: '#55534e',
						margin: '0 6px 8px',
					}}
				>
					Serenity villa
				</div>
				{navItem('Overview', true)}
				{navItem('Rooms & units')}
				{navItem('People')}
				{navItem('Rent')}
				{navItem('Repairs')}
				{navItem('Documents')}
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
					<span>Serenity villa</span>
					<span style={{ color: MICRO }}>›</span>
					<span style={{ color: INK, fontWeight: 600 }}>Overview</span>
				</div>
				<div
					style={{
						padding: '26px 24px',
						display: 'flex',
						flexDirection: 'column',
						gap: 18,
					}}
				>
					<div>
						<div
							style={{ fontFamily: serif, fontSize: 31, letterSpacing: '-.7px' }}
						>
							Good morning, Benjamin
						</div>
						<div style={{ fontSize: 16, color: MUTED, marginTop: 7 }}>
							Three people owe you GH₵ 6,400.00 today. One of them is late.
						</div>
					</div>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(3,1fr)',
							gap: 14,
						}}
					>
						{statCard('Owed to you', 'GH₵ 6,400.00', 'across 3 people')}
						{statCard('Rooms empty', '2 of 9', 'free to let today')}
						{statCard('Leases ending', '1', 'in the next 30 days')}
					</div>
					<div style={{ ...card, padding: '20px 22px 8px' }}>
						<div
							style={{ fontFamily: serif, fontSize: 22, letterSpacing: '-.3px' }}
						>
							Who owes you
						</div>
						{owesRow(
							'Gideon Bempong',
							'Room 104 · due 1 September',
							'GH₵ 3,700.00',
							false,
							true,
						)}
						{owesRow(
							'Selorm Tetteh',
							'Room 100 · 26 days late',
							'GH₵ 1,800.00',
							true,
							true,
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

function UnitChip({ label, c }: { label: string; c: string }) {
	return (
		<Chip style={{ fontSize: 14, padding: '7px 13px' }}>
			<Dot c={c} />
			{label}
		</Chip>
	)
}

function BlockCard({ name, units }: { name: string; units: string }) {
	return (
		<div style={{ ...card, padding: '14px 18px', marginBottom: 12 }}>
			<div style={{ fontSize: 16, fontWeight: 600 }}>{name}</div>
			<div style={{ fontSize: 14, color: MUTED }}>{units}</div>
		</div>
	)
}

function LegendItem({ c, label }: { c: string; label: string }) {
	return (
		<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
			<Dot c={c} />
			{label}
		</span>
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

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
	return (
		<div
			style={{
				display: 'flex',
				gap: 14,
				alignItems: 'flex-start',
				padding: '14px 16px',
				...card,
				borderRadius: 12,
			}}
		>
			<Num>{n}</Num>
			<div>
				<div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
				<div style={{ fontSize: 14, color: MUTED }}>{desc}</div>
			</div>
		</div>
	)
}

function LeaseStep({ n, title, desc }: { n: number; title: string; desc: string }) {
	return (
		<div
			style={{
				padding: 20,
				borderLeft: n === 1 ? undefined : `1px solid ${HAIRSOFT}`,
			}}
		>
			<Num>{n}</Num>
			<div style={{ fontSize: 16.5, fontWeight: 600, marginTop: 12 }}>
				{title}
			</div>
			<div style={{ fontSize: 14.5, color: MUTED, marginTop: 5 }}>{desc}</div>
		</div>
	)
}

function PayMethod({
	c,
	label,
	timing,
	border,
}: {
	c: string
	label: string
	timing: string
	border: boolean
}) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 12,
				padding: '13px 0',
				borderBottom: border ? `1px solid ${HAIRSOFT}` : undefined,
			}}
		>
			<Dot c={c} />
			<div style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>{label}</div>
			<span style={{ fontSize: 14, color: MUTED }}>{timing}</span>
		</div>
	)
}

function OccupancyRow({
	name,
	count,
	pct,
}: {
	name: string
	count: string
	pct: number
}) {
	return (
		<div>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					fontSize: 14.5,
					marginBottom: 6,
				}}
			>
				<span>{name}</span>
				<span style={{ color: MUTED }}>{count}</span>
			</div>
			<div
				style={{ height: 10, borderRadius: 999, background: CREAMDEEP }}
			>
				<div
					style={{
						width: `${pct}%`,
						height: '100%',
						borderRadius: 999,
						background: INK,
					}}
				/>
			</div>
		</div>
	)
}

function RentBar({
	month,
	owed,
	paid,
}: {
	month: string
	owed: number
	paid: number
}) {
	return (
		<div
			style={{
				flex: 1,
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'flex-end',
				gap: 3,
			}}
		>
			<div
				style={{ height: owed, background: CRIMSON, borderRadius: '4px 4px 0 0' }}
			/>
			<div
				style={{ height: paid, background: GREEN, borderRadius: '0 0 4px 4px' }}
			/>
			<div
				style={{
					textAlign: 'center',
					fontSize: 13,
					color: MUTED,
					marginTop: 6,
				}}
			>
				{month}
			</div>
		</div>
	)
}

function RoleRow({
	tint,
	name,
	role,
	border,
}: {
	tint: string
	name: string
	role: string
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
				<div style={{ fontSize: 16, fontWeight: 600 }}>{name}</div>
				<div style={{ fontSize: 14, color: MUTED }}>{role}</div>
			</div>
		</div>
	)
}

function PhonePaymentRow({
	date,
	border,
}: {
	date: string
	border: boolean
}) {
	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				fontSize: 14,
				padding: '9px 0',
				borderBottom: border ? `1px solid ${HAIRSOFT}` : undefined,
			}}
		>
			<span style={{ color: MUTED }}>{date}</span>
			<span style={{ color: GREEN, fontWeight: 600 }}>Paid</span>
		</div>
	)
}

const twoGrid: CSSProperties = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
	gap: 18,
}

const monoLabel: CSSProperties = {
	fontFamily: mono,
	fontSize: 14,
	letterSpacing: '.09em',
	textTransform: 'uppercase',
	color: '#55534e',
}

export default function WhatIsRentloop() {
	return (
		<MarketingPage current="blog">
			<div
				style={{ maxWidth: 1180, margin: '0 auto' }}
				className="px-4 md:px-10"
			>
				<div style={{ maxWidth: 700, margin: '0 auto', padding: '56px 0 44px' }}>
					<div
						style={{
							fontFamily: mono,
							fontSize: 14,
							fontWeight: 500,
							letterSpacing: '.12em',
							textTransform: 'uppercase',
							color: CRIMSON,
						}}
					>
						Blog · Product
					</div>
					<h1
						style={{
							fontFamily: serif,
							fontSize: 'clamp(44px,6vw,76px)',
							lineHeight: 1.02,
							letterSpacing: '-1.5px',
							fontWeight: 400,
							margin: '18px 0 0',
							textWrap: 'balance',
						}}
					>
						What is Rentloop?
					</h1>
					<p
						style={{
							fontSize: 21,
							lineHeight: 1.5,
							color: MUTED,
							marginTop: 22,
							maxWidth: 620,
						}}
					>
						A detailed introduction to Rentloop — the smart property management
						platform built for the Ghana rental market.
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
						<b style={{ fontWeight: 500 }}>22 March 2026</b>
						<span>·</span>
						<b style={{ fontWeight: 500 }}>Marketing Team</b>
						<span>·</span>
						<span>9 min read</span>
					</div>
				</div>

				<Figure
					tight={false}
					caption="The manager's overview — one sentence answers the day before any table appears."
				>
					<Stage style={{ padding: 'clamp(18px,3vw,44px)' }}>
						<ScaledShot width={1060}>
							<DashboardShot />
						</ScaledShot>
					</Stage>
				</Figure>

				<div style={{ maxWidth: 700, margin: '0 auto', padding: '52px 0' }}>
					<P lead>
						Managing rental properties in Ghana has long been a fragmented,
						manual process — spreadsheets for tracking rent, WhatsApp threads for
						maintenance issues, physical files for lease documents. Rentloop was
						built to change that.
					</P>
					<P>
						Rentloop is an all-in-one property management platform designed
						specifically for the Ghana rental market. It gives property owners,
						managers, and landlords a single place to manage everything — from
						the moment a tenant applies to the day they move out.
					</P>
				</div>

				<Column>
					<H2>Who is Rentloop for?</H2>
					<P>Rentloop works for anyone who manages rental properties in Ghana:</P>
					<PlainList
						items={[
							<>
								<b style={{ fontWeight: 600, color: INK }}>
									Individual landlords
								</b>{' '}
								who own and rent out apartments, houses, or rooms
							</>,
							<>
								<b style={{ fontWeight: 600, color: INK }}>
									Property management companies
								</b>{' '}
								that manage properties on behalf of owners
							</>,
							<>
								<b style={{ fontWeight: 600, color: INK }}>
									Real estate agencies
								</b>{' '}
								handling multiple clients and portfolios
							</>,
							<>
								<b style={{ fontWeight: 600, color: INK }}>Developers</b>{' '}
								managing newly built units
							</>,
						]}
					/>
					<P>
						Whether you have 2 units or 200, Rentloop scales with you. The first
						3 units are completely free — no credit card required.
					</P>
				</Column>

				<Figure caption="The same product at every size. The first 3 units cost nothing, forever.">
					<Stage deep>
						<div
							style={{
								display: 'flex',
								alignItems: 'stretch',
								background: '#fff',
								border: `1px solid ${HAIR}`,
								borderRadius: 14,
								overflow: 'hidden',
								flexWrap: 'wrap',
							}}
						>
							{[
								{
									k: '2 units',
									v: 'Free forever',
									d: 'One landlord, a few rooms',
								},
								{
									k: 'Up to 50',
									v: 'GHS 99–399 / mo',
									d: 'A growing portfolio',
								},
								{
									k: 'Up to 150',
									v: 'GHS 400–899 / mo',
									d: 'Agencies and managers',
								},
								{
									k: '200 +',
									v: 'Same platform',
									d: 'No contracts, no surprises',
								},
							].map((cell, i) => (
								<div
									key={cell.k}
									style={{
										flex: '1 1 180px',
										padding: 18,
										borderLeft: i === 0 ? undefined : `1px solid ${HAIRSOFT}`,
										minWidth: 0,
									}}
								>
									<div style={monoLabel}>{cell.k}</div>
									<div style={{ fontSize: 17, fontWeight: 600, marginTop: 7 }}>
										{cell.v}
									</div>
									<div style={{ fontSize: 14, color: MUTED, marginTop: 6 }}>
										{cell.d}
									</div>
								</div>
							))}
						</div>
					</Stage>
				</Figure>

				<Column>
					<H2>Managing properties and units</H2>
					<P>
						Once you're set up, you can create as many properties as you need.
						Each property can have multiple blocks (buildings or sections) and
						each block can contain multiple units.
					</P>
				</Column>

				<Figure caption="Property → block → unit. Every unit carries its own status, so you always know what is ready to rent.">
					<Stage>
						<div
							style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
						>
							<div
								style={{
									...card,
									padding: '16px 20px',
									display: 'flex',
									alignItems: 'center',
									gap: 14,
									maxWidth: 420,
								}}
							>
								<Dot c={INK} />
								<div>
									<div style={{ fontSize: 17, fontWeight: 600 }}>
										Serenity villa
									</div>
									<div style={{ fontSize: 14, color: MUTED }}>
										Property · East Legon, Accra
									</div>
								</div>
							</div>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
									gap: 14,
									paddingLeft: 'clamp(0px,3vw,34px)',
								}}
							>
								<div>
									<BlockCard name="Block A" units="5 units" />
									<div
										style={{
											display: 'flex',
											flexWrap: 'wrap',
											gap: 8,
											paddingLeft: 'clamp(0px,2vw,24px)',
										}}
									>
										<UnitChip label="Room 100" c={GREEN} />
										<UnitChip label="Room 101" c={GREEN} />
										<UnitChip label="Room 102" c={BLUE} />
										<UnitChip label="Room 103" c={ORANGE} />
										<UnitChip label="Room 104" c={GREEN} />
									</div>
								</div>
								<div>
									<BlockCard name="Block B" units="4 units" />
									<div
										style={{
											display: 'flex',
											flexWrap: 'wrap',
											gap: 8,
											paddingLeft: 'clamp(0px,2vw,24px)',
										}}
									>
										<UnitChip label="Room 105" c={GREEN} />
										<UnitChip label="Room 106" c={GREEN} />
										<UnitChip label="Room 107" c={BLUE} />
										<UnitChip label="Room 108" c={MICRO} />
									</div>
								</div>
							</div>
							<div
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									gap: 18,
									marginTop: 6,
									fontSize: 14.5,
									color: MUTED,
								}}
							>
								<LegendItem c={GREEN} label="Occupied" />
								<LegendItem c={BLUE} label="Available" />
								<LegendItem c={ORANGE} label="Maintenance" />
								<LegendItem c={MICRO} label="Draft" />
							</div>
						</div>
					</Stage>
				</Figure>

				<div style={{ maxWidth: 700, margin: '0 auto' }}>
					<P>Rentloop supports all the unit types common in the Ghana market:</P>
				</div>

				<Figure>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
							gap: 14,
						}}
					>
						<Tile title="Apartment" desc="Standard flats within a building" />
						<Tile title="House" desc="Standalone residential properties" />
						<Tile title="Studio" desc="Self-contained single-room units" />
						<Tile title="Office" desc="Commercial office spaces" />
						<Tile title="Retail" desc="Shops, stalls, and commercial units" />
					</div>
				</Figure>

				<Column>
					<H2>Two ways to onboard tenants</H2>
					<P>
						When a tenant is ready to move in, Rentloop gives you two onboarding
						paths.
					</P>
				</Column>

				<Figure caption="Both paths collect the same things — full name, date of birth, Ghana Card or passport, proof of income or admission, emergency contacts.">
					<div style={twoGrid}>
						<Stage style={{ padding: 26 }}>
							<div
								style={{ ...monoLabel, color: CRIMSON }}
							>
								Path one
							</div>
							<div
								style={{
									fontFamily: serif,
									fontSize: 26,
									letterSpacing: '-.4px',
									margin: '8px 0 6px',
								}}
							>
								Self-service
							</div>
							<p style={{ fontSize: 16, margin: '0 0 18px', color: MUTED }}>
								You send a link. The tenant fills in their own details and
								uploads their documents.
							</p>
							<div
								style={{
									...card,
									padding: '14px 16px',
									display: 'flex',
									alignItems: 'center',
									gap: 12,
									marginBottom: 12,
								}}
							>
								<span
									style={{
										fontFamily: mono,
										fontSize: 13,
										color: MUTED,
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
										flex: 1,
									}}
								>
									rentloop.app/apply/serenity-104
								</span>
								<span
									style={{ fontSize: 13.5, fontWeight: 600, color: CRIMSON }}
								>
									Copy
								</span>
							</div>
							<div style={{ ...card, padding: 16 }}>
								<div
									style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}
								>
									Tenant's own form
								</div>
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: 10,
									}}
								>
									<div
										style={{
											border: `1px solid ${HAIR}`,
											borderRadius: 9,
											padding: '10px 12px',
											fontSize: 14.5,
											color: MUTED,
										}}
									>
										Full name
									</div>
									<div
										style={{
											border: `1px solid ${HAIR}`,
											borderRadius: 9,
											padding: '10px 12px',
											fontSize: 14.5,
											color: MUTED,
										}}
									>
										Ghana Card number
									</div>
									<Placeholder height={66}>
										upload · photo of Ghana Card
									</Placeholder>
								</div>
							</div>
						</Stage>
						<Stage style={{ padding: 26 }}>
							<div style={{ ...monoLabel, color: CRIMSON }}>Path two</div>
							<div
								style={{
									fontFamily: serif,
									fontSize: 26,
									letterSpacing: '-.4px',
									margin: '8px 0 6px',
								}}
							>
								Admin-guided
							</div>
							<p style={{ fontSize: 16, margin: '0 0 18px', color: MUTED }}>
								You fill it in on his behalf, five short steps, in the office or
								on the phone with him.
							</p>
							<div
								style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
							>
								<Step
									n={1}
									title="Personal information"
									desc="Name, date of birth, contact"
								/>
								<Step n={2} title="Identity" desc="Ghana Card or passport" />
								<Step
									n={3}
									title="Emergency contact"
									desc="Somebody you can call"
								/>
								<Step
									n={4}
									title="Work or school"
									desc="Proof of income or admission"
								/>
								<Step
									n={5}
									title="Review and submit"
									desc="Check it once, then send"
								/>
							</div>
						</Stage>
					</div>
				</Figure>

				<Column>
					<H2>Lease management</H2>
					<P>
						Once a lease application is approved, Rentloop walks you through the
						full lease setup — and every document stays on the tenant's profile,
						reachable at any time.
					</P>
				</Column>

				<Figure caption="Four steps, then it is a lease. That makes 12 rent payments, ending 31 August 2027.">
					<Stage>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
								background: '#fff',
								border: `1px solid ${HAIR}`,
								borderRadius: 14,
								overflow: 'hidden',
							}}
						>
							<LeaseStep
								n={1}
								title="Set the terms"
								desc="Unit, lease term, rent amount"
							/>
							<LeaseStep
								n={2}
								title="Send for signing"
								desc="Documents generated and sent"
							/>
							<LeaseStep
								n={3}
								title="Watch it get signed"
								desc="Signing status, as it happens"
							/>
							<LeaseStep
								n={4}
								title="He moves in"
								desc="Move-in date recorded, unit occupied"
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
							<div style={{ flex: 1, minWidth: 220 }}>
								<div style={{ fontSize: 17, fontWeight: 600 }}>
									Lease · Room 104 · Gideon Bempong
								</div>
								<div style={{ fontSize: 14.5, color: MUTED, marginTop: 4 }}>
									1 September 2026 → 31 August 2027 · GH₵ 3,700.00 monthly
								</div>
							</div>
							<Chip style={{ color: GREEN, borderColor: '#1B9E5C44' }}>
								<Dot c={GREEN} />
								Signed by both
							</Chip>
						</div>
					</Stage>
				</Figure>

				<Column>
					<H2>Rent collection</H2>
					<P>
						Rentloop supports flexible rent collection to match how landlords and
						tenants in Ghana actually operate — how often he pays, in which
						currency, and by which method.
					</P>
				</Column>

				<Figure caption="A clear record of who has paid, who hasn't, and what's outstanding — no more chasing payments manually.">
					<Stage>
						<div style={twoGrid}>
							<div style={{ ...card, padding: '20px 22px' }}>
								<div style={monoLabel}>How often</div>
								<div
									style={{
										display: 'flex',
										flexWrap: 'wrap',
										gap: 8,
										marginTop: 14,
									}}
								>
									{['Daily', 'Weekly'].map((f) => (
										<Chip key={f} style={{ fontSize: 14.5, padding: '8px 14px' }}>
											{f}
										</Chip>
									))}
									<Chip
										style={{
											fontSize: 14.5,
											padding: '8px 14px',
											background: CRIMSON,
											color: '#fff',
											borderColor: CRIMSON,
										}}
									>
										Monthly
									</Chip>
									{['Quarterly', 'Biannual', 'Annual'].map((f) => (
										<Chip key={f} style={{ fontSize: 14.5, padding: '8px 14px' }}>
											{f}
										</Chip>
									))}
								</div>
								<div style={{ ...monoLabel, marginTop: 24 }}>Currency</div>
								<div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
									<Chip
										style={{
											fontSize: 14.5,
											padding: '8px 14px',
											background: CREAM,
										}}
									>
										GHS
									</Chip>
									<Chip style={{ fontSize: 14.5, padding: '8px 14px' }}>USD</Chip>
									<Chip style={{ fontSize: 14.5, padding: '8px 14px' }}>EUR</Chip>
								</div>
							</div>
							<div style={{ ...card, padding: '20px 22px' }}>
								<div style={monoLabel}>How he pays</div>
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: 2,
										marginTop: 10,
									}}
								>
									<PayMethod
										c={ORANGE}
										label="Mobile Money — MTN"
										timing="instant"
										border
									/>
									<PayMethod
										c={CRIMSON}
										label="Mobile Money — Vodafone"
										timing="instant"
										border
									/>
									<PayMethod
										c={BLUE}
										label="Mobile Money — AirtelTigo"
										timing="instant"
										border
									/>
									<PayMethod
										c={INK}
										label="Bank transfer"
										timing="1–2 days"
										border
									/>
									<PayMethod
										c={GREEN}
										label="Card"
										timing="instant"
										border={false}
									/>
								</div>
							</div>
						</div>
						<div style={{ ...card, marginTop: 16, padding: '20px 22px' }}>
							<div
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									gap: 16,
									alignItems: 'baseline',
									justifyContent: 'space-between',
								}}
							>
								<div style={{ fontSize: 17, fontWeight: 600 }}>September rent</div>
								<div style={{ fontSize: 15, color: MUTED }}>
									GH₵ 26,300.00 of GH₵ 32,700.00 paid
								</div>
							</div>
							<div
								style={{
									display: 'flex',
									height: 16,
									borderRadius: 999,
									overflow: 'hidden',
									marginTop: 14,
									background: CREAMDEEP,
								}}
							>
								<div style={{ width: '80%', background: GREEN }} />
								<div style={{ width: '14%', background: CRIMSON }} />
							</div>
							<div
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									gap: 20,
									marginTop: 12,
									fontSize: 14.5,
									color: MUTED,
								}}
							>
								<LegendItem c={GREEN} label="Paid · 6 people" />
								<LegendItem c={CRIMSON} label="Still owes · 3 people" />
							</div>
						</div>
					</Stage>
				</Figure>

				<Column>
					<H2>Maintenance requests</H2>
					<P>
						Tenants log repairs from the Rentloop tenant app — with a
						description, a priority, a category, and photos of the problem. You
						track every request, assign it, talk through comments, and log what
						the repair cost.
					</P>
				</Column>

				<Figure caption="One request, one place. The tenant sees the same updates you do, as they happen.">
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
									gap: 12,
									alignItems: 'center',
								}}
							>
								<Chip
									style={{
										fontSize: 13.5,
										padding: '7px 13px',
										background: 'rgba(200,0,58,.07)',
										color: CRIMSON,
										borderColor: 'rgba(200,0,58,.2)',
									}}
								>
									Emergency
								</Chip>
								<Chip
									style={{
										fontSize: 13.5,
										padding: '7px 13px',
										background: CREAM,
									}}
								>
									Plumbing
								</Chip>
								<span style={{ fontSize: 14.5, color: MUTED }}>
									Room 104 · reported 14 September, 7:40am
								</span>
							</div>
							<div
								style={{
									fontFamily: serif,
									fontSize: 27,
									letterSpacing: '-.5px',
									margin: '16px 0 8px',
								}}
							>
								Burst pipe under the kitchen sink
							</div>
							<p
								style={{
									fontSize: 17,
									margin: 0,
									color: MUTED,
									maxWidth: 620,
								}}
							>
								Water coming out steadily since last night. I have put a bucket
								under it and turned off the tap at the wall.
							</p>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
									gap: 12,
									margin: '20px 0',
								}}
							>
								<Placeholder height={110}>tenant photo · under sink</Placeholder>
								<Placeholder height={110}>tenant photo · floor</Placeholder>
								<Placeholder height={110}>plumber's photo · after</Placeholder>
							</div>
							<div
								style={{
									borderTop: `1px solid ${HAIRSOFT}`,
									paddingTop: 16,
									display: 'flex',
									flexDirection: 'column',
									gap: 14,
								}}
							>
								<div style={{ display: 'flex', gap: 12 }}>
									<div
										style={{
											width: 32,
											height: 32,
											borderRadius: '50%',
											background: CREAMDEEP,
											flex: '0 0 auto',
										}}
									/>
									<div>
										<div style={{ fontSize: 15, fontWeight: 600 }}>
											Benjamin · you
										</div>
										<div style={{ fontSize: 16, color: MUTED, marginTop: 3 }}>
											Kofi the plumber is coming this morning.
										</div>
									</div>
								</div>
								<div style={{ display: 'flex', gap: 12 }}>
									<div
										style={{
											width: 32,
											height: 32,
											borderRadius: '50%',
											background: 'rgba(200,0,58,.13)',
											flex: '0 0 auto',
										}}
									/>
									<div>
										<div style={{ fontSize: 15, fontWeight: 600 }}>
											Gideon · tenant
										</div>
										<div style={{ fontSize: 16, color: MUTED, marginTop: 3 }}>
											Thank you, I will be home until 11.
										</div>
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
									style={{
										background: INK,
										color: '#fff',
										borderColor: INK,
									}}
								>
									Mark it fixed
								</Chip>
								<Chip>Log what it cost</Chip>
								<span style={{ fontSize: 14.5, color: MUTED }}>
									Repair so far: GH₵ 240.00
								</span>
							</div>
						</div>
					</Stage>
				</Figure>

				<Column>
					<H2>Analytics and reporting</H2>
					<P>
						Rentloop's dashboard gives you a live view of your portfolio —
						occupancy across all properties, rent collected against what's
						outstanding, repair trends, and unit-level summaries.
					</P>
				</Column>

				<Figure caption="Whether you manage 5 units or 150, the numbers you need to make a decision are on one screen.">
					<Stage>
						<div style={twoGrid}>
							<div style={{ ...card, padding: '20px 22px' }}>
								<div style={{ fontSize: 16, fontWeight: 600 }}>Occupancy</div>
								<div
									style={{
										fontFamily: serif,
										fontSize: 44,
										letterSpacing: '-1px',
										margin: '6px 0 2px',
									}}
								>
									78%
								</div>
								<div
									style={{ fontSize: 14.5, color: MUTED, marginBottom: 18 }}
								>
									21 of 27 units let across 3 properties
								</div>
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										gap: 12,
									}}
								>
									<OccupancyRow name="Serenity villa" count="7 of 9" pct={78} />
									<OccupancyRow name="Adenta flats" count="9 of 12" pct={75} />
									<OccupancyRow name="Spintex shops" count="5 of 6" pct={83} />
								</div>
							</div>
							<div style={{ ...card, padding: '20px 22px' }}>
								<div style={{ fontSize: 16, fontWeight: 600 }}>
									Rent collected, last six months
								</div>
								<div style={{ fontSize: 14.5, color: MUTED, marginTop: 4 }}>
									Crimson is what was still owed at month end
								</div>
								<div
									style={{
										display: 'flex',
										alignItems: 'flex-end',
										gap: 12,
										height: 170,
										marginTop: 20,
									}}
								>
									<RentBar month="Apr" owed={16} paid={96} />
									<RentBar month="May" owed={10} paid={108} />
									<RentBar month="Jun" owed={24} paid={88} />
									<RentBar month="Jul" owed={8} paid={118} />
									<RentBar month="Aug" owed={14} paid={112} />
									<RentBar month="Sep" owed={26} paid={104} />
								</div>
							</div>
						</div>
					</Stage>
				</Figure>

				<Column>
					<H2>Your team, and their app</H2>
					<P>
						If you work with property officers, accountants, or assistants, you
						invite them and choose exactly what each one can see and do. Tenants
						get their own app on iOS and Android — their lease, their payment
						history, their repair requests, and announcements from you.
					</P>
				</Column>

				<Figure caption="Role-based permissions on your side; the tenant app on his. Fewer calls, less ambiguity.">
					<Stage
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
							gap: 22,
							alignItems: 'start',
						}}
					>
						<div style={{ ...card, padding: '20px 22px' }}>
							<div
								style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}
							>
								Who can do what
							</div>
							<RoleRow
								tint="rgba(200,0,58,.13)"
								name="Benjamin Owusu"
								role="Owner · everything"
								border
							/>
							<RoleRow
								tint={CREAMDEEP}
								name="Ama Darko"
								role="Property officer · repairs and tenants"
								border
							/>
							<RoleRow
								tint={CREAMDEEP}
								name="Kwesi Annan"
								role="Accountant · rent only, cannot delete"
								border={false}
							/>
						</div>
						<div style={{ display: 'flex', justifyContent: 'center' }}>
							<div
								style={{
									width: 290,
									border: '9px solid #0A0A0A',
									borderRadius: 38,
									background: '#fff',
									overflow: 'hidden',
									boxShadow: '0 26px 54px -30px rgba(17,17,16,.5)',
								}}
							>
								<div style={{ background: '#0A0A0A', height: 24 }} />
								<div style={{ padding: '18px 16px' }}>
									<Logo size={18} />
									<div style={{ fontSize: 14, color: MUTED, marginTop: 14 }}>
										Room 104 · Serenity villa
									</div>
									<div
										style={{ ...card, padding: 14, marginTop: 10, background: CREAM }}
									>
										<div style={{ fontSize: 13.5, color: MUTED }}>Next rent</div>
										<div
											style={{
												fontFamily: serif,
												fontSize: 25,
												letterSpacing: '-.5px',
												marginTop: 2,
											}}
										>
											GH₵ 3,700.00
										</div>
										<div style={{ fontSize: 13.5, color: MUTED }}>
											due 1 October 2026
										</div>
									</div>
									<div
										style={{ fontSize: 14, fontWeight: 600, margin: '18px 0 8px' }}
									>
										Your payments
									</div>
									<PhonePaymentRow date="1 Sep 2026" border />
									<PhonePaymentRow date="1 Aug 2026" border />
									<PhonePaymentRow date="1 Jul 2026" border={false} />
									<Chip
										style={{
											marginTop: 16,
											width: '100%',
											justifyContent: 'center',
											background: CRIMSON,
											color: '#fff',
											borderColor: CRIMSON,
											fontSize: 15,
										}}
									>
										Report a repair
									</Chip>
								</div>
							</div>
						</div>
					</Stage>
				</Figure>

				<Column>
					<H2>Getting started</H2>
					<P>
						Getting started takes less than 10 minutes. Apply as an individual
						landlord or a property management company, and once approved you can
						start adding properties and units right away.
					</P>
					<P>
						The first 3 units are free — forever. As your portfolio grows,
						pricing moves to flat monthly plans: GHS 99–399/month for up to 50
						units, GHS 400–899/month for up to 150 units. No contracts, no
						surprises.
					</P>
				</Column>

				<div
					style={{
						background: '#0A0A0A',
						color: '#fff',
						borderRadius: 22,
						padding: 'clamp(34px,5vw,60px)',
						textAlign: 'center',
						margin: '20px auto 70px',
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
						}}
					>
						Ready to modernise how you manage your rentals?
					</h3>
					<p
						style={{
							color: 'rgba(255,255,255,.66)',
							fontSize: 19,
							maxWidth: 520,
							margin: '16px auto 28px',
						}}
					>
						Create your account and see what Rentloop can do for your portfolio.
						Three units, free forever.
					</p>
					<ExternalLink
						href={APPLY_URL}
						className="inline-block rounded-full bg-rl-crimson font-semibold text-white no-underline transition-colors hover:bg-rl-crimson-deep"
						style={{ fontSize: 17, padding: '14px 26px' }}
					>
						Start free trial
					</ExternalLink>
				</div>
			</div>
		</MarketingPage>
	)
}
