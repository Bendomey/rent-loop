import { TrendingDown, TrendingUp } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import { Badge } from '~/components/ui/badge'
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '~/components/ui/chart'
import { Skeleton } from '~/components/ui/skeleton'
import { TypographyH4 } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface TotalsRow {
	'Invoices.paidAmount': string | null
	'Invoices.outstandingAmount': string | null
	'Invoices.count': string | null
}

interface TrendRow {
	'Invoices.paidAmount': string | null
	'Invoices.paidAt.month'?: string
}

const chartConfig = {
	revenue: {
		label: 'Revenue',
		color: 'var(--chart-1)',
	},
} satisfies ChartConfig

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

export function PropertyRentIncomeCards({ propertyId }: Props) {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)

	const thisMonth = localizedDayjs().format('YYYY-MM')
	const lastMonth = localizedDayjs().subtract(1, 'month').format('YYYY-MM')

	const invoiceFilter = {
		member: 'Invoices.propertyId' as const,
		operator: 'equals' as const,
		values: [propertyId],
	}

	// All-time totals for this property
	const totalsQuery = useCubeQuery<TotalsRow>(
		token,
		['prop-rent-totals', propertyId],
		{
			measures: [
				'Invoices.paidAmount',
				'Invoices.outstandingAmount',
				'Invoices.count',
			],
			filters: [invoiceFilter],
		},
	)

	// Monthly revenue trend (last 6 months) for the line chart
	const trendQuery = useCubeQuery<TrendRow>(
		token,
		['prop-rent-trend', propertyId],
		{
			measures: ['Invoices.paidAmount'],
			timeDimensions: [
				{
					dimension: 'Invoices.paidAt',
					granularity: 'month',
					dateRange: 'Last 6 months',
				},
			],
			filters: [invoiceFilter],
		},
	)

	const isLoading = totalsQuery.isPending || trendQuery.isPending

	const totalsRow = totalsQuery.data?.[0]
	const paidAmount = parseNum(totalsRow?.['Invoices.paidAmount'])
	const outstandingAmount = parseNum(totalsRow?.['Invoices.outstandingAmount'])
	const totalCount = parseNum(totalsRow?.['Invoices.count'])

	// MoM from the trend data
	const trendRows = trendQuery.data ?? []
	const thisMonthRow = trendRows.find((r) =>
		r['Invoices.paidAt.month']?.startsWith(thisMonth),
	)
	const lastMonthRow = trendRows.find((r) =>
		r['Invoices.paidAt.month']?.startsWith(lastMonth),
	)
	const thisMonthPaid = parseNum(thisMonthRow?.['Invoices.paidAmount'])
	const lastMonthPaid = parseNum(lastMonthRow?.['Invoices.paidAmount'])
	const revDelta = momDelta(thisMonthPaid, lastMonthPaid)

	const chartData = trendRows.map((row) => ({
		month: row['Invoices.paidAt.month']
			? localizedDayjs(row['Invoices.paidAt.month']).format('MMM')
			: '',
		revenue: convertPesewasToCedis(parseNum(row['Invoices.paidAmount'])),
	}))

	const cards = [
		{
			label: 'Rent Received',
			value: isLoading ? null : formatAmount(convertPesewasToCedis(paidAmount)),
			delta: revDelta,
			footer: 'All time',
		},
		{
			label: 'Outstanding',
			value: isLoading
				? null
				: formatAmount(convertPesewasToCedis(outstandingAmount)),
			delta: outstandingAmount > 0 ? -1 : 0,
			footer: 'Issued & partially paid',
		},
		{
			label: 'Total Invoices',
			value: isLoading ? null : totalCount.toLocaleString(),
			delta: 0,
			footer: 'All time',
		},
	]

	return (
		<div>
			<TypographyH4 className="mb-4">Rent Income Overview</TypographyH4>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-8 xl:grid-cols-8">
				<div className="flex flex-col gap-4 lg:col-span-3 lg:justify-between lg:gap-0 xl:col-span-3 xl:justify-between xl:gap-0">
					{cards.map((card) => (
						<Card
							key={card.label}
							className="from-primary/5 to-card dark:from-primary/10 bg-gradient-to-t px-3 py-2"
						>
							<CardHeader className="gap-y-2 p-2">
								<CardDescription className="text-xs">
									{card.label}
								</CardDescription>
								<CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
									{card.value === null ? (
										<Skeleton className="h-6 w-24" />
									) : (
										card.value
									)}
								</CardTitle>
								<CardAction>
									<Badge
										variant="outline"
										className={`gap-1 px-1.5 py-0.5 text-[10px] ${card.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
									>
										{card.delta >= 0 ? (
											<TrendingUp className="h-3.5 w-3.5" />
										) : (
											<TrendingDown className="h-3.5 w-3.5" />
										)}
										{card.footer}
									</Badge>
								</CardAction>
							</CardHeader>
						</Card>
					))}
				</div>

				<div className="bg-card rounded-lg border p-4 shadow-sm transition-all hover:shadow-md lg:col-span-5 xl:col-span-5">
					<div className="mb-4">
						<h3 className="text-lg font-semibold">Rental Income Trend</h3>
						<p className="text-muted-foreground text-sm">
							Last 6 months · paid invoices
						</p>
					</div>
					<div className="h-[230px]">
						{isLoading ? (
							<Skeleton className="h-full w-full rounded-lg" />
						) : (
							<ChartContainer config={chartConfig} className="h-full w-full">
								<LineChart
									accessibilityLayer
									data={chartData}
									margin={{ left: 12, right: 12 }}
								>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="month"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
									/>
									<YAxis
										tickLine={false}
										axisLine={false}
										tickFormatter={(v: number) =>
											v >= 1000
												? `₵${(v / 1000).toFixed(0)}k`
												: `₵${v.toLocaleString()}`
										}
									/>
									<ChartTooltip
										cursor={false}
										content={
											<ChartTooltipContent
												formatter={(value) => formatAmount(Number(value))}
												hideLabel
											/>
										}
									/>
									<Line
										dataKey="revenue"
										type="natural"
										stroke="var(--color-revenue)"
										strokeWidth={2}
										dot={false}
									/>
								</LineChart>
							</ChartContainer>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
