package models

import "github.com/lib/pq"

// MaintenanceRequest represents a maintenance request made by a tenant.
type MaintenanceRequest struct {
	BaseModelSoftDelete
	LeaseId string `gorm:"not null;index;"`
	Lease   Lease

	TenantAccountId string `gorm:"not null;index;"`
	TenantAccount   TenantAccount

	Description string `gorm:"not null;"`
	Attachments pq.StringArray

	Status string `gorm:"not null;"` // Pending, InProgress, Completed, Cancelled
}
