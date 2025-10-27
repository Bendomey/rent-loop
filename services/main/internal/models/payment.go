package models

// Payment represents a payment made towards an invoice.
type Payment struct {
	BaseModelSoftDelete
	InvoiceId string `gorm:"not null;index;"`
	Invoice   Invoice

	Amount float64 `gorm:"not null;"`
}
