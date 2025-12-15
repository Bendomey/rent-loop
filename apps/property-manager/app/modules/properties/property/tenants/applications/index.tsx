import type { ColumnDef } from '@tanstack/react-table'
import { CircleCheck, CircleX, EllipsisVertical, User } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
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
import { safeString } from '~/lib/strings'
import { useProperty } from '~/providers/property-provider'

const applications: TenantApplication[] = [
	{
		id: 'app_001',
		first_name: 'John',
		other_names: null,
		last_name: 'Mensah',
		email: 'john.mensah@example.com',
		phone: '+233501234567',
		gender: 'MALE',
		date_of_birth: '1993-04-12',
		nationality: 'Ghanaian',
		marital_status: 'SINGLE',
		profile_photo_url: null,
		id_type: 'NATIONAL_ID',
		id_number: 'GHA-02938475',
		id_front_url: null,
		id_back_url: null,
		status: 'TenantApplication.Status.InProgress',
		current_address: 'East Legon, Accra',
		emergency_contact_name: 'Kofi Mensah',
		emergency_contact_phone: '+233209876543',
		relationship_to_emergency_contact: 'Brother',
		occupation: 'Software Developer',
		employer: 'TechHub Ghana',
		occupation_address: 'Airport City',
		proof_of_income_url: null,
		completed_at: null,
		completed_by_id: null,
		completed_by: null,
		cancelled_at: null,
		cancelled_by_id: null,
		cancelled_by: null,
		desired_unit_id: 'unit_1',
		desired_unit: { name: 'Unit 203' },
		previous_landlord_name: null,
		previous_landlord_phone: null,
		previous_tenancy_period: null,
		created_at: new Date(),
		updated_at: new Date(),
	},

	{
		id: 'app_002',
		first_name: 'Angela',
		other_names: 'Naa',
		last_name: 'Owusu',
		email: 'angela.owusu@example.com',
		phone: '+233551234567',
		gender: 'FEMALE',
		date_of_birth: '1989-08-22',
		nationality: 'Ghanaian',
		marital_status: 'MARRIED',
		profile_photo_url: null,
		id_type: 'PASSPORT',
		id_number: 'P1234567',
		id_front_url: null,
		id_back_url: null,
		status: 'TenantApplication.Status.Completed',
		current_address: 'Dansoman, Accra',
		emergency_contact_name: 'Michael Owusu',
		emergency_contact_phone: '+233201112233',
		relationship_to_emergency_contact: 'Husband',
		occupation: 'Nurse',
		employer: 'Korle-Bu Teaching Hospital',
		occupation_address: 'Korle-Bu',
		proof_of_income_url: null,
		completed_at: new Date(),
		completed_by_id: 'user_1',
		completed_by: null,
		cancelled_at: null,
		cancelled_by_id: null,
		cancelled_by: null,
		desired_unit_id: 'unit_1',
		desired_unit: { name: 'Unit 3' },
		previous_landlord_name: 'Mrs. Yeboah',
		previous_landlord_phone: '+233208554433',
		previous_tenancy_period: '2 years',
		created_at: new Date(),
		updated_at: new Date(),
	},

	{
		id: 'app_003',
		first_name: 'Kwame',
		other_names: null,
		last_name: 'Boateng',
		email: 'kwame.boateng@example.com',
		phone: '+233241234999',
		gender: 'MALE',
		date_of_birth: '1990-11-05',
		nationality: 'Ghanaian',
		marital_status: 'DIVORCED',
		profile_photo_url: null,
		id_type: 'DRIVERS_LICENSE',
		id_number: 'DL-983274',
		id_front_url: null,
		id_back_url: null,
		status: 'TenantApplication.Status.Cancelled',
		current_address: 'Tema Community 9',
		emergency_contact_name: 'Adwoa Boateng',
		emergency_contact_phone: '+233202224444',
		relationship_to_emergency_contact: 'Sister',
		occupation: 'Electrician',
		employer: 'PowerTech Services',
		occupation_address: 'Tema Heavy Industrial Area',
		proof_of_income_url: null,
		completed_at: null,
		completed_by_id: null,
		completed_by: null,
		cancelled_at: new Date(),
		cancelled_by_id: 'user_1',
		cancelled_by: null,
		desired_unit_id: 'unit_1',
		desired_unit: { name: 'Unit 101' },
		previous_landlord_name: null,
		previous_landlord_phone: null,
		previous_tenancy_period: null,
		created_at: new Date(),
		updated_at: new Date(),
	},

	{
		id: 'app_004',
		first_name: 'Linda',
		other_names: null,
		last_name: 'Addo',
		email: 'linda.addo@example.com',
		phone: '+233271111222',
		gender: 'FEMALE',
		date_of_birth: '1997-01-15',
		nationality: 'Ghanaian',
		marital_status: 'SINGLE',
		profile_photo_url: null,
		id_type: 'STUDENT_ID',
		id_number: 'UG-STU-92837',
		id_front_url: null,
		id_back_url: null,
		status: 'TenantApplication.Status.InProgress',
		current_address: 'Legon Campus',
		emergency_contact_name: 'Ama Addo',
		emergency_contact_phone: '+233209887733',
		relationship_to_emergency_contact: 'Mother',
		occupation: 'Student',
		employer: 'University of Ghana',
		occupation_address: 'Legon',
		proof_of_income_url: null,
		completed_at: null,
		completed_by_id: null,
		completed_by: null,
		cancelled_at: null,
		cancelled_by_id: null,
		cancelled_by: null,
		desired_unit_id: 'unit_1',
		desired_unit: { name: 'Unit 31' },
		previous_landlord_name: null,
		previous_landlord_phone: null,
		previous_tenancy_period: null,
		created_at: new Date(),
		updated_at: new Date(),
	},

	{
		id: 'app_005',
		first_name: 'Samuel',
		other_names: 'K.',
		last_name: 'Amoah',
		email: 'samuel.amoah@example.com',
		phone: '+233592221234',
		gender: 'MALE',
		date_of_birth: '1985-06-30',
		nationality: 'Ghanaian',
		marital_status: 'MARRIED',
		profile_photo_url: null,
		id_type: 'NATIONAL_ID',
		id_number: 'GHA-88374622',
		id_front_url: null,
		id_back_url: null,
		status: 'TenantApplication.Status.InProgress',
		current_address: 'Koforidua',
		emergency_contact_name: 'Rita Amoah',
		emergency_contact_phone: '+233503345566',
		relationship_to_emergency_contact: 'Wife',
		occupation: 'Teacher',
		employer: 'St. Peter’s SHS',
		occupation_address: 'Nkwatia',
		proof_of_income_url: null,
		completed_at: null,
		completed_by_id: null,
		completed_by: null,
		cancelled_at: null,
		cancelled_by_id: null,
		cancelled_by: null,
		desired_unit_id: 'unit_1',
		desired_unit: null,
		previous_landlord_name: 'Mr. Lamptey',
		previous_landlord_phone: '+233243332221',
		previous_tenancy_period: '1 year',
		created_at: new Date(),
		updated_at: new Date(),
	},
]

export function PropertyTenantApplicationsModule() {
	const [searchParams] = useSearchParams()
	const { clientUserProperty } = useProperty()

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
			property_id: safeString(clientUserProperty?.property?.id),
			filters: {
				status: status,
				gender: gender,
				marital_status: marital_status,
			},
			pagination: { page, per },
			populate: ['CreatedBy'],
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
				id: 'drag',
				header: () => null,
				cell: () => <User />,
			},
			{
				accessorKey: 'name',
				header: 'Name',
				cell: ({ row }) => {
					return (
						<div className="min-w-32">
							<span className="truncate text-xs text-zinc-600">
								{`${row.original.first_name} ${row.original.other_names} ${row.original.last_name}`}
							</span>
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
					// TODO: Uncomment when API is ready
					// error={error ? 'Failed to load tenant applications.' : undefined}
					dataResponse={{
						rows: data?.rows ?? applications,
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
		</div>
	)
}
