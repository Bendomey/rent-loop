import { useState } from 'react'
import { useInsightsFilters } from '../use-insights-filters'
import { RiskDetailModal } from './risk-detail-modal'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import { Badge } from '~/components/ui/badge'
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'

interface OutstandingRow {
	'Invoices.outstandingAmount': string | null
	'Invoices.outstandingPropertyCount': string | null
}
interface ExpiringRow {
	'Leases.activeCount': string | null
	'Leases.expiringPropertyCount': string | null
}
interface MaintenanceRow {
	'MaintenanceRequests.newCount': string | null
	'MaintenanceRequests.inProgressCount': string | null
	'MaintenanceRequests.inReviewCount': string | null
	'MaintenanceRequests.openPropertyCount': string | null
}

function parseNum(value: string | null | undefined): number {
	return value ? Number(value) : 0
}

function StatusPill({ ok, className }: { ok: boolean; className?: string }) {
	return (
		<Badge
			variant="outline"
			className={cn(
				'gap-1.5',
				ok
					? 'border-teal-500/30 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-400'
					: 'border-amber-500/30 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400',
				className,
			)}
		>
			<span
				className={cn(
					'size-1.5 rounded-full',
					ok ? 'bg-teal-500' : 'bg-amber-500',
				)}
			/>
			{ok ? 'Clear' : 'Needs attention'}
		</Badge>
	)
}

interface RiskStat {
	type: InsightsRiskType
	label: string
	value: string
	isPending: boolean
	propertyCount: number
	emptyText: string
	modalDescription: string
}

function RiskColumn({
	stat,
	onViewDetails,
}: {
	stat: RiskStat
	onViewDetails: () => void
}) {
	const needsAttention = stat.propertyCount > 0

	return (
		<div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0">
			<div className="flex items-center justify-between gap-2">
				<span className="text-muted-foreground text-sm">{stat.label}</span>
				{stat.isPending ? (
					<Skeleton className="h-5 w-24" />
				) : (
					<StatusPill ok={!needsAttention} />
				)}
			</div>

			{stat.isPending ? (
				<Skeleton className="h-7 w-24" />
			) : (
				<span className="text-xl font-semibold tabular-nums">{stat.value}</span>
			)}

			<div className="border-t pt-3">
				{stat.isPending ? (
					<Skeleton className="h-4 w-32" />
				) : needsAttention ? (
					<div className="flex items-center justify-between gap-2">
						<span className="text-muted-foreground text-xs">
							Across {stat.propertyCount}{' '}
							{stat.propertyCount === 1 ? 'property' : 'properties'}
						</span>
						<button
							type="button"
							onClick={onViewDetails}
							className="text-primary text-xs font-medium hover:underline"
						>
							View details →
						</button>
					</div>
				) : (
					<span className="text-muted-foreground text-xs">
						{stat.emptyText}
					</span>
				)}
			</div>
		</div>
	)
}

export function RiskSummary() {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)
	const { propertyIds, propertyFilter } = useInsightsFilters()
	const [openType, setOpenType] = useState<InsightsRiskType | null>(null)

	const today = localizedDayjs().format('YYYY-MM-DD')
	const in60Days = localizedDayjs().add(60, 'day').format('YYYY-MM-DD')
	const scopeKey = propertyIds.join(',') || 'all'

	const outstandingQuery = useCubeQuery<OutstandingRow>(
		token,
		['ins-ov-risk-outstanding', scopeKey],
		{
			measures: [
				'Invoices.outstandingAmount',
				'Invoices.outstandingPropertyCount',
			],
			filters: propertyFilter('Invoices.propertyId'),
		},
	)

	const expiringQuery = useCubeQuery<ExpiringRow>(
		token,
		['ins-ov-risk-expiring', scopeKey],
		{
			measures: ['Leases.activeCount', 'Leases.expiringPropertyCount'],
			timeDimensions: [
				{ dimension: 'Leases.moveOutDate', dateRange: [today, in60Days] },
			],
			filters: propertyFilter('Leases.propertyId'),
		},
	)

	const maintenanceQuery = useCubeQuery<MaintenanceRow>(
		token,
		['ins-ov-risk-maintenance', scopeKey],
		{
			measures: [
				'MaintenanceRequests.newCount',
				'MaintenanceRequests.inProgressCount',
				'MaintenanceRequests.inReviewCount',
				'MaintenanceRequests.openPropertyCount',
			],
			filters: propertyFilter('MaintenanceRequests.propertyId'),
		},
	)

	const outstandingRow = outstandingQuery.data?.[0]
	const outstanding = parseNum(outstandingRow?.['Invoices.outstandingAmount'])
	const outstandingProperties = parseNum(
		outstandingRow?.['Invoices.outstandingPropertyCount'],
	)

	const expiringRow = expiringQuery.data?.[0]
	const expiring = parseNum(expiringRow?.['Leases.activeCount'])
	const expiringProperties = parseNum(
		expiringRow?.['Leases.expiringPropertyCount'],
	)

	const maintenanceRow = maintenanceQuery.data?.[0]
	const openMaintenance =
		parseNum(maintenanceRow?.['MaintenanceRequests.newCount']) +
		parseNum(maintenanceRow?.['MaintenanceRequests.inProgressCount']) +
		parseNum(maintenanceRow?.['MaintenanceRequests.inReviewCount'])
	const maintenanceProperties = parseNum(
		maintenanceRow?.['MaintenanceRequests.openPropertyCount'],
	)

	const stats: RiskStat[] = [
		{
			type: 'outstanding_rent',
			label: 'Outstanding Invoices',
			value: formatAmount(convertPesewasToCedis(outstanding)),
			isPending: outstandingQuery.isPending,
			propertyCount: outstandingProperties,
			emptyText: 'No outstanding balances',
			modalDescription:
				'Tenants with overdue balances. Open a property to review the ledger and record payment.',
		},
		{
			type: 'expiring_leases',
			label: 'Leases expiring',
			value: expiring.toLocaleString(),
			isPending: expiringQuery.isPending,
			propertyCount: expiringProperties,
			emptyText: 'Nothing expiring soon',
			modalDescription:
				'Leases ending within 60 days. Open a property to review the lease table.',
		},
		{
			type: 'maintenance',
			label: 'Open maintenance requests',
			value: openMaintenance.toLocaleString(),
			isPending: maintenanceQuery.isPending,
			propertyCount: maintenanceProperties,
			emptyText: 'No open requests',
			modalDescription:
				'Unresolved requests grouped by property. Open a property to triage and assign.',
		},
	]

	const allPending = stats.every((stat) => stat.isPending)
	const attentionCount = stats.filter(
		(stat) => !stat.isPending && stat.propertyCount > 0,
	).length
	const openStat = stats.find((stat) => stat.type === openType) ?? null

	return (
		<>
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle>Risk Summary</CardTitle>
					<CardDescription>
						Items that may need attention across the selected scope
					</CardDescription>
					{!allPending ? (
						<CardAction>
							<Badge
								variant="outline"
								className={cn(
									'gap-1.5',
									attentionCount === 0
										? 'border-teal-500/30 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-400'
										: 'border-amber-500/30 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400',
								)}
							>
								<span
									className={cn(
										'size-1.5 rounded-full',
										attentionCount === 0 ? 'bg-teal-500' : 'bg-amber-500',
									)}
								/>
								{attentionCount === 0
									? 'All clear'
									: `${attentionCount} ${attentionCount === 1 ? 'item needs' : 'items need'} attention`}
							</Badge>
						</CardAction>
					) : null}
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
						{stats.map((stat) => (
							<RiskColumn
								key={stat.type}
								stat={stat}
								onViewDetails={() => setOpenType(stat.type)}
							/>
						))}
					</div>
				</CardContent>
			</Card>
			{openStat ? (
				<RiskDetailModal
					type={openStat.type}
					label={openStat.label}
					description={openStat.modalDescription}
					totalValue={openStat.value}
					propertyCount={openStat.propertyCount}
					open={openType !== null}
					onOpenChange={(open) => setOpenType(open ? openStat.type : null)}
					scopedPropertyIds={propertyIds}
				/>
			) : null}
		</>
	)
}
