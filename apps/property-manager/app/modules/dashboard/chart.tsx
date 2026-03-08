import { TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '~/components/ui/chart'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Skeleton } from '~/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'

// ---------------------------------------------------------------------------
// Types & config
// ---------------------------------------------------------------------------

interface RevenueRow {
	'Invoices.paidAmount': string | null
	'Invoices.paidAt.month'?: string
	'Invoices.paidAt.week'?: string
	'Invoices.paidAt.day'?: string
}

const chartConfig = {
	revenue: {
		label: 'Revenue',
		color: 'var(--color-primary)',
	},
} satisfies ChartConfig

type TimeRange = '90d' | '30d' | '7d'

function dateRangeForRange(range: TimeRange): [string, string] {
	const now = localizedDayjs()
	const days = range === '90d' ? 90 : range === '30d' ? 30 : 7
	return [now.subtract(days, 'day').format('YYYY-MM-DD'), now.format('YYYY-MM-DD')]
}

function granularityForRange(range: TimeRange) {
	return range === '7d' ? ('day' as const) : range === '30d' ? ('week' as const) : ('month' as const)
}

function formatPeriodLabel(row: RevenueRow, range: TimeRange): string {
	const raw =
		range === '7d'
			? row['Invoices.paidAt.day']
			: range === '30d'
				? row['Invoices.paidAt.week']
				: row['Invoices.paidAt.month']
	if (!raw) return ''
	const d = localizedDayjs(raw)
	if (range === '90d') return d.format('MMM')
	if (range === '30d') return d.format('MMM D')
	return d.format('D MMM')
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChartBarDefault() {
	const [timeRange, setTimeRange] = useState<TimeRange>('90d')
	const { data: token } = useGetAnalyticsToken()

	const granularity = granularityForRange(timeRange)
	const dateRange = dateRangeForRange(timeRange)

	const revenueQuery = useCubeQuery<RevenueRow>(
		token,
		['revenue-chart', timeRange],
		{
			measures: ['Invoices.paidAmount'],
			timeDimensions: [
				{
					dimension: 'Invoices.paidAt',
					granularity,
					dateRange,
				},
			],
		},
	)

	const chartData = (revenueQuery.data ?? []).map((row) => ({
		period: formatPeriodLabel(row, timeRange),
		revenue: convertPesewasToCedis(Number(row['Invoices.paidAmount'] ?? 0)),
	}))

	const totalRevenue = chartData.reduce((sum, r) => sum + r.revenue, 0)
	const hasData = chartData.length > 0 && chartData.some((r) => r.revenue > 0)

	return (
		<Card className="@container/card">
			<CardHeader>
				<CardTitle>Revenue by Period</CardTitle>
				<CardDescription>
					<span className="hidden @[540px]/card:block">
						Paid invoice revenue for the selected time range
					</span>
					<span className="@[540px]/card:hidden">Revenue overview</span>
				</CardDescription>
				<CardAction>
					<ToggleGroup
						type="single"
						value={timeRange}
						onValueChange={(v) => v && setTimeRange(v as TimeRange)}
						variant="outline"
						className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
					>
						<ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
						<ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
						<ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
					</ToggleGroup>
					<Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
						<SelectTrigger
							className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
							size="sm"
							aria-label="Select a value"
						>
							<SelectValue placeholder="Last 3 months" />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="90d" className="rounded-lg">
								Last 3 months
							</SelectItem>
							<SelectItem value="30d" className="rounded-lg">
								Last 30 days
							</SelectItem>
							<SelectItem value="7d" className="rounded-lg">
								Last 7 days
							</SelectItem>
						</SelectContent>
					</Select>
				</CardAction>
			</CardHeader>
			<CardContent>
				{revenueQuery.isPending ? (
					<Skeleton className="h-[200px] w-full rounded-lg" />
				) : !hasData ? (
					<div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
						No revenue data for this period
					</div>
				) : (
					<ChartContainer config={chartConfig}>
						<BarChart accessibilityLayer data={chartData}>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="period"
								tickLine={false}
								tickMargin={10}
								axisLine={false}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickFormatter={(v: number) =>
								v >= 1000
									? `GH₵\u00A0${(v / 1000).toFixed(0)}k`
									: formatAmount(v)
							}
								width={60}
							/>
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										formatter={(value) =>
											formatAmount(Number(value))
										}
									/>
								}
							/>
							<Bar dataKey="revenue" fill="var(--color-primary)" radius={8} />
						</BarChart>
					</ChartContainer>
				)}
			</CardContent>
			<CardFooter className="flex-col items-start gap-2 text-sm">
				<div className="flex gap-2 leading-none font-medium">
					{formatAmount(totalRevenue)} collected <TrendingUp className="h-4 w-4" />
				</div>
				<div className="text-muted-foreground leading-none">
					Paid invoices only · does not include outstanding balances
				</div>
			</CardFooter>
		</Card>
	)
}
