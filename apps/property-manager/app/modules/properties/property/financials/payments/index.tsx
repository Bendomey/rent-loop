import type { ColumnDef } from '@tanstack/react-table'
import {
	CircleCheck,
	CircleX,
	ClockAlert,
	EllipsisVertical,
	Loader,
	User,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { RentPaymentSectionCards } from './components/cards'
import { PropertyFinancialsRentPaymentController } from './controller'
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
import { formatAmount } from '~/lib/format-amount'
import {
	getPaymentMethodLabel,
	getPaymentStatusLabel,
} from '~/lib/payment.utils'
import { useProperty } from '~/providers/property-provider'

const data = {
	rows: [
		{
			id: 'pay_001',
			amount: 2500,
			reference: 'REF-2025-0001',
			payment_method: 'BANK_TRANSFER',
			status: 'Payment.Status.Successful',
			email: 'gideon@example.com',
			tenant_id: 'tenant_001',
			tenant: {
				id: 'tenant_001',
				first_name: 'Gideon',
				last_name: 'Bempong',
			},
			successful_at: new Date('2025-01-05T10:15:00'),
			failed_at: null,
			expired_at: null,
			currency: 'GHS',
			created_at: new Date('2025-01-05T09:50:00'),
			updated_at: new Date('2025-01-05T10:15:00'),
		},
		{
			id: 'pay_002',
			amount: 1800,
			reference: 'REF-2025-0002',
			payment_method: 'CREDIT_CARD',
			status: 'Payment.Status.Pending',
			email: 'ama@example.com',
			tenant_id: 'tenant_002',
			tenant: {
				id: 'tenant_002',
				first_name: 'Ama Mensah',
				last_name: 'Bempong',
			},
			successful_at: null,
			failed_at: null,
			expired_at: null,
			currency: 'GHS',
			created_at: new Date('2025-01-10T14:20:00'),
			updated_at: new Date('2025-01-10T14:20:00'),
		},
		{
			id: 'pay_003',
			amount: 3000,
			reference: 'REF-2025-0003',
			payment_method: 'CASH',
			status: 'Payment.Status.Failed',
			email: 'kwame@example.com',
			tenant_id: 'tenant_003',
			tenant: {
				id: 'tenant_003',
				first_name: 'Kwame ',
				last_name: 'Asare',
			},
			successful_at: null,
			failed_at: new Date('2025-01-12T11:05:00'),
			expired_at: null,
			currency: 'GHS',
			created_at: new Date('2025-01-12T10:40:00'),
			updated_at: new Date('2025-01-12T11:05:00'),
		},
		{
			id: 'pay_004',
			amount: 1500,
			reference: 'REF-2025-0004',
			payment_method: 'CHECK',
			status: 'Payment.Status.Expired',
			email: 'efua@example.com',
			tenant_id: 'tenant_004',
			tenant: {
				id: 'tenant_004',
				first_name: 'Efua ',
				last_name: 'Owusu',
			},
			successful_at: null,
			failed_at: null,
			expired_at: new Date('2025-01-15T23:59:59'),
			currency: 'GHS',
			created_at: new Date('2025-01-13T08:30:00'),
			updated_at: new Date('2025-01-15T23:59:59'),
		},
		{
			id: 'pay_005',
			amount: 4200,
			reference: 'REF-2025-0005',
			payment_method: 'MOMO',
			status: 'Payment.Status.Successful',
			email: 'john@example.com',
			tenant_id: 'tenant_005',
			tenant: {
				id: 'tenant_005',
				first_name: 'John ',
				last_name: 'Tetteh',
			},
			successful_at: new Date('2025-01-18T16:45:00'),
			failed_at: null,
			expired_at: null,
			currency: 'GHS',
			created_at: new Date('2025-01-18T16:10:00'),
			updated_at: new Date('2025-01-18T16:45:00'),
		},
		{
			id: 'pay_006',
			amount: 2000,
			reference: 'REF-2025-0006',
			payment_method: 'CASH',
			status: 'Payment.Status.Pending',
			email: 'yaw@example.com',
			tenant_id: 'tenant_006',
			tenant: {
				id: 'tenant_006',
				first_name: 'Yaw ',
				last_name: 'Boateng',
			},
			successful_at: null,
			failed_at: null,
			expired_at: null,
			currency: 'GHS',
			created_at: new Date('2025-01-20T09:00:00'),
			updated_at: new Date('2025-01-20T09:00:00'),
		},
	] as Payment[],
	meta: {
		total: 150,
		page: 1,
		page_size: 50,
		order: 'desc',
		order_by: 'created_at',
		has_prev_page: false,
		has_next_page: true,
	},
}

const isPending = false
const isRefetching = false
const error = null
const refetch = () => {}

export function PropertyFinancialsPaymentsModule() {
	const [searchParams] = useSearchParams()
	const { clientUserProperty } = useProperty()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const payment_method = searchParams.get('payment_method') ?? undefined
	const status = searchParams.get('status') ?? undefined

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<Payment>[] = useMemo(() => {
		return [
			{
				id: 'id',
				header: () => null,
				cell: ({ row }) => {
					if (row.original.tenant.profile_photo_url) {
						return (
							<img
								src={row.original.tenant.profile_photo_url}
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
				accessorKey: 'tenant',
				header: 'Tenant',
				cell: ({ row }) => {
					return (
						<div className="">
							<Link
								to={`/properties/${clientUserProperty?.property_id}/financials/payments/${row.original.id}`}
								aria-label={`View details for application`}
							>
								<span className="truncate text-xs text-blue-600 hover:underline">
									{`${row.original.tenant.first_name} ${row.original.tenant.other_names ? row.original.tenant.other_names + ' ' : ''}${row.original.tenant.last_name}`}
								</span>
							</Link>
						</div>
					)
				},
				enableHiding: false,
			},
			{
				accessorKey: 'amount',
				header: 'Amount',
				cell: ({ row }) => (
					<span className="truncate text-xs font-semibold text-zinc-800">
						{formatAmount(row.original.amount) ?? 'N/A'}
					</span>
				),
			},
			{
				accessorKey: 'payment_method',
				header: 'Payment Method',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						<span className="truncate text-xs text-zinc-600">
							{getPaymentMethodLabel(getValue<Payment['payment_method']>())}
						</span>
					</Badge>
				),
			},
			{
				accessorKey: 'reference',
				header: 'Reference',
				cell: ({ getValue }) => (
					<span className="truncate text-xs text-zinc-600">
						{getValue<string>() ?? 'N/A'}
					</span>
				),
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						{getValue<string>() === 'Payment.Status.Pending' ? (
							<Loader className="text-yellow-600" />
						) : getValue<string>() === 'Payment.Status.Successful' ? (
							<CircleCheck className="fill-green-600 text-white" />
						) : getValue<string>() === 'Payment.Status.Expired' ? (
							<ClockAlert className="text-red-600" />
						) : (
							<CircleX className="fill-red-500 text-white" />
						)}
						{getPaymentStatusLabel(getValue<Payment['status']>())}
					</Badge>
				),
			},

			{
				accessorKey: 'created_at',
				header: 'Payment Date',
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
									to={`/properties/${clientUserProperty?.property?.id}/financials/payments/${row.original.id}`}
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
			<div className="space-y-1">
				<TypographyH4>Manage Payments</TypographyH4>
				<TypographyMuted>
					Monitor tenant payments, track statuses, and manage overdue
					balances efficiently.
				</TypographyMuted>
			</div>

			{/* Summary Cards */}
			<section className="mb-6">
				<RentPaymentSectionCards />
			</section>

			<div className="bg-background space-y-4 rounded-lg border p-3 sm:p-5">
				<PropertyFinancialsRentPaymentController
					isLoading={isLoading}
					refetch={refetch}
				/>
				<div className="h-full w-full">
					<DataTable
						columns={columns}
						isLoading={isLoading}
						refetch={refetch}
						error={error ? 'Failed to load payments.' : undefined}
						dataResponse={{
							rows: data?.rows ?? [],
							total: data?.meta?.total ?? 0,
							page,
							page_size: per,
							order: 'desc',
							// order: data?.meta?.order ?? 'desc',
							order_by: data?.meta?.order_by ?? 'created_at',
							has_prev_page: data?.meta?.has_prev_page ?? false,
							has_next_page: data?.meta?.has_next_page ?? false,
						}}
						empty={{
							message: 'No payments found',
							description:
								"Try adjusting your search to find what you're looking for.",
						}}
					/>
				</div>
			</div>
		</div>
	)
}
