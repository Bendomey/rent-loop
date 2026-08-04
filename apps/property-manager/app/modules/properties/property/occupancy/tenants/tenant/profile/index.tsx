import { TenantProfileBasicInformationCard } from './basic-information'
import { TenantProfileContactCard } from './contact'
import { TenantProfileEmploymentCard } from './employment'
import { TenantProfileIdentificationCard } from './identification'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
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
				<CardFooter className="text-muted-foreground text-xs">
					All-time successful payments made by this tenant for this property
				</CardFooter>
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
			<TenantProfileBasicInformationCard tenant={tenant} />
			<TenantProfileIdentificationCard tenant={tenant} />
			<TenantProfileEmploymentCard tenant={tenant} />
			<TenantProfileContactCard tenant={tenant} />
		</div>
	)
}
