import { Cell, Label, Pie, PieChart } from 'recharts'
import { useInsightsFilters } from '../use-insights-filters'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '~/components/ui/chart'
import { Skeleton } from '~/components/ui/skeleton'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'

interface UnitRow {
	'Units.occupiedCount': string | null
	'Units.availableCount': string | null
	'Units.partiallyOccupiedCount': string | null
	'Units.maintenanceCount': string | null
	'Units.draftCount': string | null
	'Units.count': string | null
}

const chartConfig = {
	occupied: {
		label: 'Occupied',
		color: 'var(--chart-1)',
	},
	available: {
		label: 'Available',
		color: 'var(--chart-2)',
	},
	maintenance: {
		label: 'Maintenance',
		color: 'var(--chart-3)',
	},
	draft: {
		label: 'Draft',
		color: 'var(--chart-4)',
	},
	partiallyOccupied: {
		label: 'Partially Occupied',
		color: 'var(--chart-5)',
	},
} satisfies ChartConfig

export function UnitDistribution({ className }: { className?: string }) {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)
	const { propertyIds, propertyFilter } = useInsightsFilters()

	const unitsQuery = useCubeQuery<UnitRow>(
		token,
		['ins-ov-unit-distribution', propertyIds.join(',') || 'all'],
		{
			measures: [
				'Units.occupiedCount',
				'Units.availableCount',
				'Units.partiallyOccupiedCount',
				'Units.maintenanceCount',
				'Units.draftCount',
				'Units.count',
			],
			filters: propertyFilter('Units.propertyId'),
		},
	)

	const row = unitsQuery.data?.[0]

	const occupied = Number(row?.['Units.occupiedCount'] ?? 0)
	const available = Number(row?.['Units.availableCount'] ?? 0)
	const partiallyOccupied = Number(row?.['Units.partiallyOccupiedCount'] ?? 0)
	const maintenance = Number(row?.['Units.maintenanceCount'] ?? 0)
	const draft = Number(row?.['Units.draftCount'] ?? 0)
	const total = Number(row?.['Units.count'] ?? 0)

	const chartData = [
		{ name: 'occupied', value: occupied, fill: 'var(--chart-1)' },
		{ name: 'available', value: available, fill: 'var(--chart-2)' },
		{ name: 'maintenance', value: maintenance, fill: 'var(--chart-3)' },
		{ name: 'draft', value: draft, fill: 'var(--chart-4)' },
		{
			name: 'partiallyOccupied',
			value: partiallyOccupied,
			fill: 'var(--chart-5)',
		},
	].filter((d) => d.value > 0)

	const hasData = chartData.length > 0

	return (
		<Card className={cn('self-start shadow-none', className)}>
			<CardHeader>
				<CardTitle>Unit Distribution</CardTitle>
				<CardDescription>
					{propertyIds.length === 0
						? 'Units across all properties, by status'
						: propertyIds.length === 1
							? 'Units in the selected property, by status'
							: `Units across ${propertyIds.length} selected properties, by status`}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{unitsQuery.isPending ? (
					<div className="flex items-center justify-center">
						<Skeleton className="size-[200px] rounded-full" />
					</div>
				) : !hasData ? (
					<div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
						No units in the selected scope
					</div>
				) : (
					<ChartContainer
						config={chartConfig}
						className="mx-auto aspect-square max-h-[360px] max-w-[360px]"
					>
						<PieChart>
							<ChartTooltip
								content={
									<ChartTooltipContent
										nameKey="name"
										formatter={(value, name) => [
											`${value} unit${Number(value) !== 1 ? 's' : ''}`,
											chartConfig[name as keyof typeof chartConfig]?.label ??
												name,
										]}
									/>
								}
								cursor={false}
							/>
							<Pie
								data={chartData}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								innerRadius={50}
								outerRadius={70}
								strokeWidth={5}
								paddingAngle={2}
							>
								{chartData.map((entry) => (
									<Cell key={entry.name} fill={entry.fill} />
								))}
								<Label
									content={({ viewBox }) => {
										if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
											return (
												<text
													dominantBaseline="middle"
													textAnchor="middle"
													x={viewBox.cx}
													y={viewBox.cy}
												>
													<tspan
														className="fill-foreground text-3xl font-bold"
														x={viewBox.cx}
														y={viewBox.cy}
													>
														{total.toLocaleString()}
													</tspan>
													<tspan
														className="fill-muted-foreground"
														x={viewBox.cx}
														y={(viewBox.cy ?? 0) + 24}
													>
														Units
													</tspan>
												</text>
											)
										}
									}}
								/>
							</Pie>
							<ChartLegend
								className="mt-5 flex-wrap justify-center gap-4 *:basis-[45%] *:justify-start"
								content={<ChartLegendContent nameKey="name" />}
							/>
						</PieChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	)
}
