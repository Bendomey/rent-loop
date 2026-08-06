import type { ChecklistItem } from './checklist-types'

/**
 * Seventeen fields, reported as four groups.
 *
 * The rail shows these inline under the active step, and seventeen rows in a
 * sidebar is the density the redesign set out to remove. Grouping changes
 * nothing about what is required — a group is done only when every field in it
 * is saved — it just stops the list from burying the one field that is missing.
 */
export function getTenantDetailItems(
	application: TenantApplication,
): ChecklistItem[] {
	const all = (...values: Array<unknown>) => values.every(Boolean)

	return [
		{
			label: 'Contact details',
			done: all(
				application.first_name,
				application.last_name,
				application.phone,
				application.gender,
				application.date_of_birth,
				application.nationality,
				application.marital_status,
				application.current_address,
			),
		},
		{
			label: 'Proof of ID',
			done: all(application.id_type, application.id_number),
		},
		{
			label: 'Employment',
			done: all(
				application.employer_type,
				application.occupation,
				application.employer,
				application.occupation_address,
			),
		},
		{
			label: 'Emergency contact',
			done: all(
				application.emergency_contact_name,
				application.emergency_contact_phone,
				application.relationship_to_emergency_contact,
			),
		},
	]
}
