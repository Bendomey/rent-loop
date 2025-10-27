package models

// LeaseExtension represents an extension to a lease agreement.
type LeaseExtension struct {
	BaseModelSoftDelete
	LeaseId string `gorm:"not null;index;"`
	Lease   Lease
}
