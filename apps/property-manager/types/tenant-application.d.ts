interface TenantApplication {
	id: string
	code: string
	on_boarding_method: 'SELF' | 'ADMIN'
	status:
		| 'TenantApplication.Status.InProgress'
		| 'TenantApplication.Status.Cancelled'
		| 'TenantApplication.Status.Completed'

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
		'DRIVER_LICENSE' | 'PASSPORT' | 'NATIONAL_ID' | 'GHANA_CARD'
	>
	id_number: string
	id_front_url: Nullable<string>
	id_back_url: Nullable<string>
	current_address: string
	emergency_contact_name: string
	emergency_contact_phone: string
	relationship_to_emergency_contact: string
	employer_type: 'WORKER' | 'STUDENT'
	occupation: string
	employer: string
	occupation_address: string
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
	desired_unit: PropertyUnit
	desired_move_in_date: Nullable<Date>
	stay_duration_frequency: Nullable<string>
	stay_duration: Nullable<number>

	rent_fee: number
	rent_fee_currency: string
	payment_frequency: Nullable<string>

	initial_deposit_fee: Nullable<number>
	initial_deposit_currency: Nullable<string>

	security_deposit_fee: Nullable<number>
	security_deposit_fee_currency: Nullable<string>

	lease_agreement_document_mode: Nullable<'MANUAL' | 'ONLINE'>
	lease_agreement_document_url: Nullable<string>

	lease_agreement_document_id: Nullable<string>
	lease_agreement_document: Nullable<RentloopDocument>
	lease_agreement_document_status: Nullable<
		'DRAFT' | 'FINALIZED' | 'SIGNING' | 'SIGNED'
	>

	lease_agreement_document_signatures: Array<RentloopDocumentSignature>

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
	property_id?: string
	ids?: Array<string>
}
