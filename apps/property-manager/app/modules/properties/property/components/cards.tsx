import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import { Badge } from '~/components/ui/badge'
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface TotalsRow {
	'Invoices.paidAmount': string | null
}

interface LeaseRow {
	'Leases.activeTenantCount': string | null
}

interface TenantApplicationRow {
	'TenantApplications.inProgressCount': string | null
}

interface MaintenanceRow {
	'MaintenanceRequests.count': string | null
	'MaintenanceRequests.newCount': string | null
	'MaintenanceRequests.inProgressCount': string | null
	'MaintenanceRequests.inReviewCount': string | null
}

function parseNum(v: string | null | undefined): number {
	return v ? Number(v) : 0
}

interface Props {
	propertyId: string
}

export function PropertySectionCards({ propertyId }: Props) {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)

	const invoiceFilter = {
		member: 'Invoices.propertyId' as const,
		operator: 'equals' as const,
		values: [propertyId],
	}
	const leaseFilter = {
		member: 'Leases.propertyId' as const,
		operator: 'equals' as const,
		values: [propertyId],
	}

	// All-time paid invoice total — powers Total Rental Income. Outstanding
	// balances are already covered by the Risk Summary section below.
	const totalsQuery = useCubeQuery<TotalsRow>(
		token,
		['prop-invoice-totals', propertyId],
		{
			measures: ['Invoices.paidAmount'],
			filters: [invoiceFilter],
		},
	)

	// Distinct tenants on an active lease — powers All Tenants
	const leaseQuery = useCubeQuery<LeaseRow>(
		token,
		['prop-active-tenants', propertyId],
		{
			measures: ['Leases.activeTenantCount'],
			filters: [leaseFilter],
		},
	)

	// Pending (in-progress) tenant applications
	const applicationsQuery = useCubeQuery<TenantApplicationRow>(
		token,
		['prop-pending-applications', propertyId],
		{
			measures: ['TenantApplications.inProgressCount'],
			filters: [
				{
					member: 'TenantApplications.propertyId',
					operator: 'equals',
					values: [propertyId],
				},
			],
		},
	)

	// Maintenance request counts
	const maintenanceQuery = useCubeQuery<MaintenanceRow>(
		token,
		['prop-maintenance-kpi', propertyId],
		{
			measures: [
				'MaintenanceRequests.count',
				'MaintenanceRequests.newCount',
				'MaintenanceRequests.inProgressCount',
				'MaintenanceRequests.inReviewCount',
			],
			filters: [
				{
					member: 'MaintenanceRequests.propertyId',
					operator: 'equals',
					values: [propertyId],
				},
			],
		},
	)

	const isLoading =
		totalsQuery.isPending ||
		leaseQuery.isPending ||
		maintenanceQuery.isPending ||
		applicationsQuery.isPending

	const totalsRow = totalsQuery.data?.[0]
	const totalRevenue = parseNum(totalsRow?.['Invoices.paidAmount'])

	const activeTenants = parseNum(
		leaseQuery.data?.[0]?.['Leases.activeTenantCount'],
	)

	const pendingApplications = parseNum(
		applicationsQuery.data?.[0]?.['TenantApplications.inProgressCount'],
	)

	// Maintenance request counts
	const maintenanceRow = maintenanceQuery.data?.[0]
	const totalMaintenance = parseNum(
		maintenanceRow?.['MaintenanceRequests.count'],
	)
	const newRequests = parseNum(maintenanceRow?.['MaintenanceRequests.newCount'])
	const inProgress = parseNum(
		maintenanceRow?.['MaintenanceRequests.inProgressCount'],
	)
	const inReview = parseNum(
		maintenanceRow?.['MaintenanceRequests.inReviewCount'],
	)
	const openRequests = newRequests + inProgress + inReview

	const baseUrl = `/properties/${propertyId}`

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<StatCard
				to={`${baseUrl}/financials/invoices?filters=status&status=PAID`}
			>
				<CardHeader>
					<CardDescription>Total Rental Income</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						{isLoading ? (
							<Skeleton className="h-8 w-32" />
						) : (
							formatAmount(convertPesewasToCedis(totalRevenue))
						)}
					</CardTitle>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					All-time paid invoices
				</CardFooter>
			</StatCard>

			<StatCard
				to={`${baseUrl}/occupancy/tenants?filters=status&status=ACTIVE`}
			>
				<CardHeader>
					<CardDescription>All Tenants</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						{isLoading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							activeTenants.toLocaleString()
						)}
					</CardTitle>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					Tenants on an active lease
				</CardFooter>
			</StatCard>

			<StatCard to={`${baseUrl}/activities/maintenance-requests`}>
				<CardHeader>
					<CardDescription>Maintenance Requests</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						{isLoading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							openRequests.toLocaleString()
						)}
					</CardTitle>
					<CardAction>
						<Badge variant="outline" className="gap-1">
							{isLoading ? (
								<Skeleton className="h-4 w-12" />
							) : (
								`${totalMaintenance} total`
							)}
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					{isLoading ? (
						<Skeleton className="h-3 w-40" />
					) : (
						`${newRequests} new · ${inProgress} in progress · ${inReview} in review`
					)}
				</CardFooter>
			</StatCard>

			<StatCard
				to={`${baseUrl}/occupancy/applications?filters=status&status=TenantApplication.Status.InProgress`}
			>
				<CardHeader>
					<CardDescription>Pending Tenant Applications</CardDescription>
					<CardTitle className="text-3xl font-semibold tabular-nums @[250px]/card:text-4xl">
						{isLoading ? (
							<Skeleton className="h-8 w-16" />
						) : (
							pendingApplications.toLocaleString()
						)}
					</CardTitle>
				</CardHeader>
				<CardFooter className="text-muted-foreground text-xs">
					Awaiting review
				</CardFooter>
			</StatCard>
		</div>
	)
}

function StatCard({ to, children }: { to: string; children: ReactNode }) {
	return (
		<Link
			to={to}
			className="group focus-visible:ring-ring/50 rounded-xl outline-none focus-visible:ring-[3px]"
		>
			<Card className="from-primary/5 to-card dark:bg-card group-hover:from-primary/10 @container/card h-full gap-3 bg-gradient-to-t py-4 shadow-xs transition-all duration-300 ease-out group-hover:-translate-y-[2px] group-hover:scale-[1.02] group-hover:shadow-lg">
				{children}
			</Card>
		</Link>
	)
}
