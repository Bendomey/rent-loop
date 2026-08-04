import { TrendingDown, TrendingUp } from 'lucide-react'
import { Badge } from '~/components/ui/badge'

/**
 * Delta vs the previous period, e.g. "+12.4%". Renders nothing when the
 * previous value is 0 (no meaningful percentage exists).
 */
export function ComparisonBadge({
	current,
	previous,
}: {
	current: number
	previous: number
}) {
	if (previous === 0) return null
	const deltaPct = ((current - previous) / previous) * 100
	const up = deltaPct >= 0
	return (
		<Badge variant="outline">
			{up ? <TrendingUp /> : <TrendingDown />}
			{up ? '+' : ''}
			{deltaPct.toFixed(1)}%
		</Badge>
	)
}
