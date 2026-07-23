import { InsightsKpiRow } from './kpi-row'
import { PropertyRankings } from './property-rankings'
import { RiskSummary } from './risk-summary'
import { InsightsTrends } from './trends'

export function InsightsOverviewModule() {
	return (
		<div className="flex flex-col gap-4 md:gap-6">
			<RiskSummary />
			<InsightsKpiRow />
			<InsightsTrends />
			<PropertyRankings />
		</div>
	)
}
