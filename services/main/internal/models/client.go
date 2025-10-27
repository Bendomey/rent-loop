package models

// Client represents a property owner (landlord/developer/etc) in the system
type Client struct {
	BaseModelSoftDelete
	Type    string `gorm:"not null;index;"` // INDIVIDUAL | COMPANY
	SubType string `gorm:"not null;index;"` // INDIVIDUAL = LANDLORD; COMPANY = PROPERTY_MANAGER | DEVELOPER | AGENCY
	Name    string `gorm:"not null;"`       // company name or individual full name

	// company address or individual home address
	Address   string  `gorm:"not null;"`
	Country   string  `gorm:"not null;"`
	Region    string  `gorm:"not null;"`
	City      string  `gorm:"not null;"`
	Latitude  float64 `gorm:"not null;"`
	Longitude float64 `gorm:"not null;"`

	ClientApplicationId string `gorm:"not null;"`
	ClientApplication   ClientApplication

	Properties []Property
}
