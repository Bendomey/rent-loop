import { ChevronDown, Plus, RotateCw, ToggleLeft } from 'lucide-react'
import { Link } from 'react-router'
import { FilterSet } from '~/components/filter-set'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { SearchInput } from '~/components/search'
import { Button } from '~/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/lib/utils'
import { useProperty } from '~/providers/property-provider'

const AddTenantButton = ({
	propertyId,
	modes,
}: {
	propertyId?: string
	modes?: Property['modes']
}) => {
	const base = `/properties/${propertyId}/occupancy`
	const hasLease = modes?.includes('LEASE')
	const hasBooking = modes?.includes('BOOKING')

	if (hasLease && hasBooking) {
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="default"
						size="sm"
						className="bg-rose-600 text-white hover:bg-rose-700"
					>
						<Plus className="size-4" />
						Add Tenant
						<ChevronDown className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem asChild>
						<Link to={`${base}/applications/new`}>New Tenant Application</Link>
					</DropdownMenuItem>
					<DropdownMenuItem asChild>
						<Link to={`${base}/bookings/new`}>New Guest Booking</Link>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		)
	}

	const to = hasBooking
		? `${base}/bookings/new`
		: `${base}/applications/new`

	return (
		<Link to={to}>
			<Button
				variant="default"
				size="sm"
				className="bg-rose-600 text-white hover:bg-rose-700"
			>
				<Plus className="size-4" />
				Add Tenant
			</Button>
		</Link>
	)
}

const filters: Array<Filter> = [
	{
		id: 1,
		type: 'selector',
		selectType: 'single',
		label: 'Status',
		value: {
			options: [
				{ label: 'Active', value: 'ACTIVE' },
				{ label: 'Expired', value: 'EXPIRED' },
			],
			urlParam: 'status',
			defaultValues: [],
		},
		Icon: ToggleLeft,
	},
]

export const PropertyTenantsController = ({
	isLoading,
	refetch,
}: {
	isLoading: boolean
	refetch: VoidFunction
}) => {
	const { clientUserProperty } = useProperty()

	return (
		<div className="flex w-full flex-col gap-2">
			<div className="w-full rounded-md border p-4">
				<div className="flex w-full flex-wrap items-center gap-2 text-sm">
					<FilterSet label="Filters" urlParam="filters" filters={filters} />
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2 text-sm">
					<SearchInput placeholder="Search tenants..." />
				</div>
				<div className="flex items-center justify-end gap-2">
					<PropertyPermissionGuard roles={['MANAGER']}>
						<AddTenantButton propertyId={clientUserProperty?.property_id} modes={clientUserProperty?.property?.modes} />
					</PropertyPermissionGuard>

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
		</div>
	)
}
