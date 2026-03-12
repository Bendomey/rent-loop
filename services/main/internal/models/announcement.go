package models

import (
	"time"

	"github.com/lib/pq"
)

// Announcement types
// MAINTENANCE | COMMUNITY | POLICY_CHANGE | EMERGENCY

// Announcement priorities
// NORMAL | IMPORTANT | URGENT

// Announcement statuses
// DRAFT → SCHEDULED | PUBLISHED → EXPIRED

// Announcement represents a broadcast communication from property managers to tenants.
type Announcement struct {
	BaseModelSoftDelete
	Title    string `gorm:"not null;index;"`
	Content  string `gorm:"not null;"`
	Type     string `gorm:"not null;"`                      // MAINTENANCE | COMMUNITY | POLICY_CHANGE | EMERGENCY
	Priority string `gorm:"not null;"`                      // NORMAL | IMPORTANT | URGENT
	Status   string `gorm:"not null;index;default:'DRAFT'"` // DRAFT | SCHEDULED | PUBLISHED | EXPIRED

	ScheduledAt *time.Time
	PublishedAt *time.Time
	ExpiresAt   *time.Time

	// Targeting — all nil means all tenants of this client's properties
	PropertyID      *string `gorm:"index;"`
	Property        *Property
	PropertyBlockID *string `gorm:"index;"`
	PropertyBlock   *PropertyBlock
	TargetUnitIDs   pq.StringArray `gorm:"type:text[];default:'{}'"`

	// Denormalized client ID for efficient PM filtering
	ClientID string `gorm:"not null;index;"`
	Client   Client

	CreatedById string `gorm:"not null;"`
	CreatedBy   ClientUser
}

// AnnouncementRead tracks which tenants have read a given announcement.
type AnnouncementRead struct {
	BaseModelSoftDelete

	AnnouncementID  string `gorm:"not null;index;"`
	Announcement    *Announcement
	TenantAccountID string `gorm:"not null;index;"`
	TenantAccount   *TenantAccount
}
