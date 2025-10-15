package models

// Client represents a property owner (landlord/developer/etc) in the system
type Client struct {
	BaseModelSoftDelete
	Type    string `json:"type" gorm:"not null;index;"`    // INDIVIDUAL | COMPANY
	SubType string `json:"subType" gorm:"not null;index;"` // INDIVIDUAL = LANDLORD; COMPANY = PROPERTY_MANAGER | DEVELOPER | AGENCY
	Name    string `json:"name" gorm:"not null;"`          // company name or individual full name

	// company address or individual home address
	Address   string  `json:"address" gorm:"not null;"`
	Country   string  `json:"country" gorm:"not null;"`
	Region    string  `json:"region" gorm:"not null;"`
	City      string  `json:"city" gorm:"not null;"`
	Latitude  float64 `json:"latitude" gorm:"not null;"`
	Longitude float64 `json:"longitude" gorm:"not null;"`

	ClientApplicationId string            `json:"clientApplicationId" gorm:"not null;"`
	ClientApplication   ClientApplication `json:"clientApplication" gorm:"foreignKey:ClientApplicationId;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}
