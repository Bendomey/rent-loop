import type { ColumnDef } from '@tanstack/react-table'
import {
	CircleCheck,
	CircleX,
	Edit,
	EllipsisVertical,
	Eye,
	RotateCw,
	Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PaymentAccountsController } from './controller'
import { useGetPaymentAccounts } from '~/api/payment-accounts'
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
import {
	getPaymentAccountTypeLabel,
	getPaymentAccountStatusLabel,
} from '~/lib/payment-account.utils'
import { paymentIcons } from '~/lib/payment-account.utils'
import { cn } from '~/lib/utils'
import DeletePaymentAccountModal from './delete'

export function PaymentAccountsModule() {
	const [selectedPaymentAccount, setSelectedPaymentAccount] =
			useState<PaymentAccount>()
		const [openDeletePaymentAccountModal, setOpenDeletePaymentAccountModal] =
			useState(false)
	const [searchParams] = useSearchParams()

	const page = searchParams.get('page')
		? Number(searchParams.get('page'))
		: PAGINATION_DEFAULTS.PAGE
	const per = searchParams.get('pageSize')
		? Number(searchParams.get('pageSize'))
		: PAGINATION_DEFAULTS.PER_PAGE
	const rail = searchParams.get('rail') ?? undefined
	const status = searchParams.get('status') ?? undefined

	const { data, isPending, isRefetching, error, refetch } =
		useGetPaymentAccounts({
			filters: { rail: rail, status: status, owner_types: ['PROPERTY_OWNER', 'SYSTEM'] },
			pagination: { page, per },
			sorter: { sort: 'desc', sort_by: 'created_at' },
		})

	const isLoading = isPending || isRefetching

	const columns: ColumnDef<PaymentAccount>[] = useMemo(() => {
		return [
			{
				id: 'drag',
				header: () => null,
				accessorKey: 'rail',
				cell: ({ getValue }) => {
					const value = getValue<PaymentAccount['rail']>()
					const Icon = paymentIcons[value]

					return Icon ? <Icon className="size-5 text-zinc-500" /> : null
				},
			},
			{
				accessorKey: 'identifier',
				header: 'Account Number',
				cell: ({ getValue }) => {
					return (
						<div className="min-w-32">
							<span className="truncate text-xs text-zinc-600">
								{getValue<string>()}
							</span>
						</div>
					)
				},
			},
			{
				accessorKey: 'rail',
				header: 'Account Type',
				cell: ({ getValue }) => (
					<span className="truncate text-xs text-zinc-600">
						{getPaymentAccountTypeLabel(getValue<PaymentAccount['rail']>())}
					</span>
				),
			},
			{
				accessorKey: 'is_default',
				header: 'Is Default',
				cell: ({ getValue }) => {
					const isDefault = getValue<boolean>()

					return (
						<Badge
							variant="outline"
							className={
								isDefault
									? 'border-emerald-600 bg-emerald-50 text-emerald-600'
									: 'border-zinc-300 bg-zinc-50 text-zinc-500'
							}
						>
							{isDefault ? (
								<>
									{' '}
									<CircleCheck className="mr-1 h-3.5 w-3.5" /> Yes
								</>
							) : (
								'No'
							)}
						</Badge>
					)
				},
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ getValue }) => (
					<Badge variant="outline" className="text-muted-foreground px-1.5">
						{getValue<PaymentAccount['status']>() ===
							'PaymentAccount.Status.Active' ? (
							<CircleCheck className="fill-green-600 text-white" />
						) : (
							<CircleX className="fill-red-500 text-white" />
						)}
						{getPaymentAccountStatusLabel(getValue<PaymentAccount['status']>())}
					</Badge>
				),
			},
			{
				id: 'actions',
				cell: ({row}) => (
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
						<DropdownMenuContent align="end" className="w-36">
							<DropdownMenuItem>
								<Eye className="h-4 w-4" /> View
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<Edit className="h-4 w-4" /> Edit
							</DropdownMenuItem>
							<DropdownMenuItem className="flex items-center gap-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600 focus:bg-emerald-50 focus:text-emerald-600">
								<CircleCheck className="h-4 w-4" />
								<span>Make Default</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="flex items-center gap-2 text-rose-600 hover:bg-red-50 hover:text-rose-600 focus:bg-rose-50 focus:text-rose-600"
							onClick={() => {
								setSelectedPaymentAccount(row.original)
								setOpenDeletePaymentAccountModal(true)
								}}>
								<Trash2 className="h-4 w-4" />
								<span>Delete</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				),
			},
		]
	}, [])

	return (
		<main className="space-y-4">
			<div className="flex flex-row items-center justify-between">
				<div>
					<TypographyH4>Manage Payment Accounts</TypographyH4>
					<TypographyMuted>
						Manage your payment accounts and billing information.
					</TypographyMuted>
				</div>
				<div className="flex items-center justify-end gap-2">
					{/* <Button
						variant="default"
						size="sm"
						className="bg-rose-600 text-white hover:bg-rose-700"
					>
						<Plus className="size-4" />
						Add Payment Account
					</Button> */}
					<Button
						onClick={() => refetch()}
						disabled={isLoading}
						variant="outline"
						size="sm"
					>
						<RotateCw className={cn('size-4', { 'animate-spin': isLoading })} />
						Refresh
					</Button>
				</div>
			</div>
			<PaymentAccountsController />
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
						message: 'No payment accounts found',
						description:
							"Try adjusting your search or filter to find what you're looking for.",
						// button: {
						// 	label: 'Add Payment Account',
						// 	onClick: () => {
						// 		Handle button click
						// 	},
						// },
					}}
				/>
			</div>
			<DeletePaymentAccountModal
							opened={openDeletePaymentAccountModal}
							setOpened={setOpenDeletePaymentAccountModal}
							data={selectedPaymentAccount}
						/>
		</main>
	)
}
