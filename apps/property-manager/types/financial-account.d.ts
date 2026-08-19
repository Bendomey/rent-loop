type ChargeCategory =
	| 'RENT'
	| 'SECURITY_DEPOSIT'
	| 'AGENCY_FEE'
	| 'VAT'
	| 'UTILITY'
	| 'DAMAGE_CHARGE'
	| 'EARLY_TERMINATION_FEE'
	| 'OTHER'

type ChargeStatus =
	| 'OUTSTANDING'
	| 'PARTIALLY_INVOICED'
	| 'INVOICED'
	| 'PARTIALLY_SETTLED'
	| 'SETTLED'
	| 'VOID'

type RentBillingCadence =
	| 'EVERY_PERIOD'
	| 'EVERY_N_PERIODS'
	| 'UPFRONT'
	| 'MANUAL'

interface ChargeInstance {
	id: string
	financial_account_id: string
	/**
	 * The term this charge belongs to. NULL means it belongs to the account
	 * rather than to any one term — a credit, a write-off, or a charge raised
	 * before the lease existed — so it shows in every term's view.
	 */
	lease_id?: Nullable<string>
	name: string
	category: ChargeCategory
	/** Signed. Negative is a refund. Minor units. */
	amount: number
	currency: string
	due_date: string
	period_start?: Nullable<string>
	period_end?: Nullable<string>
	/** Claimed by a live invoice line. */
	invoiced_amount: number
	/** Covered by payments. */
	settled_amount: number
	/** amount − settled_amount. */
	outstanding_amount: number
	/** Derived server-side from the two amounts plus voided_at — never stored. */
	status: ChargeStatus
	voided_at?: Nullable<string>
	voided_reason?: Nullable<string>
	created_at: string
	updated_at: string
}

interface FinancialAccount {
	id: string
	code: string
	tenant_application_id: string
	lease_id?: Nullable<string>
	client_id?: Nullable<string>
	property_id?: Nullable<string>
	tenant_id?: Nullable<string>
	currency: string
	/**
	 * A freshly prepared account is MANUAL and bills nothing until the landlord
	 * picks a collection plan — creating charges must not start invoicing on a
	 * cadence nobody chose.
	 */
	rent_billing_cadence: RentBillingCadence
	rent_billing_interval: number
	/** Issuance lead time BEFORE the due date, not the payment grace after it. */
	auto_issue_days_before: number
	status: 'ACTIVE' | 'CLOSED'
	closed_at?: Nullable<string>
	created_at: string
	updated_at: string
}

/** GET /financial-accounts/{id} */
interface AccountSummary {
	account: FinancialAccount
	charges: Array<ChargeInstance>
	total_charged: number
	total_settled: number
	outstanding_amount: number
	/** Structurally always 0 — overpayment is refused. Do not build UI for it. */
	available_credit: number
}

/** The summary carried on a tenant application. */
interface TenantApplicationFinancials {
	id: string
	code: string
	currency: string
	total_charged: number
	total_settled: number
	outstanding_amount: number
	available_credit: number
	charge_count: number
	invoice_count: number
	/**
	 * True once a rent charge has been invoiced or settled, at which point the
	 * move-in date and the unit can no longer change — RederiveRent returns 400
	 * ChargesAlreadyBilled.
	 *
	 * Rent-scoped on purpose: a billed deposit does not freeze anything, so do
	 * not substitute `total_settled > 0`, which is the whole account.
	 */
	rent_terms_locked: boolean
}
