import { Filter } from 'lucide-react'
import ActivityFeed from './activity-feed'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'

export function TenantActivityLogsModule() {
	return (
		<div className="mt-3 space-y-3">
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
				<CardContent className="h-[68vh] overflow-y-auto">
					<ActivityFeed />
				</CardContent>
			</Card>
		</div>
	)
}
