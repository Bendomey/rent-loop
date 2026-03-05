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

export function RentPaymentSectionCards() {
	return (
		<div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
			{/* Total Rental Income */}
			<Card className="hover:from-primary/10 @container/card gap-3 py-4 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg">
				<CardHeader>
					<CardDescription>Rental Received</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						$1,250
					</CardTitle>
					<CardAction>
						<Badge variant="outline" className="gap-1 text-emerald-600">
							<TrendingUp className="h-4 w-4" />
							+12.5%
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					Compared to last month
				</CardFooter>
			</Card>

			{/* Upcoming Payments */}
			<Card className="hover:from-primary/10 @container/card gap-3 py-4 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg">
				<CardHeader>
					<CardDescription>Upcoming Payments</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						1,234
					</CardTitle>
					<CardAction>
						<Badge variant="outline" className="gap-1 text-red-600">
							<TrendingDown className="h-4 w-4" />
							-20%
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					Payments expected this month
				</CardFooter>
			</Card>

			{/* Maintenance Requests */}
			<Card className="hover:from-primary/10 @container/card gap-3 py-4 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg">
				<CardHeader>
					<CardDescription>Overdue Payments</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						45,678
					</CardTitle>
					<CardAction>
						<Badge variant="outline" className="gap-1 text-emerald-600">
							<TrendingUp className="h-4 w-4" />
							+12.5%
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					Outstanding balances past due date
				</CardFooter>
			</Card>

			{/* Growth Rate */}
			<Card className="hover:from-primary/10 @container/card gap-3 py-4 transition-all duration-300 ease-out hover:-translate-y-[2px] hover:scale-[1.02] hover:shadow-lg">
				<CardHeader>
					<CardDescription>Total Expense</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						4.5%
					</CardTitle>
					<CardAction>
						<Badge variant="outline" className="gap-1 text-emerald-600">
							<TrendingUp className="h-4 w-4" />
							+4.5%
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					Maintenance and operational costs
				</CardFooter>
			</Card>
		</div>
	)
}
