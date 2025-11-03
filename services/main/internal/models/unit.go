package models

import "github.com/lib/pq"

// Unit represents a unit within a property in the system
type Unit struct {
	BaseModelSoftDelete
	PropertyID string   `json:"propertyId" gorm:"not null;index;"`
	Property   Property `json:"property"   gorm:"foreignKey:PropertyID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	Name        string         `json:"name"        gorm:"not null;"` // e.g., "Unit 101", "Apt 3B"
	Slug        string         `json:"slug"        gorm:"not null;index;"`
	Description *string        `json:"description"`
	Images      pq.StringArray `json:"images"      gorm:"type:text[]"`
	Tags        pq.StringArray `json:"tags"        gorm:"type:text[]"`

	Type   string `json:"type"   gorm:"not null;index;"` // APARTMENT | HOUSE | STUDIO | OFFICE | RETAIL
	Status string `json:"status" gorm:"not null;index;"` // AVAILABLE | OCCUPIED | MAINTENANCE

	Bedrooms      int     `json:"bedrooms"`
	Bathrooms     float64 `json:"bathrooms"`     // e.g., 1.5 bathrooms
	Area          float64 `json:"area"`          // in square feet or square meters
	RentAmount    float64 `json:"rentAmount"`    // monthly rent amount
	RentFrequency string  `json:"rentFrequency"` // WEEKLY | MONTHLY | YEARLY

	CreatedById string     `json:"createdById" gorm:"not null;"`
	CreatedBy   ClientUser `json:"createdBy"   gorm:"foreignKey:CreatedById;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}
