package models

// Payment represents a payment made towards an invoice.
type Payment struct {
	BaseModelSoftDelete
	Amount float64 `gorm:"not null;"`
}
