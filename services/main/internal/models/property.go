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
	ClientID string `json:"clientId" gorm:"not null;index;"`
	Client   Client `json:"client"   gorm:"foreignKey:ClientID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	Name        string         `json:"name"        gorm:"not null;"`
	Slug        string         `json:"slug"        gorm:"not null;index;"`
	Description *string        `json:"description"`
	Images      pq.StringArray `json:"images"      gorm:"type:text[]"`
	Tags        pq.StringArray `json:"tags"        gorm:"type:text[]"`

	Latitude   float64 `json:"latitude"   gorm:"not null;"`
	Longitude  float64 `json:"longitude"  gorm:"not null;"`
	Address    string  `json:"address"    gorm:"not null;"`
	Country    string  `json:"country"    gorm:"not null;"`
	Region     string  `json:"region"     gorm:"not null;"`
	City       string  `json:"city"       gorm:"not null;"`
	GPSAddress *string `json:"gpsAddress"`

	Type   string `json:"type"   gorm:"not null;index;"` // SINGLE | MULTI
	Status string `json:"status" gorm:"not null;index;"` // ACTIVE | MAINTENANCE | INACTIVE

	CreatedByID string     `json:"createdById" gorm:"not null;"`
	CreatedBy   ClientUser `json:"createdBy"`

	Units []Unit `json:"units"`
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
