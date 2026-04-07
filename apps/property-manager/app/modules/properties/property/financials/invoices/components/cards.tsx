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
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface RevenueRow {
	'Invoices.paidAmount': string | null
	'Invoices.paidAt.month'?: string
}

interface TotalsRow {
	'Invoices.outstandingAmount': string | null
	'Invoices.count': string | null
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

export function RentPaymentSectionCards({ propertyId }: Props) {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)

	const thisMonth = localizedDayjs().format('YYYY-MM')
	const lastMonth = localizedDayjs().subtract(1, 'month').format('YYYY-MM')

	const propertyFilter = {
		member: 'Invoices.propertyId' as const,
		operator: 'equals' as const,
		values: [propertyId],
	}

	// Paid amounts for the last 2 months (for MoM comparison)
	const revenueQuery = useCubeQuery<RevenueRow>(
		token,
		['invoice-revenue-mom', propertyId],
		{
			measures: ['Invoices.paidAmount'],
			timeDimensions: [
				{
					dimension: 'Invoices.paidAt',
					granularity: 'month',
					dateRange: 'Last 2 months',
				},
			],
			filters: [propertyFilter],
		},
	)

	// Outstanding + total count (all time)
	const totalsQuery = useCubeQuery<TotalsRow>(
		token,
		['invoice-totals', propertyId],
		{
			measures: ['Invoices.outstandingAmount', 'Invoices.count'],
			filters: [propertyFilter],
		},
	)

	const isLoading = revenueQuery.isPending || totalsQuery.isPending

	const revenueRows = revenueQuery.data ?? []
	const thisMonthRow = revenueRows.find((r) =>
		r['Invoices.paidAt.month']?.startsWith(thisMonth),
	)
	const lastMonthRow = revenueRows.find((r) =>
		r['Invoices.paidAt.month']?.startsWith(lastMonth),
	)
	const thisMonthPaid = parseNum(thisMonthRow?.['Invoices.paidAmount'])
	const lastMonthPaid = parseNum(lastMonthRow?.['Invoices.paidAmount'])
	const revDelta = momDelta(thisMonthPaid, lastMonthPaid)

	const totalsRow = totalsQuery.data?.[0]
	const outstandingAmount = parseNum(totalsRow?.['Invoices.outstandingAmount'])
	const totalCount = parseNum(totalsRow?.['Invoices.count'])

	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
			{/* Rental Received this month */}
			<Card className="hover:from-primary/10 @container/card gap-3 py-4 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg">
				<CardHeader>
					<CardDescription>Rental Received (this month)</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						{isLoading ? (
							<Skeleton className="h-8 w-32" />
						) : (
							formatAmount(convertPesewasToCedis(thisMonthPaid))
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
					Compared to {formatAmount(convertPesewasToCedis(lastMonthPaid))} last
					month
				</CardFooter>
			</Card>

			{/* Outstanding Amount */}
			<Card className="hover:from-primary/10 @container/card gap-3 py-4 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg">
				<CardHeader>
					<CardDescription>Outstanding Amount</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						{isLoading ? (
							<Skeleton className="h-8 w-32" />
						) : (
							formatAmount(convertPesewasToCedis(outstandingAmount))
						)}
					</CardTitle>
					<CardAction>
						{!isLoading && (
							<Badge
								variant="outline"
								className={`gap-1 ${outstandingAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}
							>
								{outstandingAmount > 0 ? (
									<TrendingDown className="h-4 w-4" />
								) : (
									<TrendingUp className="h-4 w-4" />
								)}
								{outstandingAmount > 0 ? 'Pending' : 'Clear'}
							</Badge>
						)}
					</CardAction>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					Issued &amp; partially paid invoices
				</CardFooter>
			</Card>

			{/* Total Invoices */}
			<Card className="hover:from-primary/10 @container/card gap-3 py-4 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg">
				<CardHeader>
					<CardDescription>Total Invoices</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						{isLoading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							totalCount.toLocaleString()
						)}
					</CardTitle>
					<CardAction>
						<Badge variant="outline" className="gap-1">
							All time
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					All invoices for this property
				</CardFooter>
			</Card>

			{/* Revenue Growth MoM */}
			<Card className="hover:from-primary/10 @container/card gap-3 py-4 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg">
				<CardHeader>
					<CardDescription>Revenue Growth (MoM)</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						{isLoading ? (
							<Skeleton className="h-8 w-20" />
						) : (
							`${revDelta >= 0 ? '+' : ''}${revDelta.toFixed(1)}%`
						)}
					</CardTitle>
					<CardAction>
						<Badge
							variant="outline"
							className={`gap-1 ${revDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
						>
							{revDelta >= 0 ? (
								<TrendingUp className="h-4 w-4" />
							) : (
								<TrendingDown className="h-4 w-4" />
							)}
							Month-on-month
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					Based on paid invoices this vs last month
				</CardFooter>
			</Card>
		</div>
	)
}
