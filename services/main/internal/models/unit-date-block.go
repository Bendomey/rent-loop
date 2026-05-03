package models

import "time"

// UnitDateBlock tracks blocked date ranges per unit.
// BlockType values:
//
//	BOOKING     — auto-created when a booking is CONFIRMED
//	LEASE       — auto-created when a lease is ACTIVATED
//	MAINTENANCE — manually created by a manager
//	PERSONAL    — manually created by a manager
//	OTHER       — manually created by a manager
type UnitDateBlock struct {
	BaseModelSoftDelete

	UnitID string `gorm:"not null;index;"`
	Unit   Unit

	StartDate time.Time `gorm:"not null;type:date;"`
	EndDate   time.Time `gorm:"not null;type:date;"`

	BlockType string `gorm:"not null;index;"`

	BookingID *string `gorm:"index;"`
	Booking   *Booking

	LeaseID *string `gorm:"index;"`
	Lease   *Lease

	Reason string `gorm:"not null;default:''"`

	CreatedByClientUserID *string `gorm:"index;"`
	CreatedByClientUser   *ClientUser
}
