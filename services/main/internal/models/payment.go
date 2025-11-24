package models

import "time"

// Payment represents a payment made via our payment gateway.
type Payment struct {
	BaseModelSoftDelete
	Amount int64 `gorm:"not null;"`

	Reference        string  `gorm:"not null"`
	AccessCode       *string // we clear the data once it's used
	AuthorizationUrl *string // we clear the data once it's used

	Email string `json:"email"` // either use system email or user email

	Status       string     `gorm:"not null;default:PENDING;index" json:"status"` //PENDING,SUCCESSFUL,FAILED,EXPIRED.
	SuccessfulAt *time.Time `json:"successfulAt"`
	FailedAt     *time.Time `json:"failedAt"`
	ExpiredAt    *time.Time `json:"expiredAt"`

	Metadata *string `gorm:"type:jsonb"` // to store any additional data. eg {leasePaymentId: "", tenantApplicationId: "", tenantApplicationPaymentType: "SecurityDeposit"}
}
