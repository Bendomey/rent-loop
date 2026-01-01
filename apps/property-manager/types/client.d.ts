interface ClientApplication {
	id: string
	type: 'INDIVIDUAL' | 'COMPANY'
	sub_type: 'LANDLORD' | 'PROPERTY_MANAGER' | 'DEVELOPER' | 'AGENCY'
	name: string

	address: string
	country: string
	region: string
	city: string
	latitude: number
	longitude: number

	registration_number: Nullable<string>
	logo_url: Nullable<string>
	description: Nullable<string>
	website_url: Nullable<string>
	support_email: Nullable<string>
	support_phone: Nullable<string>

	date_of_birth: Nullable<string>
	id_type: Nullable<'DRIVERS_LICENSE' | 'PASSPORT' | 'NATIONAL_ID'>
	id_number: Nullable<string>
	id_document_url: Nullable<string>
	id_expiry: Nullable<string>
	contact_email: string
	contact_name: string
	contact_phone_number: string

	status:
		| 'ClientApplication.Status.Approved'
		| 'ClientApplication.Status.Pending'
		| 'ClientApplication.Status.Rejected'

	approved_by_id: Nullable<string>
	rejected_by_id: Nullable<string>
	rejected_because: Nullable<string>

	created_at: Date
	updated_at: Date
}

interface Client {
	id: string
	type: 'INDIVIDUAL' | 'COMPANY'
	sub_type: 'LANDLORD' | 'PROPERTY_MANAGER' | 'DEVELOPER' | 'AGENCY'
	name: string

	address: string
	country: string
	region: string
	city: string
	latitude: number
	longitude: number

	registration_number: Nullable<string>
	description: Nullable<string>
	website_url: Nullable<string>
	support_email: Nullable<string>
	support_phone: Nullable<string>

	client_application_id: string
	client_application: Nullable<ClientApplication>

	created_at: Date
	updated_at: Date
}
