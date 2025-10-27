package models

// LeaseChecklist represents a checklist associated with a lease.
type LeaseChecklist struct {
	BaseModelSoftDelete
	LeaseId string `gorm:"not null;index;"`
	Lease   Lease

	Type string `json:"type" gorm:"not null;"` // CheckIn, CheckOut, Routine
}
