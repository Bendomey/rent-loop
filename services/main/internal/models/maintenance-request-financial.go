package models

// MaintenanceRequestFinancial is one costed line on a maintenance request:
// what it cost, and who if anyone settles it.
//
// It posts nothing. Money reaches the ledger through the ChargeInstance or the
// Expense it points at, and only when those are invoiced. A RECORD_ONLY line
// never reaches the ledger at all, which is what lets a landlord write down
// what a job cost without claiming anybody owes it.
//
// SettlementType and its link are paired by a CHECK constraint rather than by
// the Go type, which cannot express "exactly one of these, and it must match
// the discriminator".
type MaintenanceRequestFinancial struct {
	BaseModelSoftDelete

	MaintenanceRequestID string `gorm:"not null;index;"`
	MaintenanceRequest   MaintenanceRequest

	PropertyID string `gorm:"index;"`

	Description string `gorm:"not null;"`
	Amount      int64  `gorm:"not null;"`
	Currency    string `gorm:"not null;default:'GHS'"`

	SettlementType string `gorm:"not null;index;"` // RECORD_ONLY | TENANT_CHARGE | VENDOR_EXPENSE

	ChargeInstanceID *string `gorm:"index;"`
	ChargeInstance   *ChargeInstance

	ExpenseID *string `gorm:"index;"`
	Expense   *Expense

	CreatedByClientUserID string `gorm:"not null;"`
	CreatedByClientUser   ClientUser
}
