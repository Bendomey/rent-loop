package models

import "time"

// ChargeInstance is an actual obligation — one period of rent, one deposit,
// one damage charge. Payments allocate against these, never against invoices
// directly.
//
// There is deliberately no Status column. Status (OUTSTANDING /
// PARTIALLY_INVOICED / INVOICED / PARTIALLY_SETTLED / SETTLED / VOID) is
// derived in the transformation layer from InvoicedAmount, SettledAmount and
// VoidedAt. A stored status would be a fourth thing to keep in sync with three
// sources, and that desync is what makes a ledger untrustworthy.
type ChargeInstance struct {
	BaseModelSoftDelete

	FinancialAccountID string `gorm:"not null;index;"`
	FinancialAccount   FinancialAccount

	LeaseID *string `gorm:"index;"`
	Lease   *Lease

	ChargeDefinitionID *string `gorm:"index;"` // null for ad-hoc one-offs
	ChargeDefinition   *ChargeDefinition

	Name     string `gorm:"not null;"` // "February 2027 Rent"
	Category string `gorm:"not null;index;"`
	Amount   int64  `gorm:"not null;"` // SIGNED — negative is owed to the tenant
	Currency string `gorm:"not null;default:'GHS'"`

	PeriodStart *time.Time
	PeriodEnd   *time.Time
	DueDate     time.Time `gorm:"not null;index;"` // period start + payment grace

	InvoicedAmount int64 `gorm:"not null;default:0"` // claimed by live invoice lines
	SettledAmount  int64 `gorm:"not null;default:0"` // covered by allocations

	// Set when this instance reverses another (a refund). Inherits the
	// original's category for journal routing and is capped at its
	// SettledAmount — you cannot refund money that was never received.
	ReversesChargeInstanceID *string `gorm:"index;"`

	VoidedAt     *time.Time
	VoidedReason *string
}
