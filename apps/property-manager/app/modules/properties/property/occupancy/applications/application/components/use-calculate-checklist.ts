import { buildChecklistSteps } from './checklist-steps'
import { isStepSatisfied, requiredItems } from './checklist-types'

/**
 * The rail's numbers.
 *
 * Progress counts steps, not fields: done ÷ 5. A half-finished step
 * contributes nothing, so the bar can never read 100% while anything is short,
 * and blocked or needs-attention steps count as not done.
 */
export function useCalculateChecklist(
	application: TenantApplication,
	baseUrl = '',
) {
	const steps = buildChecklistSteps(application, baseUrl)

	const doneCount = steps.filter((step) => isStepSatisfied(step.state)).length
	const progress = (doneCount / steps.length) * 100
	const needsAttention = steps.some((step) => step.state === 'attention')

	// Approval gate. A step with no items is vacuously fine — lease documents are
	// optional until an agreement is attached — but one that has items must have
	// all of its required ones saved.
	const canApprove = steps.every(
		(step) =>
			step.items.length === 0 ||
			requiredItems(step.items).every((item) => item.done),
	)

	return { steps, progress, doneCount, needsAttention, canApprove }
}
