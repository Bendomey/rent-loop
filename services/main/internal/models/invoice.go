package models

// Invoice represents an invoice in the system.
type Invoice struct {
	BaseModelSoftDelete
	Amount float64 `gorm:"not null;"`

	LeaseId string `gorm:"not null;index;"`
	Lease   Lease
}
