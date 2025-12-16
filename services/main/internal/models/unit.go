package models

import (
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"github.com/lib/pq"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Unit represents a unit within a property in the system
type Unit struct {
	BaseModelSoftDelete
	PropertyID string `gorm:"not null;index;"`
	Property   Property

	PropertyBlockID string `gorm:"not null;index;"`
	PropertyBlock   PropertyBlock

	Name        string         `gorm:"not null;"` // e.g., "Unit 101", "Apt 3B"
	Slug        string         `gorm:"not null;index;"`
	Description *string        `gorm:"type:text;"`
	Images      pq.StringArray `gorm:"type:text[]"`
	Tags        pq.StringArray `gorm:"type:text[]"`

	Type   string `gorm:"not null;index;"` // APARTMENT | HOUSE | STUDIO | OFFICE | RETAIL
	Status string `gorm:"not null;index;"` // DRAFT | AVAILABLE | OCCUPIED | MAINTENANCE

	Area             *float64 // in square feet or square meters
	RentFee          int64    `gorm:"not null;"` // monthly rent amount
	RentFeeCurrency  string   `gorm:"not null;"`
	PaymentFrequency string   `gorm:"not null;"` // WEEKLY | DAILY | MONTHLY | Quarterly | BiAnnually | Annually

	CreatedById string `gorm:"not null;"`
	CreatedBy   ClientUser

	Features datatypes.JSON `gorm:"not null;type:jsonb;"` // additional metadata in json format {bedrooms: 2, bathrooms: 1, hasBalcony: true, ...}

	MaxOccupantsAllowed int `gorm:"not null; default:1"` // maximum number of occupants allowed
}

func (u *Unit) BeforeCreate(tx *gorm.DB) (err error) {
	slug, slugErr := lib.GenerateSlug(u.Name)
	if slugErr != nil {
		raven.CaptureError(err, map[string]string{
			"function": "BeforeCreateUnitHook",
			"action":   "Generating a slug",
		})
		return slugErr
	}

	u.Slug = slug
	return
}
