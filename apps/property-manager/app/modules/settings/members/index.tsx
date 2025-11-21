import type { ColumnDef } from '@tanstack/react-table'
import {
	AlertCircleIcon,
	CircleCheck,
	CircleX,
	EllipsisVertical,
	User,
} from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { MembersController } from './controller'
import { ClientUserStatus } from './status'
import { useGetClientUsers } from '~/api/client-users'
import { DataTable } from '~/components/datatable'
import { Alert, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { useAuth } from '~/providers/auth-provider'

export function MembersModule() {
	const [searchParams] = useSearchParams()
	const { currentUser } = useAuth()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const role = searchParams.get('role') ?? undefined
	const status = searchParams.get('status') ?? undefined

	const { data, isPending, isRefetching, error, refetch } = useGetClientUsers({
		filters: { role: role, status: status },
		pagination: { page, per },
		populate: ['CreatedBy'],
		sorter: { sort: 'desc', sort_by: 'created_at' },
		search: {
			query: searchParams.get('query') ?? undefined,
			fields: ['name', 'email', 'phone_number'],
		},
	})

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<ClientUser>[] = useMemo(() => {
		return [
			{
				id: 'drag',
				header: () => null,
				cell: () => <User />,
			},
			{
				accessorKey: 'name',
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
				accessorKey: 'id',
				header: 'Contact',
				cell: ({ row }) => (
					<div className="flex min-w-32 flex-col items-start gap-1">
						<span className="truncate text-xs text-zinc-600">
							{row.original.email}
						</span>
						<span className="truncate text-xs text-zinc-600">
							{row.original.phone_number}
						</span>
					</div>
				),
			},

			{
				accessorKey: 'status',
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
					const isCurrentUser = currentUser?.id === row.original.id
					return (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
									size="icon"
								>
									<EllipsisVertical />
									<span className="sr-only">Open menu</span>
								</Button>
							</DropdownMenuTrigger>

							<DropdownMenuContent
								align="end"
								className={`${isCurrentUser ? 'w-auto' : '32'}`}
							>
								{isCurrentUser ? (
									<Alert variant="destructive" className="border-0">
										<AlertCircleIcon />
										<AlertTitle>
											You can't edit or deactivate your own account.
										</AlertTitle>
									</Alert>
								) : (
									<>
										{row.original.role !== 'OWNER' ||
										currentUser?.role === 'OWNER' ? (
											<>
												<DropdownMenuItem>Edit</DropdownMenuItem>
												<DropdownMenuSeparator />
												<ClientUserStatus
													clientUser={row.original}
													refetch={refetch}
												/>
											</>
										) : (
											<Alert variant="destructive" className="border-0">
												<AlertCircleIcon />
												<AlertTitle>
													You do not have permission to modify or deactivate an
													"Owner" account.
												</AlertTitle>
											</Alert>
										)}
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					)
				},
			},
		]
	}, [currentUser, refetch])

	return (
		<main className="flex flex-col gap-2 sm:gap-4">
			<div>
				<TypographyH4>Manage Members</TypographyH4>
				<TypographyMuted>
					These members have access to your workspace.
				</TypographyMuted>
			</div>
			<MembersController isLoading={isLoading} refetch={refetch} />
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
		</main>
	)
}
