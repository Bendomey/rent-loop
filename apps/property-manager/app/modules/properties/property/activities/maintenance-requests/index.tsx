import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { PropertyActivitiesMaintenanceRequestsController } from './controller'
import { RequestCard } from './request-card'
import {
	useCreateMaintenanceRequestComment,
	useGetMaintenanceRequestsInfinite,
	useUpdateMaintenanceRequestStatus,
} from '~/api/maintenance-requests'
import type { DragEndEvent } from '~/components/kanban'
import {
	KanbanBoard,
	KanbanCards,
	KanbanHeader,
	KanbanProvider,
} from '~/components/kanban'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { Textarea } from '~/components/ui/textarea'
import { TypographyH3, TypographyMuted } from '~/components/ui/typography'
import { useTour } from '~/hooks/use-tour'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { MAINTENANCE_LIST_TOUR_STEPS, TOUR_KEYS } from '~/lib/tours'
import { cn } from '~/lib/utils'
import { useProperty } from '~/providers/property-provider'

type MaintenanceKanbanItem = MaintenanceRequest & {
	column: MaintenanceRequestStatus
	name: string
	[key: string]: unknown
}

const COLUMNS: Array<{
	id: MaintenanceRequestStatus
	name: string
	color: string
}> = [
	{ id: 'NEW', name: 'New', color: '#6B7280' },
	{ id: 'IN_PROGRESS', name: 'In Progress', color: '#F59E0B' },
	{ id: 'IN_REVIEW', name: 'In Review', color: '#3B82F6' },
	{ id: 'RESOLVED', name: 'Resolved', color: '#10B981' },
	{ id: 'CANCELED', name: 'Canceled', color: '#EF4444' },
]

const toKanbanItem = (req: MaintenanceRequest): MaintenanceKanbanItem => ({
	...req,
	name: req.title,
	column: req.status,
})

const flattenPages = (
	pages:
		| Array<FetchMultipleDataResponse<MaintenanceRequest> | undefined>
		| undefined,
): MaintenanceRequest[] => (pages ?? []).flatMap((p) => p?.rows ?? [])

interface PendingStatusChange {
	item: MaintenanceKanbanItem
	targetColumn: MaintenanceRequestStatus
}

export function PropertyActivitiesMaintenanceRequestsModule() {
	const { clientUserProperty } = useProperty()
	const queryClient = useQueryClient()
	const propertyId = safeString(clientUserProperty?.property?.id)
	const [searchParams] = useSearchParams()

	const { startTour, hasCompletedTour } = useTour(
		TOUR_KEYS.MAINTENANCE_LIST,
		MAINTENANCE_LIST_TOUR_STEPS,
	)

	useEffect(() => {
		if (!hasCompletedTour()) startTour()
	}, [hasCompletedTour, startTour])

	const isDraggingRef = useRef(false)

	// Read active filter values from URL
	const priority = searchParams.get('priority') ?? undefined
	const category = searchParams.get('category') ?? undefined
	const assignedWorkerId = searchParams.get('assigned_worker') ?? undefined
	const assignedManagerId = searchParams.get('assigned_manager') ?? undefined
	const unitId = searchParams.get('unit') ?? undefined

	const columnParams = (status: MaintenanceRequestStatus) => ({
		filters: {
			status,
			priority: priority as MaintenanceRequestPriority | undefined,
			category: category as MaintenanceRequestCategory | undefined,
			assigned_worker_id: assignedWorkerId,
			assigned_manager_id: assignedManagerId,
			unit_id: unitId,
		},
		pagination: { page: 1, per: 50 },
		populate: ['Unit', 'AssignedWorker', 'AssignedManager'],
	})

	const newQuery = useGetMaintenanceRequestsInfinite(
		propertyId,
		columnParams('NEW'),
	)
	const inProgressQuery = useGetMaintenanceRequestsInfinite(
		propertyId,
		columnParams('IN_PROGRESS'),
	)
	const inReviewQuery = useGetMaintenanceRequestsInfinite(
		propertyId,
		columnParams('IN_REVIEW'),
	)
	const resolvedQuery = useGetMaintenanceRequestsInfinite(
		propertyId,
		columnParams('RESOLVED'),
	)
	const canceledQuery = useGetMaintenanceRequestsInfinite(
		propertyId,
		columnParams('CANCELED'),
	)

	const columnQueries: Record<
		MaintenanceRequestStatus,
		ReturnType<typeof useGetMaintenanceRequestsInfinite>
	> = {
		NEW: newQuery,
		IN_PROGRESS: inProgressQuery,
		IN_REVIEW: inReviewQuery,
		RESOLVED: resolvedQuery,
		CANCELED: canceledQuery,
	}

	const serverData = useMemo(
		() => [
			...flattenPages(newQuery.data?.pages).map(toKanbanItem),
			...flattenPages(inProgressQuery.data?.pages).map(toKanbanItem),
			...flattenPages(inReviewQuery.data?.pages).map(toKanbanItem),
			...flattenPages(resolvedQuery.data?.pages).map(toKanbanItem),
			...flattenPages(canceledQuery.data?.pages).map(toKanbanItem),
		],

		[
			newQuery.data,
			inProgressQuery.data,
			inReviewQuery.data,
			resolvedQuery.data,
			canceledQuery.data,
		],
	)

	const [localData, setLocalData] =
		useState<MaintenanceKanbanItem[]>(serverData)

	useEffect(() => {
		if (!isDraggingRef.current) {
			setLocalData(serverData)
		}
	}, [serverData])

	const [pendingChange, setPendingChange] =
		useState<PendingStatusChange | null>(null)
	const [statusNote, setStatusNote] = useState('')

	const updateStatus = useUpdateMaintenanceRequestStatus()
	const createComment = useCreateMaintenanceRequestComment()

	const invalidateColumns = (...statuses: MaintenanceRequestStatus[]) => {
		for (const status of statuses) {
			void queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS, columnParams(status)],
			})
		}
	}

	const handleDragStart = () => {
		isDraggingRef.current = true
	}

	const handleDragEnd = (event: DragEndEvent) => {
		isDraggingRef.current = false

		const { active, over } = event
		if (!over) return

		const draggedItem = localData.find((item) => item.id === active.id)
		if (!draggedItem) return

		const targetColumn =
			localData.find((item) => item.id === over.id)?.column ??
			(over.id as MaintenanceRequestStatus)

		if (draggedItem.status === targetColumn) return

		if (targetColumn === 'RESOLVED' || targetColumn === 'CANCELED') {
			setPendingChange({ item: draggedItem, targetColumn })
			setStatusNote('')
			return
		}

		updateStatus.mutate(
			{ id: draggedItem.id, property_id: propertyId, status: targetColumn },
			{
				onError: (err) => {
					toast.error(
						err instanceof Error ? err.message : 'Failed to update status',
					)
					invalidateColumns(draggedItem.status, targetColumn)
				},
				onSuccess: () => invalidateColumns(draggedItem.status, targetColumn),
			},
		)
	}

	const handleConfirm = async () => {
		if (!pendingChange) return
		const { item, targetColumn } = pendingChange
		const isCanceled = targetColumn === 'CANCELED'
		const note = statusNote.trim()

		if (isCanceled && !note) {
			toast.error('Please provide a cancellation reason')
			return
		}

		try {
			await updateStatus.mutateAsync({
				id: item.id,
				property_id: propertyId,
				status: targetColumn,
				cancellation_reason: isCanceled ? note || undefined : undefined,
			})
			if (note) {
				await createComment.mutateAsync({
					id: item.id,
					property_id: propertyId,
					content: note,
				})
			}
			invalidateColumns(item.status, targetColumn)
			setPendingChange(null)
			setStatusNote('')
			toast.success('Status updated')
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to update status',
			)
		}
	}

	const handleDialogClose = (open: boolean) => {
		if (!open && pendingChange) {
			setLocalData((prev) =>
				prev.map((it) =>
					it.id === pendingChange.item.id
						? { ...it, column: pendingChange.item.status }
						: it,
				),
			)
			setPendingChange(null)
			setStatusNote('')
		}
	}

	const handleScrollEnd = (status: MaintenanceRequestStatus) => {
		const query = columnQueries[status]
		if (query.hasNextPage && !query.isFetchingNextPage) {
			void query.fetchNextPage()
		}
	}

	const isCanceled = pendingChange?.targetColumn === 'CANCELED'
	const isConfirming = updateStatus.isPending || createComment.isPending

	return (
		<>
			<Dialog open={!!pendingChange} onOpenChange={handleDialogClose}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{isCanceled ? 'Cancel request' : 'Resolve request'}
						</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-2">
						<TypographyMuted className="text-sm">
							{isCanceled
								? 'Provide a reason for cancellation.'
								: 'Add an optional note about the resolution.'}
						</TypographyMuted>
						<Textarea
							placeholder={
								isCanceled
									? 'Cancellation reason...'
									: 'Resolution notes (optional)...'
							}
							value={statusNote}
							onChange={(e) => setStatusNote(e.target.value)}
							rows={3}
							className="min-h-44 resize-none"
							autoFocus
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => handleDialogClose(false)}
							disabled={isConfirming}
						>
							Cancel
						</Button>
						<Button
							variant={isCanceled ? 'destructive' : 'default'}
							onClick={handleConfirm}
							disabled={isConfirming || (isCanceled && !statusNote.trim())}
							className={cn({
								'bg-green-600 text-white hover:bg-green-700': !isCanceled,
							})}
						>
							{isConfirming
								? 'Saving...'
								: isCanceled
									? 'Cancel request'
									: 'Mark as resolved'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<div className="flex h-full flex-col">
				<div className="m-5 flex shrink-0 flex-col gap-3">
					<div
						id="maintenance-list-header"
						className="flex items-center justify-between"
					>
						<TypographyH3>Maintenance Requests</TypographyH3>
						<PropertyPermissionGuard roles={['MANAGER']}>
							<Button asChild>
								<Link
									to={`/properties/${propertyId}/activities/maintenance-requests/new`}
								>
									<Plus className="size-4" />
									Add Request
								</Link>
							</Button>
						</PropertyPermissionGuard>
					</div>
					<div id="maintenance-filters">
						<PropertyActivitiesMaintenanceRequestsController />
					</div>
				</div>

				<div className="relative min-h-0 flex-1">
					<div
						id="maintenance-kanban"
						className="absolute inset-0 mb-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					>
						<KanbanProvider
							columns={COLUMNS}
							data={localData}
							onDataChange={setLocalData}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
						>
							{(column) => {
								const query = columnQueries[column.id]
								return (
									<KanbanBoard id={column.id} key={column.id}>
										<KanbanHeader>
											<div className="flex items-center gap-2">
												<div
													className="h-2 w-2 rounded-full"
													style={{ backgroundColor: column.color }}
												/>
												<span>{column.name}</span>
												<span className="text-muted-foreground ml-auto text-xs font-normal">
													{query.data?.pages[0]?.meta?.total ?? 0}
												</span>
											</div>
										</KanbanHeader>
										<KanbanCards
											id={column.id}
											onScrollEnd={() => handleScrollEnd(column.id)}
										>
											{(item: MaintenanceKanbanItem) => (
												<RequestCard
													key={item.id}
													item={item}
													propertyId={propertyId}
												/>
											)}
										</KanbanCards>
										{query.isFetchingNextPage && (
											<div className="flex justify-center py-2">
												<Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
											</div>
										)}
									</KanbanBoard>
								)
							}}
						</KanbanProvider>
					</div>
				</div>
			</div>
		</>
	)
}
