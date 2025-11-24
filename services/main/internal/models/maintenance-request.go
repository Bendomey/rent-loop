package models

import "github.com/lib/pq"

// MaintenanceRequest represents a maintenance request made by a tenant.
type MaintenanceRequest struct {
	BaseModelSoftDelete
	LeaseId string `gorm:"not null;index;"`
	Lease   Lease

	TenantId string `gorm:"not null;index;"`
	Tenant   Tenant

	Description string         `gorm:"not null;"`
	Attachments pq.StringArray `gorm:"type:text[]"`

	Status string `gorm:"not null;"` // Pending, InProgress, Completed, Cancelled
}
