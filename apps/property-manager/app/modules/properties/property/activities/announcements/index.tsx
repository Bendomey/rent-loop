import { useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
	useCancelScheduledAnnouncement,
	useDeleteAnnouncement,
	useGetPropertyAnnouncements,
	usePublishAnnouncement,
} from '~/api/announcements'
import { AnnouncementForm } from '~/components/blocks/announcements/announcement-form'
import { ExtendExpiryModal } from '~/components/blocks/announcements/extend-expiry-modal'
import { ScheduleAnnouncementModal } from '~/components/blocks/announcements/schedule-announcement-modal'
import { DataTable } from '~/components/datatable'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH2 } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS, QUERY_KEYS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { useProperty } from '~/providers/property-provider'

function getStatusBadge(status: Announcement['status']) {
	const map: Record<
		Announcement['status'],
		{ label: string; className: string }
	> = {
		DRAFT: { label: 'Draft', className: 'bg-zinc-400 text-white' },
		SCHEDULED: { label: 'Scheduled', className: 'bg-blue-500 text-white' },
		PUBLISHED: { label: 'Published', className: 'bg-green-500 text-white' },
		EXPIRED: { label: 'Expired', className: 'bg-gray-400 text-white' },
	}
	const config = map[status] ?? map.DRAFT
	return (
		<Badge variant="outline" className={config.className}>
			{config.label}
		</Badge>
	)
}

function getPriorityBadge(priority: Announcement['priority']) {
	const map: Record<
		Announcement['priority'],
		{ label: string; className: string }
	> = {
		NORMAL: {
			label: 'Normal',
			className:
				'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
		},
		IMPORTANT: {
			label: 'Important',
			className:
				'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
		},
		URGENT: {
			label: 'Urgent',
			className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
		},
	}
	const config = map[priority] ?? map.NORMAL
	return (
		<Badge variant="outline" className={config.className}>
			{config.label}
		</Badge>
	)
}

function getTypeLabel(type: Announcement['type']) {
	const map: Record<Announcement['type'], string> = {
		COMMUNITY: 'Community',
		MAINTENANCE: 'Maintenance',
		POLICY_CHANGE: 'Policy Change',
		EMERGENCY: 'Emergency',
	}
	return map[type] ?? type
}

export function PropertyActivitiesAnnouncementsModule() {
	const { clientUserProperty } = useProperty()
	const propertyId = clientUserProperty?.property?.id
	const queryClient = useQueryClient()
	const [searchParams] = useSearchParams()

	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
	const [extendExpiryModalOpen, setExtendExpiryModalOpen] = useState(false)
	const [activeId, setActiveId] = useState<string | null>(null)

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE

	const { data, isPending, isRefetching, error, refetch } =
		useGetPropertyAnnouncements(propertyId, {
			pagination: { page, per },
			sorter: { sort: 'desc', sort_by: 'created_at' },
		})

	const { mutate: deleteAnnouncement, isPending: isDeleting } =
		useDeleteAnnouncement()
	const { mutate: publishAnnouncement } = usePublishAnnouncement()
	const { mutate: cancelScheduled } = useCancelScheduledAnnouncement()

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<Announcement>[] = useMemo(
		() => [
			{
				accessorKey: 'title',
				header: 'Title',
				cell: ({ row }) => (
					<span className="min-w-40 text-sm font-medium">
						{row.original.title}
					</span>
				),
			},
			{
				accessorKey: 'type',
				header: 'Type',
				cell: ({ row }) => (
					<span className="text-muted-foreground text-xs">
						{getTypeLabel(row.original.type)}
					</span>
				),
			},
			{
				accessorKey: 'priority',
				header: 'Priority',
				cell: ({ row }) => getPriorityBadge(row.original.priority),
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ row }) => getStatusBadge(row.original.status),
			},
			{
				accessorKey: 'published_at',
				header: 'Published At',
				cell: ({ row }) => (
					<span className="text-muted-foreground min-w-32 text-xs">
						{row.original.published_at
							? localizedDayjs(row.original.published_at).format('MMM D, YYYY')
							: '—'}
					</span>
				),
			},
			{
				id: 'actions',
				cell: ({ row }) => {
					const announcement = row.original
					return (
						<div className="flex items-center gap-2">
							{announcement.status === 'DRAFT' && (
								<>
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											publishAnnouncement(announcement.id, {
												onError: () =>
													toast.error('Failed to publish. Try again.'),
												onSuccess: () => {
													toast.success('Announcement published.')
													void queryClient.invalidateQueries({
														queryKey: [QUERY_KEYS.ANNOUNCEMENTS],
													})
												},
											})
										}}
									>
										Publish
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											setActiveId(announcement.id)
											setScheduleModalOpen(true)
										}}
									>
										Schedule
									</Button>
									<Button
										size="sm"
										variant="outline"
										className="text-destructive hover:text-destructive"
										onClick={() => {
											setActiveId(announcement.id)
											setDeleteDialogOpen(true)
										}}
									>
										Delete
									</Button>
								</>
							)}

							{announcement.status === 'SCHEDULED' && (
								<>
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											publishAnnouncement(announcement.id, {
												onError: () =>
													toast.error('Failed to publish. Try again.'),
												onSuccess: () => {
													toast.success('Announcement published.')
													void queryClient.invalidateQueries({
														queryKey: [QUERY_KEYS.ANNOUNCEMENTS],
													})
												},
											})
										}}
									>
										Publish Now
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											cancelScheduled(announcement.id, {
												onError: () =>
													toast.error('Failed to cancel schedule. Try again.'),
												onSuccess: () => {
													toast.success('Schedule cancelled.')
													void queryClient.invalidateQueries({
														queryKey: [QUERY_KEYS.ANNOUNCEMENTS],
													})
												},
											})
										}}
									>
										Cancel Schedule
									</Button>
								</>
							)}

							{announcement.status === 'PUBLISHED' && (
								<Button
									size="sm"
									variant="outline"
									onClick={() => {
										setActiveId(announcement.id)
										setExtendExpiryModalOpen(true)
									}}
								>
									Extend Expiry
								</Button>
							)}
						</div>
					)
				},
			},
		],
		[cancelScheduled, publishAnnouncement, queryClient],
	)

	return (
		<div className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
			<div className="flex flex-row items-center justify-between">
				<TypographyH2>Announcements</TypographyH2>
				<AnnouncementForm propertyId={propertyId} />
			</div>

			<DataTable
				columns={columns}
				isLoading={isLoading}
				refetch={refetch}
				error={error ? 'Failed to load announcements.' : undefined}
				dataResponse={{
					rows: data?.rows ?? [],
					total: data?.meta?.total ?? 0,
					page,
					page_size: per,
					order: data?.meta?.order ?? 'desc',
					order_by: data?.meta?.order_by ?? 'created_at',
					has_prev_page: data?.meta?.has_prev_page ?? false,
					has_next_page: data?.meta?.has_next_page ?? false,
				}}
				empty={{
					message: 'No announcements yet',
					description: 'Create one to notify tenants.',
				}}
			/>

			<ScheduleAnnouncementModal
				announcementId={activeId}
				opened={scheduleModalOpen}
				setOpened={setScheduleModalOpen}
			/>

			<ExtendExpiryModal
				announcementId={activeId}
				opened={extendExpiryModalOpen}
				setOpened={setExtendExpiryModalOpen}
			/>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent className="sm:max-w-[425px]">
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete the announcement.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="mt-5">
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={isDeleting}
							onClick={(e) => {
								e.preventDefault()
								if (!activeId || isDeleting) return
								deleteAnnouncement(activeId, {
									onError: () =>
										toast.error(
											'Failed to delete announcement. Try again later.',
										),
									onSuccess: () => {
										void queryClient.invalidateQueries({
											queryKey: [QUERY_KEYS.ANNOUNCEMENTS],
										})
										setDeleteDialogOpen(false)
										setActiveId(null)
									},
								})
							}}
							className="bg-destructive hover:bg-destructive/90 text-white"
						>
							{isDeleting ? <Spinner /> : null}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
