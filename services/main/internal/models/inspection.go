package models

// Inspection represents an inspection related to a lease.
type Inspection struct {
	BaseModelSoftDelete
	LeaseId string `gorm:"not null;index;"`
	Lease   Lease
}
