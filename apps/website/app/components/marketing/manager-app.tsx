import { useEffect, useRef, useState } from 'react'

// Values mirror apps/pm_mobile/lib/src/shared/tokens.dart so the mockups
// stay pixel-faithful to the real manager app.
const T = {
	crimson: '#C8003A',
	crimsonTint: 'rgba(200,0,58,0.08)',
	crimsonTint2: 'rgba(200,0,58,0.14)',
	ink: '#111110',
	inkSoft: '#3A3935',
	muted: 'rgba(17,17,16,0.55)',
	mutedSoft: 'rgba(17,17,16,0.40)',
	micro: 'rgba(17,17,16,0.30)',
	surface: '#FFFFFF',
	fill: '#F4F4F2',
	hairline: 'rgba(17,17,16,0.12)',
	hairlineSoft: 'rgba(17,17,16,0.07)',
	sans: 'var(--font-app-sans)',
	serif: 'var(--font-app-serif)',
	mono: 'var(--font-app-mono)',
}

type Tone = 'success' | 'info' | 'warning' | 'danger' | 'neutral'

const tones: Record<Tone, { fg: string; bg: string }> = {
	success: { fg: '#157A47', bg: 'rgba(27,158,92,0.13)' },
	info: { fg: '#2456C4', bg: 'rgba(46,108,246,0.12)' },
	warning: { fg: '#BD5E16', bg: 'rgba(233,123,42,0.16)' },
	danger: { fg: '#C8003A', bg: 'rgba(200,0,58,0.10)' },
	neutral: { fg: '#555555', bg: 'rgba(17,17,16,0.06)' },
}

function statusTone(status: string): Tone {
	switch (status) {
		case 'Paid':
		case 'Active':
		case 'Resolved':
		case 'Completed':
			return 'success'
		case 'In Progress':
		case 'Issued':
			return 'info'
		case 'In Review':
		case 'Partially Paid':
		case 'Medium':
			return 'warning'
		case 'Overdue':
		case 'High':
		case 'Emergency':
			return 'danger'
		default:
			return 'neutral'
	}
}

const DESIGN_WIDTH = 402

export function Icon({
	name,
	size,
	color,
	filled = true,
}: {
	name: string
	size: number
	color: string
	filled?: boolean
}) {
	return (
		<span
			aria-hidden="true"
			style={{
				fontFamily: "'Material Symbols Rounded'",
				fontSize: size,
				lineHeight: 1,
				color,
				fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'opsz' 24`,
				display: 'inline-block',
				width: size,
				height: size,
				overflow: 'hidden',
				userSelect: 'none',
			}}
		>
			{name}
		</span>
	)
}

function StatusBar() {
	return (
		<div
			style={{
				height: 54,
				flex: 'none',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				padding: '8px 34px 0 42px',
				fontFamily: '-apple-system, "SF Pro Text", Inter, sans-serif',
				fontSize: 17,
				fontWeight: 600,
				color: '#000',
			}}
		>
			<span>9:41</span>
			<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
				<svg width="19" height="12" viewBox="0 0 19 12" fill="#000">
					<rect x="0" y="8" width="3.2" height="4" rx="0.8" />
					<rect x="5.2" y="5.5" width="3.2" height="6.5" rx="0.8" />
					<rect x="10.4" y="3" width="3.2" height="9" rx="0.8" />
					<rect x="15.6" y="0" width="3.2" height="12" rx="0.8" />
				</svg>
				<svg width="17" height="12" viewBox="0 0 17 12" fill="#000">
					<path d="M8.5 2.4c2.3 0 4.4.9 6 2.4l1.2-1.2A10.2 10.2 0 0 0 8.5.7 10.2 10.2 0 0 0 1.3 3.6l1.2 1.2a8.5 8.5 0 0 1 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.2-1.2a6.8 6.8 0 0 0-9.6 0l1.2 1.2c1-.9 2.2-1.4 3.6-1.4Zm0 3.4c.5 0 1 .2 1.3.5L8.5 11 7.2 9.7c.3-.3.8-.5 1.3-.5Z" />
				</svg>
				<svg width="27" height="13" viewBox="0 0 27 13" fill="none">
					<rect
						x="0.5"
						y="0.5"
						width="23"
						height="12"
						rx="3.5"
						stroke="#000"
						strokeOpacity="0.35"
					/>
					<rect x="2" y="2" width="20" height="9" rx="2.2" fill="#000" />
					<path
						d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z"
						fill="#000"
						fillOpacity="0.4"
					/>
				</svg>
			</span>
		</div>
	)
}

type TabName = 'home' | 'building' | 'activity' | 'money' | 'more'

const tabs: Array<{ label: string; icon: TabName }> = [
	{ label: 'Home', icon: 'home' },
	{ label: 'Properties', icon: 'building' },
	{ label: 'Activity', icon: 'activity' },
	{ label: 'Money', icon: 'money' },
	{ label: 'More', icon: 'more' },
]

function TabIcon({
	name,
	color,
	sw,
}: {
	name: TabName
	color: string
	sw: number
}) {
	const dot = (sw + 0.4) / 2
	const stroke = {
		stroke: color,
		strokeWidth: sw,
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
		fill: 'none',
	}
	return (
		<svg width="23" height="23" viewBox="0 0 24 24">
			{name === 'home' && (
				<>
					<path d="M3 11.5 12 4l9 7.5" {...stroke} />
					<path d="M5.5 10v10h13V10" {...stroke} />
				</>
			)}
			{name === 'building' && (
				<>
					<rect x="4" y="3" width="16" height="18" rx="1.5" {...stroke} />
					{[
						[9, 7],
						[15, 7],
						[9, 11],
						[15, 11],
						[9, 15],
						[15, 15],
					].map(([cx, cy]) => (
						<circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={dot} fill={color} />
					))}
					<path d="M10 21v-3h4v3" {...stroke} />
				</>
			)}
			{name === 'activity' && (
				<path d="M3 12h3.5l2-6L12 19l2.5-9 1.5 4h5" {...stroke} />
			)}
			{name === 'money' && (
				<>
					<rect x="3" y="6" width="18" height="12" rx="2" {...stroke} />
					<circle cx="12" cy="12" r="2.4" {...stroke} />
					<circle cx="6.5" cy="9" r={dot} fill={color} />
					<circle cx="17.5" cy="15" r={dot} fill={color} />
				</>
			)}
			{name === 'more' &&
				[5, 12, 19].map((cx) => (
					<circle key={cx} cx={cx} cy="12" r={sw * 0.95} fill={color} />
				))}
		</svg>
	)
}

function TabBar({ active }: { active: TabName }) {
	return (
		<div
			style={{
				flex: 'none',
				background: T.surface,
				borderTop: `1px solid ${T.hairline}`,
				boxShadow: '0 -6px 18px -10px rgba(17,17,16,0.18)',
				paddingTop: 9,
				paddingBottom: 26,
				display: 'flex',
				position: 'relative',
			}}
		>
			{tabs.map((tab) => {
				const isActive = tab.icon === active
				const color = isActive ? T.crimson : T.mutedSoft
				return (
					<div
						key={tab.label}
						style={{
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
						}}
					>
						<TabIcon name={tab.icon} color={color} sw={isActive ? 2 : 1.7} />
						<span
							style={{
								marginTop: 4,
								marginBottom: 8,
								fontFamily: T.sans,
								fontSize: 10.5,
								fontWeight: isActive ? 700 : 500,
								color,
								letterSpacing: 0.1,
								lineHeight: 1,
							}}
						>
							{tab.label}
						</span>
					</div>
				)
			})}
			<div
				style={{
					position: 'absolute',
					bottom: 8,
					left: '50%',
					width: 139,
					height: 5,
					marginLeft: -69.5,
					borderRadius: 3,
					background: '#000',
				}}
			/>
		</div>
	)
}

export function DeviceScreen({
	children,
	bottomBar,
}: {
	children: React.ReactNode
	bottomBar?: React.ReactNode
}) {
	const outerRef = useRef<HTMLDivElement>(null)
	const [box, setBox] = useState({ scale: 318 / DESIGN_WIDTH, height: 867 })

	useEffect(() => {
		const element = outerRef.current
		if (!element) return
		const observer = new ResizeObserver(([entry]) => {
			if (!entry) return
			const scale = entry.contentRect.width / DESIGN_WIDTH
			setBox({ scale, height: entry.contentRect.height / scale })
		})
		observer.observe(element)
		return () => observer.disconnect()
	}, [])

	return (
		<div
			ref={outerRef}
			className="relative h-full w-full overflow-hidden bg-white"
		>
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: DESIGN_WIDTH,
					height: box.height,
					transform: `scale(${box.scale})`,
					transformOrigin: 'top left',
					display: 'flex',
					flexDirection: 'column',
					background: T.surface,
					fontFamily: T.sans,
					color: T.ink,
					WebkitFontSmoothing: 'antialiased',
				}}
			>
				<StatusBar />
				<div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
					{children}
				</div>
				{bottomBar}
			</div>
		</div>
	)
}

function Pill({ label, tone }: { label: string; tone?: Tone }) {
	const t = tones[tone ?? statusTone(label)]
	return (
		<span
			style={{
				display: 'inline-block',
				padding: '3px 9px',
				borderRadius: 999,
				background: t.bg,
				fontFamily: T.sans,
				fontSize: 11,
				fontWeight: 600,
				color: t.fg,
				letterSpacing: 0.1,
				lineHeight: 1,
				whiteSpace: 'nowrap',
			}}
		>
			{label}
		</span>
	)
}

function SectionLabel({ text, action }: { text: string; action?: string }) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				padding: '22px 2px 10px',
			}}
		>
			<span
				style={{
					flex: 1,
					fontFamily: T.mono,
					fontSize: 10.5,
					fontWeight: 500,
					letterSpacing: 1.1,
					color: T.mutedSoft,
					textTransform: 'uppercase',
				}}
			>
				{text}
			</span>
			{action && (
				<span
					style={{
						fontFamily: T.sans,
						fontSize: 12.5,
						fontWeight: 600,
						color: T.crimson,
					}}
				>
					{action}
				</span>
			)}
		</div>
	)
}

function Money({
	amount,
	size,
	color = T.ink,
	currencyColor,
}: {
	amount: string
	size: number
	color?: string
	currencyColor: string
}) {
	return (
		<span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
			<span
				style={{
					fontFamily: T.sans,
					fontSize: size * 0.5,
					fontWeight: 600,
					color: currencyColor,
					lineHeight: 1,
				}}
			>
				$
			</span>
			<span
				style={{
					fontFamily: T.serif,
					fontSize: size,
					color,
					letterSpacing: -0.6,
					lineHeight: 1,
				}}
			>
				{amount}
			</span>
		</span>
	)
}

function IconButton({
	icon,
	badge,
	bg = T.surface,
	iconColor = T.ink,
	filled = false,
}: {
	icon: string
	badge?: number
	bg?: string
	iconColor?: string
	filled?: boolean
}) {
	return (
		<span style={{ position: 'relative', display: 'inline-block' }}>
			<span
				style={{
					width: 38,
					height: 38,
					borderRadius: 11,
					background: bg,
					border: `1px solid ${T.hairline}`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					boxSizing: 'border-box',
				}}
			>
				<Icon name={icon} size={19} color={iconColor} filled={filled} />
			</span>
			{badge ? (
				<span
					style={{
						position: 'absolute',
						top: -5,
						right: -5,
						minWidth: 17,
						height: 17,
						padding: badge > 9 ? '0 4px' : 0,
						borderRadius: 999,
						background: T.crimson,
						border: `2px solid ${T.surface}`,
						boxSizing: 'content-box',
						fontFamily: T.sans,
						fontSize: 10,
						fontWeight: 700,
						color: '#fff',
						lineHeight: '17px',
						textAlign: 'center',
					}}
				>
					{badge}
				</span>
			) : null}
		</span>
	)
}

function Avatar({
	name,
	size,
	crimsonTone = false,
}: {
	name: string
	size: number
	crimsonTone?: boolean
}) {
	const initials = name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]!.toUpperCase())
		.join('')
	return (
		<span
			style={{
				width: size,
				height: size,
				borderRadius: '50%',
				background: crimsonTone ? T.crimsonTint2 : T.fill,
				border: `1px solid ${T.hairline}`,
				boxSizing: 'border-box',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: T.serif,
				fontSize: size * 0.36,
				color: T.crimson,
				lineHeight: 1,
				flex: 'none',
			}}
		>
			{initials}
		</span>
	)
}

function TopHeader({
	title,
	eyebrow,
	trailing,
}: {
	title: string
	eyebrow?: React.ReactNode
	trailing?: React.ReactNode
}) {
	return (
		<div style={{ background: T.surface }}>
			<div
				style={{
					display: 'flex',
					alignItems: 'flex-end',
					padding: '6px 20px 14px',
				}}
			>
				<div style={{ flex: 1 }}>
					{eyebrow && <div style={{ marginBottom: 4 }}>{eyebrow}</div>}
					<div
						style={{
							fontFamily: T.serif,
							fontSize: 28,
							letterSpacing: -0.4,
							color: T.ink,
							lineHeight: 1,
						}}
					>
						{title}
					</div>
				</div>
				{trailing && (
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						{trailing}
					</div>
				)}
			</div>
			<div style={{ height: 1, background: T.hairlineSoft }} />
		</div>
	)
}

function Bar({
	percent,
	height = 7,
	color = T.crimson,
	track = T.fill,
}: {
	percent: number
	height?: number
	color?: string
	track?: string
}) {
	return (
		<div style={{ height, borderRadius: height, background: track }}>
			<div
				style={{
					width: `${percent}%`,
					height,
					borderRadius: height,
					background: color,
				}}
			/>
		</div>
	)
}

function Segmented({
	items,
	active,
}: {
	items: Array<{ label: string; count?: number }>
	active: string
}) {
	return (
		<div
			style={{
				display: 'flex',
				padding: 3,
				borderRadius: 12,
				background: T.fill,
			}}
		>
			{items.map((item) => {
				const isActive = item.label === active
				return (
					<div
						key={item.label}
						style={{
							flex: 1,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 6,
							padding: '8px 0',
							borderRadius: 9,
							background: isActive ? T.surface : 'transparent',
							boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
						}}
					>
						<span
							style={{
								fontFamily: T.sans,
								fontSize: 13,
								fontWeight: isActive ? 700 : 500,
								color: isActive ? T.ink : T.muted,
							}}
						>
							{item.label}
						</span>
						{item.count !== undefined && (
							<span
								style={{
									fontFamily: T.mono,
									fontSize: 10.5,
									fontWeight: 700,
									color: isActive ? T.crimson : T.mutedSoft,
								}}
							>
								{item.count}
							</span>
						)}
					</div>
				)
			})}
		</div>
	)
}

function Fab({ label }: { label: string }) {
	return (
		<div
			style={{
				position: 'absolute',
				right: 16,
				bottom: 16,
				height: 48,
				padding: '0 20px 0 16px',
				borderRadius: 999,
				background: T.crimson,
				color: '#fff',
				display: 'flex',
				alignItems: 'center',
				gap: 8,
				boxShadow: '0 6px 16px -6px rgba(17,17,16,0.35)',
				fontFamily: T.sans,
				fontSize: 14.5,
				fontWeight: 600,
			}}
		>
			<Icon name="add" size={20} color="#fff" />
			{label}
		</div>
	)
}

const card = {
	background: T.surface,
	borderRadius: 16,
	border: `1px solid ${T.hairline}`,
} as const

function TileIcon({ icon, tone }: { icon: string; tone: Tone }) {
	return (
		<span
			style={{
				width: 38,
				height: 38,
				borderRadius: 11,
				background: tones[tone].bg,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flex: 'none',
			}}
		>
			<Icon name={icon} size={18} color={tones[tone].fg} />
		</span>
	)
}

function ListRow({
	leading,
	title,
	subtitle,
	trailing,
	last = false,
}: {
	leading?: React.ReactNode
	title: string
	subtitle?: string
	trailing?: React.ReactNode
	last?: boolean
}) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				padding: '13px 2px',
				borderBottom: last ? undefined : `1px solid ${T.hairlineSoft}`,
			}}
		>
			{leading && <span style={{ marginRight: 13 }}>{leading}</span>}
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						fontFamily: T.sans,
						fontSize: 15,
						fontWeight: 600,
						color: T.ink,
						letterSpacing: -0.1,
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{title}
				</div>
				{subtitle && (
					<div
						style={{
							marginTop: 2,
							fontFamily: T.sans,
							fontSize: 12.5,
							color: T.muted,
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}
					>
						{subtitle}
					</div>
				)}
			</div>
			{trailing && <span style={{ marginLeft: 8 }}>{trailing}</span>}
			<span style={{ marginLeft: 4, display: 'flex' }}>
				<Icon name="chevron_right" size={17} color={T.micro} />
			</span>
		</div>
	)
}

function Metric({
	value,
	label,
	delta,
}: {
	value: string
	label: string
	delta?: string
}) {
	return (
		<div style={{ ...card, padding: 16 }}>
			<div
				style={{
					fontFamily: T.serif,
					fontSize: 24,
					color: T.ink,
					letterSpacing: -0.4,
					lineHeight: 1,
				}}
			>
				{value}
			</div>
			<div
				style={{
					marginTop: 6,
					display: 'flex',
					alignItems: 'center',
					gap: 6,
				}}
			>
				<span style={{ fontFamily: T.sans, fontSize: 11.5, color: T.muted }}>
					{label}
				</span>
				{delta && (
					<span
						style={{
							fontFamily: T.mono,
							fontSize: 10.5,
							fontWeight: 700,
							color: tones.success.fg,
						}}
					>
						{delta}
					</span>
				)}
			</div>
		</div>
	)
}

export function ManagerHomeScreen() {
	return (
		<DeviceScreen bottomBar={<TabBar active="home" />}>
			<TopHeader
				eyebrow={
					<span
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 4,
							fontFamily: T.mono,
							fontSize: 10.5,
							fontWeight: 600,
							letterSpacing: 1,
							color: T.crimson,
						}}
					>
						MAPLE ESTATES
						<Icon name="keyboard_arrow_down" size={14} color={T.crimson} />
					</span>
				}
				title="Good morning"
				trailing={
					<>
						<IconButton icon="notifications" badge={3} />
						<Avatar name="Alex Morgan" size={38} crimsonTone />
					</>
				}
			/>
			<div style={{ padding: '10px 20px 0' }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						padding: '13px 15px',
						borderRadius: 14,
						background: 'rgba(233,123,42,0.10)',
						border: '1px solid rgba(233,123,42,0.30)',
					}}
				>
					<Icon
						name="warning"
						size={22}
						color={tones.warning.fg}
						filled={false}
					/>
					<div style={{ flex: 1, marginLeft: 12 }}>
						<div
							style={{
								fontFamily: T.sans,
								fontSize: 14.5,
								fontWeight: 700,
								color: '#9A4A12',
							}}
						>
							Complete your checklist
						</div>
						<div
							style={{
								marginTop: 2,
								fontFamily: T.sans,
								fontSize: 12.5,
								color: T.muted,
							}}
						>
							3/5 steps complete
						</div>
					</div>
					<div style={{ display: 'flex', gap: 3, marginLeft: 8 }}>
						{[true, true, false, true, false].map((done, index) => (
							<span
								key={index}
								style={{
									width: 16,
									height: 4,
									borderRadius: 3,
									background: done ? tones.success.fg : 'rgba(233,123,42,0.30)',
								}}
							/>
						))}
					</div>
				</div>

				<div
					style={{
						marginTop: 10,
						padding: 20,
						borderRadius: 16,
						background: T.ink,
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<span
							style={{
								flex: 1,
								fontFamily: T.mono,
								fontSize: 10.5,
								letterSpacing: 1,
								color: 'rgba(255,255,255,0.55)',
								textTransform: 'uppercase',
							}}
						>
							Revenue · June
						</span>
						<Pill label="▲ +12%" tone="success" />
					</div>
					<div style={{ marginTop: 12 }}>
						<Money
							amount="184,500"
							size={40}
							color="#fff"
							currencyColor="rgba(255,255,255,0.6)"
						/>
					</div>
					<div style={{ marginTop: 18, display: 'flex' }}>
						<span
							style={{
								flex: 1,
								fontFamily: T.sans,
								fontSize: 12.5,
								color: 'rgba(255,255,255,0.6)',
							}}
						>
							Rent collected
						</span>
						<span
							style={{
								fontFamily: T.sans,
								fontSize: 12.5,
								fontWeight: 600,
								color: '#fff',
							}}
						>
							92%
						</span>
					</div>
					<div style={{ marginTop: 8 }}>
						<Bar percent={92} color="#fff" track="rgba(255,255,255,0.15)" />
					</div>
					<div
						style={{
							margin: '14px 0',
							height: 1,
							background: 'rgba(255,255,255,0.10)',
						}}
					/>
					<div style={{ display: 'flex' }}>
						<span
							style={{
								flex: 1,
								fontFamily: T.sans,
								fontSize: 13,
								color: 'rgba(255,255,255,0.65)',
							}}
						>
							Outstanding
						</span>
						<span
							style={{
								fontFamily: T.sans,
								fontSize: 14,
								fontWeight: 600,
								color: '#FF6F8E',
							}}
						>
							$14,200
						</span>
					</div>
				</div>

				<div
					style={{
						marginTop: 10,
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: 10,
					}}
				>
					<Metric value="88%" label="Occupancy" delta="▲ 3%" />
					<Metric value="51" label="Active leases" />
					<Metric value="7" label="Open requests" />
					<Metric value="4" label="Pending apps" />
				</div>

				<div style={{ marginTop: 22 }}>
					<SectionLabel text="Needs your attention" action="Activity" />
					<div style={{ ...card, padding: 14 }}>
						<ListRow
							leading={<TileIcon icon="build" tone="danger" />}
							title="Leaking kitchen tap"
							subtitle="Unit 4B · High priority"
							trailing={<Pill label="New" />}
						/>
						<ListRow
							leading={<TileIcon icon="receipt_long" tone="warning" />}
							title="Invoice overdue"
							subtitle="INV-2041 · Sarah Mitchell"
							trailing={
								<span
									style={{
										fontFamily: T.sans,
										fontSize: 13.5,
										fontWeight: 700,
										color: T.ink,
									}}
								>
									$4,200
								</span>
							}
						/>
						<ListRow
							leading={<TileIcon icon="description" tone="info" />}
							title="New application"
							subtitle="Maria Santos · Unit 1C"
							trailing={<Pill label="Review" />}
							last
						/>
					</div>
				</div>
			</div>
		</DeviceScreen>
	)
}

const invoices = [
	{
		id: 'INV-2041',
		payer: 'Sarah Mitchell',
		unit: 'Unit 5A · Maple Court',
		due: 'Jun 1',
		amount: '4,200',
		paid: null,
		status: 'Overdue',
	},
	{
		id: 'INV-2042',
		payer: 'Daniel Okafor',
		unit: 'Unit 7 · Harbour View',
		due: 'Jun 1',
		amount: '3,500',
		paid: '2,000',
		status: 'Partially Paid',
	},
	{
		id: 'INV-2039',
		payer: 'Priya Sharma',
		unit: 'Unit 4B · Maple Court',
		due: 'Jun 1',
		amount: '4,200',
		paid: null,
		status: 'Paid',
	},
	{
		id: 'INV-2043',
		payer: 'Lucas Moreau',
		unit: 'Unit 3B · Maple Court',
		due: 'Jun 5',
		amount: '5,500',
		paid: null,
		status: 'Issued',
	},
	{
		id: 'INV-2044',
		payer: 'Emma Clarke',
		unit: 'Suite 1 · Parkside',
		due: 'Jun 3',
		amount: '3,200',
		paid: null,
		status: 'Paid',
	},
]

export function ManagerMoneyScreen() {
	return (
		<DeviceScreen bottomBar={<TabBar active="money" />}>
			<TopHeader title="Money" trailing={<IconButton icon="tune" filled />} />
			<div style={{ padding: '6px 20px 0' }}>
				<div
					style={{
						marginTop: 14,
						padding: 20,
						borderRadius: 16,
						background: T.ink,
					}}
				>
					<div
						style={{
							fontFamily: T.mono,
							fontSize: 10.5,
							letterSpacing: 1,
							color: 'rgba(255,255,255,0.55)',
						}}
					>
						COLLECTED · JUNE
					</div>
					<div style={{ marginTop: 10 }}>
						<Money
							amount="169,740"
							size={38}
							color="#fff"
							currencyColor="rgba(255,255,255,0.6)"
						/>
					</div>
					<div
						style={{
							margin: '18px 0 16px',
							height: 1,
							background: 'rgba(255,255,255,0.10)',
						}}
					/>
					<div style={{ display: 'flex', gap: 24 }}>
						{[
							{ label: 'Outstanding', value: '$14,200', color: '#FF6F8E' },
							{ label: 'Expenses', value: '$1,970', color: '#fff' },
						].map((item) => (
							<div key={item.label}>
								<div
									style={{
										fontFamily: T.sans,
										fontSize: 11.5,
										color: 'rgba(255,255,255,0.55)',
									}}
								>
									{item.label}
								</div>
								<div
									style={{
										marginTop: 3,
										fontFamily: T.sans,
										fontSize: 16,
										fontWeight: 600,
										color: item.color,
									}}
								>
									{item.value}
								</div>
							</div>
						))}
					</div>
				</div>
				<div style={{ marginTop: 16 }}>
					<Segmented
						active="Invoices"
						items={[
							{ label: 'Invoices', count: 6 },
							{ label: 'Expenses', count: 3 },
						]}
					/>
				</div>
				<div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
					{['All', 'Outstanding', 'Paid', 'Draft'].map((filter) => {
						const active = filter === 'All'
						return (
							<span
								key={filter}
								style={{
									padding: '7px 14px',
									borderRadius: 20,
									background: active ? T.ink : T.surface,
									border: `1px solid ${active ? T.ink : T.hairline}`,
									fontFamily: T.sans,
									fontSize: 12.5,
									fontWeight: 600,
									color: active ? '#fff' : T.muted,
								}}
							>
								{filter}
							</span>
						)
					})}
				</div>
				<div
					style={{
						marginTop: 14,
						display: 'flex',
						flexDirection: 'column',
						gap: 10,
					}}
				>
					{invoices.map((invoice) => (
						<div
							key={invoice.id}
							style={{
								...card,
								padding: 14,
								display: 'flex',
								alignItems: 'flex-start',
								gap: 12,
							}}
						>
							<div style={{ flex: 1, minWidth: 0 }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<span
										style={{
											fontFamily: T.mono,
											fontSize: 11,
											color: T.mutedSoft,
										}}
									>
										{invoice.id}
									</span>
									<Pill label={invoice.status} />
								</div>
								<div
									style={{
										marginTop: 6,
										fontFamily: T.sans,
										fontSize: 15,
										fontWeight: 600,
										color: T.ink,
									}}
								>
									{invoice.payer}
								</div>
								<div
									style={{
										marginTop: 1,
										fontFamily: T.sans,
										fontSize: 12,
										color: T.muted,
									}}
								>
									{invoice.unit} · due {invoice.due}
								</div>
							</div>
							<div style={{ textAlign: 'right' }}>
								<div
									style={{
										fontFamily: T.serif,
										fontSize: 20,
										color: T.ink,
										letterSpacing: -0.4,
									}}
								>
									${invoice.amount}
								</div>
								{invoice.paid && (
									<div
										style={{
											marginTop: 2,
											fontFamily: T.sans,
											fontSize: 11,
											color: tones.warning.fg,
										}}
									>
										${invoice.paid} paid
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
			<Fab label="Invoice" />
		</DeviceScreen>
	)
}

function ActivityHeader({ active }: { active: string }) {
	return (
		<>
			<div
				style={{
					display: 'flex',
					alignItems: 'flex-end',
					padding: '10px 20px 14px',
				}}
			>
				<div
					style={{
						flex: 1,
						fontFamily: T.serif,
						fontSize: 28,
						color: T.ink,
						letterSpacing: -0.4,
						lineHeight: 1,
					}}
				>
					Activity
				</div>
				<IconButton icon="tune" bg={T.fill} iconColor={T.inkSoft} filled />
			</div>
			<div
				style={{
					padding: '4px 20px 12px',
					borderBottom: `1px solid ${T.hairlineSoft}`,
				}}
			>
				<Segmented
					active={active}
					items={[
						{ label: 'Maintenance', count: 7 },
						{ label: 'Applications', count: 4 },
						{ label: 'Bookings', count: 2 },
					]}
				/>
			</div>
		</>
	)
}

const requests = [
	{
		priority: 'High',
		age: '2h ago',
		code: 'MR-1042',
		title: 'Leaking kitchen tap',
		asset: 'Unit 4B · Kitchen sink',
		category: 'Plumbing',
		assignees: [] as Array<{ name: string; manager: boolean }>,
	},
	{
		priority: 'Medium',
		age: '1d ago',
		code: 'MR-1039',
		title: 'Broken window latch',
		asset: 'Unit 2A · Bedroom window',
		category: 'Carpentry',
		assignees: [
			{ name: 'Kevin Addo', manager: false },
			{ name: 'Alex Morgan', manager: true },
		],
	},
	{
		priority: 'Low',
		age: '3d ago',
		code: 'MR-1036',
		title: 'Flickering corridor light',
		asset: 'Block B · 2nd floor corridor',
		category: 'Electrical',
		assignees: [{ name: 'Yusuf Mensah', manager: false }],
	},
]

export function ManagerMaintenanceScreen() {
	const newTone = tones.neutral
	return (
		<DeviceScreen bottomBar={<TabBar active="activity" />}>
			<ActivityHeader active="Maintenance" />
			<div
				style={{
					display: 'flex',
					gap: 8,
					padding: '10px 20px',
					borderBottom: `1px solid ${T.hairlineSoft}`,
					whiteSpace: 'nowrap',
				}}
			>
				{['Property', 'Unit', 'Priority', 'Category'].map((label) => (
					<span
						key={label}
						style={{
							display: 'inline-flex',
							alignItems: 'center',
							gap: 2,
							padding: '8px 10px 8px 12px',
							borderRadius: 999,
							background: T.fill,
							fontFamily: T.sans,
							fontSize: 12.5,
							fontWeight: 500,
							color: T.muted,
						}}
					>
						{label}
						<Icon name="keyboard_arrow_down" size={16} color={T.mutedSoft} />
					</span>
				))}
			</div>
			<div style={{ display: 'flex', padding: '0 10px' }}>
				<div style={{ width: '92%', flex: 'none', padding: '0 6px' }}>
					<div
						style={{
							margin: '10px 0 4px',
							padding: '12px 14px',
							borderRadius: 12,
							background: newTone.bg,
							display: 'flex',
							justifyContent: 'space-between',
						}}
					>
						<span
							style={{
								fontFamily: T.sans,
								fontSize: 15,
								fontWeight: 700,
								color: newTone.fg,
							}}
						>
							New
						</span>
						<span
							style={{
								fontFamily: T.mono,
								fontSize: 13,
								fontWeight: 700,
								color: newTone.fg,
							}}
						>
							3
						</span>
					</div>
					<div
						style={{
							padding: '12px 2px',
							display: 'flex',
							flexDirection: 'column',
							gap: 10,
						}}
					>
						{requests.map((request) => {
							const pri = tones[statusTone(request.priority)]
							return (
								<div key={request.code} style={{ ...card, padding: 14 }}>
									<div style={{ display: 'flex', alignItems: 'center' }}>
										<span
											style={{
												width: 8,
												height: 8,
												borderRadius: '50%',
												background: pri.fg,
											}}
										/>
										<span
											style={{
												flex: 1,
												marginLeft: 6,
												fontFamily: T.sans,
												fontSize: 11,
												fontWeight: 600,
												color: pri.fg,
											}}
										>
											{request.priority}
										</span>
										<span
											style={{
												fontFamily: T.mono,
												fontSize: 10.5,
												color: T.micro,
											}}
										>
											{request.age}
										</span>
									</div>
									<div
										style={{
											marginTop: 6,
											fontFamily: T.mono,
											fontSize: 10,
											color: T.mutedSoft,
										}}
									>
										#{request.code}
									</div>
									<div
										style={{
											marginTop: 4,
											fontFamily: T.serif,
											fontSize: 17,
											color: T.ink,
											lineHeight: 1.15,
										}}
									>
										{request.title}
									</div>
									<div
										style={{
											marginTop: 4,
											fontFamily: T.sans,
											fontSize: 12.5,
											color: T.muted,
										}}
									>
										{request.asset}
									</div>
									<div
										style={{
											margin: '11px 0',
											height: 1,
											background: T.hairlineSoft,
										}}
									/>
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'space-between',
										}}
									>
										<Pill label={request.category} tone="neutral" />
										{request.assignees.length > 0 ? (
											<span style={{ display: 'flex', gap: 4 }}>
												{request.assignees.map((person) => (
													<span
														key={person.name}
														style={{
															width: 24,
															height: 24,
															borderRadius: '50%',
															background: person.manager
																? tones.info.bg
																: T.fill,
															border: `1px solid ${T.hairline}`,
															boxSizing: 'border-box',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															fontFamily: T.sans,
															fontSize: 9,
															fontWeight: 700,
															color: person.manager ? tones.info.fg : T.crimson,
														}}
													>
														{person.name
															.split(' ')
															.map((part) => part[0])
															.join('')}
													</span>
												))}
											</span>
										) : (
											<span
												style={{
													fontFamily: T.sans,
													fontSize: 12,
													fontWeight: 500,
													color: T.crimson,
												}}
											>
												Unassigned
											</span>
										)}
									</div>
								</div>
							)
						})}
					</div>
				</div>
				<div style={{ width: '92%', flex: 'none', padding: '0 6px' }}>
					<div
						style={{
							margin: '10px 0 4px',
							padding: '12px 14px',
							borderRadius: 12,
							background: tones.info.bg,
							display: 'flex',
							justifyContent: 'space-between',
						}}
					>
						<span
							style={{
								fontFamily: T.sans,
								fontSize: 15,
								fontWeight: 700,
								color: tones.info.fg,
							}}
						>
							In Progress
						</span>
					</div>
				</div>
			</div>
			<Fab label="Request" />
		</DeviceScreen>
	)
}

const applications = [
	{
		name: 'Maria Santos',
		unit: 'Unit 1C · 2 bedroom',
		status: 'In Progress',
		step: 3,
		age: '2h ago',
	},
	{
		name: 'James Carter',
		unit: 'Unit 5B · Studio',
		status: 'In Progress',
		step: 4,
		age: 'Yesterday',
	},
	{
		name: 'Aisha Bello',
		unit: 'Unit 3A · 1 bedroom',
		status: 'Completed',
		code: 'APP-2026-0412',
		age: '3 days ago',
	},
	{
		name: 'Tom Nguyen',
		unit: 'Unit 2D · 1 bedroom',
		status: 'In Progress',
		step: 1,
		age: '5 days ago',
	},
]

export function ManagerApplicationsScreen() {
	return (
		<DeviceScreen bottomBar={<TabBar active="activity" />}>
			<ActivityHeader active="Applications" />
			<div style={{ padding: '8px 20px 4px' }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						padding: '11px 14px',
						borderRadius: 999,
						background: T.fill,
					}}
				>
					<Icon name="search" size={20} color={T.mutedSoft} />
					<span
						style={{ fontFamily: T.sans, fontSize: 14, color: T.mutedSoft }}
					>
						Search name, email or phone
					</span>
				</div>
			</div>
			<div
				style={{
					padding: '12px 20px',
					display: 'flex',
					flexDirection: 'column',
					gap: 10,
				}}
			>
				{applications.map((application) => {
					const pending = application.status === 'In Progress'
					return (
						<div key={application.name} style={{ ...card, padding: 16 }}>
							<div style={{ display: 'flex', alignItems: 'center' }}>
								<Avatar name={application.name} size={42} />
								<div style={{ flex: 1, marginLeft: 12, minWidth: 0 }}>
									<div
										style={{
											fontFamily: T.sans,
											fontSize: 15.5,
											fontWeight: 600,
											color: T.ink,
										}}
									>
										{application.name}
									</div>
									<div
										style={{
											marginTop: 2,
											fontFamily: T.sans,
											fontSize: 12.5,
											color: T.muted,
										}}
									>
										{application.unit}
									</div>
								</div>
								<span style={{ marginLeft: 10 }}>
									<Pill label={application.status} />
								</span>
							</div>
							<div
								style={{
									marginTop: 14,
									display: 'flex',
									justifyContent: 'space-between',
								}}
							>
								<span
									style={{
										fontFamily: T.mono,
										fontSize: 10,
										color: T.mutedSoft,
										letterSpacing: 0.5,
									}}
								>
									{pending ? `STEP ${application.step}/5` : application.code}
								</span>
								<span
									style={{ fontFamily: T.sans, fontSize: 12, color: T.muted }}
								>
									{application.age}
								</span>
							</div>
							{pending && (
								<div style={{ marginTop: 6 }}>
									<Bar percent={(application.step! / 5) * 100} height={6} />
								</div>
							)}
						</div>
					)
				})}
			</div>
			<Fab label="Application" />
		</DeviceScreen>
	)
}
