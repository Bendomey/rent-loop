import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface ExpenseRow {
	'Expenses.totalAmount': string | null
	'Expenses.outstandingAmount': string | null
	'Expenses.outstandingCount': string | null
	'Expenses.maintenanceAmount': string | null
	'Expenses.count': string | null
}

function parseNum(v: string | null | undefined): number {
	return v ? Number(v) : 0
}

interface Props {
	propertyId: string
}

export function PropertyExpenseAnalyticsCards({ propertyId }: Props) {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)

	const expensesQuery = useCubeQuery<ExpenseRow>(
		token,
		['prop-expenses-kpi', propertyId],
		{
			measures: [
				'Expenses.totalAmount',
				'Expenses.outstandingAmount',
				'Expenses.outstandingCount',
				'Expenses.maintenanceAmount',
				'Expenses.count',
			],
			filters: [
				{
					member: 'Expenses.propertyId',
					operator: 'equals',
					values: [propertyId],
				},
			],
		},
	)

	const isLoading = expensesQuery.isPending
	const row = expensesQuery.data?.[0]
	const totalAmount = parseNum(row?.['Expenses.totalAmount'])
	const outstandingAmount = parseNum(row?.['Expenses.outstandingAmount'])
	const outstandingCount = parseNum(row?.['Expenses.outstandingCount'])
	const maintenanceAmount = parseNum(row?.['Expenses.maintenanceAmount'])
	const count = parseNum(row?.['Expenses.count'])

	// Owed first: it is the only figure here that asks the landlord to do
	// something, and the reason expenses became payables at all.
	const cards = [
		{
			label: 'Owed to Vendors',
			value: formatAmount(convertPesewasToCedis(outstandingAmount)),
			footer:
				outstandingCount === 1
					? '1 bill still to pay'
					: `${outstandingCount.toLocaleString()} bills still to pay`,
		},
		{
			label: 'Total Spent',
			value: formatAmount(convertPesewasToCedis(totalAmount)),
			footer: 'All time · voided excluded',
		},
		{
			label: 'Maintenance Spend',
			value: formatAmount(convertPesewasToCedis(maintenanceAmount)),
			footer: 'Maintenance context only',
		},
		{
			label: 'Total Expenses',
			value: count.toLocaleString(),
			footer: 'Across all contexts',
		},
	]

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{cards.map((card) => (
				<Card key={card.label} className="shadow-none">
					<CardHeader>
						<CardDescription>{card.label}</CardDescription>
						<CardTitle className="text-2xl font-semibold tabular-nums">
							{isLoading ? <Skeleton className="h-7 w-28" /> : card.value}
						</CardTitle>
						<p className="text-muted-foreground text-xs">{card.footer}</p>
					</CardHeader>
				</Card>
			))}
		</div>
	)
}
