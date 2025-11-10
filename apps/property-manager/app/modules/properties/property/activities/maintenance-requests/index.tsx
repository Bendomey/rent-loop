import { Plus } from 'lucide-react'
import { useState } from 'react'
import {
	KanbanBoard,
	KanbanCard,
	KanbanCards,
	KanbanHeader,
	KanbanProvider,
} from '~/components/kanban'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { TypographyH3 } from '~/components/ui/typography'
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
const columns = [
	{ id: '1', name: 'New', color: '#6B7280' },
	{ id: '2', name: 'In Progress', color: '#F59E0B' },
	{ id: '3', name: 'In Review', color: '#3B82F6' },
	{ id: '4', name: 'Resolved', color: '#10B981' },
	{ id: '5', name: 'Canceled', color: '#EF4444' },
]
const users = Array.from({ length: 4 })
	.fill(null)
	.map(() => ({
		id: '' + Math.random().toString(36).substr(2, 9),
		name: capitalize(
			['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'][
				Math.floor(Math.random() * 6)
			]!,
		),
		image: `https://i.pravatar.cc/150?u=${Math.random().toString(36).substr(2, 9)}`,
	}))
const exampleFeatures = Array.from({ length: 20 })
	.fill(null)
	.map(() => ({
		id: '' + Math.random().toString(36).substr(2, 9),
		name: [
			'Fix leaky faucet',
			'Replace broken window',
			'Repair HVAC system',
			'Paint living room',
			'Clean gutters',
			'Service lawn mower',
			'Inspect roof',
			'Upgrade insulation',
			'Install new lighting',
			'Fix door lock',
		][Math.floor(Math.random() * 10)]!,
		startAt: new Date(),
		endAt: new Date(new Date().setMonth(new Date().getMonth() + 6)),
		column: columns[Math.floor(Math.random() * columns.length)]?.id!,
		owner: users[Math.floor(Math.random() * users.length)],
	}))
const dateFormatter = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
})
const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
	month: 'short',
	day: 'numeric',
})

export function PropertyActivitiesMaintenanceRequestsModule() {
	const [features, setFeatures] = useState(exampleFeatures)
	return (
		<div className="w-full overflow-auto p-5">
			<div className="mb-5 flex items-center justify-between">
				<div>
					<TypographyH3>Maintenance Requests</TypographyH3>
				</div>
				<div>
					<Button>
						<Plus className="size-4" />
						Add Request
					</Button>
				</div>
			</div>
			<KanbanProvider
				columns={columns}
				data={features}
				onDataChange={setFeatures}
			>
				{(column) => (
					<KanbanBoard id={column.id} key={column.id}>
						<KanbanHeader>
							<div className="flex items-center gap-2">
								<div
									className="h-2 w-2 rounded-full"
									style={{ backgroundColor: column.color }}
								/>
								<span>{column.name}</span>
							</div>
						</KanbanHeader>
						<KanbanCards id={column.id}>
							{(feature: (typeof features)[number]) => (
								<KanbanCard
									column={column.id}
									id={feature.id}
									key={feature.id}
									name={feature.name}
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex flex-col gap-1">
											<p className="m-0 flex-1 text-sm font-medium">
												{feature.name}
											</p>
										</div>
										{feature.owner && (
											<Avatar className="h-4 w-4 shrink-0">
												<AvatarImage src={feature.owner.image} />
												<AvatarFallback>
													{feature.owner.name?.slice(0, 2)}
												</AvatarFallback>
											</Avatar>
										)}
									</div>
									<p className="text-muted-foreground m-0 text-xs">
										{shortDateFormatter.format(feature.startAt)} -{' '}
										{dateFormatter.format(feature.endAt)}
									</p>
								</KanbanCard>
							)}
						</KanbanCards>
					</KanbanBoard>
				)}
			</KanbanProvider>
		</div>
	)
}
