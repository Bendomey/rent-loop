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
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface RevenueRow {
	'Invoices.paidAmount': string | null
	'Invoices.paidAt.month'?: string
}

const chartConfig = {
	revenue: {
		label: 'Revenue',
		color: 'var(--color-primary)',
	},
} satisfies ChartConfig

type TimeRange = '12m' | '6m' | '3m'

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
	'12m': 'Last year',
	'6m': 'Last 6 months',
	'3m': 'Last 3 months',
}

// Cube's relative "last N months" range excludes the current, in-progress
// month, so an explicit range (N-1 months back, through the end of the
// current month) is used to make sure this month is included.
function dateRangeForRange(range: TimeRange): [string, string] {
	const months = range === '12m' ? 11 : range === '6m' ? 5 : 2
	return [
		localizedDayjs()
			.subtract(months, 'month')
			.startOf('month')
			.format('YYYY-MM-DD'),
		localizedDayjs().endOf('month').format('YYYY-MM-DD'),
	]
}

function formatPeriodLabel(row: RevenueRow, range: TimeRange): string {
	const raw = row['Invoices.paidAt.month']
	if (!raw) return ''
	const d = localizedDayjs(raw)
	return range === '12m' ? d.format('MMM YY') : d.format('MMM')
}

interface Props {
	propertyId: string
}

export function PropertyChartBar({ propertyId }: Props) {
	const [timeRange, setTimeRange] = useState<TimeRange>('3m')
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)

	const dateRange = dateRangeForRange(timeRange)

	const revenueQuery = useCubeQuery<RevenueRow>(
		token,
		['prop-revenue-chart', propertyId, timeRange],
		{
			measures: ['Invoices.paidAmount'],
			timeDimensions: [
				{
					dimension: 'Invoices.paidAt',
					granularity: 'month',
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
						<ToggleGroupItem value="12m">Last year</ToggleGroupItem>
						<ToggleGroupItem value="6m">Last 6 months</ToggleGroupItem>
						<ToggleGroupItem value="3m">Last 3 months</ToggleGroupItem>
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
							<SelectValue placeholder={TIME_RANGE_LABELS[timeRange]} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="12m">Last year</SelectItem>
							<SelectItem value="6m">Last 6 months</SelectItem>
							<SelectItem value="3m">Last 3 months</SelectItem>
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
									v >= 1000 ? `GH₵ ${(v / 1000).toFixed(0)}k` : formatAmount(v)
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
