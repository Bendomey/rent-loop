import type { ReactNode } from 'react'
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'

export function KpiCard({
	label,
	value,
	isPending,
	badge,
	footer,
}: {
	label: string
	value: ReactNode
	isPending: boolean
	badge?: ReactNode
	footer?: ReactNode
}) {
	return (
		<Card className="@container/card shadow-none">
			<CardHeader>
				<CardDescription>{label}</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{isPending ? <Skeleton className="h-8 w-24" /> : value}
				</CardTitle>
				{badge ? <CardAction>{badge}</CardAction> : null}
			</CardHeader>
			{footer ? (
				<CardFooter className="text-muted-foreground text-sm">
					{footer}
				</CardFooter>
			) : null}
		</Card>
	)
}
