import { Cell, Pie, PieChart } from 'recharts'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
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

interface UnitRow {
	'Units.occupiedCount': string | null
	'Units.availableCount': string | null
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
} satisfies ChartConfig

export function UnitsChart() {
	const { data: token } = useGetAnalyticsToken()

	const unitsQuery = useCubeQuery<UnitRow>(
		token,
		['units-distribution'],
		{
			measures: [
				'Units.occupiedCount',
				'Units.availableCount',
				'Units.maintenanceCount',
				'Units.draftCount',
				'Units.count',
			],
		},
	)

	const row = unitsQuery.data?.[0]

	const occupied = Number(row?.['Units.occupiedCount'] ?? 0)
	const available = Number(row?.['Units.availableCount'] ?? 0)
	const maintenance = Number(row?.['Units.maintenanceCount'] ?? 0)
	const draft = Number(row?.['Units.draftCount'] ?? 0)
	const total = Number(row?.['Units.count'] ?? 0)

	const chartData = [
		{ name: 'occupied', value: occupied, fill: 'var(--chart-1)' },
		{ name: 'available', value: available, fill: 'var(--chart-2)' },
		{ name: 'maintenance', value: maintenance, fill: 'var(--chart-3)' },
		{ name: 'draft', value: draft, fill: 'var(--chart-4)' },
	].filter((d) => d.value > 0)

	const hasData = chartData.length > 0

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>Unit Status Distribution</CardTitle>
				<CardDescription>Breakdown of all units by current status</CardDescription>
			</CardHeader>
			<CardContent>
				{unitsQuery.isPending ? (
					<div className="flex items-center justify-center">
						<Skeleton className="h-[200px] w-[200px] rounded-full" />
					</div>
				) : !hasData ? (
					<div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
						No unit data available
					</div>
				) : (
					<ChartContainer config={chartConfig} className="mx-auto max-h-[250px]">
						<PieChart>
							<ChartTooltip
								content={
									<ChartTooltipContent
										nameKey="name"
										formatter={(value, name) => [
											`${value} unit${Number(value) !== 1 ? 's' : ''}`,
											chartConfig[name as keyof typeof chartConfig]?.label ?? name,
										]}
									/>
								}
							/>
							<Pie
								data={chartData}
								dataKey="value"
								nameKey="name"
								cx="50%"
								cy="50%"
								innerRadius={60}
								outerRadius={90}
								paddingAngle={2}
							>
								{chartData.map((entry) => (
									<Cell key={entry.name} fill={entry.fill} />
								))}
							</Pie>
							<ChartLegend content={<ChartLegendContent nameKey="name" />} />
						</PieChart>
					</ChartContainer>
				)}
			</CardContent>
			<CardFooter className="text-muted-foreground flex justify-center text-sm">
				{total > 0
					? `${total} total unit${total !== 1 ? 's' : ''} across all properties`
					: 'No units yet'}
			</CardFooter>
		</Card>
	)
}
