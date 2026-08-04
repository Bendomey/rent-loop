import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
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
	ChartTooltip,
	ChartTooltipContent,
} from '~/components/ui/chart'
import { Skeleton } from '~/components/ui/skeleton'

export interface TrendPoint {
	period: string
	value: number
}

/**
 * Single-series bar trend. The card title names the series, so no legend is
 * rendered; identity is never color-alone.
 */
export function TrendChart({
	title,
	description,
	data,
	isPending,
	valueFormatter = (value) => value.toLocaleString(),
	emptyMessage = 'No data for this period',
}: {
	title: string
	description?: string
	data: TrendPoint[]
	isPending: boolean
	valueFormatter?: (value: number) => string
	emptyMessage?: string
}) {
	const hasData = data.length > 0 && data.some((point) => point.value !== 0)
	const config = {
		value: { label: title, color: 'var(--color-primary)' },
	} satisfies ChartConfig

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description ? <CardDescription>{description}</CardDescription> : null}
			</CardHeader>
			<CardContent>
				{isPending ? (
					<Skeleton className="h-[220px] w-full rounded-lg" />
				) : !hasData ? (
					<div className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
						{emptyMessage}
					</div>
				) : (
					<ChartContainer config={config} className="h-[220px] w-full">
						<BarChart accessibilityLayer data={data}>
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
								width={60}
								tickFormatter={(value: number) => valueFormatter(value)}
							/>
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										formatter={(value) => valueFormatter(Number(value))}
									/>
								}
							/>
							<Bar dataKey="value" fill="var(--color-primary)" radius={8} />
						</BarChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	)
}
