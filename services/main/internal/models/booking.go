package models

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Booking statuses: PENDING → CONFIRMED → CHECKED_IN → COMPLETED | CANCELLED
// Booking sources: MANAGER | GUEST_LINK

type Booking struct {
	BaseModelSoftDelete
	Code        string `gorm:"not null;uniqueIndex;"`
	CheckInCode string `gorm:"not null;default:''"`

	UnitID     string `gorm:"not null;index;"`
	Unit       Unit
	PropertyID string `gorm:"not null;index;"`
	Property   Property
	TenantID   string `gorm:"not null;index;"`
	Tenant     Tenant

	CheckInDate  time.Time `gorm:"not null;"`
	CheckOutDate time.Time `gorm:"not null;"`

	CheckedInAt   *time.Time // when they actually checked in.
	CheckedInByID *string    // ClientUser ID who performed the check-in
	CheckedInBy   *ClientUser

	CheckedOutAt   *time.Time // when they actually checked out.
	CheckedOutByID *string    // ClientUser ID who performed the check-out
	CheckedOutBy   *ClientUser

	Rate     int64  `gorm:"not null;"`
	Currency string `gorm:"not null;"`

	Status string `gorm:"not null;default:'PENDING';index;"`

	CanceledAt         *time.Time
	CanceledByID       *string
	CanceledBy         *ClientUser
	CancellationReason string `gorm:"not null;default:''"`

	Notes string `gorm:"not null;default:''"`

	BookingSource          string  `gorm:"not null;"`
	RequiresUpfrontPayment bool    `gorm:"not null;default:false"`
	CreatedByClientUserID  *string `gorm:"index;"`
	CreatedByClientUser    *ClientUser

	InvoiceID *string `gorm:"index;"`
	Invoice   *Invoice

	Meta datatypes.JSON `gorm:"type:jsonb;"`
}

func (b *Booking) BeforeCreate(tx *gorm.DB) error {
	uniqueCode, genErr := lib.GenerateCode(tx, &Booking{})
	if genErr != nil {
		raven.CaptureError(genErr, map[string]string{
			"function": "BeforeCreateBookingHook",
			"action":   "Generating a unique code",
		})
		return genErr
	}
	b.Code = *uniqueCode

	return nil
}
