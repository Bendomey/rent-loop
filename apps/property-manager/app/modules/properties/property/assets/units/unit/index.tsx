import {
	Briefcase,
	Building2,
	Home,
	LayoutGrid,
	Pencil,
	Store,
	Trash,
} from 'lucide-react'
import { useState } from 'react'
import {
	Link,
	Outlet,
	useLoaderData,
	useLocation,
	useNavigate,
} from 'react-router'
import DeletePropertyUnitModal from '../delete'
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
import { Separator } from '~/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import {
	TypographyH4,
	TypographyMuted,
	TypographyP,
} from '~/components/ui/typography'
import { formatAmount } from '~/lib/format-amount'
import { getPropertyUnitStatusLabel } from '~/lib/properties.utils'
import { toFirstUpperCase } from '~/lib/strings'
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
			return 'bg-zinc-400 text-white'
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

export function PropertyAssetUnitModule() {
	const { unit } = useLoaderData<typeof loader>()
	const { pathname } = useLocation()
	const navigate = useNavigate()
	const [openDeleteModal, setOpenDeleteModal] = useState(false)

	if (!unit) {
		return (
			<div className="flex h-full items-center justify-center p-10">
				<TypographyH4>Unit not found</TypographyH4>
			</div>
		)
	}

	const TypeIcon = unitTypeIcons[unit.type] ?? Building2
	const baseUrl = `/properties/${unit.property_id}/assets/units/${unit.id}`

	return (
		<div className="m-5 grid grid-cols-12 gap-6">
			{/* Sidebar */}
			<div className="col-span-12 lg:col-span-4">
				<Card className="overflow-hidden pt-0 shadow-none">
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
							<Badge
								variant="outline"
								className={getStatusBadgeClass(unit.status)}
							>
								{getPropertyUnitStatusLabel(unit.status)}
							</Badge>
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

						<div className="space-y-1">
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
							<Link to={`${baseUrl}/edit`}>
								<Button variant="outline" size="sm">
									<Pencil className="mr-1 size-4" />
									Edit
								</Button>
							</Link>
							<Button
								variant="destructive"
								size="sm"
								onClick={() => setOpenDeleteModal(true)}
							>
								<Trash className="mr-1 size-4" />
								Delete
							</Button>
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
						void navigate(`/properties/${unit.property_id}/assets/units`)
					}
				}}
				data={unit}
			/>
		</div>
	)
}
