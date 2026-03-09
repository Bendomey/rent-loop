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

// ---------------------------------------------------------------------------
// Cube query result types
// ---------------------------------------------------------------------------

interface RevenueRow {
	'Invoices.paidAmount': string | null
	'Invoices.paidAt.month'?: string
}

interface LeaseRow {
	'Leases.activeCount': string | null
}

interface UnitRow {
	'Units.count': string | null
	'Units.occupiedCount': string | null
	'Units.availableCount': string | null
	'Units.maintenanceCount': string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseNum(v: string | null | undefined): number {
	return v ? Number(v) : 0
}

function pct(a: number, b: number): string {
	if (b === 0) return '0%'
	return `${((a / b) * 100).toFixed(1)}%`
}

function momDelta(thisMonth: number, lastMonth: number): number {
	if (lastMonth === 0) return 0
	return ((thisMonth - lastMonth) / lastMonth) * 100
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SectionCards() {
	const { data: token } = useGetAnalyticsToken()

	const thisMonth = localizedDayjs().format('YYYY-MM')
	const lastMonth = localizedDayjs().subtract(1, 'month').format('YYYY-MM')

	// Revenue for the last 2 months (grouped by month to compute MoM delta)
	const revenueQuery = useCubeQuery<RevenueRow>(token, ['revenue-mom'], {
		measures: ['Invoices.paidAmount'],
		timeDimensions: [
			{
				dimension: 'Invoices.paidAt',
				granularity: 'month',
				dateRange: 'Last 2 months',
			},
		],
	})

	// Active lease count
	const leaseQuery = useCubeQuery<LeaseRow>(token, ['active-leases'], {
		measures: ['Leases.activeCount'],
	})

	// Units breakdown
	const unitsQuery = useCubeQuery<UnitRow>(token, ['units-kpi'], {
		measures: [
			'Units.count',
			'Units.occupiedCount',
			'Units.availableCount',
			'Units.maintenanceCount',
		],
	})

	const isLoading =
		revenueQuery.isPending || leaseQuery.isPending || unitsQuery.isPending

	// Revenue figures
	const revenueRows = revenueQuery.data ?? []
	const thisMonthRow = revenueRows.find((r) =>
		r['Invoices.paidAt.month']?.startsWith(thisMonth),
	)
	const lastMonthRow = revenueRows.find((r) =>
		r['Invoices.paidAt.month']?.startsWith(lastMonth),
	)
	const thisMonthRevPesewas = parseNum(thisMonthRow?.['Invoices.paidAmount'])
	const lastMonthRevPesewas = parseNum(lastMonthRow?.['Invoices.paidAmount'])
	const revDelta = momDelta(thisMonthRevPesewas, lastMonthRevPesewas)

	// Active leases
	const activeLeases = parseNum(leaseQuery.data?.[0]?.['Leases.activeCount'])

	// Units
	const unitsRow = unitsQuery.data?.[0]
	const totalUnits = parseNum(unitsRow?.['Units.count'])
	const occupiedUnits = parseNum(unitsRow?.['Units.occupiedCount'])
	const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
			{/* Total Rental Income */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Rental Income (this month)</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{isLoading ? (
							<Skeleton className="h-8 w-32" />
						) : (
							formatAmount(convertPesewasToCedis(thisMonthRevPesewas))
						)}
					</CardTitle>
					<CardAction>
						{!isLoading && (
							<Badge variant="outline">
								{revDelta >= 0 ? <TrendingUp /> : <TrendingDown />}
								{revDelta >= 0 ? '+' : ''}
								{revDelta.toFixed(1)}%
							</Badge>
						)}
					</CardAction>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="line-clamp-1 flex gap-2 font-medium">
						{revDelta >= 0 ? (
							<>
								Trending up this month <TrendingUp className="size-4" />
							</>
						) : (
							<>
								Down from last month <TrendingDown className="size-4" />
							</>
						)}
					</div>
					<div className="text-muted-foreground">
						Compared to{' '}
						{formatAmount(convertPesewasToCedis(lastMonthRevPesewas))} last
						month
					</div>
				</CardFooter>
			</Card>

			{/* Active Leases */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Active Leases</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{isLoading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							activeLeases.toLocaleString()
						)}
					</CardTitle>
					<CardAction>
						<Badge variant="outline">
							<TrendingUp />
							Live
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="line-clamp-1 flex gap-2 font-medium">
						Currently active tenancy agreements
					</div>
					<div className="text-muted-foreground">
						Across all your properties
					</div>
				</CardFooter>
			</Card>

			{/* Occupancy Rate */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Occupancy Rate</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{isLoading ? (
							<Skeleton className="h-8 w-20" />
						) : (
							pct(occupiedUnits, totalUnits)
						)}
					</CardTitle>
					<CardAction>
						<Badge variant="outline">
							{occupancyRate >= 80 ? <TrendingUp /> : <TrendingDown />}
							{occupiedUnits}/{totalUnits} units
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="line-clamp-1 flex gap-2 font-medium">
						{occupancyRate >= 80 ? (
							<>
								High occupancy <TrendingUp className="size-4" />
							</>
						) : (
							<>
								Room for improvement <TrendingDown className="size-4" />
							</>
						)}
					</div>
					<div className="text-muted-foreground">
						{parseNum(unitsRow?.['Units.availableCount'])} available ·{' '}
						{parseNum(unitsRow?.['Units.maintenanceCount'])} in maintenance
					</div>
				</CardFooter>
			</Card>

			{/* MoM Revenue Growth */}
			<Card className="@container/card">
				<CardHeader>
					<CardDescription>Revenue Growth (MoM)</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{isLoading ? (
							<Skeleton className="h-8 w-20" />
						) : (
							`${revDelta >= 0 ? '+' : ''}${revDelta.toFixed(1)}%`
						)}
					</CardTitle>
					<CardAction>
						<Badge variant="outline">
							{revDelta >= 0 ? <TrendingUp /> : <TrendingDown />}
							Month-on-month
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="flex-col items-start gap-1.5 text-sm">
					<div className="line-clamp-1 flex gap-2 font-medium">
						{revDelta >= 0 ? (
							<>
								Positive growth <TrendingUp className="size-4" />
							</>
						) : (
							<>
								Revenue declined <TrendingDown className="size-4" />
							</>
						)}
					</div>
					<div className="text-muted-foreground">
						Based on paid invoices this vs last month
					</div>
				</CardFooter>
			</Card>
		</div>
	)
}
