import type { ChecklistStep } from '../components/checklist-types'
import { useCalculateChecklist } from '../components/use-calculate-checklist'
import {
	type LeadCopy,
	type StepCopy,
	leadCopyFor,
	stepCopyFor,
} from './overview-copy'
import {
	type ApplicationSituation,
	type StepState,
	leadStepFor,
	resolveSituation,
} from '~/lib/application-situation'
import { type Pronouns, pronounsFor } from '~/lib/pronouns'

export interface ApplicationOverview {
	steps: ChecklistStep[]
	copy: Record<string, StepCopy>
	situation: ApplicationSituation
	leadStep: ChecklistStep | null
	lead: LeadCopy
	progress: number
	doneCount: number
	canApprove: boolean
	pronouns: Pronouns
	firstName: string
}

/**
 * The hub's view of the application.
 *
 * Everything about *state* comes from `useCalculateChecklist` — the same call
 * the rail makes. This adds only which situation the page is in, which step to
 * point at, and the words to say it in.
 */
export function useApplicationOverview(
	application: TenantApplication,
	baseUrl: string,
): ApplicationOverview {
	const { steps, progress, doneCount, canApprove } = useCalculateChecklist(
		application,
		baseUrl,
	)

	const stepStates = steps.map((step) => step.state as StepState)
	const situation = resolveSituation({
		status: application.status,
		stepStates,
		canApprove,
	})

	const index = leadStepFor(situation, stepStates)
	const leadStep = index === null ? null : (steps[index] ?? null)

	const pronouns = pronounsFor(application.gender)
	const firstName = application.first_name
	const copy = stepCopyFor(pronouns, firstName)

	const lead = leadCopyFor(
		situation,
		pronouns,
		firstName,
		leadStep ? (copy[leadStep.key]?.title ?? leadStep.label) : null,
		application.desired_unit?.name ?? null,
	)

	return {
		steps,
		copy,
		situation,
		leadStep,
		lead,
		progress,
		doneCount,
		canApprove,
		pronouns,
		firstName,
	}
}
