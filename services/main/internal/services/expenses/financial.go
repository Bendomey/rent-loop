package expenses

import "time"

const (
	SettlementRecordOnly    = "RECORD_ONLY"
	SettlementTenantCharge  = "TENANT_CHARGE"
	SettlementVendorExpense = "VENDOR_EXPENSE"
)

// ChargeLinkView is the part of a ChargeInstance a financial line's status
// depends on.
type ChargeLinkView struct {
	InvoicedAmount int64
	SettledAmount  int64
	VoidedAt       *time.Time
}

// FinancialView is a maintenance request financial line and whichever
// settlement it points at. At most one of Charge and Expense is ever set.
type FinancialView struct {
	SettlementType string
	Amount         int64
	Charge         *ChargeLinkView
	Expense        *ExpenseView
}

// DeriveFinancialStatus mirrors whatever the line settles through. A
// RECORD_ONLY line settles through nothing and never reaches the ledger, so it
// has a status of its own.
func DeriveFinancialStatus(v FinancialView) string {
	switch v.SettlementType {
	case SettlementRecordOnly:
		return StatusRecorded
	case SettlementTenantCharge:
		if v.Charge == nil {
			return StatusVoided
		}
		return deriveChargeStatus(*v.Charge, v.Amount)
	case SettlementVendorExpense:
		if v.Expense == nil {
			return StatusVoided
		}
		return DeriveExpenseStatus(*v.Expense)
	default:
		return StatusRecorded
	}
}

func deriveChargeStatus(c ChargeLinkView, amount int64) string {
	switch {
	case c.VoidedAt != nil:
		return StatusVoided
	case c.SettledAmount >= amount && amount > 0:
		return StatusSettled
	case c.SettledAmount > 0:
		return StatusPartiallySettled
	case c.InvoicedAmount > 0:
		return StatusInvoiced
	default:
		return StatusOutstanding
	}
}

// IsFinancialEditable answers the question the UI asks before offering an edit
// or a settlement-type conversion, so the screen stops offering what the API
// is going to refuse.
//
// A missing link on a line whose type demands one is treated as frozen. That
// row is broken, and letting an edit through would compound it.
func IsFinancialEditable(v FinancialView) bool {
	switch v.SettlementType {
	case SettlementRecordOnly:
		return true
	case SettlementTenantCharge:
		if v.Charge == nil {
			return false
		}
		return v.Charge.VoidedAt == nil &&
			v.Charge.InvoicedAmount == 0 &&
			v.Charge.SettledAmount == 0
	case SettlementVendorExpense:
		if v.Expense == nil {
			return false
		}
		return IsExpenseClean(*v.Expense)
	default:
		return false
	}
}
