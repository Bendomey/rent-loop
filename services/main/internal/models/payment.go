package models

import (
	"time"

	"gorm.io/datatypes"
)

// Payment represents a payment made via our payment gateway.
type Payment struct {
	BaseModelSoftDelete

	InvoiceID *string
	Invoice   *Invoice

	PaymentAccountID string `gorm:"not null;"`
	PaymentAccount   PaymentAccount

	Rail     string  `gorm:"not null;"` // MOMO | BANK_TRANSFER | CARD | OFFLINE
	Provider *string // MTN | VODAFONE | AIRTELTIGO | PAYSTACK | BANK_API

	Amount   int64  `gorm:"not null;"`
	Currency string `gorm:"not null;default:'GHS'"` // e.g., 'GHS'

	Reference *string // unique reference from payment processor. null for offline(cash) payments

	Status       string `gorm:"not null;default:PENDING;index"` // PENDING,SUCCESSFUL,FAILED.
	SuccessfulAt *time.Time
	FailedAt     *time.Time

	Metadata *datatypes.JSON `gorm:"type:jsonb"` // to store any additional data. eg payment processor response
}
