import type { ColumnDef } from '@tanstack/react-table'
import { CircleCheck, CircleX, Trash, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { MembersController } from './controller'
import RemoveMemberModule from './remove'
import { useGetClientUserProperties } from '~/api/client-user-properties'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { useProperty } from '~/providers/property-provider'

export function PropertyMembersModule() {
	const [searchParams] = useSearchParams()
	const { clientUserProperty } = useProperty()

	const [selectedMember, setSelectedMember] = useState<ClientUser>()
	const [openRemoveMemberModal, setOpenRemoveMemberModal] = useState(false)

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const role = searchParams.get('role') ?? undefined

	const { data, isPending, isRefetching, error, refetch } =
		useGetClientUserProperties({
			filters: { role: role, property_id: clientUserProperty?.property?.id },
			pagination: { page, per },
			populate: ['ClientUser'],
			sorter: { sort: 'desc', sort_by: 'created_at' },
			search: {
				query: searchParams.get('query') ?? undefined,
				fields: ['property'],
			},
		})

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<ClientUserProperty>[] = useMemo(() => {
		return [
			{
				id: 'drag',
				header: () => null,
				cell: () => <User />,
			},
			{
				accessorKey: 'client_user.name',
				header: 'Name',
				cell: ({ getValue }) => {
					return (
						<div className="min-w-32">
							<span className="truncate text-xs text-zinc-600">
								{getValue<string>()}
							</span>
						</div>
					)
				},
				enableHiding: false,
			},
			{
				accessorKey: 'role',
				header: 'Role',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						<span className="truncate text-xs text-zinc-600">
							{getValue<string>()}
						</span>
					</Badge>
				),
			},
			{
				accessorKey: 'client_user.id',
				header: 'Contact',
				cell: ({ row }) => (
					<div className="flex min-w-32 flex-col items-start gap-1">
						<span className="truncate text-xs text-zinc-600">
							{row.original.client_user?.email}
						</span>
						<span className="truncate text-xs text-zinc-600">
							{row.original.client_user?.phone_number}
						</span>
					</div>
				),
			},

			{
				accessorKey: 'client_user.status',
				header: 'Status',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						{getValue<string>() === 'ClientUser.Status.Active' ? (
							<CircleCheck className="fill-green-600 text-white" />
						) : (
							<CircleX className="fill-red-500 text-white" />
						)}
						{getValue<string>() === 'ClientUser.Status.Active'
							? 'Active'
							: 'Inactive'}
					</Badge>
				),
			},
			{
				id: 'actions',
				cell: ({ row }) => {
					if (
						clientUserProperty?.client_user_id === row.original.client_user_id
					) {
						return null
					}

					return (
						<Button
							variant="ghost"
							className="flex size-8 text-red-600 hover:bg-red-100 hover:text-red-600"
							size="icon"
							onClick={() => {
								setSelectedMember(row.original?.client_user ?? undefined)
								setOpenRemoveMemberModal(true)
							}}
						>
							<Trash />
							<span className="sr-only">Remove Member</span>
						</Button>
					)
				},
			},
		]
	}, [clientUserProperty?.client_user_id])

	return (
		<main className="flex flex-col gap-2 sm:gap-4">
			<div>
				<TypographyH4>Manage Members</TypographyH4>
				<TypographyMuted>
					These members have access to your workspace.
				</TypographyMuted>
			</div>
			<MembersController />
			<div className="h-full w-full">
				<DataTable
					columns={columns}
					isLoading={isLoading}
					refetch={refetch}
					error={error ? 'Failed to load members.' : undefined}
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
						message: 'No members found',
						description:
							"Try adjusting your search to find what you're looking for.",
					}}
				/>
			</div>

			{clientUserProperty?.property ? (
				<RemoveMemberModule
					opened={openRemoveMemberModal}
					setOpened={setOpenRemoveMemberModal}
					data={selectedMember}
					property={clientUserProperty?.property}
				/>
			) : null}
		</main>
	)
}
