package models

import "github.com/lib/pq"

// Unit represents a unit within a property in the system
type Unit struct {
	BaseModelSoftDelete
	PropertyID string `gorm:"not null;index;"`
	Property   Property

	Name        string         `gorm:"not null;"` // e.g., "Unit 101", "Apt 3B"
	Slug        string         `gorm:"not null;index;"`
	Description *string        `gorm:"type:text;"`
	Images      pq.StringArray `gorm:"type:text[]"`
	Tags        pq.StringArray `gorm:"type:text[]"`

	Type   string `gorm:"not null;index;"` // APARTMENT | HOUSE | STUDIO | OFFICE | RETAIL
	Status string `gorm:"not null;index;"` // AVAILABLE | OCCUPIED | MAINTENANCE

	Area             *float64 // in square feet or square meters
	RentFee          float64  `gorm:"not null;"` // monthly rent amount
	RentFeeCurrency  string   `gorm:"not null;"`
	PaymentFrequency string   `gorm:"not null;"` // WEEKLY | DAILY | MONTHLY | Quarterly | BiAnnually | Annually

	CreatedById string `gorm:"not null;"`
	CreatedBy   ClientUser

	RoomsCount int `gorm:"not null"` // to hold the count of related rooms
	Rooms      []Room

	MaxOccupantsAllowed int `gorm:"not null; default:1"` // maximum number of occupants allowed
}
