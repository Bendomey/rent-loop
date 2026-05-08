import type { ColumnDef } from '@tanstack/react-table'
import { ClipboardCheck } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { ApplicationsController } from './controller'
import { ApplicationStatus } from './status'
import { useGetClientApplications } from '~/api/client-applications'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
	'ClientApplication.Status.Pending': {
		label: 'Pending',
		className:
			'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
	},
	'ClientApplication.Status.Approved': {
		label: 'Approved',
		className:
			'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
	},
	'ClientApplication.Status.Rejected': {
		label: 'Rejected',
		className:
			'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
	},
}

function StatusBadge({ status }: { status: string }) {
	const config = STATUS_CONFIG[status] ?? { label: status, className: '' }
	return (
		<Badge variant="outline" className={config.className}>
			{config.label}
		</Badge>
	)
}

export function ApplicationsModule() {
	const [searchParams] = useSearchParams()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const status =
		searchParams.get('status') ?? 'ClientApplication.Status.Pending'
	const query = searchParams.get('query') ?? undefined

	const { data, isPending, isRefetching, error, refetch } =
		useGetClientApplications({
			pagination: { page, per },
			sorter: { sort: 'desc', sort_by: 'created_at' },
			filters: { status },
			search: { query, fields: ['name', 'contact_name', 'contact_email'] },
		})

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<ClientApplication>[] = useMemo(
		() => [
			{
				id: 'name',
				header: 'Name',
				cell: ({ row }) => {
					const app = row.original
					return (
						<div className="min-w-36">
							<p className="text-sm font-medium">{app.name}</p>
							<p className="text-muted-foreground text-xs">
								{app.contact_email}
							</p>
						</div>
					)
				},
			},
			{
				id: 'type',
				header: 'Type',
				cell: ({ row }) => {
					const app = row.original
					return (
						<div className="flex flex-col gap-0.5">
							<span className="text-sm">{app.type}</span>
							<span className="text-muted-foreground text-xs">
								{app.sub_type}
							</span>
						</div>
					)
				},
			},
			{
				id: 'contact',
				header: 'Contact',
				cell: ({ row }) => {
					const app = row.original
					return (
						<div className="min-w-32">
							<p className="text-sm">{app.contact_name}</p>
							<p className="text-muted-foreground text-xs">
								{app.contact_phone_number}
							</p>
						</div>
					)
				},
			},
			{
				id: 'location',
				header: 'Location',
				cell: ({ row }) => {
					const app = row.original
					return (
						<span className="text-muted-foreground text-sm">
							{app.city}, {app.region}
						</span>
					)
				},
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
			},
			{
				accessorKey: 'created_at',
				header: 'Submitted',
				cell: ({ getValue }) => (
					<span className="text-muted-foreground text-sm">
						{localizedDayjs(getValue<Date>()).format('MMM D, YYYY')}
					</span>
				),
			},
			{
				id: 'actions',
				cell: ({ row }) => <ApplicationStatus application={row.original} />,
			},
		],
		[],
	)

	return (
		<main className="flex flex-col gap-6 px-4 py-8 md:px-8">
			<div>
				<TypographyH2>Property Manager Applications</TypographyH2>
				<TypographyMuted>
					Review and action property manager registration requests.
				</TypographyMuted>
			</div>

			<ApplicationsController isLoading={isLoading} refetch={refetch} />

			<div className="h-full w-full">
				<DataTable
					columns={columns}
					isLoading={isLoading}
					refetch={refetch}
					error={error ? 'Failed to load applications.' : undefined}
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
						message: 'No applications found',
						description: query
							? `No applications match "${query}".`
							: 'There are no applications with this status.',
						icon: <ClipboardCheck className="size-8" />,
					}}
				/>
			</div>
		</main>
	)
}
