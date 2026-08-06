export interface ChecklistItem {
	label: string
	done: boolean
	/**
	 * Nice to have, but it does not hold the step back. An optional item still
	 * shows its state in the rail; it just never blocks the section from
	 * completing or the application from being approved.
	 */
	optional?: boolean
}

/**
 * What a row is, listed in the order it takes precedence when a step qualifies
 * for two.
 *
 * `attention` wins because it is the only one that means someone has to act
 * now. `locked` is a suffix on `done` rather than a colour of its own — the
 * tick stays, and the lock only says the step can no longer be revisited.
 */
export type ChecklistStepState =
	| 'attention'
	| 'blocked'
	| 'progress'
	| 'done'
	| 'locked'
	| 'todo'

export interface ChecklistStep {
	key: string
	label: string
	/** Where the row goes when it is tappable. */
	href: string
	state: ChecklistStepState
	/**
	 * One line, kept short. A fact when done, what is missing when in progress,
	 * the dependency when blocked, the damage when it needs attention. Absent
	 * when nothing has started — silence is cheaper than the words "Not started".
	 */
	note?: string
	/** Where "Fix that first" sends you. Only set when the state is blocked. */
	blockerHref?: string
	items: ChecklistItem[]
}

/** A step counts as satisfied for the steps that depend on it. */
export const isStepSatisfied = (state: ChecklistStepState) =>
	state === 'done' || state === 'locked'

/** The items a step is actually judged on. */
export const requiredItems = (items: ChecklistItem[]) =>
	items.filter((item) => !item.optional)
