import {
	ArrowRight,
	Check,
	ChevronRight,
	Lock,
	TriangleAlert,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { ChecklistMarker } from './checklist-marker'
import type {
	ChecklistItem,
	ChecklistStep,
	ChecklistStepState,
} from './checklist-types'
import { requiredItems } from './checklist-types'
import { useCalculateChecklist } from './use-calculate-checklist'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Progress } from '~/components/ui/progress'
import { localizedDayjs } from '~/lib/date'
import { cn } from '~/lib/utils'

interface Props {
	application: TenantApplication
	propertyId: string
	footer?: React.ReactNode
}

export function PropertyTenantApplicationChecklist({
	application,
	propertyId,
	footer,
}: Props) {
	const baseUrl = `/properties/${propertyId}/occupancy/applications/${application.id}`
	const { pathname } = useLocation()

	const { steps, progress, needsAttention } = useCalculateChecklist(
		application,
		baseUrl,
	)
	const approved = application.status === 'TenantApplication.Status.Completed'

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle className="text-lg">
					{approved ? 'Application complete' : 'Complete application'}
				</CardTitle>
				<p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
					{approved
						? 'This application became a lease. Its steps are kept for the record.'
						: 'Five steps before this application can be approved into a lease.'}
				</p>

				{approved ? (
					<div className="bg-success-bg mt-4 flex items-center gap-2.5 rounded-xl px-3 py-2.5">
						<Check className="text-success size-4 shrink-0" />
						<span className="text-success text-xs font-bold">
							Approved
							{application.completed_at
								? ` ${localizedDayjs(application.completed_at).format('D MMM YYYY')}`
								: null}
						</span>
					</div>
				) : (
					<div className="mt-4 flex items-center gap-3">
						{/* Neutral track, as in the boards — only the fill carries colour,
						    and it turns orange the moment a step comes undone. */}
						<Progress
							value={progress}
							className={cn(
								'bg-muted',
								needsAttention ? '[&>*]:bg-warning!' : '',
							)}
						/>
						<span className="font-mono text-xs font-bold tabular-nums">
							{Math.round(progress)}%
						</span>
					</div>
				)}

				{needsAttention ? (
					<div className="bg-warning-bg mt-3 flex items-start gap-2.5 rounded-xl px-3 py-2.5">
						<TriangleAlert className="text-warning mt-0.5 size-4 shrink-0" />
						<span className="text-warning text-xs leading-relaxed font-semibold">
							One step needs attention. Nothing after it can proceed.
						</span>
					</div>
				) : null}
			</CardHeader>

			<CardContent className="px-3">
				{steps.map((step, index) => (
					<ChecklistRow
						key={step.key}
						step={step}
						first={index === 0}
						// Only the step being worked on opens. The other four stay one line
						// each — which is the answer to "is this overkill".
						active={pathname === step.href}
					/>
				))}
			</CardContent>

			{footer ? (
				<CardFooter className="flex justify-end gap-2 border-t pt-4">
					{footer}
				</CardFooter>
			) : !approved && progress === 100 ? (
				// The rail is navigation only — approving belongs to the overview, so
				// a finished rail points there rather than dead-ending.
				<CardFooter className="border-t pt-4">
					<Link
						to={baseUrl}
						className="text-primary text-sm font-semibold hover:underline"
					>
						Ready to approve — go to the overview →
					</Link>
				</CardFooter>
			) : null}
		</Card>
	)
}

/** A sub-step inherits from its parent, then reports its own truth. */
function subState(
	parent: ChecklistStepState,
	item: ChecklistItem,
): ChecklistStepState {
	// An optional item never inherits. A finished step whose optional part is
	// outstanding is genuinely finished, but ticking "First payment" while the
	// account reads GH₵ 0.00 settled would be a lie the reader can see through.
	if (item.optional) return item.done ? 'done' : 'todo'
	if (parent === 'done' || parent === 'locked') return 'done'
	if (parent === 'blocked' || parent === 'todo') return 'todo'
	// The data is still there but can no longer be trusted, so what was done
	// goes orange with its parent.
	if (parent === 'attention') return item.done ? 'attention' : 'todo'
	return item.done ? 'done' : 'todo'
}

function ChecklistRow({
	step,
	first,
	active,
}: {
	step: ChecklistStep
	first: boolean
	active: boolean
}) {
	const { state, note, items } = step
	const blocked = state === 'blocked'
	const required = requiredItems(items)
	const doneCount = required.filter((item) => item.done).length
	const open = active && items.length > 0

	// A blocked row sends you to the thing in the way, not to itself — tapping
	// into it would only lead to a write the server refuses.
	const href = blocked ? (step.blockerHref ?? step.href) : step.href

	return (
		<Link
			to={href}
			className={cn(
				'block px-3',
				first ? '' : 'border-t',
				active ? 'bg-primary/8 rounded-xl border-transparent' : '',
			)}
		>
			<div className="flex items-center gap-3 py-3">
				<ChecklistMarker state={state} />

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5">
						<span
							className={cn(
								'text-sm',
								active ? 'font-bold' : 'font-medium',
								blocked ? 'text-muted-foreground' : '',
							)}
						>
							{step.label}
						</span>
						{state === 'locked' ? (
							<Lock className="text-muted-foreground size-3" />
						) : null}
					</div>
					{note && !open ? (
						<p
							className={cn(
								'mt-0.5 text-xs font-semibold',
								blocked || state === 'attention'
									? 'text-warning'
									: 'text-muted-foreground',
							)}
						>
							{note}
						</p>
					) : null}
				</div>

				{open ? (
					<span className="text-muted-foreground font-mono text-[11px] font-bold whitespace-nowrap">
						{doneCount} of {required.length}
					</span>
				) : null}

				{blocked && !open ? (
					<>
						{/* On a phone the full phrase costs more room than the label it
						    is competing with, and the orange note already names the
						    blocker — so the arrow carries it alone. */}
						<span className="text-warning hidden shrink-0 text-xs font-bold whitespace-nowrap sm:inline">
							Fix that first →
						</span>
						<ArrowRight className="text-warning size-4 shrink-0 sm:hidden" />
					</>
				) : (
					<ChevronRight
						className={cn(
							'text-muted-foreground size-4 shrink-0',
							open ? 'rotate-90' : '',
						)}
					/>
				)}
			</div>

			{open ? (
				<div className="-mt-1 pb-3 pl-8">
					{items.map((item) => (
						<div key={item.label} className="flex items-center gap-2.5 py-1">
							<ChecklistMarker state={subState(state, item)} size="sm" />
							<span
								className={cn(
									'text-xs font-medium',
									item.done ? 'text-foreground/80' : 'text-muted-foreground',
								)}
							>
								{item.label}
							</span>
							{item.optional ? (
								<span className="text-muted-foreground rounded border px-1 py-px text-[9px] font-bold tracking-wide uppercase">
									Optional
								</span>
							) : null}
						</div>
					))}
					{(blocked || state === 'attention') && note ? (
						<p className="text-warning mt-2 text-xs font-bold">{note} →</p>
					) : null}
				</div>
			) : null}
		</Link>
	)
}
