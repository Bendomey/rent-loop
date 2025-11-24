package models

// LeaseChecklist represents a checklist associated with a lease.
type LeaseChecklist struct {
	BaseModelSoftDelete
	LeaseId string `gorm:"not null;index;"`
	Lease   Lease

	Type string `gorm:"not null;"` // CheckIn, CheckOut, Routine

	Items []LeaseChecklistItem

	CreatedById string `gorm:"not null;"`
	CreatedBy   ClientUser
}

// LeaseChecklistItem represents an item in a lease checklist.
type LeaseChecklistItem struct {
	BaseModelSoftDelete
	LeaseChecklistId string `gorm:"not null;index;"`
	LeaseChecklist   LeaseChecklist

	Description string `gorm:"not null;"`
	Status      string `gorm:"not null;"` // Functional, Damaged, Missing
}
