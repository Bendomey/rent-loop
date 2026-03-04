import type { ChecklistItem } from './checklist-types'

export function getMoveInItems(
	application: TenantApplication,
): ChecklistItem[] {
	return [
		{
			label: 'Move-in date',
			done: Boolean(application.desired_move_in_date),
		},
		{
			label: 'Stay duration frequency',
			done: Boolean(application.stay_duration_frequency),
		},
		{ label: 'Stay duration', done: Boolean(application.stay_duration) },
	]
}
