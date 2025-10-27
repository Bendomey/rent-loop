package models

import "github.com/lib/pq"

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
	GPSAddress string  `gorm:"not null;"`

	Type   string `gorm:"not null;index;"` // SINGLE | MULTI
	Status string `gorm:"not null;index;"` // ACTIVE | MAINTENANCE | INACTIVE

	CreatedByID string `gorm:"not null;"`
	CreatedBy   ClientUser

	Units []Unit
}
