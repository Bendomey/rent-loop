import { TrendingDown, TrendingUp } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'

type TrendDirection = 'up' | 'down'

interface RentPaymentStatCardProps {
	title: string
	value: string | number
	description: string
	trend?: {
		direction: TrendDirection
		value: string
	}
}

export function StatCard({
	title,
	value,
	description,
	trend,
}: RentPaymentStatCardProps) {
	const isUp = trend?.direction === 'up'

	return (
		<Card className="hover:from-primary/10 @container/card gap-3 py-4 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg">
			<CardHeader>
				<CardDescription>{title}</CardDescription>

				<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
					{value}
				</CardTitle>

				{trend && (
					<CardAction>
						<Badge
							variant="outline"
							className={`gap-1 ${isUp ? 'text-emerald-600' : 'text-red-600'}`}
						>
							{isUp ? (
								<TrendingUp className="h-4 w-4" />
							) : (
								<TrendingDown className="h-4 w-4" />
							)}
							{trend.value}
						</Badge>
					</CardAction>
				)}
			</CardHeader>

			<CardFooter className="text-muted-foreground text-xs">
				{description}
			</CardFooter>
		</Card>
	)
}
