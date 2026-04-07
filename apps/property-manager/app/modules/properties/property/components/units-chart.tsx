import { Cell, Pie, PieChart, Label } from 'recharts'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '~/components/ui/chart'
import { Skeleton } from '~/components/ui/skeleton'
import { TypographyH3 } from '~/components/ui/typography'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface UnitRow {
	'Units.occupiedCount': string | null
	'Units.availableCount': string | null
	'Units.maintenanceCount': string | null
	'Units.draftCount': string | null
	'Units.count': string | null
}

const chartConfig = {
	occupied: { label: 'Occupied', color: 'var(--chart-1)' },
	available: { label: 'Available', color: 'var(--chart-2)' },
	maintenance: { label: 'Maintenance', color: 'var(--chart-3)' },
	draft: { label: 'Draft', color: 'var(--chart-4)' },
} satisfies ChartConfig

interface Props {
	propertyId: string
}

export function PropertyUnitsChart({ propertyId }: Props) {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)

	const unitsQuery = useCubeQuery<UnitRow>(
		token,
		['prop-units-distribution', propertyId],
		{
			measures: [
				'Units.occupiedCount',
				'Units.availableCount',
				'Units.maintenanceCount',
				'Units.draftCount',
				'Units.count',
			],
			filters: [
				{
					member: 'Units.propertyId',
					operator: 'equals',
					values: [propertyId],
				},
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
		<div className="bg-background w-full max-w-xl rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md">
			<TypographyH3 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
				Unit Distribution
			</TypographyH3>

			{unitsQuery.isPending ? (
				<div className="flex items-center justify-center">
					<Skeleton className="h-[280px] w-[280px] rounded-full" />
				</div>
			) : !hasData ? (
				<div className="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
					No unit data available
				</div>
			) : (
				<ChartContainer
					className="mx-auto aspect-square max-h-[320px]"
					config={chartConfig}
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
							innerRadius={60}
							outerRadius={90}
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
							className="mt-3 flex-wrap justify-center gap-3 *:basis-[45%] *:justify-start"
							content={<ChartLegendContent nameKey="name" />}
						/>
					</PieChart>
				</ChartContainer>
			)}
		</div>
	)
}
