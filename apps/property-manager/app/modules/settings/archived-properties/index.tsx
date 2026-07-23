import type { ColumnDef } from '@tanstack/react-table'
import { Building } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { ArchivedPropertiesController } from './controller'
import { RestoreFlow } from './restore-flow'
import { useGetProperties } from '~/api/properties'
import { DataTable } from '~/components/datatable'
import { PermissionGuard } from '~/components/permissions/permission-guard'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

export function ArchivedPropertiesModule() {
	const [searchParams] = useSearchParams()
	const { clientUser } = useClient()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE

	const { data, isPending, isRefetching, error, refetch } = useGetProperties(
		safeString(clientUser?.client_id),
		{
			filters: { archived: true },
			pagination: { page, per },
			populate: ['DeletedBy.User'],
			sorter: { sort: 'desc', sort_by: 'created_at' },
			search: {
				query: searchParams.get('query') ?? undefined,
				fields: ['name', 'address'],
			},
		},
	)

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<Property>[] = useMemo(() => {
		return [
			{
				id: 'drag',
				header: () => null,
				cell: () => <Building />,
			},
			{
				accessorKey: 'name',
				header: 'Name',
				cell: ({ getValue, row }) => (
					<div className="flex max-w-48 min-w-32 flex-col items-start gap-1">
						<span className="w-full truncate text-xs text-zinc-600 dark:text-white">
							{getValue<string>()}
						</span>
						<span className="text-muted-foreground w-full truncate text-xs">
							{row.original.address} · {row.original.type}
						</span>
					</div>
				),
				enableHiding: false,
			},
			{
				id: 'records',
				header: 'Blocks / Units',
				cell: ({ row }) => (
					<span className="text-xs text-zinc-600 dark:text-white">
						{row.original.blocks_count} blocks · {row.original.units_count}{' '}
						units
					</span>
				),
			},
			{
				id: 'archived',
				header: 'Archived',
				cell: ({ row }) => (
					<div className="flex max-w-40 min-w-32 flex-col items-start gap-1">
						<span className="w-full truncate text-xs text-zinc-600 dark:text-white">
							{row.original.deleted_by?.user?.name ?? '—'}
						</span>
						<span className="text-muted-foreground w-full truncate text-xs">
							{row.original.deleted_at
								? localizedDayjs(row.original.deleted_at).format(
										'DD/MM/YYYY hh:mm a',
									)
								: '—'}
						</span>
					</div>
				),
			},
			{
				id: 'actions',
				cell: ({ row }) => (
					<RestoreFlow property={row.original} refetch={refetch} />
				),
			},
		]
	}, [refetch])

	return (
		<PermissionGuard roles={['OWNER', 'ADMIN']}>
			<main className="flex flex-col gap-2 sm:gap-4">
				<ArchivedPropertiesController isLoading={isLoading} refetch={refetch} />
				<div className="h-full w-full">
					<DataTable
						columns={columns}
						isLoading={isLoading}
						refetch={refetch}
						error={error ? 'Failed to load archived properties.' : undefined}
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
							message: 'No archived properties',
							description:
								'Properties you delete are archived here and can be restored anytime.',
						}}
					/>
				</div>
			</main>
		</PermissionGuard>
	)
}
