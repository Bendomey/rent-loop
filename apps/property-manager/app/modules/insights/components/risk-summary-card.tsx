import { useState } from 'react'
import { useNavigate } from 'react-router'
import { getRiskLinkPath } from '../lib/risk-link'
import { RiskDetailModal } from '../overview/risk-detail-modal'
import { Badge } from '~/components/ui/badge'
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { cn } from '~/lib/utils'

export interface RiskStat {
	type: InsightsRiskType
	label: string
	value: string
	isPending: boolean
	propertyCount: number
	emptyText: string
	modalDescription: string
}

function StatusPill({ ok, className }: { ok: boolean; className?: string }) {
	return (
		<Badge
			variant="outline"
			className={cn(
				'gap-1.5',
				ok
					? 'border-teal-500/30 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-400'
					: 'border-amber-500/30 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400',
				className,
			)}
		>
			<span
				className={cn(
					'size-1.5 rounded-full',
					ok ? 'bg-teal-500' : 'bg-amber-500',
				)}
			/>
			{ok ? 'Clear' : 'Needs attention'}
		</Badge>
	)
}

function RiskColumn({
	stat,
	onViewDetails,
	showPropertyCount,
}: {
	stat: RiskStat
	onViewDetails: () => void
	showPropertyCount: boolean
}) {
	const needsAttention = stat.propertyCount > 0

	return (
		<div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0">
			<div className="flex items-center justify-between gap-2">
				<span className="text-muted-foreground text-sm">{stat.label}</span>
				{stat.isPending ? (
					<Skeleton className="h-5 w-24" />
				) : (
					<StatusPill ok={!needsAttention} />
				)}
			</div>

			{stat.isPending ? (
				<Skeleton className="h-7 w-24" />
			) : (
				<span className="text-xl font-semibold tabular-nums">{stat.value}</span>
			)}

			<div className="border-t pt-3">
				{stat.isPending ? (
					<Skeleton className="h-4 w-32" />
				) : needsAttention ? (
					<div
						className={cn(
							'flex items-center gap-2',
							showPropertyCount ? 'justify-between' : 'justify-end',
						)}
					>
						{showPropertyCount ? (
							<span className="text-muted-foreground text-xs">
								Across {stat.propertyCount}{' '}
								{stat.propertyCount === 1 ? 'property' : 'properties'}
							</span>
						) : null}
						<button
							type="button"
							onClick={onViewDetails}
							className="text-primary text-xs font-medium hover:underline"
						>
							View details →
						</button>
					</div>
				) : (
					<span className="text-muted-foreground text-xs">
						{stat.emptyText}
					</span>
				)}
			</div>
		</div>
	)
}

interface RiskSummaryCardProps {
	stats: RiskStat[]
	/** Property scope passed through to the detail modal's fetch. */
	scopedPropertyIds?: string[]
	/**
	 * Show "Across N properties" in each column's footer. Defaults to true;
	 * pass false when the card is already scoped to a single property (its
	 * own overview page) — that context is redundant there.
	 */
	showPropertyCount?: boolean
}

/**
 * Shared Risk Summary card + drill-down modal. Callers own data-fetching
 * (Cube queries, whatever their scope is) and just hand over the computed
 * stats — used by both the portfolio-wide Insights Overview and a single
 * property's overview page.
 */
export function RiskSummaryCard({
	stats,
	scopedPropertyIds,
	showPropertyCount = true,
}: RiskSummaryCardProps) {
	const navigate = useNavigate()
	const [openType, setOpenType] = useState<InsightsRiskType | null>(null)

	// Scoped to exactly one property: we already know which property needs
	// attention, so skip the "which property?" modal and go straight to the
	// page that resolves it.
	const singlePropertyId =
		scopedPropertyIds?.length === 1 ? scopedPropertyIds[0] : undefined

	const handleViewDetails = (stat: RiskStat) => {
		if (singlePropertyId) {
			void navigate(getRiskLinkPath(stat.type, singlePropertyId))
		} else {
			setOpenType(stat.type)
		}
	}

	const allPending = stats.every((stat) => stat.isPending)
	const attentionCount = stats.filter(
		(stat) => !stat.isPending && stat.propertyCount > 0,
	).length
	const openStat = stats.find((stat) => stat.type === openType) ?? null

	return (
		<>
			<Card className="shadow-none">
				<CardHeader>
					<CardTitle>Risk Summary</CardTitle>
					<CardDescription>
						Items that may need attention across the selected scope
					</CardDescription>
					{!allPending ? (
						<CardAction>
							<Badge
								variant="outline"
								className={cn(
									'gap-1.5',
									attentionCount === 0
										? 'border-teal-500/30 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-400'
										: 'border-amber-500/30 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400',
								)}
							>
								<span
									className={cn(
										'size-1.5 rounded-full',
										attentionCount === 0 ? 'bg-teal-500' : 'bg-amber-500',
									)}
								/>
								{attentionCount === 0
									? 'All clear'
									: `${attentionCount} ${attentionCount === 1 ? 'item needs' : 'items need'} attention`}
							</Badge>
						</CardAction>
					) : null}
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
						{stats.map((stat) => (
							<RiskColumn
								key={stat.type}
								stat={stat}
								onViewDetails={() => handleViewDetails(stat)}
								showPropertyCount={showPropertyCount}
							/>
						))}
					</div>
				</CardContent>
			</Card>
			{openStat ? (
				<RiskDetailModal
					type={openStat.type}
					label={openStat.label}
					description={openStat.modalDescription}
					totalValue={openStat.value}
					propertyCount={openStat.propertyCount}
					open={openType !== null}
					onOpenChange={(open) => setOpenType(open ? openStat.type : null)}
					scopedPropertyIds={scopedPropertyIds}
				/>
			) : null}
		</>
	)
}
