interface Tenant {
	id: string
	on_boarding_method: 'SELF' | 'ADMIN'
	first_name: string
	other_names: Nullable<string>
	last_name: string
	email: Nullable<string>
	phone: string
	gender: Nullable<'MALE' | 'FEMALE'>
	date_of_birth: Nullable<string>
	nationality: Nullable<string>
	marital_status: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED'
	profile_photo_url: Nullable<string>
	id_type: Nullable<
		'DRIVER_LICENSE' | 'PASSPORT' | 'NATIONAL_ID' | 'GHANA_CARD'
	>
	id_number: string
	id_front_url: Nullable<string>
	id_back_url: Nullable<string>
	status: 'Tenant.Status.Active' | 'Tenant.Status.Suspended'
	current_address: Nullable<string>
	emergency_contact_name: Nullable<string>
	emergency_contact_phone: Nullable<string>
	relationship_to_emergency_contact: Nullable<string>
	employer_type: Nullable<'WORKER' | 'STUDENT'>
	occupation: Nullable<string>
	employer: Nullable<string>
	occupation_address: Nullable<string>
	proof_of_income_url: Nullable<string>

	created_by: Nullable<ClientUser>
	created_by_id: string

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
