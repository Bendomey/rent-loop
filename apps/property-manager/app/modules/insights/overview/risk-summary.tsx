import { RiskSummaryCard, type RiskStat } from '../components/risk-summary-card'
import { useInsightsFilters } from '../use-insights-filters'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface OutstandingRow {
	'Invoices.outstandingAmount': string | null
	'Invoices.outstandingPropertyCount': string | null
}
interface ExpiringRow {
	'Leases.expiringCount': string | null
	'Leases.expiringPropertyCount': string | null
}
interface MaintenanceRow {
	'MaintenanceRequests.newCount': string | null
	'MaintenanceRequests.inProgressCount': string | null
	'MaintenanceRequests.inReviewCount': string | null
	'MaintenanceRequests.openPropertyCount': string | null
}

function parseNum(value: string | null | undefined): number {
	return value ? Number(value) : 0
}

export function RiskSummary() {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)
	const { propertyIds, propertyFilter } = useInsightsFilters()
	const scopeKey = propertyIds.join(',') || 'all'

	const outstandingQuery = useCubeQuery<OutstandingRow>(
		token,
		['ins-ov-risk-outstanding', scopeKey],
		{
			measures: [
				'Invoices.outstandingAmount',
				'Invoices.outstandingPropertyCount',
			],
			filters: propertyFilter('Invoices.propertyId'),
		},
	)

	const expiringQuery = useCubeQuery<ExpiringRow>(
		token,
		['ins-ov-risk-expiring', scopeKey],
		{
			measures: ['Leases.expiringCount', 'Leases.expiringPropertyCount'],
			filters: propertyFilter('Leases.propertyId'),
		},
	)

	const maintenanceQuery = useCubeQuery<MaintenanceRow>(
		token,
		['ins-ov-risk-maintenance', scopeKey],
		{
			measures: [
				'MaintenanceRequests.newCount',
				'MaintenanceRequests.inProgressCount',
				'MaintenanceRequests.inReviewCount',
				'MaintenanceRequests.openPropertyCount',
			],
			filters: propertyFilter('MaintenanceRequests.propertyId'),
		},
	)

	const outstandingRow = outstandingQuery.data?.[0]
	const outstanding = parseNum(outstandingRow?.['Invoices.outstandingAmount'])
	const outstandingProperties = parseNum(
		outstandingRow?.['Invoices.outstandingPropertyCount'],
	)

	const expiringRow = expiringQuery.data?.[0]
	const expiring = parseNum(expiringRow?.['Leases.expiringCount'])
	const expiringProperties = parseNum(
		expiringRow?.['Leases.expiringPropertyCount'],
	)

	const maintenanceRow = maintenanceQuery.data?.[0]
	const openMaintenance =
		parseNum(maintenanceRow?.['MaintenanceRequests.newCount']) +
		parseNum(maintenanceRow?.['MaintenanceRequests.inProgressCount']) +
		parseNum(maintenanceRow?.['MaintenanceRequests.inReviewCount'])
	const maintenanceProperties = parseNum(
		maintenanceRow?.['MaintenanceRequests.openPropertyCount'],
	)

	const stats: RiskStat[] = [
		{
			type: 'outstanding_rent',
			label: 'Outstanding Invoices',
			value: formatAmount(convertPesewasToCedis(outstanding)),
			isPending: outstandingQuery.isPending,
			propertyCount: outstandingProperties,
			emptyText: 'No outstanding balances',
			modalDescription:
				'Tenants with overdue balances. Open a property to review the ledger and record payment.',
		},
		{
			type: 'expiring_leases',
			label: 'Leases expiring',
			value: expiring.toLocaleString(),
			isPending: expiringQuery.isPending,
			propertyCount: expiringProperties,
			emptyText: 'Nothing expiring soon',
			modalDescription:
				'Leases near their end — a month out for monthly terms, 3 days for weekly, 1 for daily. Open a property to review the lease table.',
		},
		{
			type: 'maintenance',
			label: 'Open maintenance requests',
			value: openMaintenance.toLocaleString(),
			isPending: maintenanceQuery.isPending,
			propertyCount: maintenanceProperties,
			emptyText: 'No open requests',
			modalDescription:
				'Unresolved requests grouped by property. Open a property to triage and assign.',
		},
	]

	return <RiskSummaryCard stats={stats} scopedPropertyIds={propertyIds} />
}
