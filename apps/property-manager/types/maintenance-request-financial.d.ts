// How a costed line on a maintenance request gets settled. RECORD_ONLY reaches
// the ledger not at all — it exists so a landlord can write down what a job
// cost without claiming anybody owes it.
type SettlementType = 'RECORD_ONLY' | 'TENANT_CHARGE' | 'VENDOR_EXPENSE'

type FinancialStatus =
	| 'RECORDED'
	| 'OUTSTANDING'
	| 'INVOICED'
	| 'PARTIALLY_SETTLED'
	| 'SETTLED'
	| 'VOIDED'

type TenantChargeCategory =
	| 'MAINTENANCE_CHARGE'
	| 'DAMAGE_CHARGE'
	| 'UTILITY'
	| 'OTHER'

interface MaintenanceRequestFinancial {
	id: string
	maintenance_request_id: string
	property_id: string
	description: string
	amount: number // pesewas
	currency: string
	settlement_type: SettlementType
	// Both derived from whichever settlement the line points at.
	status: FinancialStatus
	is_editable: boolean
	charge_instance_id: Nullable<string>
	expense_id: Nullable<string>
	expense: Nullable<Expense>
	created_by_client_user_id: string
	created_at: string
	updated_at: string
}

interface FetchMRFinancialFilter {
	settlement_type?: SettlementType
}
