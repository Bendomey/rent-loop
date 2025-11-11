import { Label, Pie, PieChart, ResponsiveContainer } from 'recharts'
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '~/components/ui/chart'
import { TypographyH3 } from '~/components/ui/typography'

const chartData = [
	{ name: 'occupied', units: 395, fill: '#3b82f6' },
	{ name: 'booked', units: 82, fill: '#f59e0b' },
	{ name: 'vacant', units: 154, fill: '#9ca3af' },
	{ name: 'maintenance', units: 53, fill: '#ef4444' },
]

const chartConfig = {
	units: {
		label: 'Units',
	},
	occupied: {
		label: 'Occupied',
		color: '#3b82f6',
	},
	booked: {
		label: 'Booked',
		color: '#f59e0b',
	},
	vacant: {
		label: 'Vacant',
		color: '#9ca3af',
	},
	maintenance: {
		label: 'Maintenance',
		color: '#ef4444',
	},
} satisfies ChartConfig

export function PropertyUnitsChart() {
	return (
		<div className="bg-background w-full max-w-xl rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md">
			<TypographyH3 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-100">
				Unit Distribution
			</TypographyH3>
			<ChartContainer
				className="mx-auto aspect-square max-h-[320px]"
				config={chartConfig}
			>
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<ChartTooltip
							content={<ChartTooltipContent hideLabel />}
							cursor={false}
						/>
						<Pie
							data={chartData}
							dataKey="units"
							innerRadius={60}
							nameKey="name"
							strokeWidth={5}
							outerRadius={90}
						>
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
													{chartData
														.reduce((acc, curr) => acc + curr.units, 0)
														.toLocaleString()}
												</tspan>
												<tspan
													className="fill-muted-foreground"
													x={viewBox.cx}
													y={(viewBox.cy || 0) + 24}
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
				</ResponsiveContainer>
			</ChartContainer>
		</div>
	)
}
