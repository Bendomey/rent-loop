package models

import "time"

// LeasePayment represents a lease payment agreement in the system.
type LeasePayment struct {
	BaseModelSoftDelete
	LeaseId string `gorm:"not null;"`
	Lease   Lease

	Status string `gorm:"not null;default:'LeasePayment.Status.Pending'"` // LeasePayment.Status.Pending, LeasePayment.Status.Paid

	Amount   int64  `gorm:"not null;"`
	Currency string `gorm:"not null;"`

	PaymentId        *string  // from payment gateway
	Payment          *Payment // url to payment proof document
	PaymentReference *string
	PaidAt           *time.Time
}
