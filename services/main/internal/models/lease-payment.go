package models

// LeasePayment represents a lease payment agreement in the system.
type LeasePayment struct {
	BaseModelSoftDelete
	LeaseId string `gorm:"not null;"`
	Lease   Lease

	Status string `gorm:"not null;default:'LeasePayment.Status.Pending'"` // LeasePayment.Status.Pending, LeasePayment.Status.Completed, LeasePayment.Status.Failed

	Amount   int64  `gorm:"not null;"`
	Currency string `gorm:"not null;"`

	PaymentId *string  // from payment gateway
	Payment   *Payment // url to payment proof document
}
