package models

import (
	"time"

	"github.com/gofrs/uuid"
	"gorm.io/datatypes"
)

// Notification is the source-of-truth record for every notification event.
// visibility = IN_APP  → shown in the user's notification centre.
// visibility = HIDDEN  → stored for audit/delivery tracking only; never returned to users.
type Notification struct {
	BaseModel
	OrganizationID string `gorm:"not null;index"`
	RecipientID    string `gorm:"not null;index"`
	RecipientType  string `gorm:"not null"` // CLIENT_USER | TENANT_ACCOUNT
	Event          string `gorm:"not null"`
	Category       *string
	Visibility     string `gorm:"not null;default:'IN_APP'"` // IN_APP | HIDDEN
	Title          *string
	Body           *string        `gorm:"type:text"`
	Data           datatypes.JSON `gorm:"type:jsonb"`
	ReadAt         *time.Time
	Status         string `gorm:"not null;default:'PENDING'"` // PENDING | PROCESSING | COMPLETED | PARTIAL | FAILED
	ScheduledAt    *time.Time
	ExpiresAt      *time.Time
}

// NotificationDelivery tracks a single channel delivery attempt for a Notification.
type NotificationDelivery struct {
	BaseModel
	NotificationID    uuid.UUID    `gorm:"not null;index"`
	Notification      Notification `gorm:"foreignKey:NotificationID"`
	Channel           string       `gorm:"not null"` // EMAIL | SMS | PUSH
	Provider          *string
	RecipientAddress  *string
	ProviderMessageID *string
	Status            string `gorm:"not null;default:'QUEUED'"` // QUEUED | PROCESSING | SENT | DELIVERED | FAILED | RETRYING
	Attempts          int    `gorm:"not null;default:0"`
	MaxAttempts       int    `gorm:"not null;default:5"`
	ErrorCode         *string
	ErrorMessage      *string   `gorm:"type:text"`
	QueuedAt          time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
	SentAt            *time.Time
	DeliveredAt       *time.Time
	FailedAt          *time.Time
	NextRetryAt       *time.Time
}
