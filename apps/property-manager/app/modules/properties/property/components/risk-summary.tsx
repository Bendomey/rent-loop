import type { CubeFilter } from '~/api/analytics'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import {
	RiskSummaryCard,
	type RiskStat,
} from '~/modules/insights/components/risk-summary-card'
import { useClient } from '~/providers/client-provider'

interface OutstandingRow {
	'Invoices.outstandingAmount': string | null
}
interface ExpiringRow {
	'Leases.activeCount': string | null
}
interface MaintenanceRow {
	'MaintenanceRequests.newCount': string | null
	'MaintenanceRequests.inProgressCount': string | null
	'MaintenanceRequests.inReviewCount': string | null
}

function parseNum(value: string | null | undefined): number {
	return value ? Number(value) : 0
}

interface Props {
	propertyId: string
}

/**
 * Single-property Risk Summary — same card/modal as the portfolio-wide
 * Insights Overview (app/modules/insights/overview/risk-summary.tsx), just
 * scoped to one property instead of the Insights filter bar's selection.
 */
export function PropertyRiskSummary({ propertyId }: Props) {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)

	const propertyFilter = (member: string): CubeFilter[] => [
		{ member, operator: 'equals', values: [propertyId] },
	]

	const today = localizedDayjs().format('YYYY-MM-DD')
	const in60Days = localizedDayjs().add(60, 'day').format('YYYY-MM-DD')

	const outstandingQuery = useCubeQuery<OutstandingRow>(
		token,
		['prop-risk-outstanding', propertyId],
		{
			measures: ['Invoices.outstandingAmount'],
			filters: propertyFilter('Invoices.propertyId'),
		},
	)

	const expiringQuery = useCubeQuery<ExpiringRow>(
		token,
		['prop-risk-expiring', propertyId],
		{
			measures: ['Leases.activeCount'],
			timeDimensions: [
				{ dimension: 'Leases.moveOutDate', dateRange: [today, in60Days] },
			],
			filters: propertyFilter('Leases.propertyId'),
		},
	)

	const maintenanceQuery = useCubeQuery<MaintenanceRow>(
		token,
		['prop-risk-maintenance', propertyId],
		{
			measures: [
				'MaintenanceRequests.newCount',
				'MaintenanceRequests.inProgressCount',
				'MaintenanceRequests.inReviewCount',
			],
			filters: propertyFilter('MaintenanceRequests.propertyId'),
		},
	)

	const outstanding = parseNum(
		outstandingQuery.data?.[0]?.['Invoices.outstandingAmount'],
	)
	const expiring = parseNum(expiringQuery.data?.[0]?.['Leases.activeCount'])
	const maintenanceRow = maintenanceQuery.data?.[0]
	const openMaintenance =
		parseNum(maintenanceRow?.['MaintenanceRequests.newCount']) +
		parseNum(maintenanceRow?.['MaintenanceRequests.inProgressCount']) +
		parseNum(maintenanceRow?.['MaintenanceRequests.inReviewCount'])

	const stats: RiskStat[] = [
		{
			type: 'outstanding_rent',
			label: 'Outstanding Invoices',
			value: formatAmount(convertPesewasToCedis(outstanding)),
			isPending: outstandingQuery.isPending,
			propertyCount: outstanding > 0 ? 1 : 0,
			emptyText: 'No outstanding balances',
			modalDescription:
				'Tenants with overdue balances. Open the ledger to review and record payment.',
		},
		{
			type: 'expiring_leases',
			label: 'Leases expiring',
			value: expiring.toLocaleString(),
			isPending: expiringQuery.isPending,
			propertyCount: expiring > 0 ? 1 : 0,
			emptyText: 'Nothing expiring soon',
			modalDescription: 'Leases ending within 60 days.',
		},
		{
			type: 'maintenance',
			label: 'Open maintenance requests',
			value: openMaintenance.toLocaleString(),
			isPending: maintenanceQuery.isPending,
			propertyCount: openMaintenance > 0 ? 1 : 0,
			emptyText: 'No open requests',
			modalDescription: 'Unresolved requests for this property.',
		},
	]

	return (
		<RiskSummaryCard
			stats={stats}
			scopedPropertyIds={[propertyId]}
			showPropertyCount={false}
		/>
	)
}
