import { TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
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
	return [
		now.subtract(days, 'day').format('YYYY-MM-DD'),
		now.format('YYYY-MM-DD'),
	]
}

function granularityForRange(range: TimeRange) {
	return range === '7d'
		? ('day' as const)
		: range === '30d'
			? ('week' as const)
			: ('month' as const)
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

interface Props {
	propertyId: string
}

export function PropertyChartBar({ propertyId }: Props) {
	const [timeRange, setTimeRange] = useState<TimeRange>('90d')
	const { data: token } = useGetAnalyticsToken()

	const granularity = granularityForRange(timeRange)
	const dateRange = dateRangeForRange(timeRange)

	const revenueQuery = useCubeQuery<RevenueRow>(
		token,
		['prop-revenue-chart', propertyId, timeRange],
		{
			measures: ['Invoices.paidAmount'],
			timeDimensions: [
				{
					dimension: 'Invoices.paidAt',
					granularity,
					dateRange,
				},
			],
			filters: [
				{
					member: 'Invoices.propertyId',
					operator: 'equals',
					values: [propertyId],
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
		<div className="bg-background flex w-full flex-col rounded-2xl p-4 shadow-sm transition-all duration-300 ease-in-out hover:shadow-md">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<h3 className="text-lg font-semibold">Total Revenue</h3>
					<p className="text-muted-foreground text-sm">
						Paid invoice revenue for the selected period
					</p>
				</div>

				<div className="flex items-center gap-3">
					<ToggleGroup
						type="single"
						value={timeRange}
						onValueChange={(v) => v && setTimeRange(v as TimeRange)}
						variant="outline"
						className="hidden md:flex"
					>
						<ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
						<ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
						<ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
					</ToggleGroup>

					<Select
						value={timeRange}
						onValueChange={(v) => setTimeRange(v as TimeRange)}
					>
						<SelectTrigger
							className="w-36 md:hidden"
							size="sm"
							aria-label="Select time range"
						>
							<SelectValue placeholder="Last 3 months" />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="90d">Last 3 months</SelectItem>
							<SelectItem value="30d">Last 30 days</SelectItem>
							<SelectItem value="7d">Last 7 days</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="mt-4 h-[250px] sm:h-[280px] lg:h-[300px]">
				{revenueQuery.isPending ? (
					<Skeleton className="h-full w-full rounded-lg" />
				) : !hasData ? (
					<div className="text-muted-foreground flex h-full items-center justify-center text-sm">
						No revenue data for this period
					</div>
				) : (
					<ChartContainer config={chartConfig} className="h-full w-full">
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
										formatter={(value) => formatAmount(Number(value))}
									/>
								}
							/>
							<Bar
								dataKey="revenue"
								fill="var(--color-primary)"
								radius={4}
								barSize={20}
							/>
						</BarChart>
					</ChartContainer>
				)}
			</div>

			{!revenueQuery.isPending && hasData && (
				<div className="mt-3 flex items-center gap-2 text-sm font-medium">
					{formatAmount(totalRevenue)} collected{' '}
					<TrendingUp className="h-4 w-4" />
				</div>
			)}
		</div>
	)
}
