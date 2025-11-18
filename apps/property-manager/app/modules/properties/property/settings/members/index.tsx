import type { ColumnDef } from '@tanstack/react-table'
import { CircleCheck, CircleX, EllipsisVertical, User } from 'lucide-react'
import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { MembersController } from './controller'
import { useGetClientUserProperties } from '~/api/client-user-properties'
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
	AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
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

export function PropertyMembersModule() {
	const [searchParams] = useSearchParams()
	const params = useParams()

	const { clientUserProperties } = useAuth()

	const propertySlug = params?.propertySlug as string

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const role = searchParams.get('role') ?? undefined

	const propertyObj = useMemo(() => {
		return clientUserProperties?.rows?.find(
			(item) => item.property?.slug === propertySlug,
		)
	}, [propertySlug, clientUserProperties?.rows])

	const { data, isPending, isRefetching, error, refetch } =
		useGetClientUserProperties({
			filters: { role: role, property_id: propertyObj?.property_id },
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
				accessorKey: 'client_user.role',
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
				cell: () => (
					<AlertDialog>
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
							<DropdownMenuContent align="end" className="w-32">
								<DropdownMenuItem>Edit</DropdownMenuItem>
								<DropdownMenuSeparator />
								<AlertDialogTrigger asChild>
									<DropdownMenuItem variant="destructive">
										Deactivate
									</DropdownMenuItem>
								</AlertDialogTrigger>
							</DropdownMenuContent>
						</DropdownMenu>
						<AlertDialogContent className="sm:max-w-[425px]">
							<AlertDialogHeader>
								<AlertDialogTitle>Are you sure?</AlertDialogTitle>
								<AlertDialogDescription>
									This will deactivate the member.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter className="mt-5">
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-white">
									Deactivate
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				),
			},
		]
	}, [])

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
		</main>
	)
}
