import { useInsightsFilters } from '../use-insights-filters'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
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

function RiskStat({
	label,
	value,
	isPending,
}: {
	label: string
	value: string
	isPending: boolean
}) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-muted-foreground text-sm">{label}</span>
			{isPending ? (
				<Skeleton className="h-7 w-20" />
			) : (
				<span className="text-xl font-semibold tabular-nums">{value}</span>
			)}
		</div>
	)
}

export function RiskSummary() {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)
	const { propertyId, propertyFilter } = useInsightsFilters()

	const today = localizedDayjs().format('YYYY-MM-DD')
	const in60Days = localizedDayjs().add(60, 'day').format('YYYY-MM-DD')

	const outstandingQuery = useCubeQuery<OutstandingRow>(
		token,
		['ins-ov-risk-outstanding', propertyId ?? 'all'],
		{
			measures: ['Invoices.outstandingAmount'],
			filters: propertyFilter('Invoices.propertyId'),
		},
	)

	const expiringQuery = useCubeQuery<ExpiringRow>(
		token,
		['ins-ov-risk-expiring', propertyId ?? 'all'],
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
		['ins-ov-risk-maintenance', propertyId ?? 'all'],
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

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>Risk Summary</CardTitle>
				<CardDescription>
					Items that may need attention across the selected scope
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
					<RiskStat
						label="Outstanding rent"
						value={formatAmount(convertPesewasToCedis(outstanding))}
						isPending={outstandingQuery.isPending}
					/>
					<RiskStat
						label="Leases expiring in 60 days"
						value={expiring.toLocaleString()}
						isPending={expiringQuery.isPending}
					/>
					<RiskStat
						label="Open maintenance requests"
						value={openMaintenance.toLocaleString()}
						isPending={maintenanceQuery.isPending}
					/>
				</div>
			</CardContent>
		</Card>
	)
}
