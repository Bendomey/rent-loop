interface Lease {
	id: string
	status:
		| 'Lease.Status.Pending'
		| 'Lease.Status.Active'
		| 'Lease.Status.Completed'
		| 'Lease.Status.Cancelled'
		| 'Lease.Status.Terminated'
	parent_lease_id: Nullable<string>
	meta: StringRecord

	rent_fee: number
	rent_fee_currency: string
	payment_frequency: Nullable<string>
	stay_duration: number
	stay_duration_frequency: string

	move_in_date: Date
	property_inspection_date: Nullable<Date>
	utility_transfers_date: Nullable<Date>

	lease_agreement_document_mode: Nullable<'MANUAL' | 'ONLINE'>
	lease_agreement_document_url: string
	lease_agreement_document_property_manager_signed_at: Nullable<Date>
	lease_agreement_document_property_manager_signed_by_id: Nullable<string>
	lease_agreement_document_property_manager_signed_by: Nullable<ClientUser>
	lease_agreement_document_tenant_signed_at: Nullable<Date>

	termination_agreement_document_url: Nullable<string>
	termination_agreement_document_property_manager_signed_at: Nullable<Date>
	termination_agreement_document_property_manager_signed_by_id: Nullable<string>
	termination_agreement_document_property_manager_signed_by: Nullable<ClientUser>
	termination_agreement_document_tenant_signed_at: Nullable<Date>

	activated_at: Nullable<Date>
	activated_by_id: Nullable<string>
	activated_by: Nullable<ClientUser>

	cancelled_at: Nullable<Date>
	cancelled_by_id: Nullable<string>
	cancelled_by: Nullable<ClientUser>

	completed_at: Nullable<Date>
	completed_by_id: Nullable<string>
	completed_by: Nullable<ClientUser>

	terminated_at: Nullable<Date>
	terminated_by_id: Nullable<string>
	terminated_by: Nullable<ClientUser>

	tenant_id: string
	tenant: Tenant
	tenant_application_id: string
	tenant_application: TenantApplication
	unit_id: string
	unit: PropertyUnit

	created_at: Date
	updated_at: Date
}
