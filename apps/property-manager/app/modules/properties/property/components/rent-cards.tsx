import { TrendingDown, TrendingUp } from 'lucide-react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Badge } from '~/components/ui/badge'
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '~/components/ui/chart'
import { TypographyH4 } from '~/components/ui/typography'

const chartData = [
	{ month: 'January', desktop: 186 },
	{ month: 'February', desktop: 305 },
	{ month: 'March', desktop: 237 },
	{ month: 'April', desktop: 73 },
	{ month: 'May', desktop: 209 },
	{ month: 'June', desktop: 214 },
]

const chartConfig = {
	desktop: {
		label: 'Desktop',
		color: 'var(--chart-1)',
	},
}

const cards = [
	{
		label: 'Rent Received',
		value: '$1,250.00',
		change: '+12.5%',
		trend: 'up',
		color: 'text-emerald-600',
	},
	{
		label: 'Total Overdue',
		value: '$1,234.00',
		change: '-20%',
		trend: 'down',
		color: 'text-red-600',
	},
	{
		label: 'Maintenance Cost',
		value: '45,678',
		change: '+12.5%',
		trend: 'up',
		color: 'text-emerald-600',
	},
]

export function PropertyRentIncomeCards() {
	return (
		<div>
			<TypographyH4 className="mb-4">Rent Income Overview</TypographyH4>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-8 xl:grid-cols-8">
				<div className="flex flex-col gap-4 lg:col-span-3 lg:justify-between lg:gap-0 xl:col-span-3 xl:justify-between xl:gap-0">
					{cards.map((card, i) => (
						<Card
							key={i}
							className="from-primary/5 to-card dark:from-primary/10 bg-gradient-to-t px-3 py-2"
						>
							<CardHeader className="gap-y-2 p-2">
								<CardDescription className="text-xs">
									{card.label}
								</CardDescription>
								<CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl">
									{card.value}
								</CardTitle>
								<CardAction>
									<Badge
										variant="outline"
										className={`gap-1 px-1.5 py-0.5 text-[10px] ${card.color}`}
									>
										{card.trend === 'up' ? (
											<TrendingUp className="h-3.5 w-3.5" />
										) : (
											<TrendingDown className="h-3.5 w-3.5" />
										)}
										{card.change}
									</Badge>
								</CardAction>
							</CardHeader>
						</Card>
					))}
				</div>

				<div className="bg-card rounded-lg border p-4 shadow-sm transition-all hover:shadow-md lg:col-span-5 xl:col-span-5">
					<div className="mb-4 text-center">
						<h3 className="text-lg font-semibold">Rental Income Trend</h3>
						<p className="text-muted-foreground text-sm">January – June 2024</p>
					</div>
					<div className="h-[230px]">
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
									tickFormatter={(value) => value.slice(0, 3)}
								/>
								<YAxis
									tickLine={false}
									axisLine={false}
									tickFormatter={(value: number) =>
										`₵${value.toLocaleString()}`
									}
								/>
								<ChartTooltip
									cursor={false}
									content={<ChartTooltipContent hideLabel />}
								/>
								<Line
									dataKey="desktop"
									type="natural"
									stroke="var(--color-desktop)"
									strokeWidth={2}
									dot={false}
								/>
							</LineChart>
						</ChartContainer>
					</div>
				</div>
			</div>
		</div>
	)
}
