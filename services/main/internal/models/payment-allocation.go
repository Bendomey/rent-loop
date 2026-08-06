package models

// PaymentAllocation records which obligation a payment satisfied. Without it
// the account balance would be correct while nothing could answer "January
// rent is still 400 short".
type PaymentAllocation struct {
	BaseModelSoftDelete

	PaymentID string `gorm:"not null;index;"`
	Payment   Payment

	ChargeInstanceID string `gorm:"not null;index;"`
	ChargeInstance   ChargeInstance

	InvoiceLineItemID *string
	InvoiceLineItem   *InvoiceLineItem

	Amount   int64  `gorm:"not null;"`
	Currency string `gorm:"not null;default:'GHS'"`
}
