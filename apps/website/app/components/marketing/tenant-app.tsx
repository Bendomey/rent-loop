import { DeviceScreen, Icon } from './manager-app'

// Values mirror apps/go/lib/src (Material 3 theme seeded from grey.shade600,
// primary #E6023F, Inter) so the mockups stay faithful to the tenant app.
const C = {
	primary: '#E6023F',
	ink: '#1A1C1C',
	inkVariant: '#444748',
	black87: 'rgba(0,0,0,0.87)',
	white70: 'rgba(255,255,255,0.70)',
	grey50: '#FAFAFA',
	grey100: '#F5F5F5',
	grey200: '#EEEEEE',
	grey300: '#E0E0E0',
	grey400: '#BDBDBD',
	grey500: '#9E9E9E',
	grey600: '#757575',
	orange50: '#FFF3E0',
	orange100: '#FFE0B2',
	orange400: '#FFA726',
	orange600: '#FB8C00',
	orange700: '#F57C00',
	orange900: '#E65100',
	red: '#F44336',
	red700: '#D32F2F',
	green50: '#E8F5E9',
	green700: '#388E3C',
	green900: '#1B5E20',
	blue50: '#E3F2FD',
	blue700: '#1976D2',
	blue900: '#0D47A1',
	purple50: '#F3E5F5',
	purple700: '#7B1FA2',
	blueAccent: '#448AFF',
	badge: '#BA1A1A',
	sans: "'Inter', system-ui, sans-serif",
	hand: 'var(--font-app-hand)',
}

function alpha(hex: string, a: number) {
	const n = parseInt(hex.slice(1), 16)
	return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`
}

// Unstyled Flutter Text inherits bodyMedium, which the app's theme sets to 17px
// on top of the M3 defaults (0.25 letter spacing, 1.43 line height).
function text(
	size: number,
	weight = 400,
	color = C.ink,
	letterSpacing = 0.25,
	lineHeight = 1.43,
): React.CSSProperties {
	return {
		fontFamily: C.sans,
		fontSize: size,
		fontWeight: weight,
		color,
		letterSpacing,
		lineHeight,
	}
}

function Screen({
	children,
	background = '#fff',
}: {
	children: React.ReactNode
	background?: string
}) {
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background,
				fontFamily: C.sans,
				color: C.ink,
				// Flutter never sets Inter's opsz axis, so it always renders the
				// 14pt text cut, even for large headings.
				fontOpticalSizing: 'none',
			}}
		>
			{children}
		</div>
	)
}

function CountBadge({
	count,
	background = C.badge,
	color = '#fff',
}: {
	count: number
	background?: string
	color?: string
}) {
	return (
		<span
			style={{
				position: 'absolute',
				left: 12,
				top: -4,
				minWidth: 16,
				height: 16,
				padding: '0 4px',
				boxSizing: 'border-box',
				borderRadius: 8,
				background,
				...text(11, 500, color, 0.5),
				lineHeight: '16px',
				textAlign: 'center',
			}}
		>
			{count}
		</span>
	)
}

function BadgedIcon({
	name,
	size = 24,
	color,
	filled = false,
	badge,
}: {
	name: string
	size?: number
	color: string
	filled?: boolean
	badge?: React.ReactNode
}) {
	return (
		<span style={{ position: 'relative', display: 'inline-flex', width: size }}>
			<Icon name={name} size={size} color={color} filled={filled} />
			{badge}
		</span>
	)
}

type Tab = 'home' | 'payments' | 'maintenance' | 'more'

const tabs: Array<{ id: Tab; label: string; icon: string }> = [
	{ id: 'home', label: 'Home', icon: 'pie_chart' },
	{ id: 'payments', label: 'Payments', icon: 'payments' },
	{ id: 'maintenance', label: 'Maintenance', icon: 'build' },
	{ id: 'more', label: 'More', icon: 'more_horiz' },
]

function HomeIndicator() {
	return (
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
	)
}

function TenantNavBar({ active }: { active: Tab }) {
	const openRequests = 3
	return (
		<div
			style={{
				flex: 'none',
				position: 'relative',
				height: 114,
				background: '#fff',
				display: 'flex',
			}}
		>
			{tabs.map((tab) => {
				const isActive = tab.id === active
				const badge =
					tab.id === 'maintenance' ? (
						<CountBadge
							count={openRequests}
							background={isActive ? '#fff' : C.badge}
							color={isActive ? C.red : '#fff'}
						/>
					) : undefined
				return (
					<div
						key={tab.id}
						style={{
							flex: 1,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							paddingTop: 12,
						}}
					>
						<span
							style={{
								width: 64,
								height: 32,
								borderRadius: 16,
								background: isActive ? C.primary : 'transparent',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}
						>
							<BadgedIcon
								name={tab.icon}
								color={isActive ? '#fff' : C.inkVariant}
								filled={isActive}
								badge={badge}
							/>
						</span>
						<span
							style={{
								marginTop: 4,
								...text(12, 500, isActive ? C.ink : C.inkVariant, 0.5, 1.33),
							}}
						>
							{tab.label}
						</span>
					</div>
				)
			})}
			<HomeIndicator />
		</div>
	)
}

function AppBar({
	title,
	size = 22,
	weight = 700,
	leading,
	actions,
}: {
	title: string
	size?: number
	weight?: number
	leading?: React.ReactNode
	actions?: React.ReactNode
}) {
	return (
		<div
			style={{
				position: 'relative',
				height: 56,
				background: '#fff',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			{leading && (
				<div
					style={{
						position: 'absolute',
						left: 4,
						top: 4,
						width: 48,
						height: 48,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					{leading}
				</div>
			)}
			<span style={text(size, weight, C.ink, 0, 1.27)}>{title}</span>
			{actions && (
				<div
					style={{
						position: 'absolute',
						right: 0,
						top: 4,
						display: 'flex',
					}}
				>
					{actions}
				</div>
			)}
		</div>
	)
}

function IconButton({ children }: { children: React.ReactNode }) {
	return (
		<span
			style={{
				width: 48,
				height: 48,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			{children}
		</span>
	)
}

function FilledButton({
	label,
	icon,
}: {
	label: string
	icon?: React.ReactNode
}) {
	return (
		<div
			style={{
				height: 40,
				borderRadius: 20,
				background: C.primary,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 8,
				...text(14, 500, '#fff', 0.1, 1.43),
			}}
		>
			{icon}
			{label}
		</div>
	)
}

function HandTitle({ children }: { children: React.ReactNode }) {
	return (
		<div
			style={{
				fontFamily: C.hand,
				fontSize: 17,
				fontWeight: 500,
				color: C.ink,
				lineHeight: 1.27,
			}}
		>
			{children}
		</div>
	)
}

const outlinedCard = {
	background: '#fff',
	borderRadius: 8,
	border: `1px solid ${C.grey100}`,
	margin: 4,
} as const

function LeaseSelectorBar() {
	return (
		<div
			style={{
				margin: '4px 14px',
				padding: '5px 5px 5px 8px',
				borderRadius: 50,
				background: C.grey50,
				border: `1px solid ${C.grey100}`,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
			}}
		>
			<span style={{ display: 'flex', alignItems: 'center', padding: 7 }}>
				<Icon name="apartment" size={24} color={C.ink} />
				<span style={{ marginLeft: 10, ...text(15, 400, C.ink, 0.4, 1.33) }}>
					Unit 4B
				</span>
				<Icon name="keyboard_arrow_down" size={20} color={C.grey500} />
			</span>
			<span style={{ display: 'flex' }}>
				<IconButton>
					<BadgedIcon
						name="notifications"
						color={C.inkVariant}
						badge={<CountBadge count={2} background={C.red} />}
					/>
				</IconButton>
				<IconButton>
					<Icon name="refresh" size={24} color={C.inkVariant} />
				</IconButton>
			</span>
		</div>
	)
}

function LeaseField({ label, value }: { label: string; value: string }) {
	return (
		<div style={{ flex: 1 }}>
			<div style={text(11, 500, C.grey500)}>{label}</div>
			<div style={{ marginTop: 2, ...text(14, 600) }}>{value}</div>
		</div>
	)
}

export function TenantHomeScreen() {
	const due = C.orange700
	const status = C.orange700
	return (
		<DeviceScreen bottomBar={<TenantNavBar active="home" />}>
			<Screen>
				<LeaseSelectorBar />
				<div
					style={{
						margin: '10px 30px 0',
						...text(33, 900, C.ink, -0.25, 1.12),
					}}
				>
					Welcome back, Sarah!
				</div>

				<div
					style={{
						margin: 14,
						padding: 15,
						borderRadius: 8,
						background: C.orange50,
						border: `1px solid ${C.orange100}`,
						display: 'flex',
						alignItems: 'flex-start',
					}}
				>
					<Icon name="lightbulb" size={24} color={C.orange600} />
					<div style={{ flex: 1, marginLeft: 10 }}>
						<div style={text(17, 900, C.ink, -0.25, 1.12)}>Rent reminder</div>
						<div style={{ marginTop: 5, ...text(14, 400, C.ink, 0.4, 1.33) }}>
							Your rent for October is due in 5 days. Please ensure timely
							payment to avoid late fees.
						</div>
					</div>
					<Icon name="chevron_right" size={24} color={C.orange400} />
				</div>

				<div style={{ padding: '10px 10px' }}>
					<div style={{ ...outlinedCard, padding: 10 }}>
						<HandTitle>Upcoming Payment</HandTitle>
						<div
							style={{
								marginTop: 10,
								...outlinedCard,
								border: `1px solid ${C.grey200}`,
							}}
						>
							<div
								style={{
									padding: '8px 12px',
									borderRadius: '7px 7px 0 0',
									background: alpha(due, 0.12),
									...text(12, 700, due),
								}}
							>
								Due in 5 days
							</div>
							<div style={{ padding: '12px 10px' }}>
								<div style={text(33, 700, C.ink, -0.25, 1.12)}>$2,550.00</div>
								<span
									style={{
										display: 'inline-block',
										marginTop: 8,
										padding: '4px 10px',
										borderRadius: 5,
										background: alpha(status, 0.12),
										...text(11, 900, status),
									}}
								>
									Rent
								</span>
							</div>
							<div style={{ height: 1, background: C.grey100 }} />
							<div
								style={{
									padding: '8px 10px',
									display: 'flex',
									alignItems: 'center',
									gap: 8,
								}}
							>
								<Icon
									name="calendar_today"
									size={16}
									color={C.grey500}
									filled={false}
								/>
								<span style={text(15, 400, C.grey600, 0.4, 1.33)}>
									Due Oct 5, 2026
								</span>
							</div>
						</div>
						<div style={{ marginTop: 8 }}>
							<FilledButton label="View Details" />
						</div>
					</div>
				</div>

				<div style={{ padding: '0 10px' }}>
					<div style={{ ...outlinedCard, padding: 16 }}>
						<HandTitle>Lease Overview</HandTitle>
						<div style={{ marginTop: 16, display: 'flex' }}>
							<LeaseField label="Rent" value="$2,400.00" />
							<LeaseField label="Frequency" value="Monthly" />
						</div>
						<div style={{ marginTop: 14, display: 'flex' }}>
							<LeaseField label="Status" value="Active" />
							<LeaseField label="Move-in Date" value="Jan 1, 2026" />
						</div>
					</div>
				</div>
			</Screen>
		</DeviceScreen>
	)
}

type InvoiceRow = {
	code: string
	context: string
	amount: string
	status: 'PAID' | 'PARTIALLY_PAID' | 'ISSUED'
	banner?: string
	linked?: boolean
}

const invoiceStatus: Record<InvoiceRow['status'], [string, string]> = {
	PAID: [C.green700, 'PAID'],
	PARTIALLY_PAID: [C.orange700, 'PARTIAL'],
	ISSUED: [C.red700, 'UNPAID'],
}

const outstandingInvoices: InvoiceRow[] = [
	{
		code: 'INV-2610-K4M2QD',
		context: 'Rent',
		amount: '$2,550.00',
		status: 'PARTIALLY_PAID',
		banner: 'Due in 5 days',
		linked: true,
	},
	{
		code: 'INV-2609-P8T3WX',
		context: 'Maintenance Expense',
		amount: '$180.00',
		status: 'ISSUED',
	},
]

const paidInvoices: InvoiceRow[] = [
	{
		code: 'INV-2609-7HN2RC',
		context: 'Rent',
		amount: '$2,550.00',
		status: 'PAID',
		linked: true,
	},
	{
		code: 'INV-2608-3JX9LB',
		context: 'Rent',
		amount: '$2,550.00',
		status: 'PAID',
		linked: true,
	},
]

function InvoiceCard({ invoice }: { invoice: InvoiceRow }) {
	const [statusColor, statusLabel] = invoiceStatus[invoice.status]
	return (
		<div
			style={{
				margin: '0 20px 12px',
				background: '#fff',
				borderRadius: 12,
				border: `1px solid ${C.grey100}`,
			}}
		>
			{invoice.banner && (
				<div
					style={{
						padding: '6px 12px',
						borderRadius: '11px 11px 0 0',
						background: alpha(C.orange700, 0.1),
						...text(11, 700, C.orange700),
					}}
				>
					{invoice.banner}
				</div>
			)}
			<div style={{ padding: 16, display: 'flex', alignItems: 'center' }}>
				<div style={{ flex: 1 }}>
					<div style={text(14, 500)}>{invoice.code}</div>
					<div
						style={{
							marginTop: 4,
							display: 'flex',
							alignItems: 'center',
							gap: 2,
						}}
					>
						<span
							style={{
								padding: '2px 6px',
								borderRadius: 4,
								background: C.grey100,
								...text(11, 400, C.grey600),
							}}
						>
							{invoice.context}
						</span>
						{invoice.linked && (
							<Icon name="open_in_new" size={11} color={C.grey500} />
						)}
					</div>
				</div>
				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'flex-end',
					}}
				>
					<div style={text(15, 500)}>{invoice.amount}</div>
					<span
						style={{
							marginTop: 4,
							padding: '3px 8px',
							borderRadius: 20,
							background: alpha(statusColor, 0.12),
							...text(10, 600, statusColor),
						}}
					>
						{statusLabel}
					</span>
				</div>
				<span style={{ marginLeft: 4, display: 'flex' }}>
					<Icon name="chevron_right" size={20} color={C.grey400} />
				</span>
			</div>
		</div>
	)
}

function SectionTitle({
	children,
	trailing,
}: {
	children: React.ReactNode
	trailing?: React.ReactNode
}) {
	return (
		<div
			style={{
				padding: '0 20px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				...text(16, 500, C.black87, 0.15, 1.5),
			}}
		>
			{children}
			{trailing}
		</div>
	)
}

export function TenantPaymentsScreen() {
	return (
		<DeviceScreen bottomBar={<TenantNavBar active="payments" />}>
			<Screen background={C.grey50}>
				<AppBar title="Payments" />
				<div
					style={{
						display: 'inline-flex',
						flexDirection: 'column',
						alignItems: 'center',
						margin: '20px 20px 0',
						padding: 24,
						borderRadius: 20,
						background: `linear-gradient(135deg, ${C.primary}, #C8023F)`,
						boxShadow: `0 10px 24px ${alpha(C.primary, 0.3)}`,
					}}
				>
					<span style={text(14, 500, C.white70)}>
						Total Outstanding Balance
					</span>
					<span style={{ marginTop: 8, ...text(32, 600, '#fff', 0.25, 1.2) }}>
						$2,730.00
					</span>
					<span style={{ marginTop: 4, ...text(13, 400, C.white70) }}>
						2 invoices pending
					</span>
				</div>
				<div style={{ height: 24 }} />
				<SectionTitle>Outstanding ({outstandingInvoices.length})</SectionTitle>
				<div style={{ height: 8 }} />
				{outstandingInvoices.map((invoice) => (
					<InvoiceCard key={invoice.code} invoice={invoice} />
				))}
				<div style={{ height: 24 }} />
				<SectionTitle
					trailing={
						<span style={{ display: 'flex', transform: 'rotate(180deg)' }}>
							<Icon name="keyboard_arrow_down" size={24} color={C.grey500} />
						</span>
					}
				>
					Paid (6)
				</SectionTitle>
				<div style={{ height: 8 }} />
				{paidInvoices.map((invoice) => (
					<InvoiceCard key={invoice.code} invoice={invoice} />
				))}
			</Screen>
		</DeviceScreen>
	)
}

function DetailCard({ children }: { children: React.ReactNode }) {
	return (
		<div
			style={{
				padding: 16,
				background: '#fff',
				borderRadius: 12,
				border: `1px solid ${C.grey100}`,
			}}
		>
			{children}
		</div>
	)
}

const lineItems = [
	{ label: 'Monthly Rent', amount: '$2,400.00' },
	{ label: 'Service Charge', amount: '$150.00' },
]

export function TenantInvoiceScreen() {
	const status = C.orange700
	const due = C.orange700
	const paid = C.green700
	return (
		<DeviceScreen>
			<Screen background={C.grey50}>
				<AppBar
					title="Invoice"
					leading={
						<Icon
							name="arrow_back_ios_new"
							size={22}
							color={C.ink}
							filled={false}
						/>
					}
				/>
				<div
					style={{
						padding: 16,
						display: 'flex',
						flexDirection: 'column',
						gap: 12,
					}}
				>
					<div
						style={{
							padding: 20,
							background: '#fff',
							borderRadius: 12,
							border: `1px solid ${C.grey100}`,
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							<span style={text(16, 500, C.ink, 0.15, 1.5)}>
								INV-2610-K4M2QD
							</span>
							<span
								style={{
									padding: '4px 10px',
									borderRadius: 20,
									background: alpha(status, 0.12),
									...text(11, 600, status),
								}}
							>
								Partially Paid
							</span>
						</div>
						<div
							style={{ marginTop: 12, ...text(33, 800, C.ink, -0.25, 1.12) }}
						>
							$2,550.00
						</div>
					</div>

					<div
						style={{
							padding: '12px 16px',
							borderRadius: 10,
							background: alpha(due, 0.1),
							border: `1px solid ${alpha(due, 0.3)}`,
							display: 'flex',
							alignItems: 'center',
							gap: 8,
						}}
					>
						<Icon name="calendar_today" size={16} color={due} filled={false} />
						<div>
							<div style={text(13, 700, due)}>Due in 5 days</div>
							<div style={text(12, 400, alpha(due, 0.8))}>
								Monday, Oct 5, 2026
							</div>
						</div>
					</div>

					<DetailCard>
						<div style={{ display: 'flex', alignItems: 'center' }}>
							<span
								style={{
									padding: 8,
									borderRadius: 8,
									background: C.grey100,
									display: 'flex',
								}}
							>
								<Icon name="home" size={18} color={C.grey600} filled={false} />
							</span>
							<div style={{ flex: 1, marginLeft: 12 }}>
								<div style={text(11, 400, C.grey500)}>Invoice For</div>
								<div style={text(14, 500)}>Rent</div>
							</div>
							<Icon name="open_in_new" size={18} color={C.primary} />
						</div>
					</DetailCard>

					<DetailCard>
						<div style={text(14, 500, C.ink, 0.1, 1.43)}>Line Items</div>
						<div style={{ marginTop: 12 }}>
							{lineItems.map((item) => (
								<div
									key={item.label}
									style={{
										paddingBottom: 10,
										display: 'flex',
										justifyContent: 'space-between',
									}}
								>
									<span style={text(13, 500, C.grey500)}>{item.label}</span>
									<span style={text(13, 500)}>{item.amount}</span>
								</div>
							))}
						</div>
						<div
							style={{ margin: '7.5px 0', height: 1, background: C.grey100 }}
						/>
						<div style={{ display: 'flex', justifyContent: 'space-between' }}>
							<span style={text(17, 500)}>Total</span>
							<span style={text(17, 600)}>$2,550.00</span>
						</div>
					</DetailCard>

					<DetailCard>
						<div style={text(14, 500, C.ink, 0.1, 1.43)}>Payments (1)</div>
						<div
							style={{
								marginTop: 12,
								paddingBottom: 10,
								display: 'flex',
								alignItems: 'flex-start',
							}}
						>
							<span
								style={{
									padding: 8,
									borderRadius: 8,
									background: alpha(paid, 0.1),
									display: 'flex',
								}}
							>
								<Icon
									name="credit_card"
									size={16}
									color={paid}
									filled={false}
								/>
							</span>
							<div style={{ flex: 1, marginLeft: 10 }}>
								<div
									style={{ display: 'flex', justifyContent: 'space-between' }}
								>
									<span style={text(13, 500)}>Bank Transfer</span>
									<span style={text(13, 600)}>$1,200.00</span>
								</div>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
									}}
								>
									<span
										style={{
											padding: '2px 6px',
											borderRadius: 4,
											background: alpha(paid, 0.1),
											...text(10, 600, paid),
										}}
									>
										Successful
									</span>
									<span style={text(11, 400, C.grey500)}>Sep 28, 2026</span>
								</div>
							</div>
						</div>
					</DetailCard>
				</div>

				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						bottom: 0,
						padding: '12px 16px 24px',
						background: '#fff',
					}}
				>
					<FilledButton
						label="Pay Now"
						icon={<Icon name="credit_card" size={18} color="#fff" />}
					/>
				</div>
				<HomeIndicator />
			</Screen>
		</DeviceScreen>
	)
}

type RequestStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED'

const requestStatus: Record<
	RequestStatus,
	{ label: string; bg: string; fg: string }
> = {
	NEW: { label: 'New', bg: C.orange50, fg: C.orange900 },
	IN_PROGRESS: { label: 'In Progress', bg: C.blue50, fg: C.blue900 },
	RESOLVED: { label: 'Resolved', bg: C.green50, fg: C.green900 },
}

function StatusChip({ status }: { status: RequestStatus }) {
	const style = requestStatus[status]
	return (
		<span
			style={{
				flex: 'none',
				padding: '4px 10px',
				borderRadius: 5,
				background: style.bg,
				...text(11, 800, style.fg),
			}}
		>
			{style.label}
		</span>
	)
}

type Activity = {
	label: string
	icon: string
	bg: string
	fg: string
	transition?: [RequestStatus, RequestStatus]
	description?: string
}

const requests: Array<{
	title: string
	status: RequestStatus
	code: string
	submitted: string
	updated: string
	activity: Activity
}> = [
	{
		title: 'Kitchen sink is leaking',
		status: 'NEW',
		code: '2609KQ7M3T',
		submitted: 'Sep 28, 2026',
		updated: 'Sep 28, 2026',
		activity: {
			label: 'Request Submitted',
			icon: 'add_task',
			bg: C.blue50,
			fg: C.blue700,
		},
	},
	{
		title: 'Bedroom AC not cooling',
		status: 'IN_PROGRESS',
		code: '2609HV2P8N',
		submitted: 'Sep 22, 2026',
		updated: 'Sep 26, 2026',
		activity: {
			label: 'Status Updated',
			icon: 'swap_horiz',
			bg: C.purple50,
			fg: C.purple700,
			transition: ['NEW', 'IN_PROGRESS'],
		},
	},
	{
		title: 'Bathroom light switch faulty',
		status: 'RESOLVED',
		code: '2609BD4R6Y',
		submitted: 'Sep 10, 2026',
		updated: 'Sep 14, 2026',
		activity: {
			label: 'Resolved',
			icon: 'check_circle',
			bg: C.green50,
			fg: C.green700,
		},
	},
]

export function TenantMaintenanceScreen() {
	return (
		<DeviceScreen bottomBar={<TenantNavBar active="maintenance" />}>
			<Screen>
				<AppBar
					title="My Requests"
					size={20}
					weight={600}
					actions={
						<>
							<IconButton>
								<BadgedIcon
									name="filter_list"
									size={27}
									color={C.ink}
									badge={<CountBadge count={0} background={C.blueAccent} />}
								/>
							</IconButton>
							<IconButton>
								<Icon name="search" size={24} color={C.inkVariant} />
							</IconButton>
						</>
					}
				/>
				<div style={{ padding: '0 10px' }}>
					{requests.map((request) => (
						<div key={request.code} style={{ paddingBottom: 8 }}>
							<div
								style={{
									margin: 4,
									padding: 10,
									background: '#fff',
									borderRadius: 8,
									border: `1px solid ${C.grey300}`,
								}}
							>
								<div style={{ display: 'flex', alignItems: 'center' }}>
									<span
										style={{
											flex: 1,
											minWidth: 0,
											whiteSpace: 'nowrap',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											...text(17, 600, C.ink, 0, 1.27),
										}}
									>
										{request.title}
									</span>
									<span style={{ marginLeft: 8, display: 'flex' }}>
										<StatusChip status={request.status} />
									</span>
								</div>
								<div
									style={{ marginTop: 10, ...text(14, 400, C.grey600, 0.1) }}
								>
									Case ID: #{request.code}
								</div>
								<div
									style={{
										marginTop: 8,
										height: 56,
										display: 'flex',
										alignItems: 'center',
									}}
								>
									<span style={{ width: 24, display: 'flex' }}>
										<Icon
											name="calendar_today"
											size={22}
											color={C.inkVariant}
										/>
									</span>
									<span
										style={{
											flex: 1,
											marginLeft: 16,
											...text(15, 400, C.ink, 0.4, 1.33),
										}}
									>
										Submitted: {request.submitted}
									</span>
									<Icon name="arrow_forward" size={24} color={C.inkVariant} />
								</div>
								<div style={{ display: 'flex', alignItems: 'center' }}>
									<Icon name="alarm" size={22} color={C.ink} filled={false} />
									<span
										style={{
											marginLeft: 20,
											...text(15, 400, C.ink, 0.4, 1.33),
										}}
									>
										Updated: {request.updated}
									</span>
								</div>
								<div
									style={{
										margin: '19.5px 0 15.5px',
										height: 1,
										background: C.grey300,
									}}
								/>
								<div style={{ display: 'flex', alignItems: 'flex-start' }}>
									<span
										style={{
											padding: 8,
											borderRadius: 100,
											background: request.activity.bg,
											display: 'flex',
										}}
									>
										<Icon
											name={request.activity.icon}
											size={22}
											color={request.activity.fg}
										/>
									</span>
									<div style={{ flex: 1, marginLeft: 12 }}>
										<div style={text(14, 600, C.ink, 0.1)}>
											{request.activity.label}
										</div>
										{request.activity.transition && (
											<div
												style={{
													marginTop: 4,
													display: 'flex',
													alignItems: 'center',
												}}
											>
												<StatusChip status={request.activity.transition[0]} />
												<span style={{ margin: '0 6px', display: 'flex' }}>
													<Icon
														name="arrow_forward"
														size={12}
														color="#9E9E9E"
													/>
												</span>
												<StatusChip status={request.activity.transition[1]} />
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
				<div
					style={{
						position: 'absolute',
						right: 16,
						bottom: 16,
						width: 56,
						height: 56,
						borderRadius: '50%',
						background: C.primary,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow:
							'0 3px 5px -1px rgba(0,0,0,0.2), 0 6px 10px rgba(0,0,0,0.14), 0 1px 18px rgba(0,0,0,0.12)',
					}}
				>
					<Icon name="add" size={24} color="#fff" />
				</div>
			</Screen>
		</DeviceScreen>
	)
}
