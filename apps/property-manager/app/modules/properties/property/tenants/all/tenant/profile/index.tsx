import { Filter } from 'lucide-react'
import ActivityFeed from './activity-feed'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'

export function TenantProfileModule() {
	return (
		<div className="mt-3 space-y-3">
			<div className="grid grid-cols-3 gap-2">
				<Card className="@container/card shadow-none">
					<CardHeader>
						<CardDescription>Total Leases</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
							1
						</CardTitle>
					</CardHeader>
				</Card>
				<Card className="@container/card shadow-none">
					<CardHeader>
						<CardDescription>Total Payments</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
							GHS1,250.00
						</CardTitle>
					</CardHeader>
				</Card>
				<Card className="@container/card shadow-none">
					<CardHeader>
						<CardDescription>Total Requests</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
							10
						</CardTitle>
					</CardHeader>
				</Card>
			</div>
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						Activity log
					</CardTitle>
					<CardAction>
						<Button variant="ghost" size="icon">
							<Filter className="h-4 w-4" />
						</Button>
					</CardAction>
				</CardHeader>
				<CardContent className="h-[50vh] overflow-y-auto">
					<ActivityFeed />
				</CardContent>
			</Card>
		</div>
	)
}
