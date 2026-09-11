package models

import "time"

// Expense is money the landlord owes a vendor for a service provided to them.
//
// It is a payable, not a record of cash already gone: every expense creates an
// invoice in the same transaction, and that invoice is what posts to the
// ledger. Recharging a tenant for the same underlying event is a separate
// MAINTENANCE_CHARGE on their financial account and is deliberately not
// derived from this record — the landlord may recharge more, less, or nothing.
//
// The request an expense belongs to is reached through
// MaintenanceRequestFinancial. A second FK here would be a source of truth
// that could disagree with it.
type Expense struct {
	BaseModelSoftDelete

	Code string `gorm:"not null;uniqueIndex;"` // EXP-YYMM-XXXXXX

	ContextType string `gorm:"not null;index;"` // MAINTENANCE | GENERAL

	PropertyID string `gorm:"index;"`
	Property   Property

	// REPAIRS | UTILITIES | INSURANCE | LANDSCAPING | SECURITY | MANAGEMENT | OTHER
	//
	// The default exists for AutoMigrate, which runs before the migration jobs
	// and cannot add a NOT NULL column to a populated table without one.
	// BackfillExpenseContextAndCategory then corrects the maintenance rows.
	Category string `gorm:"not null;index;default:'OTHER'"`

	// Nullable in the database, required by the create validator. Rows
	// migrated from the old model genuinely do not know who was paid, and a
	// placeholder there would be invented data.
	VendorName    *string
	VendorContact *string

	Description string `gorm:"not null;"`
	Amount      int64  `gorm:"not null;"`
	Currency    string `gorm:"not null;default:'GHS'"`

	VoidedAt     *time.Time
	VoidedReason *string

	CreatedByClientUserID string `gorm:"not null;"`
	CreatedByClientUser   ClientUser

	Invoices []Invoice `gorm:"foreignKey:ContextExpenseID"`
}
