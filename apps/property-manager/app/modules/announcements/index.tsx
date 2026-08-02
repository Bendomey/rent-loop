import type { ColumnDef } from '@tanstack/react-table'
import { ChevronRight, Copy, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useGetAnnouncements } from '~/api/announcements'
import { DataTable, useDataTableSort } from '~/components/datatable'
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
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

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

/**
 * Fields the API may order by. `order_by` reaches the backend's ORDER BY
 * clause, so only these — never a raw URL value — are forwarded.
 */
const SORTABLE_FIELDS = [
	'announcements.title',
	'announcements.published_at',
	'announcements.status',
	'announcements.created_at',
]

export function AnnouncementsModule() {
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const sorter = useDataTableSort(SORTABLE_FIELDS, {
		sort_by: 'announcements.created_at',
		sort: 'desc',
	})
	const { clientUser } = useClient()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE

	const { data, isPending, isRefetching, error, refetch } = useGetAnnouncements(
		safeString(clientUser?.client_id),
		{
			pagination: { page, per },
			sorter,
			populate: ['Property'],
		},
	)

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<Announcement>[] = useMemo(
		() => [
			{
				accessorKey: 'title',
				header: 'Title',
				// Titles are the point of this table, so the column is sized to
				// dominate; `w-full` lets it take any slack left over on top.
				size: 520,
				enableSorting: true,
				meta: { className: 'w-full', sortKey: 'announcements.title' },
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
				size: 170,
				enableSorting: true,
				meta: { sortKey: 'announcements.published_at' },
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
										<Copy className="size-4" />
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
								<ChevronRight className="size-4" />
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
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
