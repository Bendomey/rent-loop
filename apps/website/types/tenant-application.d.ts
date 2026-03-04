interface TenantApplication {
	id: string
	on_boarding_method: 'SELF' | 'ADMIN'
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
	status:
		| 'TenantApplication.Status.InProgress'
		| 'TenantApplication.Status.Cancelled'
		| 'TenantApplication.Status.Completed'
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
	desired_unit: Unit
	previous_landlord_name: Nullable<string>
	previous_landlord_phone: Nullable<string>
	previous_tenancy_period: Nullable<string>
	created_at: Date
	updated_at: Date
}

interface TrackingApplication {
	code: string
	status: TenantApplication['status']
	first_name: string
	last_name: string
	desired_unit: Nullable<{
		name: string
		type: string
		property: Nullable<{ name: string; address: string }>
	}>
	desired_move_in_date: Nullable<string>
	stay_duration: Nullable<number>
	stay_duration_frequency: Nullable<string>
	rent_fee: number
	rent_fee_currency: string
	payment_frequency: Nullable<string>
	initial_deposit_fee: Nullable<number>
	security_deposit_fee: Nullable<number>
	lease_agreement_document_status: Nullable<
		'DRAFT' | 'FINALIZED' | 'SIGNING' | 'SIGNED'
	>
	lease_agreement_document_signing_url: Nullable<string>
	lease_agreement_document_url: Nullable<string>
	application_payment_invoice: Nullable<TrackingInvoice>
	checklist_progress: {
		unit_selected: boolean
		personal_details_complete: boolean
		move_in_setup_complete: boolean
		financial_setup_complete: boolean
		lease_document_ready: boolean
	}
	created_at: string
	completed_at: Nullable<string>
	cancelled_at: Nullable<string>
}

interface TrackingInvoice {
	code: string
	status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID'
	total_amount: number
	currency: string
	line_items: Array<{
		label: string
		category: string
		total_amount: number
		currency: string
	}>
	paid_at: Nullable<string>
	due_date: Nullable<string>
}
