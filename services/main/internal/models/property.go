package models

import (
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/getsentry/raven-go"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// Property represents a property under a client in the system
type Property struct {
	BaseModelSoftDelete
	ClientID string `gorm:"not null;index;"`
	Client   Client

	Name        string `gorm:"not null;"`
	Slug        string `gorm:"not null;index;"`
	Description *string
	Images      pq.StringArray `gorm:"type:text[]"`
	Tags        pq.StringArray `gorm:"type:text[]"`

	Latitude   float64 `gorm:"not null;"`
	Longitude  float64 `gorm:"not null;"`
	Address    string  `gorm:"not null;"`
	Country    string  `gorm:"not null;"`
	Region     string  `gorm:"not null;"`
	City       string  `gorm:"not null;"`
	GPSAddress *string

	Type   string `gorm:"not null;index;"` // SINGLE | MULTI
	Status string `gorm:"not null;index;"` // ACTIVE | MAINTENANCE | INACTIVE

	CreatedByID string `gorm:"not null;"`
	CreatedBy   ClientUser

	Units []Unit
}

func (p *Property) BeforeCreate(tx *gorm.DB) (err error) {
	slug, slugErr := lib.GenerateSlug(p.Name)
	if slugErr != nil {
		raven.CaptureError(err, map[string]string{
			"function": "BeforeCreatePropertyHook",
			"action":   "Generating a slug",
		})
		return slugErr
	}

	p.Slug = slug
	return
}
