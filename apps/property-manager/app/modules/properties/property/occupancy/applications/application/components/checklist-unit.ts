import type { ChecklistItem } from './checklist-types'

export function getUnitItems(application: TenantApplication): ChecklistItem[] {
	return [{ label: 'Unit selected', done: Boolean(application.desired_unit) }]
}
