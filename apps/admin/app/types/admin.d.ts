interface Admin {
	id: string
	name: string
	email: string
	status: 'Admin.Status.Active' | 'Admin.Status.Inactive'
	phone_number: string
	created_at: Date
	updated_at: Date
}

interface FetchAdminFilter {
	status?: string
}

interface ClientApplication {
	id: string
	name: string
	type: 'INDIVIDUAL' | 'COMPANY'
	sub_type: 'LANDLORD' | 'PROPERTY_MANAGER' | 'DEVELOPER' | 'AGENCY'
	status:
		| 'ClientApplication.Status.Pending'
		| 'ClientApplication.Status.Approved'
		| 'ClientApplication.Status.Rejected'
	contact_name: string
	contact_email: string
	contact_phone_number: string
	address: string
	city: string
	region: string
	country: string
	latitude: number
	longitude: number
	description: Maybe<string>
	logo_url: Maybe<string>
	website_url: Maybe<string>
	support_email: string
	support_phone: string
	registration_number: Maybe<string>
	date_of_birth: Maybe<string>
	id_type: Maybe<'DRIVERS_LICENSE' | 'PASSPORT' | 'NATIONAL_ID'>
	id_number: Maybe<string>
	id_expiry: Maybe<string>
	id_document_url: Maybe<string>
	approved_by_id: Maybe<string>
	rejected_by_id: Maybe<string>
	rejected_because: Maybe<string>
	created_at: Date
	updated_at: Date
}

interface FetchClientApplicationFilter {
	status?: string
	type?: string
	sub_type?: string
}

interface CreateClientApplicationInput {
	name: string
	type: ClientApplication['type']
	sub_type: ClientApplication['sub_type']
	contact_name: string
	contact_email: string
	contact_phone_number: string
	address: string
	city: string
	region: string
	country: string
	latitude: number
	longitude: number
	support_email: string
	support_phone: string
	description?: string
	website_url?: string
	registration_number?: string
	date_of_birth?: string
}
