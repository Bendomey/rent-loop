package models

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"gorm.io/gorm"
)

// LeaseTermination represents a lease termination process.
// Status: LeaseTermination.Status.InProgress → .Completed | .Cancelled
// Type: EVICTION | MUTUAL_AGREEMENT | TENANT_INITIATED
type LeaseTermination struct {
	BaseModelSoftDelete

	Code   string `gorm:"not null;uniqueIndex;"`
	Status string `gorm:"not null;default:'LeaseTermination.Status.InProgress';index;"`
	Type   string `gorm:"not null;"` // EVICTION, MUTUAL_AGREEMENT, TENANT_INITIATED
	Reason string `gorm:"not null;"`

	LeaseID string `gorm:"not null;index;"`
	Lease   Lease

	// step 1: move-out checklist (optional)
	LeaseChecklistID *string
	LeaseChecklist   *LeaseChecklist

	// step 2: termination agreement document (optional)
	DocumentMode *string // MANUAL | ONLINE
	DocumentUrl  *string // for MANUAL mode
	DocumentID   *string // FK to library Document for ONLINE mode
	Document     *Document

	// process tracking
	InitiatedById string     `gorm:"not null;"`
	InitiatedBy   ClientUser `gorm:"foreignKey:InitiatedById"`

	CompletedAt   *time.Time
	CompletedById *string
	CompletedBy   *ClientUser `gorm:"foreignKey:CompletedById"`

	CancelledAt   *time.Time
	CancelledById *string
	CancelledBy   *ClientUser `gorm:"foreignKey:CancelledById"`
}

func (t *LeaseTermination) BeforeCreate(tx *gorm.DB) error {
	uniqueCode, genErr := lib.GenerateCode(tx, &LeaseTermination{})
	if genErr != nil {
		raven.CaptureError(genErr, map[string]string{
			"function": "BeforeCreateLeaseTerminationHook",
			"action":   "Generating a unique code",
		})
		return genErr
	}

	t.Code = *uniqueCode
	return nil
}
