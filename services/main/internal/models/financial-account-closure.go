package models

import "time"

// FinancialAccountClosure is the audit record of a property manager closing an
// account. Closure is an event, not a status flip: the deposit is released at
// this moment, so there must be a row saying who decided, when, on what
// balance, and what happened to the tenant's money.
//
// Reopening is recorded on this same row rather than by deleting it, so an
// accidental closure leaves a trail instead of silently rewriting history.
type FinancialAccountClosure struct {
	BaseModelSoftDelete

	FinancialAccountID string `gorm:"type:uuid;not null;index;"`
	FinancialAccount   FinancialAccount

	Reason   string    `gorm:"not null;"`
	ClosedAt time.Time `gorm:"not null;"`
	// Null when the closure sweep acted rather than a person. The audit row
	// exists to say who decided, so "nobody, it aged out" must stay
	// distinguishable from a named property manager — never papered over with
	// a synthetic user that later reads as a real one.
	ClosedByID *string     `gorm:"type:uuid;"`
	ClosedBy   *ClientUser `gorm:"foreignKey:ClosedByID"`

	// The account's state at the moment of closure, frozen. Recomputing these
	// later would give different answers once refunds have posted.
	OutstandingAtClosure int64 `gorm:"not null;default:0"`
	DepositHeldAmount    int64 `gorm:"not null;default:0"`

	// The reversing SECURITY_DEPOSIT instance, when the deposit was released
	// or offset. Null when the deposit was forfeited or none was held.
	DepositRefundChargeInstanceID *string `gorm:"type:uuid;"`
	DepositForfeitedAmount        int64   `gorm:"not null;default:0"`

	ReopenedAt   *time.Time
	ReopenedByID *string     `gorm:"type:uuid;"`
	ReopenedBy   *ClientUser `gorm:"foreignKey:ReopenedByID"`
	ReopenReason *string
}
