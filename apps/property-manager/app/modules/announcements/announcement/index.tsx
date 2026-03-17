import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
	ArrowLeft,
	Building2,
	CalendarClock,
	CalendarDays,
	CalendarOff,
	Megaphone,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useLoaderData, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import {
	useCancelScheduledAnnouncement,
	useDeleteAnnouncement,
	useGetAnnouncement,
	usePublishAnnouncement,
} from '~/api/announcements'
import { EditDraftModal } from '~/components/blocks/announcements/edit-draft-modal'
import { ExtendExpiryModal } from '~/components/blocks/announcements/extend-expiry-modal'
import { ScheduleAnnouncementModal } from '~/components/blocks/announcements/schedule-announcement-modal'
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
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { TypographyMuted } from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import type { loader } from '~/routes/_auth._dashboard.activities.announcements.$announcementId._index'

const STATUS_CONFIG: Record<
	Announcement['status'],
	{ label: string; className: string }
> = {
	DRAFT: {
		label: 'Draft',
		className: 'bg-zinc-400 dark:bg-zinc-700 text-white',
	},
	SCHEDULED: {
		label: 'Scheduled',
		className: 'bg-blue-500 dark:bg-blue-700 text-white',
	},
	PUBLISHED: {
		label: 'Published',
		className: 'bg-green-500 dark:bg-green-700 text-white',
	},
	EXPIRED: {
		label: 'Expired',
		className: 'bg-gray-400 dark:bg-gray-600 text-white',
	},
}

const PRIORITY_CONFIG: Record<
	Announcement['priority'],
	{ label: string; className: string }
> = {
	NORMAL: {
		label: 'Normal',
		className: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
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

const TYPE_LABELS: Record<Announcement['type'], string> = {
	COMMUNITY: 'Community',
	MAINTENANCE: 'Maintenance',
	POLICY_CHANGE: 'Policy Change',
	EMERGENCY: 'Emergency',
}

function MetaRow({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode
	label: string
	value: React.ReactNode
}) {
	return (
		<div className="flex items-start gap-3">
			<div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
			<div className="flex flex-col gap-0.5">
				<TypographyMuted className="text-xs">{label}</TypographyMuted>
				<div className="text-sm font-medium">{value ?? '—'}</div>
			</div>
		</div>
	)
}

export function AnnouncementDetailModule() {
	const { announcementId } = useParams<{ announcementId: string }>()
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const loaderData = useLoaderData<typeof loader>()

	const [editOpen, setEditOpen] = useState(false)
	const [publishOpen, setPublishOpen] = useState(false)
	const [scheduleOpen, setScheduleOpen] = useState(false)
	const [extendExpiryOpen, setExtendExpiryOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)

	const {
		data: announcement,
		isPending,
		error,
	} = useGetAnnouncement(
		announcementId ?? '',
		loaderData.announcement ?? undefined,
	)
	const { mutate: publish, isPending: isPublishing } = usePublishAnnouncement()
	const { mutate: cancelSchedule, isPending: isCancelling } =
		useCancelScheduledAnnouncement()
	const { mutate: deleteAnnouncement, isPending: isDeleting } =
		useDeleteAnnouncement()

	const invalidate = () =>
		void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ANNOUNCEMENTS] })

	if (isPending) {
		return (
			<div className="m-5 grid grid-cols-12 gap-6">
				<div className="col-span-12 lg:col-span-4">
					<Card className="shadow-none">
						<CardContent className="space-y-4 pt-6">
							<Skeleton className="h-5 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
							<Skeleton className="h-4 w-2/3" />
						</CardContent>
					</Card>
				</div>
				<div className="col-span-12 lg:col-span-8">
					<Card className="shadow-none">
						<CardContent className="space-y-3 pt-6">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-4/5" />
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	if (error || !announcement) {
		return (
			<div className="flex h-96 items-center justify-center">
				<p className="text-muted-foreground text-sm">Announcement not found.</p>
			</div>
		)
	}

	const status = STATUS_CONFIG[announcement.status]
	const priority = PRIORITY_CONFIG[announcement.priority]

	return (
		<div className="m-5 grid grid-cols-12 gap-6">
			{/* Sidebar */}
			<div className="col-span-12 lg:col-span-4">
				<Card className="shadow-none">
					<CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
						<div className="flex items-center gap-2">
							<Megaphone className="text-muted-foreground size-5" />
							<Badge variant="secondary" className={status.className}>
								{status.label}
							</Badge>
						</div>
						<Badge variant="secondary" className={priority.className}>
							{priority.label}
						</Badge>
					</CardHeader>

					<CardContent className="space-y-4">
						<MetaRow
							icon={<Building2 className="size-4" />}
							label="Property"
							value={announcement.property?.name ?? 'All Properties'}
						/>

						<MetaRow
							icon={<CalendarDays className="size-4" />}
							label="Type"
							value={TYPE_LABELS[announcement.type]}
						/>

						{announcement.published_at && (
							<MetaRow
								icon={<CalendarDays className="size-4" />}
								label="Publish Date"
								value={localizedDayjs(announcement.published_at).format(
									'MMM D, YYYY h:mm A',
								)}
							/>
						)}

						{announcement.scheduled_at &&
							announcement.status === 'SCHEDULED' && (
								<MetaRow
									icon={<CalendarClock className="size-4" />}
									label="Scheduled For"
									value={localizedDayjs(announcement.scheduled_at).format(
										'MMM D, YYYY h:mm A',
									)}
								/>
							)}

						{/* {announcement.expires_at && ( */}
						<MetaRow
							icon={<CalendarOff className="size-4" />}
							label="Expires"
							value={
								<span
									className={
										dayjs(announcement.expires_at).isBefore(dayjs())
											? 'text-red-500'
											: ''
									}
								>
									{announcement.expires_at
										? localizedDayjs(announcement.expires_at).format(
												'MMM D, YYYY h:mm A',
											)
										: 'N/A'}
								</span>
							}
						/>
						{/* )} */}

						<Separator />

						<MetaRow
							icon={<CalendarDays className="size-4" />}
							label="Created"
							value={localizedDayjs(announcement.created_at).format(
								'MMM D, YYYY',
							)}
						/>

						<Separator />

						{/* Actions */}
						<div className="flex flex-col gap-2">
							{announcement.status === 'DRAFT' && (
								<>
									<Button
										variant="outline"
										size="sm"
										className="w-full"
										onClick={() => setEditOpen(true)}
									>
										Edit Draft
									</Button>
									<Button
										size="sm"
										className="w-full bg-rose-600 hover:bg-rose-700"
										onClick={() => setPublishOpen(true)}
									>
										Publish Now
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="w-full"
										onClick={() => setScheduleOpen(true)}
									>
										Schedule
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="text-destructive hover:text-destructive w-full"
										onClick={() => setDeleteOpen(true)}
									>
										Delete
									</Button>
								</>
							)}

							{announcement.status === 'SCHEDULED' && (
								<>
									<Button
										size="sm"
										className="w-full bg-rose-600 hover:bg-rose-700"
										onClick={() => setPublishOpen(true)}
									>
										Publish Now
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="w-full"
										disabled={isCancelling}
										onClick={() =>
											cancelSchedule(announcement.id, {
												onError: () =>
													toast.error('Failed to cancel schedule.'),
												onSuccess: () => {
													toast.success('Schedule cancelled.')
													invalidate()
												},
											})
										}
									>
										{isCancelling ? 'Cancelling…' : 'Cancel Schedule'}
									</Button>
								</>
							)}

							{announcement.status === 'PUBLISHED' && (
								<Button
									variant="outline"
									size="sm"
									className="w-full"
									onClick={() => setExtendExpiryOpen(true)}
								>
									{announcement.expires_at ? 'Extend Expiry' : 'Set Expiry'}
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				<div className="mt-4">
					<Link to="/activities/announcements">
						<Button
							variant="ghost"
							size="sm"
							className="text-muted-foreground gap-1"
						>
							<ArrowLeft className="size-4" />
							Back to Announcements
						</Button>
					</Link>
				</div>
			</div>

			{/* Main Content */}
			<div className="col-span-12 lg:col-span-8">
				<Card className="shadow-none">
					<CardContent>
						<h1 className="text-xl font-semibold">{announcement.title}</h1>
						<Separator className="my-4" />
						<p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
							{announcement.content}
						</p>
					</CardContent>
				</Card>
			</div>

			<ScheduleAnnouncementModal
				announcementId={announcement.id}
				opened={scheduleOpen}
				setOpened={setScheduleOpen}
			/>

			<ExtendExpiryModal
				announcement={announcement}
				opened={extendExpiryOpen}
				setOpened={setExtendExpiryOpen}
			/>

			<EditDraftModal
				announcement={announcement}
				opened={editOpen}
				setOpened={setEditOpen}
			/>

			<AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
				<AlertDialogContent className="sm:max-w-[425px]">
					<AlertDialogHeader>
						<AlertDialogTitle>Publish announcement?</AlertDialogTitle>
						<AlertDialogDescription>
							This will immediately publish &ldquo;{announcement.title}&rdquo;
							to all targeted tenants.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="mt-5">
						<AlertDialogCancel disabled={isPublishing}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={isPublishing}
							className="bg-rose-600 text-white hover:bg-rose-700"
							onClick={(e) => {
								e.preventDefault()
								publish(announcement.id, {
									onError: () => toast.error('Failed to publish. Try again.'),
									onSuccess: () => {
										toast.success('Announcement published.')
										invalidate()
										setPublishOpen(false)
									},
								})
							}}
						>
							{isPublishing ? 'Publishing…' : 'Publish'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<AlertDialogContent className="sm:max-w-[425px]">
					<AlertDialogHeader>
						<AlertDialogTitle>Delete announcement?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete &ldquo;{announcement.title}&rdquo;.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="mt-5">
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							disabled={isDeleting}
							className="bg-destructive hover:bg-destructive/90 text-white"
							onClick={(e) => {
								e.preventDefault()
								deleteAnnouncement(announcement.id, {
									onError: () => toast.error('Failed to delete. Try again.'),
									onSuccess: () => {
										invalidate()
										void navigate('/activities/announcements')
									},
								})
							}}
						>
							{isDeleting ? 'Deleting…' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
