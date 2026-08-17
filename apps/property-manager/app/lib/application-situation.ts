/**
 * What the overview is looking at, and what it should point the landlord at.
 *
 * The step states themselves come from `buildChecklistSteps`, which stays the
 * single source of truth. This module only reads them — the rail and the hub
 * are two presentations of one state machine, and nothing here may diverge
 * from it.
 *
 * The union is redeclared structurally rather than imported: `app/lib` must
 * not depend on a feature module. The literals match `ChecklistStepState`, so
 * a `ChecklistStep['state']` is assignable.
 */
export type StepState =
	| 'attention'
	| 'blocked'
	| 'progress'
	| 'done'
	| 'locked'
	| 'todo'

export type ApplicationSituation =
	| 'fresh'
	| 'midway'
	| 'attention'
	| 'ready'
	| 'approved'
	| 'cancelled'

export interface SituationInput {
	status: TenantApplication['status']
	/** One entry per step, in step order. */
	stepStates: readonly StepState[]
	canApprove: boolean
}

const satisfied = (state: StepState) => state === 'done' || state === 'locked'

/**
 * Resolved in strict order, and the order is load-bearing.
 *
 * `attention` outranks `ready` because a step can come undone from outside —
 * the unit let to someone else — while every field it needs is still filled
 * in. Ranking `ready` first would offer to approve an application that cannot
 * proceed.
 */
export function resolveSituation({
	status,
	stepStates,
	canApprove,
}: SituationInput): ApplicationSituation {
	if (status === 'TenantApplication.Status.Completed') return 'approved'
	if (status === 'TenantApplication.Status.Cancelled') return 'cancelled'
	if (stepStates.some((state) => state === 'attention')) return 'attention'
	if (canApprove) return 'ready'
	return stepStates.filter(satisfied).length <= 1 ? 'fresh' : 'midway'
}

/**
 * The step "Do this next" opens, or null when there is nothing to do next.
 *
 * Blocked steps are never the lead: tapping into one leads only to a write the
 * server refuses, which is the same reason the rail routes a blocked row to
 * its blocker instead of itself.
 */
export function leadStepIndex(stepStates: readonly StepState[]): number | null {
	const first = (want: StepState) => {
		const index = stepStates.indexOf(want)
		return index === -1 ? null : index
	}
	return first('attention') ?? first('progress') ?? first('todo')
}

/** Situations where the page is a decision or a record, not a to-do list. */
const NO_NEXT_STEP: ReadonlySet<ApplicationSituation> = new Set([
	'ready',
	'approved',
	'cancelled',
])

/**
 * The next step for a given situation, or null when there isn't one.
 *
 * Not the same as `leadStepIndex`. A step with no items is vacuously
 * approvable — lease documents are optional until an agreement is attached —
 * so an application can be `ready` while a step is still `todo`. Pointing at
 * that step would have the page say "Everything's done" and highlight an
 * unfinished step in the same breath.
 */
export function leadStepFor(
	situation: ApplicationSituation,
	stepStates: readonly StepState[],
): number | null {
	return NO_NEXT_STEP.has(situation) ? null : leadStepIndex(stepStates)
}
