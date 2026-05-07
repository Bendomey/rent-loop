import type { ColumnDef } from '@tanstack/react-table'
import { EllipsisVertical, Shield } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AdminsController } from './controller'
import { useGetAdmins } from '~/api/admins'
import { DataTable } from '~/components/datatable'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { getNameInitials } from '~/lib/misc'
import { useAuth } from '~/providers/auth-provider'

export function AdminsModule() {
	const [searchParams] = useSearchParams()
	const { currentUser } = useAuth()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const query = searchParams.get('query') ?? undefined

	const { data, isPending, isRefetching, error, refetch } = useGetAdmins({
		pagination: { page, per },
		sorter: { sort: 'desc', sort_by: 'created_at' },
		search: {
			query,
			fields: ['name', 'email'],
		},
	})

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<Admin>[] = useMemo(
		() => [
			{
				id: 'admin',
				header: 'Admin',
				cell: ({ row }) => {
					const admin = row.original
					const isCurrentUser = currentUser?.id === admin.id
					return (
						<div className="flex min-w-32 items-center gap-3">
							<Avatar className="size-8">
								<AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
									{getNameInitials(admin.name)}
								</AvatarFallback>
							</Avatar>
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">{admin.name}</span>
								{isCurrentUser && (
									<Badge variant="secondary" className="text-xs">
										You
									</Badge>
								)}
							</div>
						</div>
					)
				},
			},
			{
				accessorKey: 'email',
				header: 'Email',
				cell: ({ getValue }) => (
					<span className="text-muted-foreground text-sm">
						{getValue<string>()}
					</span>
				),
			},
			{
				accessorKey: 'created_at',
				header: 'Joined',
				cell: ({ getValue }) => (
					<span className="text-muted-foreground text-sm">
						{localizedDayjs(getValue<Date>()).format('MMM D, YYYY')}
					</span>
				),
			},
			{
				id: 'actions',
				cell: ({ row }) => (
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
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link to={`/admins/${row.original.id}`}>View details</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				),
			},
		],
		[currentUser],
	)

	return (
		<main className="flex flex-col gap-6 px-4 py-8 md:px-8">
			<div>
				<TypographyH2>Admins</TypographyH2>
				<TypographyMuted>Manage Rentloop admin accounts.</TypographyMuted>
			</div>
			<AdminsController isLoading={isLoading} refetch={refetch} />
			<div className="h-full w-full">
				<DataTable
					columns={columns}
					isLoading={isLoading}
					refetch={refetch}
					error={error ? 'Failed to load admins.' : undefined}
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
						message: 'No admins found',
						description: query
							? `No admins match "${query}".`
							: 'No admins have been created yet.',
						icon: <Shield className="size-8" />,
					}}
				/>
			</div>
		</main>
	)
}
