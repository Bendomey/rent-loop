import { Calendar, MapPin, User } from 'lucide-react'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

// ---------------------------------------------------------------------------
// Cube query result types
// ---------------------------------------------------------------------------

interface PaymentRow {
	'Payments.totalAmount': string | null
}

interface LeaseRow {
	'Leases.count': string | null
}

interface BookingRow {
	'Bookings.count': string | null
}

interface MaintenanceRequestRow {
	'MaintenanceRequests.count': string | null
}

function parseNum(v: string | null | undefined): number {
	return v ? Number(v) : 0
}

function InfoRow({
	icon,
	label,
	value,
}: {
	icon?: React.ReactNode
	label: string
	value: React.ReactNode
}) {
	return (
		<div className="flex gap-3">
			{icon && (
				<div className="text-muted-foreground mt-1 flex-shrink-0">{icon}</div>
			)}
			<div className="min-w-0 flex-1">
				<p className="text-muted-foreground text-xs font-semibold">{label}</p>
				<p className="text-foreground text-sm font-medium">{value || 'N/A'}</p>
			</div>
		</div>
	)
}

export function TenantProfileModule({
	tenant,
	propertyId,
}: {
	tenant: Tenant
	propertyId: string
}) {
	const { clientUser } = useClient()
	const { clientUserProperty } = useProperty()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)

	const modes = clientUserProperty?.property?.modes ?? []
	const isLease = modes.includes('LEASE')
	const isBooking = modes.includes('BOOKING')

	const tenantFilter = (member: string) => ({
		member,
		operator: 'equals' as const,
		values: [tenant.id],
	})
	const propertyFilter = (member: string) => ({
		member,
		operator: 'equals' as const,
		values: [propertyId],
	})

	const paymentsQuery = useCubeQuery<PaymentRow>(
		token,
		['tenant-payments', tenant.id, propertyId],
		{
			measures: ['Payments.totalAmount'],
			filters: [
				tenantFilter('Payments.tenantId'),
				propertyFilter('Payments.propertyId'),
			],
		},
	)

	const leasesQuery = useCubeQuery<LeaseRow>(
		token,
		['tenant-leases', tenant.id, propertyId],
		{
			measures: ['Leases.count'],
			filters: [
				tenantFilter('Leases.tenantId'),
				propertyFilter('Leases.propertyId'),
			],
		},
		{ enabled: isLease },
	)

	const bookingsQuery = useCubeQuery<BookingRow>(
		token,
		['tenant-bookings', tenant.id, propertyId],
		{
			measures: ['Bookings.count'],
			filters: [
				tenantFilter('Bookings.tenantId'),
				propertyFilter('Bookings.propertyId'),
			],
		},
		{ enabled: isBooking },
	)

	const maintenanceRequestsQuery = useCubeQuery<MaintenanceRequestRow>(
		token,
		['tenant-maintenance-requests', tenant.id, propertyId],
		{
			measures: ['MaintenanceRequests.count'],
			filters: [
				tenantFilter('MaintenanceRequests.tenantId'),
				propertyFilter('MaintenanceRequests.propertyId'),
			],
		},
	)

	const totalPayments = parseNum(
		paymentsQuery.data?.[0]?.['Payments.totalAmount'],
	)
	const totalLeases = parseNum(leasesQuery.data?.[0]?.['Leases.count'])
	const totalBookings = parseNum(bookingsQuery.data?.[0]?.['Bookings.count'])
	const totalMaintenanceRequests = parseNum(
		maintenanceRequestsQuery.data?.[0]?.['MaintenanceRequests.count'],
	)

	return (
		<div className="mt-3 space-y-3">
			<Card className="@container/card col-span-2 shadow-none lg:col-span-1">
				<CardHeader>
					<CardDescription>Total Payments</CardDescription>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						{paymentsQuery.isPending ? (
							<Skeleton className="h-8 w-32" />
						) : (
							formatAmount(convertPesewasToCedis(totalPayments))
						)}
					</CardTitle>
				</CardHeader>
			</Card>
			<div className="col-span-2 grid grid-cols-2 gap-2 lg:col-span-1 lg:grid-cols-3">
				{isLease ? (
					<Card className="@container/card col-span-1 shadow-none lg:col-span-1">
						<CardHeader>
							<CardDescription>Total Leases</CardDescription>
							<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
								{leasesQuery.isPending ? (
									<Skeleton className="h-8 w-10" />
								) : (
									totalLeases.toLocaleString()
								)}
							</CardTitle>
						</CardHeader>
					</Card>
				) : null}
				{isBooking ? (
					<Card className="@container/card col-span-1 shadow-none lg:col-span-1">
						<CardHeader>
							<CardDescription>Total Bookings</CardDescription>
							<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
								{bookingsQuery.isPending ? (
									<Skeleton className="h-8 w-10" />
								) : (
									totalBookings.toLocaleString()
								)}
							</CardTitle>
						</CardHeader>
					</Card>
				) : null}

				<Card className="@container/card col-span-1 shadow-none lg:col-span-1">
					<CardHeader>
						<CardDescription>Total Requests</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
							{maintenanceRequestsQuery.isPending ? (
								<Skeleton className="h-8 w-10" />
							) : (
								totalMaintenanceRequests.toLocaleString()
							)}
						</CardTitle>
					</CardHeader>
				</Card>
			</div>
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
						Basic Information
					</CardTitle>
					{/* <CardAction>
						<Button variant="ghost" size="icon">
							<Filter className="h-4 w-4" />
						</Button>
					</CardAction> */}
				</CardHeader>

				<CardContent className="space-y-4">
					<Separator />
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<InfoRow
							icon={<Calendar size={18} />}
							label="Date of Birth"
							value={
								tenant?.date_of_birth
									? localizedDayjs(tenant.date_of_birth).format('DD MMM YYYY')
									: 'N/A'
							}
						/>
						<InfoRow
							icon={<User size={18} />}
							label="Marital Status"
							value={tenant?.marital_status}
						/>
						<InfoRow
							icon={<MapPin size={18} />}
							label="Nationality"
							value={tenant?.nationality}
						/>
						<InfoRow
							icon={<Calendar size={18} />}
							label="Record Created"
							value={
								tenant?.created_at
									? localizedDayjs(tenant.created_at).format('DD MMM YYYY')
									: 'N/A'
							}
						/>
						<InfoRow
							icon={<Calendar size={18} />}
							label="Last Updated"
							value={
								tenant?.updated_at
									? localizedDayjs(tenant.updated_at).format('DD MMM YYYY')
									: 'N/A'
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<TypographyH4>Identification</TypographyH4>
				</CardHeader>
				<CardContent className="space-y-4">
					<Separator />
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<InfoRow label="ID Type" value={tenant?.id_type} />
						<InfoRow label="ID Number" value={tenant?.id_number} />
						<InfoRow
							label="ID Front"
							value={
								tenant?.id_front_url ? (
									<a
										href={tenant.id_front_url}
										target="_blank"
										rel="noreferrer"
										className="text-primary underline"
									>
										View
									</a>
								) : (
									'N/A'
								)
							}
						/>
						<InfoRow
							label="ID Back"
							value={
								tenant?.id_back_url ? (
									<a
										href={tenant.id_back_url}
										target="_blank"
										rel="noreferrer"
										className="text-primary underline"
									>
										View
									</a>
								) : (
									'N/A'
								)
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<TypographyH4>Employment</TypographyH4>
				</CardHeader>
				<CardContent className="space-y-4">
					<Separator />
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<InfoRow label="Employer" value={tenant?.employer} />
						<InfoRow label="Occupation" value={tenant?.occupation} />
						<InfoRow label="Work Address" value={tenant?.occupation_address} />
						<InfoRow
							label="Proof of Income"
							value={
								tenant?.proof_of_income_url ? (
									<a
										href={tenant.proof_of_income_url}
										target="_blank"
										rel="noreferrer"
										className="text-primary underline"
									>
										View
									</a>
								) : (
									'N/A'
								)
							}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Contact & Address */}
			<Card>
				<CardHeader>
					<TypographyH4>Contact & Address</TypographyH4>
				</CardHeader>
				<CardContent className="space-y-4">
					<Separator />

					<div className="pt-2">
						<TypographyMuted>Emergency Contact</TypographyMuted>
						<div className="mt-2 space-y-2">
							<p className="text-foreground font-medium">
								{tenant?.emergency_contact_name}
							</p>
							<div className="text-muted-foreground flex gap-2 text-sm">
								<span>{tenant?.emergency_contact_phone}</span>
								<span>•</span>
								<span>{tenant?.relationship_to_emergency_contact}</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
