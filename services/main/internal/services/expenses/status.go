// Package expenses holds the derivation rules for expenses and maintenance
// request financial lines. They live here as pure functions so the rules that
// decide what a landlord may still edit are provable without a database.
package expenses

import "time"

const (
	StatusRecorded         = "RECORDED"
	StatusOutstanding      = "OUTSTANDING"
	StatusInvoiced         = "INVOICED"
	StatusPartiallySettled = "PARTIALLY_SETTLED"
	StatusSettled          = "SETTLED"
	StatusVoided           = "VOIDED"
)

// ExpenseView is the minimum an expense's status depends on.
type ExpenseView struct {
	HasInvoice    bool
	InvoiceStatus string
	VoidedAt      *time.Time
}

// DeriveExpenseStatus computes status rather than storing it. A stored status
// would be a fourth thing to keep in sync with three sources.
//
// An expense with no invoice can only be a row migrated from the old model.
// Those posted Dr Maintenance Expense / Cr Cash when they were created, so the
// money is already gone and calling them OUTSTANDING would tell the landlord
// they owe vendors for cash they have spent.
func DeriveExpenseStatus(v ExpenseView) string {
	switch {
	case v.VoidedAt != nil:
		return StatusVoided
	case !v.HasInvoice:
		return StatusSettled
	case v.InvoiceStatus == "PAID":
		return StatusSettled
	case v.InvoiceStatus == "PARTIALLY_PAID":
		return StatusPartiallySettled
	default:
		return StatusOutstanding
	}
}

// IsExpenseClean reports whether the expense may still be edited, converted or
// voided. The line is drawn at money moving, not at the invoice being issued:
// an issued but unpaid bill can still be withdrawn and reissued.
func IsExpenseClean(v ExpenseView) bool {
	if v.VoidedAt != nil {
		return false
	}
	return v.InvoiceStatus != "PAID" && v.InvoiceStatus != "PARTIALLY_PAID"
}
