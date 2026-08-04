import { TrendChart, type TrendPoint } from '../components/trend-chart'
import { useInsightsFilters } from '../use-insights-filters'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface RevenueTrendRow {
	'Invoices.paidAmount': string | null
	'Invoices.paidAt.month'?: string
}
interface ExpenseTrendRow {
	'Expenses.totalAmount': string | null
	'Expenses.createdAt.month'?: string
}

function amountTick(value: number): string {
	return value >= 1000
		? `GH₵ ${(value / 1000).toFixed(0)}k`
		: formatAmount(value)
}

export function InsightsTrends() {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)
	const { from, to, propertyIds, timeDimension, propertyFilter } =
		useInsightsFilters()

	const scopeKey = [from, to, propertyIds.join(',') || 'all']

	const revenueTrendQuery = useCubeQuery<RevenueTrendRow>(
		token,
		['ins-ov-revenue-trend', ...scopeKey],
		{
			measures: ['Invoices.paidAmount'],
			timeDimensions: [timeDimension('Invoices.paidAt', 'month')],
			filters: propertyFilter('Invoices.propertyId'),
		},
	)

	const expenseTrendQuery = useCubeQuery<ExpenseTrendRow>(
		token,
		['ins-ov-expense-trend', ...scopeKey],
		{
			measures: ['Expenses.totalAmount'],
			timeDimensions: [timeDimension('Expenses.createdAt', 'month')],
			filters: propertyFilter('Expenses.propertyId'),
		},
	)

	const revenueData: TrendPoint[] = (revenueTrendQuery.data ?? []).map(
		(row) => ({
			period: localizedDayjs(row['Invoices.paidAt.month']).format('MMM YYYY'),
			value: convertPesewasToCedis(
				parseFloat(row['Invoices.paidAmount'] ?? '0'),
			),
		}),
	)
	const expenseData: TrendPoint[] = (expenseTrendQuery.data ?? []).map(
		(row) => ({
			period: localizedDayjs(row['Expenses.createdAt.month']).format(
				'MMM YYYY',
			),
			value: convertPesewasToCedis(
				parseFloat(row['Expenses.totalAmount'] ?? '0'),
			),
		}),
	)

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<TrendChart
				title="Revenue Trend"
				description="Paid invoice revenue by month"
				data={revenueData}
				isPending={revenueTrendQuery.isPending}
				valueFormatter={amountTick}
			/>
			<TrendChart
				title="Expense Trend"
				description="Recorded expenses by month"
				data={expenseData}
				isPending={expenseTrendQuery.isPending}
				valueFormatter={amountTick}
			/>
		</div>
	)
}
