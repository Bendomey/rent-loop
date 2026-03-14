import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
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
import { cn } from '~/lib/utils'
import { AssignDialog } from './assign-dialog'

type MaintenanceKanbanItem = MaintenanceRequest & {
	column: MaintenanceRequestStatus
	name: string
	[key: string]: unknown
}

const PRIORITY_STYLES: Record<MaintenanceRequestPriority, string> = {
	LOW: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
	MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
	HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
	EMERGENCY: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const PRIORITY_LABELS: Record<MaintenanceRequestPriority, string> = {
	LOW: 'Low',
	MEDIUM: 'Medium',
	HIGH: 'High',
	EMERGENCY: 'Emergency',
}

const CATEGORY_LABELS: Record<MaintenanceRequestCategory, string> = {
	PLUMBING: 'Plumbing',
	ELECTRICAL: 'Electrical',
	HVAC: 'HVAC',
	OTHER: 'Other',
}

interface RequestCardProps {
	item: MaintenanceKanbanItem
}

export function RequestCard({ item }: RequestCardProps) {
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
						<p className="line-clamp-2 flex-1 text-sm font-medium leading-snug">
							{item.title}
						</p>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-5 w-5 shrink-0 -mr-1"
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

					<div className="flex items-center gap-1 flex-wrap">
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
								<Avatar className="h-5 w-5" title={`Worker: ${item.assigned_worker?.name}`}>
									<AvatarFallback className="text-[9px]">
										{workerInitials}
									</AvatarFallback>
								</Avatar>
							)}
							{managerInitials && (
								<Avatar className="h-5 w-5" title={`Manager: ${item.assigned_manager?.name}`}>
									<AvatarFallback className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
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
				type={assignType}
			/>
		</>
	)
}
