import type { ColumnDef } from '@tanstack/react-table'
import { CircleCheck, CircleX, Delete, EllipsisVertical, Trash2, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import ApproveTenantApplicationModal from './approve'
import CancelTenantApplicationModal from './cancel'
import { PropertyTenantApplicationsController } from './controller'
import { useGetPropertyTenantApplications } from '~/api/tenant-applications'
import { DataTable } from '~/components/datatable'
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
import { localizedDayjs } from '~/lib/date'
import { useProperty } from '~/providers/property-provider'
import DeleteTenantApplicationModal from './delete'

export function PropertyTenantApplicationsModule() {
	const [searchParams] = useSearchParams()
	const { clientUserProperty } = useProperty()
	const [openApproveModal, setOpenApproveModal] = useState(false)
	const [openCancelModal, setOpenCancelModal] = useState(false)
	const [openDeleteModal, setOpenDeleteModal] = useState(false)
	const [selectedApplication, setSelectedApplication] =
		useState<TenantApplication>()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const marital_status = searchParams.get('marital_status') ?? undefined
	const gender = searchParams.get('gender') ?? undefined
	const status = searchParams.get('status') ?? undefined

	const { data, isPending, isRefetching, error, refetch } =
		useGetPropertyTenantApplications({
			filters: {
				status: status,
				gender: gender,
				marital_status: marital_status,
				property_id: clientUserProperty?.property?.id,
			},
			pagination: { page, per },
			populate: ['DesiredUnit'],
			sorter: { sort: 'desc', sort_by: 'created_at' },
			search: {
				query: searchParams.get('query') ?? undefined,
				fields: ['first_name', 'last_name', 'email', 'phone'],
			},
		})

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<TenantApplication>[] = useMemo(() => {
		return [
			{
				id: 'id',
				header: () => null,
				cell: ({ row }) => {
					if (row.original.profile_photo_url) {
						return (
							<img
								src={row.original.profile_photo_url}
								alt="Profile Photo"
								className="h-8 w-8 rounded-full object-cover"
							/>
						)
					} else {
						return <User />
					}
				},
			},
			{
				accessorKey: 'name',
				header: 'Name',
				cell: ({ row }) => {
					return (
						<div className="min-w-32">
							<Link
								to={`/properties/${clientUserProperty?.property_id}/tenants/applications/${row.original.id}`}
								aria-label={`View details for application`}
							>
								<span className="truncate text-xs text-blue-600 hover:underline">
									{`${row.original.first_name} ${row.original.other_names ? row.original.other_names + ' ' : ''}${row.original.last_name}`}
								</span>
							</Link>
						</div>
					)
				},
				enableHiding: false,
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
							{row.original.phone}
						</span>
					</div>
				),
			},
			{
				accessorKey: 'desired_unit.name',
				header: 'Desired Unit',
				cell: ({ getValue }) => (
					<span className="truncate text-xs text-zinc-600">
						{getValue<string>() ?? 'N/A'}
					</span>
				),
			},
			{
				accessorKey: 'gender',
				header: 'Gender',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						<span className="truncate text-xs text-zinc-600">
							{getValue<string>()}
						</span>
					</Badge>
				),
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						{getValue<string>() === 'TenantApplication.Status.InProgress' ? (
							<CircleCheck className="fill-green-600 text-white" />
						) : (
							<CircleX className="fill-red-500 text-white" />
						)}
						{getValue<string>() === 'TenantApplication.Status.InProgress'
							? 'In Progress'
							: getValue<string>() === 'TenantApplication.Status.Completed'
								? 'Completed'
								: 'Cancelled'}
					</Badge>
				),
			},
			{
				accessorKey: 'created_at',
				header: 'Created On',
				cell: ({ getValue }) => (
					<div className="min-w-32">
						<span className="truncate text-xs text-zinc-600">
							{localizedDayjs(getValue<Date>()).format('DD/MM/YYYY hh:mm a')}
						</span>
					</div>
				),
			},
			{
				id: 'actions',
				cell: ({ row }) => {
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

							<DropdownMenuContent align="end" className="32">
								<Link
									to={`/properties/${clientUserProperty?.property?.id}/tenants/applications/${row.original.id}`}
								>
									<DropdownMenuItem>View</DropdownMenuItem>
								</Link>
								<DropdownMenuSeparator />
								{row.original.status ===
								'TenantApplication.Status.InProgress' ? (
									<>
										<DropdownMenuItem
											className="flex items-center gap-2 text-rose-600 hover:bg-red-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600"
											onClick={() => {
												setSelectedApplication(row.original)
												setOpenCancelModal(true)
											}}
										>
											<CircleX className="h-4 w-4" />
											<span>Cancel</span>
										</DropdownMenuItem>
										<DropdownMenuItem
											className="flex items-center gap-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600"
											onClick={() => {
												setSelectedApplication(row.original)
												setOpenApproveModal(true)
											}}
										>
											<CircleCheck className="h-4 w-4" />
											<span>Approve</span>
										</DropdownMenuItem>
									</>
								) :  null}
								{row.original.status === 'TenantApplication.Status.Cancelled' ? (
										<DropdownMenuItem
											className="flex items-center gap-2 text-rose-600 hover:bg-red-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600"
											onClick={() => {
												setSelectedApplication(row.original)
												setOpenDeleteModal(true)
											}}
										>
											<Trash2 className="h-4 w-4" />
											<span>Delete</span>
										</DropdownMenuItem>
									) : null}
							</DropdownMenuContent>
						</DropdownMenu>
					)
				},
			},
		]
	}, [clientUserProperty])

	return (
		<div className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
			<div>
				<TypographyH4>Manage Tenant Applications</TypographyH4>
				<TypographyMuted>
					Manage all tenant applications in one place. You can quickly create
					new entries or accept, deny, and delete existing ones.
				</TypographyMuted>
			</div>
			<PropertyTenantApplicationsController
				isLoading={isLoading}
				refetch={refetch}
			/>
			<div className="h-full w-full">
				<DataTable
					columns={columns}
					isLoading={isLoading}
					refetch={refetch}
					error={error ? 'Failed to load tenant applications.' : undefined}
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
						message: 'No tenant applications found',
						description:
							"Try adjusting your search to find what you're looking for.",
					}}
				/>
			</div>

			<CancelTenantApplicationModal
				opened={openCancelModal}
				setOpened={setOpenCancelModal}
				refetch={refetch}
				data={selectedApplication}
			/>

			<ApproveTenantApplicationModal
				opened={openApproveModal}
				setOpened={setOpenApproveModal}
				refetch={refetch}
				data={selectedApplication}
			/>

			<DeleteTenantApplicationModal
				opened={openDeleteModal}
				setOpened={setOpenDeleteModal}
				data={selectedApplication}
			/>
		</div>
	)
}
