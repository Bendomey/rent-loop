type LeaseTerminationStatus = 'InProgress' | 'Completed' | 'Cancelled'
type LeaseTerminationType = 'EVICTION' | 'MUTUAL_AGREEMENT' | 'TENANT_INITIATED'
type LeaseTerminationDocumentMode = 'MANUAL' | 'ONLINE'

interface LeaseTermination {
	id: string
	code: string
	status: LeaseTerminationStatus
	type: Nullable<LeaseTerminationType>
	reason: Nullable<string>

	lease_id: string
	lease: Nullable<Lease>

	lease_checklist_id: Nullable<string>
	lease_checklist: Nullable<LeaseChecklist>

	document_mode: Nullable<LeaseTerminationDocumentMode>
	document_url: Nullable<string>
	document_id: Nullable<string>
	document: Nullable<RentloopDocument>

	initiated_by_id: string
	initiated_by: Nullable<ClientUser>

	completed_at: Nullable<Date>
	completed_by_id: Nullable<string>
	completed_by: Nullable<ClientUser>

	cancelled_at: Nullable<Date>
	cancelled_by_id: Nullable<string>
	cancelled_by: Nullable<ClientUser>

	created_at: Date
	updated_at: Date
}

interface FetchLeaseTerminationFilter {
	status?: LeaseTerminationStatus
}
