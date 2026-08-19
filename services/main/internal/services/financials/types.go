// Package financials owns tenant financial accounts: the charges a tenant
// owes, the invoices composed against them, and the allocation of payments
// back onto those charges.
//
// Everything in this file and in billing_policy.go, materialise.go, fill.go
// and selection.go is deliberately pure — no DB, no context, no clock beyond
// what is passed in. That is what makes the allocation invariants testable
// without a database.
package financials

import "time"

// Rent billing cadences. Stored on FinancialAccount.RentBillingCadence.
const (
	CadenceEveryPeriod   = "EVERY_PERIOD"
	CadenceEveryNPeriods = "EVERY_N_PERIODS"
	CadenceUpfront       = "UPFRONT"
	CadenceManual        = "MANUAL"
)

// Charge categories. Sign carries direction (negative is owed to the tenant),
// so there are deliberately no refund-specific categories: a negative
// SECURITY_DEPOSIT charge *is* a deposit refund, and routes by reversing the
// same journal case.
const (
	CategoryRent                = "RENT"
	CategorySecurityDeposit     = "SECURITY_DEPOSIT"
	CategoryAgencyFee           = "AGENCY_FEE"
	CategoryVAT                 = "VAT"
	CategoryUtility             = "UTILITY"
	CategoryDamageCharge        = "DAMAGE_CHARGE"
	CategoryEarlyTerminationFee = "EARLY_TERMINATION_FEE"
	CategoryOther               = "OTHER"
)

// RentBillingPolicy is how many rent periods the queue bills at a time.
type RentBillingPolicy struct {
	Cadence  string
	Interval int64
}

// ChargeView is a read-only projection of a ChargeInstance, carrying only what
// the arithmetic needs. Using a projection rather than the GORM model keeps
// these functions free of persistence concerns and trivially constructible in
// tests.
type ChargeView struct {
	ID             string
	LeaseID        *string
	Category       string
	Amount         int64 // signed; negative is owed to the tenant
	DueDate        time.Time
	InvoicedAmount int64
	SettledAmount  int64
}

// UninvoicedAmount is how much of this charge no live invoice has claimed.
// Signed, and always the same sign as Amount.
func (c ChargeView) UninvoicedAmount() int64 {
	return c.Amount - c.InvoicedAmount
}

// UnsettledAmount is how much of this charge no payment has covered.
func (c ChargeView) UnsettledAmount() int64 {
	return c.Amount - c.SettledAmount
}

// Claim is an intent to bill part or all of one charge on one invoice line.
type Claim struct {
	ChargeInstanceID string
	Amount           int64 // signed, same sign as the charge, |Amount| <= |Uninvoiced|
}

// ChargeInstanceDraft is a charge instance before it is persisted.
type ChargeInstanceDraft struct {
	Name        string
	Category    string
	Amount      int64
	Currency    string
	PeriodStart time.Time
	PeriodEnd   time.Time
	DueDate     time.Time
}
