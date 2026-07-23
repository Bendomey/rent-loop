import { ComparisonBadge } from '../components/comparison-badge'
import { KpiCard } from '../components/kpi-card'
import { useInsightsFilters } from '../use-insights-filters'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface RevenueRow {
	'Invoices.paidAmount': string | null
}
interface OutstandingRow {
	'Invoices.outstandingAmount': string | null
}
interface ExpenseRow {
	'Expenses.totalAmount': string | null
}
interface LeaseRow {
	'Leases.activeCount': string | null
}
interface UnitRow {
	'Units.count': string | null
	'Units.occupiedCount': string | null
}

function parseNum(value: string | null | undefined): number {
	return value ? Number(value) : 0
}

export function InsightsKpiRow() {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)
	const {
		from,
		to,
		propertyIds,
		compare,
		previousRange,
		timeDimension,
		propertyFilter,
	} = useInsightsFilters()

	const scopeKey = [from, to, propertyIds.join(',') || 'all']

	const revenueQuery = useCubeQuery<RevenueRow>(
		token,
		['ins-ov-revenue', ...scopeKey],
		{
			measures: ['Invoices.paidAmount'],
			timeDimensions: [timeDimension('Invoices.paidAt')],
			filters: propertyFilter('Invoices.propertyId'),
		},
	)
	const prevRevenueQuery = useCubeQuery<RevenueRow>(
		token,
		['ins-ov-revenue-prev', ...scopeKey],
		{
			measures: ['Invoices.paidAmount'],
			timeDimensions: [
				{ dimension: 'Invoices.paidAt', dateRange: previousRange },
			],
			filters: propertyFilter('Invoices.propertyId'),
		},
		{ enabled: compare },
	)

	const expensesQuery = useCubeQuery<ExpenseRow>(
		token,
		['ins-ov-expenses', ...scopeKey],
		{
			measures: ['Expenses.totalAmount'],
			timeDimensions: [timeDimension('Expenses.createdAt')],
			filters: propertyFilter('Expenses.propertyId'),
		},
	)
	const prevExpensesQuery = useCubeQuery<ExpenseRow>(
		token,
		['ins-ov-expenses-prev', ...scopeKey],
		{
			measures: ['Expenses.totalAmount'],
			timeDimensions: [
				{ dimension: 'Expenses.createdAt', dateRange: previousRange },
			],
			filters: propertyFilter('Expenses.propertyId'),
		},
		{ enabled: compare },
	)

	const outstandingQuery = useCubeQuery<OutstandingRow>(
		token,
		['ins-ov-outstanding', propertyIds.join(',') || 'all'],
		{
			measures: ['Invoices.outstandingAmount'],
			filters: propertyFilter('Invoices.propertyId'),
		},
	)

	const leasesQuery = useCubeQuery<LeaseRow>(
		token,
		['ins-ov-active-leases', propertyIds.join(',') || 'all'],
		{
			measures: ['Leases.activeCount'],
			filters: propertyFilter('Leases.propertyId'),
		},
	)

	const unitsQuery = useCubeQuery<UnitRow>(
		token,
		['ins-ov-units', propertyIds.join(',') || 'all'],
		{
			measures: ['Units.count', 'Units.occupiedCount'],
			filters: propertyFilter('Units.propertyId'),
		},
	)

	const revenue = parseNum(revenueQuery.data?.[0]?.['Invoices.paidAmount'])
	const prevRevenue = parseNum(
		prevRevenueQuery.data?.[0]?.['Invoices.paidAmount'],
	)
	const expenses = parseNum(expensesQuery.data?.[0]?.['Expenses.totalAmount'])
	const prevExpenses = parseNum(
		prevExpensesQuery.data?.[0]?.['Expenses.totalAmount'],
	)
	const outstanding = parseNum(
		outstandingQuery.data?.[0]?.['Invoices.outstandingAmount'],
	)
	const activeLeases = parseNum(leasesQuery.data?.[0]?.['Leases.activeCount'])
	const totalUnits = parseNum(unitsQuery.data?.[0]?.['Units.count'])
	const occupiedUnits = parseNum(unitsQuery.data?.[0]?.['Units.occupiedCount'])
	const occupancyRate =
		totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0.0'

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
			<KpiCard
				label="Revenue"
				isPending={revenueQuery.isPending}
				value={formatAmount(convertPesewasToCedis(revenue))}
				badge={
					compare && !prevRevenueQuery.isPending ? (
						<ComparisonBadge current={revenue} previous={prevRevenue} />
					) : undefined
				}
				footer="Paid invoices in the selected period"
			/>
			<KpiCard
				label="Expenses"
				isPending={expensesQuery.isPending}
				value={formatAmount(convertPesewasToCedis(expenses))}
				badge={
					compare && !prevExpensesQuery.isPending ? (
						<ComparisonBadge current={expenses} previous={prevExpenses} />
					) : undefined
				}
				footer="Expenses recorded in the selected period"
			/>
			<KpiCard
				label="Net Income"
				isPending={revenueQuery.isPending || expensesQuery.isPending}
				value={formatAmount(convertPesewasToCedis(revenue - expenses))}
				footer="Revenue minus expenses"
			/>
			<KpiCard
				label="Outstanding Rent"
				isPending={outstandingQuery.isPending}
				value={formatAmount(convertPesewasToCedis(outstanding))}
				footer="Across all issued invoices"
			/>
			<KpiCard
				label="Active Leases"
				isPending={leasesQuery.isPending}
				value={activeLeases.toLocaleString()}
				footer="Currently active tenancy agreements"
			/>
			<KpiCard
				label="Occupancy Rate"
				isPending={unitsQuery.isPending}
				value={`${occupancyRate}%`}
				footer={`${occupiedUnits} of ${totalUnits} units occupied`}
			/>
		</div>
	)
}
