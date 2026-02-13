import { useQueryClient } from '@tanstack/react-query'
import {
	Briefcase,
	Building2,
	ChevronDown,
	Home,
	LayoutGrid,
	Pencil,
	Store,
	Trash,
} from 'lucide-react'
import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate, useRevalidator, useRouteLoaderData } from 'react-router'
import { toast } from 'sonner'
import DeletePropertyUnitModal from '../delete'
import {
	useMakePropertyUnitAvailable,
	useMakePropertyUnitDraft,
	useMakePropertyUnitMaintenance,
} from '~/api/units'
import { Image } from '~/components/Image'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '~/components/ui/tooltip'
import {
	TypographyH4,
	TypographyMuted,
	TypographyP,
} from '~/components/ui/typography'
import { QUERY_KEYS } from '~/lib/constants'
import { formatAmount } from '~/lib/format-amount'
import { getPropertyUnitStatusLabel } from '~/lib/properties.utils'
import { safeString, toFirstUpperCase } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useProperty } from '~/providers/property-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId.assets.units.$unitId'

function getStatusBadgeClass(status: PropertyUnit['status']) {
	switch (status) {
		case 'Unit.Status.Available':
			return 'bg-teal-500 text-white'
		case 'Unit.Status.Maintenance':
			return 'bg-yellow-500 text-white'
		case 'Unit.Status.Occupied':
			return 'bg-rose-500 text-white'
		case 'Unit.Status.Draft':
		default:
			return 'bg-zinc-600 text-white'
	}
}

const unitTypeIcons: Record<PropertyUnit['type'], typeof Building2> = {
	APARTMENT: Building2,
	HOUSE: Home,
	STUDIO: LayoutGrid,
	OFFICE: Briefcase,
	RETAIL: Store,
}

const paymentFrequencyLabels: Record<
	PropertyUnit['payment_frequency'],
	string
> = {
	WEEKLY: 'Weekly',
	DAILY: 'Daily',
	MONTHLY: 'Monthly',
	QUARTERLY: 'Quarterly',
	BIANNUALLY: 'Biannually',
	ANNUALLY: 'Annually',
}

const selectableStatuses: Array<{
	value: PropertyUnit['status']
	label: string
	description: string
}> = [
	{ value: 'Unit.Status.Draft', label: 'Draft', description: 'Not visible to tenants' },
	{ value: 'Unit.Status.Available', label: 'Available', description: 'Ready for tenant applications' },
	{ value: 'Unit.Status.Maintenance', label: 'Maintenance', description: 'Temporarily unavailable' },
]

export function PropertyAssetUnitModule() {
	const loaderData = useRouteLoaderData<Awaited<ReturnType<typeof loader>>>('routes/_auth.properties.$propertyId.assets.units.$unitId')
	const { pathname } = useLocation()
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const revalidator = useRevalidator()
	const { clientUserProperty } = useProperty()
	const { mutate: makeDraft, isPending: isDrafting } = useMakePropertyUnitDraft()
	const { mutate: makeAvailable, isPending: isMakingAvailable } = useMakePropertyUnitAvailable()
	const { mutate: makeMaintenance, isPending: isMakingMaintenance } = useMakePropertyUnitMaintenance()
	const isUpdatingStatus = isDrafting || isMakingAvailable || isMakingMaintenance
	const [openDeleteModal, setOpenDeleteModal] = useState(false)
	const unit = loaderData?.unit

	if (!unit) {
		return (
			<div className="flex h-full items-center justify-center p-10">
				<TypographyH4>Unit not found</TypographyH4>
			</div>
		)
	}

	const TypeIcon = unitTypeIcons[unit.type] ?? Building2
	const baseUrl = `/properties/${unit.property_id}/assets/units/${unit.id}`
	const property_id = safeString(clientUserProperty?.property?.id)
	const isOccupied = unit.status === 'Unit.Status.Occupied'
	const isEditable = unit.status === 'Unit.Status.Draft' || unit.status === 'Unit.Status.Maintenance'

	const handleStatusChange = (newStatus: PropertyUnit['status']) => {
		const statusProps = { propertyId: property_id, unitId: unit.id }
		const callbacks = {
			onError: () => toast.error('Failed to update status. Try again later.'),
			onSuccess: () => {
				toast.success('Unit status updated')
				void revalidator.revalidate()
				void queryClient.invalidateQueries({
					queryKey: [QUERY_KEYS.PROPERTY_UNITS],
				})
			},
		}

		switch (newStatus) {
			case 'Unit.Status.Draft':
				makeDraft(statusProps, callbacks)
				break
			case 'Unit.Status.Available':
				makeAvailable(statusProps, callbacks)
				break
			case 'Unit.Status.Maintenance':
				makeMaintenance(statusProps, callbacks)
				break
		}
	}

	return (
		<div className="m-5 grid grid-cols-12 gap-6">
			{/* Sidebar */}
			<div className="col-span-12 lg:col-span-4">
				<Card className="overflow-hidden shadow-none pt-0">
					<div className="h-full w-full overflow-hidden">
						<Image
							className="h-full w-full object-cover"
							src={unit.images?.[0] ?? 'https://placehold.co/600x400'}
							alt={unit.name}
						/>
					</div>

					{unit.images && unit.images.length > 1 && (
						<div className="flex gap-2 overflow-x-auto px-4 pt-3">
							{unit.images.map((img, i) => (
								<div
									key={img}
									className="h-14 w-14 shrink-0 overflow-hidden rounded-md border"
								>
									<Image
										className="h-full w-full object-cover"
										src={img}
										alt={`${unit.name} image ${i + 1}`}
									/>
								</div>
							))}
						</div>
					)}

					<CardHeader className="flex items-start justify-between">
						<CardTitle className="text-lg">{unit.name}</CardTitle>
						<CardAction>
							{isOccupied ? (
								<Badge
									variant="outline"
									className={getStatusBadgeClass(unit.status)}
								>
									{getPropertyUnitStatusLabel(unit.status)}
								</Badge>
							) : (
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											disabled={isUpdatingStatus}
											className={cn(
												'gap-1.5 border-none text-xs',
												getStatusBadgeClass(unit.status),
											)}
										>
											{getPropertyUnitStatusLabel(unit.status)}
											<ChevronDown className="size-3" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-56">
										{selectableStatuses.map((option) => (
											<DropdownMenuItem
												key={option.value}
												disabled={unit.status === option.value}
												onClick={() => handleStatusChange(option.value)}
												className="flex items-start gap-2 py-2"
											>
												<Badge
													variant="outline"
													className={cn('mt-1 size-2 shrink-0 rounded-full p-0', getStatusBadgeClass(option.value))}
												/>
												<div>
													<p className="text-sm font-medium">{option.label}</p>
													<p className="text-muted-foreground text-xs">{option.description}</p>
												</div>
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							)}
						</CardAction>
					</CardHeader>

					<CardContent className="space-y-4">
						<div className="flex items-center gap-2 text-sm">
							<TypeIcon size={16} className="text-zinc-500" />
							<TypographyP className="!mt-0">
								{toFirstUpperCase(unit.type)}
							</TypographyP>
						</div>

						<Separator />

						<div className='space-y-1'>
							<TypographyMuted className="text-xs">Rent Fee</TypographyMuted>
							<p className="text-2xl font-semibold">
								{formatAmount(unit.rent_fee)}
							</p>
							<TypographyMuted className="text-xs">
								{paymentFrequencyLabels[unit.payment_frequency]}
							</TypographyMuted>
						</div>
					</CardContent>

					<CardFooter className="flex justify-end gap-2 border-t pt-4">
						<PropertyPermissionGuard roles={['MANAGER']}>
							{isEditable ? (
								<Link to={`${baseUrl}/edit`}>
									<Button variant="outline" size="sm">
										<Pencil className="mr-1 size-4" />
										Edit
									</Button>
								</Link>
							) : (
								<Tooltip>
									<TooltipTrigger asChild>
										<span tabIndex={0} className="cursor-not-allowed">
											<Button variant="outline" size="sm" disabled className="pointer-events-none">
												<Pencil className="mr-1 size-4" />
												Edit
											</Button>
										</span>
									</TooltipTrigger>
									<TooltipContent side="top">
										{isOccupied
											? 'This unit is occupied. Status will update automatically when the lease ends.'
											: 'Switch this unit to Draft or Maintenance to enable editing.'}
									</TooltipContent>
								</Tooltip>
							)}
							{isEditable ? (
								<Button
									variant="destructive"
									size="sm"
									onClick={() => setOpenDeleteModal(true)}
								>
									<Trash className="mr-1 size-4" />
									Delete
								</Button>
							) : (
								<Tooltip>
									<TooltipTrigger asChild>
										<span tabIndex={0} className="cursor-not-allowed">
											<Button variant="destructive" size="sm" disabled className="pointer-events-none">
												<Trash className="mr-1 size-4" />
												Delete
											</Button>
										</span>
									</TooltipTrigger>
									<TooltipContent side="top">
										{isOccupied
											? 'This unit is occupied and cannot be deleted.'
											: 'Switch this unit to Draft or Maintenance to delete it.'}
									</TooltipContent>
								</Tooltip>
							)}
						</PropertyPermissionGuard>
					</CardFooter>
				</Card>

			</div>

			{/* Main Content with Tabs */}
			<div className="col-span-12 lg:col-span-8">
				<Tabs value={pathname}>
					<TabsList>
						<Link to={baseUrl}>
							<TabsTrigger value={baseUrl}>Details</TabsTrigger>
						</Link>
						<Link to={`${baseUrl}/leases`}>
							<TabsTrigger value={`${baseUrl}/leases`}>Leases</TabsTrigger>
						</Link>
						<Link to={`${baseUrl}/maintenance-requests`}>
							<TabsTrigger value={`${baseUrl}/maintenance-requests`}>
								Maintenance Requests
							</TabsTrigger>
						</Link>
						<Link to={`${baseUrl}/reviews`}>
							<TabsTrigger value={`${baseUrl}/reviews`}>
								Tenant Reviews
							</TabsTrigger>
						</Link>
					</TabsList>
					<TabsContent value={pathname}>
						<Outlet context={{ unit }} />
					</TabsContent>
				</Tabs>
			</div>

			<DeletePropertyUnitModal
				opened={openDeleteModal}
				setOpened={(open) => {
					setOpenDeleteModal(open)
					if (!open) {
						void navigate(
							`/properties/${unit.property_id}/assets/units`,
						)
					}
				}}
				data={unit}
			/>
		</div>
	)
}
