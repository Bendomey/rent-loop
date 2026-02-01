package models

import (
	"time"

	"github.com/lib/pq"
	"gorm.io/datatypes"
)

// MaintenanceRequest represents a maintenance request made by a tenant.
type MaintenanceRequest struct {
	BaseModelSoftDelete
	Code string `gorm:"not null;uniqueIndex;"` // unique maintenance request code

	UnitID string `gorm:"not null;index;"`
	Unit   Unit

	// should only exist if user created it
	LeaseID *string
	Lease   *Lease

	CreateByTenantID *string
	CreatedByTenant  *Tenant

	CreatedByClientUserID *string
	CreatedByClientUser   *ClientUser

	Title       string         `gorm:"not null;"`
	Description string         `gorm:"not null;"`
	Attachments pq.StringArray `gorm:"type:text[]"`

	Priority string `gorm:"not null;"` // low | medium | high | emergency
	Category string `gorm:"not null;"` // plumbing | electrical | hvac  | other

	Status string `gorm:"not null;"` // NEW | IN_PROGRESS | IN_REVIEW | RESOLVED | CANCELED

	AssignedWorkerID *string // current worker
	AssignedWorker   *ClientUser

	AssignedManagerID *string // reviewer / supervisor
	AssignedManager   *ClientUser

	StartedAt *time.Time // when work actually started

	ResolvedAt *time.Time // when work was marked resolved

	CanceledAt *time.Time // when work was marked canceled
}

type MaintenanceRequestActivityLog struct {
	BaseModelSoftDelete
	MaintenanceRequestID string `gorm:"not null;index;"`
	MaintenanceRequest   MaintenanceRequest

	Action      string `gorm:"not null;"` // CREATED | STATUS_CHANGED | WORKER_ASSIGNED | MANAGER_ASSIGNED | RESOLVED | CANCELED
	Description *string

	PerformedByClientUserID *string
	PerformedByClientUser   *ClientUser

	PerformedByTenantID *string
	PerformedByTenant   *Tenant

	Metadata *datatypes.JSON `gorm:"type:jsonb"` // any additional data

	Timestamp time.Time `gorm:"not null;default:current_timestamp;"`
}
