package models

import (
	"time"

	"gorm.io/datatypes"
)

// Payment represents a payment made via our payment gateway.
type Payment struct {
	BaseModelSoftDelete
	Amount int64 `gorm:"not null;"`

	Reference        string  `gorm:"not null"`
	AccessCode       *string // we clear the data once it's used
	AuthorizationUrl *string // we clear the data once it's used

	Email string `json:"email"` // either use system email or user email

	Status       string `gorm:"not null;default:PENDING;index"` // PENDING,SUCCESSFUL,FAILED,EXPIRED.
	SuccessfulAt *time.Time
	FailedAt     *time.Time
	ExpiredAt    *time.Time

	Metadata *datatypes.JSON `gorm:"type:jsonb"` // to store any additional data. eg {leasePaymentId: "", tenantApplicationId: "", tenantApplicationPaymentType: "SecurityDeposit"}
}
