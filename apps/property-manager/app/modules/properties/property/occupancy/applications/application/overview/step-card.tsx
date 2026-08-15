import { ChevronRight, Lock } from 'lucide-react'
import { Link } from 'react-router'
import { ChecklistMarker } from '../components/checklist-marker'
import type { ChecklistStep } from '../components/checklist-types'
import { STEP_CTA, type StepCopy } from './overview-copy'
import { buttonVariants } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { cn } from '~/lib/utils'

/**
 * One step, as a card you click into.
 *
 * The chips fill from each item's own `done`, never by counting — an index-
 * based fill would tick the wrong items whenever an optional one is
 * outstanding, which is exactly the lie the rail's `subState` avoids.
 */
export function OverviewStepCard({
	step,
	copy,
	lead,
}: {
	step: ChecklistStep
	copy: StepCopy
	lead: boolean
}) {
	const blocked = step.state === 'blocked'
	const attention = step.state === 'attention'
	const cta = STEP_CTA[step.state]
	// A blocked card sends you to the thing in the way, as the rail does.
	const href = blocked ? (step.blockerHref ?? step.href) : step.href

	return (
		<Link to={href} className="block" data-step={step.key}>
			<Card
				// Marks the step the lead card is pointing at. A test hook as much as
				// anything: asserting on the accent border would also catch the done
				// markers, which carry the same colour.
				data-lead={lead ? 'true' : undefined}
				className={cn(
					'flex flex-row items-start gap-4 p-5 shadow-none transition-colors',
					blocked ? 'bg-muted' : 'bg-card hover:border-foreground/20',
					lead ? 'border-primary shadow-[0_2px_0_var(--primary)]' : '',
				)}
			>
				<div className="mt-0.5">
					<ChecklistMarker state={step.state} />
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span
							className={cn(
								'text-base font-bold',
								blocked ? 'text-muted-foreground' : '',
							)}
						>
							{copy.title}
						</span>
						{step.state === 'locked' ? (
							<Lock className="text-muted-foreground size-3.5" />
						) : null}
					</div>

					<p className="text-muted-foreground mt-1 text-sm leading-relaxed">
						{copy.what}
					</p>

					{step.note ? (
						<p
							className={cn(
								'mt-2.5 text-sm font-semibold',
								blocked || attention ? 'text-warning' : 'text-muted-foreground',
							)}
						>
							{step.note}
						</p>
					) : null}

					<div className="mt-3 flex flex-wrap gap-1.5">
						{step.items.map((item) => (
							<span
								key={item.label}
								className={cn(
									'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
									item.done
										? 'bg-success-bg text-success'
										: 'text-muted-foreground border',
								)}
							>
								{item.label}
								{item.optional ? (
									<span className="rounded border px-1 py-px text-[9px] font-bold tracking-wide uppercase">
										Optional
									</span>
								) : null}
							</span>
						))}
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-2 pt-1">
					{/*
					 * Styled as a button but rendered as a span: the whole card is
					 * already a Link, and a <button> inside an <a> is invalid HTML that
					 * breaks keyboard activation.
					 */}
					{cta ? (
						<span
							className={cn(
								buttonVariants({
									variant: lead ? 'default' : 'outline',
									size: 'sm',
								}),
								'pointer-events-none',
							)}
						>
							{cta}
						</span>
					) : (
						<span className="text-muted-foreground text-sm font-semibold">
							Locked for now
						</span>
					)}
					<ChevronRight className="text-muted-foreground size-4" />
				</div>
			</Card>
		</Link>
	)
}
