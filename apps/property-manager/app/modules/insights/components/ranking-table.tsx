import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'

export interface RankingRow {
	id: string
	name: string
	value: number
}

export function RankingTable({
	title,
	description,
	rows,
	isPending,
	valueLabel = 'Value',
	valueFormatter = (value) => value.toLocaleString(),
	emptyMessage = 'No data for this period',
}: {
	title: string
	description?: string
	rows: RankingRow[]
	isPending: boolean
	valueLabel?: string
	valueFormatter?: (value: number) => string
	emptyMessage?: string
}) {
	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description ? <CardDescription>{description}</CardDescription> : null}
			</CardHeader>
			<CardContent>
				{isPending ? (
					<Skeleton className="h-40 w-full rounded-lg" />
				) : rows.length === 0 ? (
					<div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
						{emptyMessage}
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10">#</TableHead>
								<TableHead>Property</TableHead>
								<TableHead className="text-right">{valueLabel}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row, index) => (
								<TableRow key={row.id}>
									<TableCell className="text-muted-foreground">
										{index + 1}
									</TableCell>
									<TableCell className="font-medium">{row.name}</TableCell>
									<TableCell className="text-right tabular-nums">
										{valueFormatter(row.value)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	)
}
