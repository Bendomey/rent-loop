import type { ChecklistItem } from './checklist-types'

export function getTenantDetailItems(
	application: TenantApplication,
): ChecklistItem[] {
	return [
		{ label: 'First name', done: Boolean(application.first_name) },
		{ label: 'Last name', done: Boolean(application.last_name) },
		{ label: 'Phone', done: Boolean(application.phone) },
		{ label: 'Gender', done: Boolean(application.gender) },
		{ label: 'Date of birth', done: Boolean(application.date_of_birth) },
		{ label: 'Nationality', done: Boolean(application.nationality) },
		{ label: 'Marital status', done: Boolean(application.marital_status) },
		{ label: 'ID type', done: Boolean(application.id_type) },
		{ label: 'ID number', done: Boolean(application.id_number) },
		{ label: 'Current address', done: Boolean(application.current_address) },
		{
			label: 'Emergency contact name',
			done: Boolean(application.emergency_contact_name),
		},
		{
			label: 'Emergency contact phone',
			done: Boolean(application.emergency_contact_phone),
		},
		{
			label: 'Relationship to emergency contact',
			done: Boolean(application.relationship_to_emergency_contact),
		},
		{ label: 'Employment type', done: Boolean(application.employer_type) },
		{ label: 'Occupation', done: Boolean(application.occupation) },
		{ label: 'Employer', done: Boolean(application.employer) },
		{
			label: 'Occupation address',
			done: Boolean(application.occupation_address),
		},
	]
}
