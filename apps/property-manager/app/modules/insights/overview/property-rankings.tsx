import { useMemo } from 'react'
import { RankingTable, type RankingRow } from '../components/ranking-table'
import { useInsightsFilters } from '../use-insights-filters'
import { UnitDistribution } from './unit-distribution'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import { useGetClientUserProperties } from '~/api/client-user-properties'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface RevenueByPropertyRow {
	'Invoices.propertyId': string | null
	'Invoices.paidAmount': string | null
}

/**
 * Property rankings (portfolio scope only) plus the unit distribution card,
 * which stays visible regardless of scope — grouped together since they
 * share this section of the Overview page.
 */
export function PropertyRankings() {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)
	const { propertyIds, from, to, timeDimension } = useInsightsFilters()
	const isPortfolioScope = propertyIds.length === 0

	const revenueByPropertyQuery = useCubeQuery<RevenueByPropertyRow>(
		token,
		['ins-ov-revenue-by-property', from, to],
		{
			measures: ['Invoices.paidAmount'],
			dimensions: ['Invoices.propertyId'],
			timeDimensions: [timeDimension('Invoices.paidAt')],
			order: { 'Invoices.paidAmount': 'desc' },
		},
		{ enabled: isPortfolioScope },
	)

	const { data: propertiesData } = useGetClientUserProperties(
		safeString(clientUser?.client_id),
		{
			pagination: { page: 1, per: 100 },
			sorter: {},
			search: {},
			populate: ['Property'],
			filters: { client_user_id: clientUser?.id },
		},
	)

	const nameById = useMemo(() => {
		const map = new Map<string, string>()
		for (const row of propertiesData?.rows ?? []) {
			if (row.property) map.set(row.property.id, row.property.name)
		}
		return map
	}, [propertiesData])

	const rows: RankingRow[] = (revenueByPropertyQuery.data ?? []).flatMap(
		(row) => {
			const id = row['Invoices.propertyId']
			if (!id) return []
			return [
				{
					id,
					name: nameById.get(id) ?? 'Unknown property',
					value: convertPesewasToCedis(
						parseFloat(row['Invoices.paidAmount'] ?? '0'),
					),
				},
			]
		},
	)

	const top = rows.slice(0, 5)
	const bottom = rows.length > 5 ? rows.slice(-5).reverse() : []

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			{isPortfolioScope ? (
				<div className="flex flex-col gap-4">
					<RankingTable
						title="Top Properties by Revenue"
						description="Highest paid revenue in the selected period"
						rows={top}
						isPending={revenueByPropertyQuery.isPending}
						valueLabel="Revenue"
						valueFormatter={(value) => formatAmount(value)}
					/>
					{bottom.length > 0 ? (
						<RankingTable
							title="Lowest Revenue Properties"
							description="Lowest paid revenue in the selected period"
							rows={bottom}
							isPending={revenueByPropertyQuery.isPending}
							valueLabel="Revenue"
							valueFormatter={(value) => formatAmount(value)}
						/>
					) : null}
				</div>
			) : null}
			<UnitDistribution
				className={!isPortfolioScope ? 'lg:col-span-2' : undefined}
			/>
		</div>
	)
}
