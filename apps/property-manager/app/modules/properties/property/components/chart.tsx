import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
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
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'

const chartData = [
	{ month: 'January', income: 28186, expenses: 180 },
	{ month: 'February', income: 53305, expenses: 18200 },
	{ month: 'March', income: 42037, expenses: 51200 },
	{ month: 'April', income: 52730, expenses: 21190 },
	{ month: 'May', income: 42090, expenses: 1130 },
	{ month: 'June', income: 52140, expenses: 20140 },
	{ month: 'July', income: 42140, expenses: 3140 },
	{ month: 'August', income: 31640, expenses: 50140 },
	{ month: 'September', income: 60000, expenses: 10140 },
]
const chartConfig = {
	income: {
		label: 'Income',
		color: '#3b82f6', // Tailwind blue-500
	},
	expenses: {
		label: 'Expenses',
		color: '#ef4444', // Tailwind red-500
	},
}

export function PropertyChartBar() {
	const [timeRange, setTimeRange] = useState('90d')

	return (
		<div className="bg-background flex w-full flex-col rounded-2xl p-4 shadow-sm transition-all duration-300 ease-in-out hover:shadow-md">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div>
					<h3 className="text-lg font-semibold">Total Revenue</h3>
					<p className="text-muted-foreground text-sm">
						January – September 2025
					</p>
				</div>

				<div className="flex items-center gap-3">
					<ToggleGroup
						type="single"
						value={timeRange}
						onValueChange={setTimeRange}
						variant="outline"
						className="hidden md:flex"
					>
						<ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
						<ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
						<ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
					</ToggleGroup>

					<Select value={timeRange} onValueChange={setTimeRange}>
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
				<ChartContainer config={chartConfig} className="h-full w-full">
					<BarChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="month"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							tickFormatter={(value) => value.slice(0, 3)}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							tickFormatter={(value: number) => `₵${value.toLocaleString()}`}
						/>
						<ChartTooltip
							cursor={false}
							formatter={(value: unknown) =>
								typeof value === 'number'
									? `₵${value.toLocaleString()}`
									: `₵${String(value)}`
							}
							content={<ChartTooltipContent indicator="dashed" />}
						/>
						<ChartLegend content={<ChartLegendContent />} />
						<Bar dataKey="income" fill="#3b82f6" radius={4} barSize={20} />
						<Bar dataKey="expenses" fill="#ef4444" radius={4} barSize={20} />
					</BarChart>
				</ChartContainer>
			</div>
		</div>
	)
}
