import { useInsightsFilters } from '../use-insights-filters'
import { InsightsKpiRow } from './kpi-row'
import { PropertyRankings } from './property-rankings'
import { RiskSummary } from './risk-summary'
import { InsightsTrends } from './trends'

export function InsightsOverviewModule() {
	const { propertyId } = useInsightsFilters()
	return (
		<div className="flex flex-col gap-4 md:gap-6">
			<InsightsKpiRow />
			<RiskSummary />
			<InsightsTrends />
			{!propertyId ? <PropertyRankings /> : null}
		</div>
	)
}
