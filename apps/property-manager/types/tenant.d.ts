interface Tenant {
	id: string
	first_name: string
	other_names: Nullable<string>
	last_name: string
	email: string
	phone: string
	gender: 'MALE' | 'FEMALE'
	date_of_birth: Nullable<Date>
	nationality: Nullable<string>
	marital_status: Nullable<'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED'>
	profile_photo_url: Nullable<string>
	id_type: Nullable<
		'DRIVER_LICENSE' | 'PASSPORT' | 'NATIONAL_ID' | 'GHANA_CARD'
	>
	id_number: Nullable<string>
	id_front_url: Nullable<string>
	id_back_url: Nullable<string>
	status: 'ACTIVE' | 'EXPIRED'
	current_address: string
	emergency_contact_name: Nullable<string>
	emergency_contact_phone: Nullable<string>
	relationship_to_emergency_contact: Nullable<string>
	employer_type: 'WORKER' | 'STUDENT'
	occupation: Nullable<string>
	employer: Nullable<string>
	occupation_address: Nullable<string>
	proof_of_income_url: Nullable<string>

	created_by: Nullable<ClientUser>
	created_by_id: string

	created_at: Date
	updated_at: Date
}

interface FetchTenantFilter {
	status?: string
	gender?: string
	marital_status?: string
	property_id?: string
	ids?: Array<string>
}
