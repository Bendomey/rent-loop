type LeaseChecklistStatus = 'DRAFT' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'DISPUTED'
type LeaseChecklistType = 'CHECK_IN' | 'CHECK_OUT' | 'ROUTINE'
type LeaseChecklistItemStatus =
	| 'PENDING'
	| 'FUNCTIONAL'
	| 'DAMAGED'
	| 'MISSING'
	| 'NEEDS_REPAIR'
	| 'NOT_PRESENT'

interface LeaseChecklistItem {
	id: string
	lease_checklist_id: string
	description: string
	status: LeaseChecklistItemStatus
	notes: Nullable<string>
	photos: string[]
	created_at: string
	updated_at: string
}

interface LeaseChecklistAcknowledgment {
	id: string
	tenant_account_id: string
	round: number
	submitted_at: string
	action: 'ACKNOWLEDGED' | 'DISPUTED'
	comment: Nullable<string>
	created_at: string
}

interface LeaseChecklist {
	id: string
	lease_id: string
	type: LeaseChecklistType
	status: LeaseChecklistStatus
	round: number
	check_in_checklist_id: Nullable<string>
	submitted_at: Nullable<string>
	items: LeaseChecklistItem[]
	acknowledgments: LeaseChecklistAcknowledgment[]
	created_at: string
	updated_at: string
}

interface FetchLeaseChecklistFilter {
	type?: LeaseChecklistType
	statuses?: LeaseChecklistStatus[]
}
