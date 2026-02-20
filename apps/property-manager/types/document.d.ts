interface RentloopDocument {
	id: string

	type: 'TEMPLATE' | 'DOCUMENT'
	title: string
	content: string
	size: number
	tags: Array<string>

	property_id: string
	property?: Property

	created_by_id: string
	created_by?: ClientUser
	updated_by_id: string
	updated_by?: ClientUser

	created_at: Date
	updated_at: Date
}

interface RentloopDocumentSignature {
	id: string
	document_id: string
	document: Document
	tenant_application_id: Nullable<string>
	tenant_application: Nullable<TenantApplication>
	role: 'PROPERTY_MANAGER' | 'TENANT' | 'PM_WITNESS' | 'TENANT_WITNESS'
	signature_url: string
	signed_by_name: Nullable<string>
	signed_by_id: Nullable<string>
	signed_by?: Nullable<ClientUser>
	ip_address: string
	created_at: Date
	updated_at: Date
}

interface FetchRentloopDocumentFilter {
	property_id?: string
	property_slug?: string
	type?: string
	tags?: Array<string>
	ids?: Array<string>
	only_global_documents?: boolean
	include_global_documents?: boolean
}
