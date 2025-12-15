interface TenantApplication {
	id: string
	first_name: string
	other_names: Nullable<string>
	last_name: string
	email: string
	phone: string
	gender: 'MALE' | 'FEMALE'
	date_of_birth: string
	nationality: string
	marital_status: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED'
	profile_photo_url: Nullable<string>
	id_type: Nullable<
		'DRIVERS_LICENSE' | 'PASSPORT' | 'NATIONAL_ID' | 'STUDENT_ID'
	>
	id_number: string
	id_front_url: Nullable<string>
	id_back_url: Nullable<string>
	status:
		| 'TenantApplication.Status.InProgress'
		| 'TenantApplication.Status.Cancelled'
		| 'TenantApplication.Status.Completed'
	current_address: string
	emergency_contact_name: string
	emergency_contact_phone: string
	relationship_to_emergency_contact: string
	occupation: string
	employer: string
	occupation_address: string
	proof_of_income_url: Nullable<string>
	completed_at: Nullable<Date>
	completed_by_id: Nullable<string>
	completed_by: Nullable<ClientUser>
	cancelled_at: Nullable<Date>
	cancelled_by_id: Nullable<string>
	cancelled_by: Nullable<ClientUser>
	desired_unit_id: string
	desired_unit: Unit
	previous_landlord_name: Nullable<string>
	previous_landlord_phone: Nullable<string>
	previous_tenancy_period: Nullable<string>
	created_at: Date
	updated_at: Date
}

interface FetchTenantApplicationFilter {
	status?: string
	gender?: string
	marital_status?: string
}
