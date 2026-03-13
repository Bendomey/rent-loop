package models

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"github.com/lib/pq"
	"gorm.io/datatypes"
	"gorm.io/gorm"
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

	CreatedByTenantID *string
	CreatedByTenant   *Tenant

	CreatedByClientUserID *string
	CreatedByClientUser   *ClientUser

	Title       string         `gorm:"not null;"`
	Description string         `gorm:"not null;"`
	Attachments pq.StringArray `gorm:"type:text[]"`

	Priority string `gorm:"not null;"` // LOW | MEDIUM | HIGH | EMERGENCY
	Category string `gorm:"not null;"` // PLUMBING | ELECTRICAL | HVAC | OTHER

	Status string `gorm:"not null;"` // NEW | IN_PROGRESS | IN_REVIEW | RESOLVED | CANCELED

	AssignedWorkerID *string // current worker
	AssignedWorker   *ClientUser

	AssignedManagerID *string // reviewer / supervisor
	AssignedManager   *ClientUser

	StartedAt *time.Time // when work actually started

	ReviewedAt *time.Time // when work was marked in review

	ResolvedAt *time.Time // when work was marked resolved

	CanceledAt         *time.Time // when work was marked canceled
	CancellationReason *string

	Visibility string `gorm:"not null;default:'TENANT_VISIBLE'"` // TENANT_VISIBLE | INTERNAL_ONLY

	ActivityLogs []MaintenanceRequestActivityLog
	Expenses     []Expense
}

func (mr *MaintenanceRequest) BeforeCreate(tx *gorm.DB) error {
	uniqueCode, genErr := lib.GenerateCode(tx, &MaintenanceRequest{})
	if genErr != nil {
		raven.CaptureError(genErr, map[string]string{
			"function": "BeforeCreateMaintenanceRequestHook",
			"action":   "Generating a unique code",
		})
		return genErr
	}
	mr.Code = *uniqueCode
	return nil
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
}
