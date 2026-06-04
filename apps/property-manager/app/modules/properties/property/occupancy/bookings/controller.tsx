import { ChevronDown, Copy, ExternalLink, Info, Link2, RotateCw, ToggleLeft, UserCog } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { getPropertyUnits, useGetPropertyUnits } from '~/api/units'
import { FilterSet } from '~/components/filter-set'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { PAGINATION_DEFAULTS, WEBSITE_URL } from '~/lib/constants'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

function GuestLinkModal({
	open,
	onOpenChange,
	propertySlug,
	clientId,
	propertyId,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	propertySlug: string | null | undefined
	clientId: string
	propertyId: string
}) {
	const [selectedUnitId, setSelectedUnitId] = useState('')

	const { data: unitsData, isPending } = useGetPropertyUnits(clientId, {
		property_id: propertyId,
		pagination: { per: 100 },
		filters: {},
	})
	const units = (unitsData?.rows ?? []).filter(
		(u) =>
			u.status === 'Unit.Status.Available' ||
			u.status === 'Unit.Status.PartiallyOccupied',
	)

	const selectedUnit = units.find((u) => u.id === selectedUnitId)
	const bookingUrl =
		propertySlug && selectedUnit?.slug
			? `${WEBSITE_URL}/book/${propertySlug}/${selectedUnit.slug}`
			: null

	const handleOpenChange = (next: boolean) => {
		if (!next) setSelectedUnitId('')
		onOpenChange(next)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Link2 className="size-4 text-rose-500" />
						Guest Booking Link
					</DialogTitle>
					<DialogDescription>
						Select a unit to generate a self-booking link you can share with
						your guest.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					<div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
						<Info className="mt-0.5 size-4 shrink-0 text-yellow-600" />
						<p className="text-xs text-yellow-700 dark:text-yellow-400">
							Only available units are listed. If a unit is missing, make sure
							it's not in draft or occupied state.{' '}
							<a
								href={`/properties/${propertyId}/assets/units`}
								className="underline underline-offset-2"
							>
								Manage units
							</a>
						</p>
					</div>

					<div className="space-y-1.5">
						<Select
							value={selectedUnitId}
							onValueChange={setSelectedUnitId}
							disabled={isPending}
						>
							<SelectTrigger className='w-full'>
								<SelectValue placeholder="Select a unit" />
							</SelectTrigger>
							<SelectContent >
								{units.map((u) => (
									<SelectItem key={u.id} value={u.id}>
										{u.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{selectedUnitId ? (
						bookingUrl ? (
							<div className="bg-muted/40 space-y-3 rounded-lg border p-4">
								<p className="text-muted-foreground text-[10px] font-light tracking-widest uppercase">
									Booking URL
								</p>
								<p className="font-mono text-sm break-all">{bookingUrl}</p>
								<div className="flex gap-2">
									<Button
										type="button"
										size="sm"
										className="flex-1 gap-1.5 bg-rose-600 text-white hover:bg-rose-700"
										onClick={() => {
											void navigator.clipboard
												.writeText(bookingUrl)
												.then(() => toast.success('Link copied'))
										}}
									>
										<Copy className="size-3.5" />
										Copy link
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										asChild
									>
										<a href={bookingUrl} target="_blank" rel="noreferrer">
											<ExternalLink className="size-3.5" />
										</a>
									</Button>
								</div>
							</div>
						) : (
							<div className="bg-muted/40 rounded-lg border border-dashed p-4 text-center">
								<p className="text-sm font-medium">No booking link available</p>
								<p className="text-muted-foreground mt-1 text-xs">
									This unit hasn't been configured with a public slug yet.
								</p>
							</div>
						)
					) : null}
					</div>
			</DialogContent>
		</Dialog>
	)
}

export function PropertyBookingsController({
	isLoading,
	refetch,
}: {
	isLoading: boolean
	refetch: VoidFunction
}) {
	const { clientUserProperty } = useProperty()
	const { clientUser } = useClient()
	const navigate = useNavigate()
	const [guestLinkOpen, setGuestLinkOpen] = useState(false)

	const propertyId = clientUserProperty?.property_id ?? ''
	const propertySlug = clientUserProperty?.property?.slug
	const clientId = safeString(clientUser?.client_id)

	const filters: Array<Filter> = useMemo(
		() => [
			{
				id: 1,
				type: 'selector',
				selectType: 'single',
				label: 'Status',
				value: {
					options: [
						{ label: 'Pending', value: 'PENDING' },
						{ label: 'Confirmed', value: 'CONFIRMED' },
						{ label: 'Checked In', value: 'CHECKED_IN' },
						{ label: 'Completed', value: 'COMPLETED' },
						{ label: 'Cancelled', value: 'CANCELLED' },
					],
					urlParam: 'status',
					defaultValues: [],
				},
				Icon: ToggleLeft,
			},
			{
				id: 2,
				type: 'selector',
				selectType: 'single',
				label: 'Unit',
				value: {
					urlParam: 'unit_id',
					defaultValues: [],
					onSearch: async ({}) => {
						if (!clientUserProperty?.property_id) return []
						const data = await getPropertyUnits(
							safeString(clientUser?.client_id),
							{
								property_id: clientUserProperty.property_id,
								pagination: {
									page: PAGINATION_DEFAULTS.PAGE,
									per: PAGINATION_DEFAULTS.PER_PAGE,
								},
							},
						)
						return (
							data?.rows.map((unit) => ({
								label: unit.name,
								value: unit.id,
							})) ?? []
						)
					},
				},
				Icon: ToggleLeft,
			},
		],
		[clientUser?.client_id, clientUserProperty?.property_id],
	)

	return (
		<>
		<div className="flex w-full flex-col gap-2">
			<div className="w-full rounded-md border p-4">
				<div className="flex w-full flex-wrap items-center gap-2 text-sm">
					<FilterSet label="Filters" urlParam="filters" filters={filters} />
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div />
				<div className="flex items-center justify-end gap-2">
					<PropertyPermissionGuard roles={['MANAGER']}>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									size="sm"
									className="bg-rose-600 text-white hover:bg-rose-700"
								>
									New Booking
									<ChevronDown className="ml-1 size-3.5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() =>
										void navigate(
											`/properties/${propertyId}/occupancy/bookings/new`,
										)
									}
								>
									<UserCog className="size-4" />
									Admin booking
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setGuestLinkOpen(true)}>
									<Link2 className="size-4" />
									Guest link
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
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
		<GuestLinkModal
			open={guestLinkOpen}
			onOpenChange={setGuestLinkOpen}
			propertySlug={propertySlug}
			clientId={clientId}
			propertyId={propertyId}
		/>
		</>
	)
}
