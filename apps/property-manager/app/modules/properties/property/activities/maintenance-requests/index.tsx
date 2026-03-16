import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { RequestCard } from './request-card'
import {
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
import { Button } from '~/components/ui/button'
import { TypographyH3 } from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { safeString } from '~/lib/strings'
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

export function PropertyActivitiesMaintenanceRequestsModule() {
	const { clientUserProperty } = useProperty()
	const queryClient = useQueryClient()
	const propertyId = safeString(clientUserProperty?.property?.id)

	const isDraggingRef = useRef(false)

	const columnParams = (status: MaintenanceRequestStatus) => ({
		filters: { property_id: propertyId, status },
		pagination: { page: 1, per: 50 },
		populate: ['Unit', 'AssignedWorker', 'AssignedManager'],
	})

	const newQuery = useGetMaintenanceRequestsInfinite(columnParams('NEW'))
	const inProgressQuery = useGetMaintenanceRequestsInfinite(
		columnParams('IN_PROGRESS'),
	)
	const inReviewQuery = useGetMaintenanceRequestsInfinite(
		columnParams('IN_REVIEW'),
	)
	const resolvedQuery = useGetMaintenanceRequestsInfinite(
		columnParams('RESOLVED'),
	)
	const canceledQuery = useGetMaintenanceRequestsInfinite(
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

	const updateStatus = useUpdateMaintenanceRequestStatus()

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

		updateStatus.mutate(
			{ id: draggedItem.id, status: targetColumn },
			{
				onError: (err) => {
					toast.error(
						err instanceof Error ? err.message : 'Failed to update status',
					)
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS],
					})
				},
				onSuccess: () => {
					void queryClient.invalidateQueries({
						queryKey: [QUERY_KEYS.MAINTENANCE_REQUESTS],
					})
				},
			},
		)
	}

	const handleScrollEnd = (status: MaintenanceRequestStatus) => {
		const query = columnQueries[status]
		if (query.hasNextPage && !query.isFetchingNextPage) {
			void query.fetchNextPage()
		}
	}

	return (
		<div className="flex h-full flex-col">
			<div className="m-5 flex shrink-0 items-center justify-between">
				<TypographyH3>Maintenance Requests</TypographyH3>
				<Button asChild>
					<Link
						to={`/properties/${propertyId}/activities/maintenance-requests/new`}
					>
						<Plus className="size-4" />
						Add Request
					</Link>
				</Button>
			</div>

			<div className="relative min-h-0 flex-1">
				<div className="absolute inset-0 mb-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
	)
}
