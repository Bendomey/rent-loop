import type { ColumnDef } from '@tanstack/react-table'
import { ChevronRight, Copy, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useGetAnnouncements } from '~/api/announcements'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import { TypographyH2 } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'

function getStatusBadge(status: Announcement['status']) {
	const map: Record<
		Announcement['status'],
		{ label: string; className: string }
	> = {
		DRAFT: {
			label: 'Draft',
			className: 'bg-zinc-200 dark:bg-zinc-700 text-black dark:text-white',
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
			className: 'bg-gray-400 dark:bg-gray-700 text-white',
		},
	}
	const config = map[status] ?? map.DRAFT
	return (
		<Badge variant="secondary" className={config.className}>
			{config.label}
		</Badge>
	)
}

export function AnnouncementsModule() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE

	const { data, isPending, isRefetching, error, refetch } = useGetAnnouncements(
		{
			pagination: { page, per },
			sorter: { sort: 'desc', sort_by: 'created_at' },
			populate: ['Property'],
		},
	)

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<Announcement>[] = useMemo(
		() => [
			{
				accessorKey: 'title',
				header: 'Title',
				meta: { className: 'w-full' },
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium">{row.original.title}</span>
						{getStatusBadge(row.original.status)}
					</div>
				),
			},
			{
				accessorKey: 'published_at',
				header: 'Publish Date',
				cell: ({ row }) => (
					<span className="text-muted-foreground min-w-32 text-xs">
						{row.original.published_at
							? localizedDayjs(row.original.published_at).format('MMM D, YYYY')
							: ''}
					</span>
				),
			},
			{
				id: 'actions',
				cell: ({ row }) => {
					const announcement = row.original
					return (
						<div className="flex items-center justify-end gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="icon"
										variant="ghost"
										onClick={() =>
											void navigate(
												`/activities/announcements/new?announcement_id=${announcement.id}`,
											)
										}
									>
										<Copy className="h-4 w-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Duplicate</TooltipContent>
							</Tooltip>
							<Button
								size="icon"
								variant="ghost"
								onClick={() =>
									void navigate(`/activities/announcements/${announcement.id}`)
								}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					)
				},
			},
		],
		[navigate],
	)

	return (
		<div className="mx-auto my-6 flex max-w-4xl flex-col gap-4 sm:gap-6">
			<div className="flex flex-row items-center justify-between">
				<div>
					<TypographyH2>Announcements</TypographyH2>
					<p className="text-muted-foreground mt-1 text-sm">
						Broadcast messages to tenants across your properties.
					</p>
				</div>
				<Link to="/activities/announcements/new">
					<Button size="sm">
						<Plus className="size-4" />
						New Announcement
					</Button>
				</Link>
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
		</div>
	)
}
