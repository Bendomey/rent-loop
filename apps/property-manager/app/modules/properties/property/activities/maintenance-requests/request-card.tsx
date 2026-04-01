import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { AssignDialog } from './assign-dialog'
import { KanbanCard } from '~/components/kanban'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
	CATEGORY_LABELS,
	PRIORITY_LABELS,
	PRIORITY_STYLES,
} from '~/lib/maintenance-request.utils'
import { cn } from '~/lib/utils'

type MaintenanceKanbanItem = MaintenanceRequest & {
	column: MaintenanceRequestStatus
	name: string
	[key: string]: unknown
}

interface RequestCardProps {
	item: MaintenanceKanbanItem
	propertyId: string
}

export function RequestCard({ item, propertyId }: RequestCardProps) {
	const [assignDialogOpen, setAssignDialogOpen] = useState(false)
	const [assignType, setAssignType] = useState<'worker' | 'manager'>('worker')

	const openAssign = (type: 'worker' | 'manager') => {
		setAssignType(type)
		setAssignDialogOpen(true)
	}

	const workerInitials = item.assigned_worker?.name?.slice(0, 2).toUpperCase()
	const managerInitials = item.assigned_manager?.name?.slice(0, 2).toUpperCase()

	return (
		<>
			<KanbanCard column={item.column} id={item.id} name={item.name}>
				<div className="flex flex-col gap-2">
					<div className="flex items-start justify-between gap-1">
						<Link
							to={`/properties/${propertyId}/activities/maintenance-requests/${item.id}`}
							className="flex min-w-0 flex-col gap-0.5"
							onClick={(e) => e.stopPropagation()}
						>
							<p className="text-muted-foreground text-[10px] font-medium">
								#{item.code}
							</p>
							<p className="line-clamp-2 text-sm leading-snug font-medium hover:underline">
								{item.title}
							</p>
						</Link>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="-mr-1 h-5 w-5 shrink-0"
								>
									<MoreHorizontal className="h-3 w-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => openAssign('worker')}>
									Assign Worker
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => openAssign('manager')}>
									Assign Manager
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="flex flex-wrap items-center gap-1">
						<Badge
							variant="outline"
							className={cn(
								'border-0 px-1.5 py-0 text-[10px] font-medium',
								PRIORITY_STYLES[item.priority],
							)}
						>
							{PRIORITY_LABELS[item.priority]}
						</Badge>
						<Badge
							variant="outline"
							className="px-1.5 py-0 text-[10px] font-normal"
						>
							{CATEGORY_LABELS[item.category]}
						</Badge>
					</div>

					{(workerInitials || managerInitials) && (
						<div className="flex items-center gap-1">
							{workerInitials && (
								<Avatar
									className="h-5 w-5"
									title={`Worker: ${item.assigned_worker?.name}`}
								>
									<AvatarFallback className="text-[9px]">
										{workerInitials}
									</AvatarFallback>
								</Avatar>
							)}
							{managerInitials && (
								<Avatar
									className="h-5 w-5"
									title={`Manager: ${item.assigned_manager?.name}`}
								>
									<AvatarFallback className="bg-blue-100 text-[9px] text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
										{managerInitials}
									</AvatarFallback>
								</Avatar>
							)}
						</div>
					)}
				</div>
			</KanbanCard>

			<AssignDialog
				open={assignDialogOpen}
				onOpenChange={setAssignDialogOpen}
				requestId={item.id}
				propertyId={propertyId}
				type={assignType}
			/>
		</>
	)
}
