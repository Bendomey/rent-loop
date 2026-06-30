interface LeaseAgreementDocument {
	id: string
	lease_id: string
	mode: 'MANUAL' | 'ONLINE'
	document_id: Nullable<string>
	document?: Nullable<RentloopDocument>
	document_url: Nullable<string>
	status: 'DRAFT' | 'FINALIZED' | 'SIGNING' | 'SIGNED'
	signatures: Array<RentloopDocumentSignature>
	created_at: Date
	updated_at: Date
}
