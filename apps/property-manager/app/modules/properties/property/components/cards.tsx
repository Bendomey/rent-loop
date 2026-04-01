import { TrendingDown, TrendingUp } from 'lucide-react'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import { Badge } from '~/components/ui/badge'
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

interface RevenueRow {
	'Invoices.paidAmount': string | null
	'Invoices.paidAt.month'?: string
}

interface LeaseRow {
	'Leases.count': string | null
	'Leases.createdAt.month'?: string
}

interface MaintenanceRow {
	'MaintenanceRequests.count': string | null
	'MaintenanceRequests.newCount': string | null
	'MaintenanceRequests.inProgressCount': string | null
	'MaintenanceRequests.inReviewCount': string | null
}

function parseNum(v: string | null | undefined): number {
	return v ? Number(v) : 0
}

function momDelta(current: number, previous: number): number {
	if (previous === 0) return 0
	return ((current - previous) / previous) * 100
}

interface Props {
	propertyId: string
}

export function PropertySectionCards({ propertyId }: Props) {
	const { data: token } = useGetAnalyticsToken()

	const thisMonth = localizedDayjs().format('YYYY-MM')
	const lastMonth = localizedDayjs().subtract(1, 'month').format('YYYY-MM')

	const invoiceFilter = {
		member: 'Invoices.propertyId' as const,
		operator: 'equals' as const,
		values: [propertyId],
	}
	const leaseFilter = {
		member: 'Leases.propertyId' as const,
		operator: 'equals' as const,
		values: [propertyId],
	}

	// Revenue for last 2 months — powers Total Rental Income + Growth Rate
	const revenueQuery = useCubeQuery<RevenueRow>(
		token,
		['prop-revenue-mom', propertyId],
		{
			measures: ['Invoices.paidAmount'],
			timeDimensions: [
				{
					dimension: 'Invoices.paidAt',
					granularity: 'month',
					dateRange: 'Last 2 months',
				},
			],
			filters: [invoiceFilter],
		},
	)

	// New leases created last 2 months — powers New Tenants
	const leaseQuery = useCubeQuery<LeaseRow>(
		token,
		['prop-new-leases-mom', propertyId],
		{
			measures: ['Leases.count'],
			timeDimensions: [
				{
					dimension: 'Leases.createdAt',
					granularity: 'month',
					dateRange: 'Last 2 months',
				},
			],
			filters: [leaseFilter],
		},
	)

	// Maintenance request counts
	const maintenanceQuery = useCubeQuery<MaintenanceRow>(
		token,
		['prop-maintenance-kpi', propertyId],
		{
			measures: [
				'MaintenanceRequests.count',
				'MaintenanceRequests.newCount',
				'MaintenanceRequests.inProgressCount',
				'MaintenanceRequests.inReviewCount',
			],
			filters: [
				{
					member: 'MaintenanceRequests.propertyId',
					operator: 'equals',
					values: [propertyId],
				},
			],
		},
	)

	const isLoading =
		revenueQuery.isPending || leaseQuery.isPending || maintenanceQuery.isPending

	// Revenue
	const revenueRows = revenueQuery.data ?? []
	const thisMonthRevRow = revenueRows.find((r) =>
		r['Invoices.paidAt.month']?.startsWith(thisMonth),
	)
	const lastMonthRevRow = revenueRows.find((r) =>
		r['Invoices.paidAt.month']?.startsWith(lastMonth),
	)
	const thisMonthRev = parseNum(thisMonthRevRow?.['Invoices.paidAmount'])
	const lastMonthRev = parseNum(lastMonthRevRow?.['Invoices.paidAmount'])
	const revDelta = momDelta(thisMonthRev, lastMonthRev)

	// New tenants (leases created this month vs last)
	const leaseRows = leaseQuery.data ?? []
	const thisMonthLeases = parseNum(
		leaseRows.find((r) => r['Leases.createdAt.month']?.startsWith(thisMonth))?.[
			'Leases.count'
		],
	)
	const lastMonthLeases = parseNum(
		leaseRows.find((r) => r['Leases.createdAt.month']?.startsWith(lastMonth))?.[
			'Leases.count'
		],
	)
	const leaseDelta = momDelta(thisMonthLeases, lastMonthLeases)

	// Maintenance request counts
	const maintenanceRow = maintenanceQuery.data?.[0]
	const totalMaintenance = parseNum(
		maintenanceRow?.['MaintenanceRequests.count'],
	)
	const newRequests = parseNum(maintenanceRow?.['MaintenanceRequests.newCount'])
	const inProgress = parseNum(
		maintenanceRow?.['MaintenanceRequests.inProgressCount'],
	)
	const inReview = parseNum(
		maintenanceRow?.['MaintenanceRequests.inReviewCount'],
	)
	const openRequests = newRequests + inProgress + inReview

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-2 lg:px-6 xl:grid-cols-4">
			{/* Total Rental Income */}
			<Card className="hover:from-primary/10 @container/card gap-3 py-4 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg">
				<CardHeader>
					<CardDescription>Total Rental Income</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						{isLoading ? (
							<Skeleton className="h-8 w-32" />
						) : (
							formatAmount(convertPesewasToCedis(thisMonthRev))
						)}
					</CardTitle>
					<CardAction>
						{!isLoading && (
							<Badge
								variant="outline"
								className={`gap-1 ${revDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
							>
								{revDelta >= 0 ? (
									<TrendingUp className="h-4 w-4" />
								) : (
									<TrendingDown className="h-4 w-4" />
								)}
								{revDelta >= 0 ? '+' : ''}
								{revDelta.toFixed(1)}%
							</Badge>
						)}
					</CardAction>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					Compared to {formatAmount(convertPesewasToCedis(lastMonthRev))} last
					month
				</CardFooter>
			</Card>

			{/* New Tenants */}
			<Card className="hover:from-primary/10 @container/card gap-3 py-4 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg">
				<CardHeader>
					<CardDescription>New Tenants</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						{isLoading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							thisMonthLeases.toLocaleString()
						)}
					</CardTitle>
					<CardAction>
						{!isLoading && (
							<Badge
								variant="outline"
								className={`gap-1 ${leaseDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
							>
								{leaseDelta >= 0 ? (
									<TrendingUp className="h-4 w-4" />
								) : (
									<TrendingDown className="h-4 w-4" />
								)}
								{leaseDelta >= 0 ? '+' : ''}
								{leaseDelta.toFixed(1)}%
							</Badge>
						)}
					</CardAction>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					{leaseDelta >= 0
						? 'New tenant sign-ups this month'
						: 'New tenant sign-ups declined this month'}
				</CardFooter>
			</Card>

			{/* Maintenance Requests */}
			<Card className="hover:from-primary/10 @container/card gap-3 py-4 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg">
				<CardHeader>
					<CardDescription>Maintenance Requests</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						{isLoading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							openRequests.toLocaleString()
						)}
					</CardTitle>
					<CardAction>
						<Badge variant="outline" className="gap-1">
							{isLoading ? (
								<Skeleton className="h-4 w-12" />
							) : (
								`${totalMaintenance} total`
							)}
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					{isLoading ? (
						<Skeleton className="h-3 w-40" />
					) : (
						`${newRequests} new · ${inProgress} in progress · ${inReview} in review`
					)}
				</CardFooter>
			</Card>

			{/* Growth Rate */}
			<Card className="hover:from-primary/10 @container/card gap-3 py-4 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg">
				<CardHeader>
					<CardDescription>Growth Rate</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						{isLoading ? (
							<Skeleton className="h-8 w-20" />
						) : (
							`${revDelta >= 0 ? '+' : ''}${revDelta.toFixed(1)}%`
						)}
					</CardTitle>
					<CardAction>
						{!isLoading && (
							<Badge
								variant="outline"
								className={`gap-1 ${revDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
							>
								{revDelta >= 0 ? (
									<TrendingUp className="h-4 w-4" />
								) : (
									<TrendingDown className="h-4 w-4" />
								)}
								{revDelta >= 0 ? '+' : ''}
								{revDelta.toFixed(1)}%
							</Badge>
						)}
					</CardAction>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					On track with quarterly projections
				</CardFooter>
			</Card>
		</div>
	)
}
