package models

import (
	"time"

	"github.com/lib/pq"
)

// LeaseChecklist represents a checklist associated with a lease.
type LeaseChecklist struct {
	BaseModelSoftDelete
	LeaseId string `gorm:"not null;index;"`
	Lease   Lease

	Type   string `gorm:"not null;"`                // CHECK_IN, CHECK_OUT, ROUTINE
	Status string `gorm:"not null;default:'DRAFT'"` // DRAFT, SUBMITTED, ACKNOWLEDGED, DISPUTED
	Round  int    `gorm:"not null;default:1"`       // increments on each re-submit after dispute

	CheckInChecklistId *string         `gorm:"index;"`
	CheckInChecklist   *LeaseChecklist `gorm:"foreignKey:CheckInChecklistId"`

	SubmittedAt *time.Time

	Items           []LeaseChecklistItem           `gorm:"foreignKey:LeaseChecklistId"`
	Acknowledgments []LeaseChecklistAcknowledgment `gorm:"foreignKey:LeaseChecklistId"`

	CreatedById string `gorm:"not null;"`
	CreatedBy   ClientUser
}

// LeaseChecklistItem represents an item in a lease checklist.
type LeaseChecklistItem struct {
	BaseModelSoftDelete
	LeaseChecklistId string `gorm:"not null;index;"`
	LeaseChecklist   LeaseChecklist

	Description string         `gorm:"not null;"`
	Status      string         `gorm:"not null;"` // PENDING, FUNCTIONAL, DAMAGED, MISSING, NEEDS_REPAIR, NOT_PRESENT
	Notes       *string        `gorm:"type:text"`
	Photos      pq.StringArray `gorm:"type:text[]"`
}

// LeaseChecklistAcknowledgment records a tenant's response (acknowledge or dispute)
// to a submitted checklist for a given round.
type LeaseChecklistAcknowledgment struct {
	BaseModelSoftDelete
	LeaseChecklistId string         `gorm:"not null;uniqueIndex:idx_ack_checklist_tenant_round"`
	LeaseChecklist   LeaseChecklist `gorm:"foreignKey:LeaseChecklistId"`

	TenantAccountId string        `gorm:"not null;uniqueIndex:idx_ack_checklist_tenant_round"`
	TenantAccount   TenantAccount `gorm:"foreignKey:TenantAccountId"`

	Round int `gorm:"not null;uniqueIndex:idx_ack_checklist_tenant_round"`

	SubmittedAt time.Time `gorm:"not null"` // when PM submitted this round
	Action      string    `gorm:"not null"` // ACKNOWLEDGED, DISPUTED
	Comment     *string   `gorm:"type:text"`
}
