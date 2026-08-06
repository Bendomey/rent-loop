package models

import "time"

// ChargeDefinition is the template a charge instance is generated from. A rent
// review closes one definition and opens another from the effective date;
// instances already generated keep their historical amount, which is why the
// total obligation is never stored anywhere.
type ChargeDefinition struct {
	BaseModelSoftDelete

	FinancialAccountID string `gorm:"not null;index;"`
	FinancialAccount   FinancialAccount

	Name string `gorm:"not null;"` // "Monthly Rent"
	// RENT | SECURITY_DEPOSIT | AGENCY_FEE | VAT | UTILITY | DAMAGE_CHARGE
	// | EARLY_TERMINATION_FEE | OTHER
	Category string `gorm:"not null;"`
	Amount   int64  `gorm:"not null;"` // ONE period at the agreed rate. Signed.
	Currency string `gorm:"not null;default:'GHS'"`

	Frequency string `gorm:"not null;"` // ONCE | MONTHLY | QUARTERLY | BI_ANNUALLY | ANNUALLY
	StartDate *time.Time
	EndDate   *time.Time

	Status string `gorm:"not null;default:'ACTIVE';index;"` // ACTIVE | CLOSED
}
