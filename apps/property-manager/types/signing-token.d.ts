interface AdminSigningToken {
	id: string
	token: string
	document_id: string
	document?: RentloopDocument
	tenant_application_id: Nullable<string>
	tenant_application?: TenantApplication
	lease_id: Nullable<string>
	lease?: Lease
	role: 'TENANT' | 'PM_WITNESS' | 'TENANT_WITNESS'
	signer_name: Nullable<string>
	signer_email: Nullable<string>
	signer_phone: Nullable<string>
	created_by_id: string
	created_by?: ClientUser
	signed_at: Nullable<Date>
	last_accessed_at: Nullable<Date>
	expires_at: Date
	document_signature_id: Nullable<string>
	document_signature?: RentloopDocumentSignature
	created_at: Date
	updated_at: Date
}

interface SigningToken {
	id: string
	token: string
	document_id: string
	document?: RentloopDocument
	tenant_application_id: Nullable<string>
	tenant_application?: TenantApplication
	lease_id: Nullable<string>
	lease?: Lease
	role: 'TENANT' | 'PM_WITNESS' | 'TENANT_WITNESS'
	signer_name: Nullable<string>
	signer_email: Nullable<string>
	signer_phone: Nullable<string>
	signed_at: Nullable<Date>
	last_accessed_at: Nullable<Date>
	expires_at: Date
	document_signature_id: Nullable<string>
	document_signature?: RentloopDocumentSignature
	created_at: Date
	updated_at: Date
}
