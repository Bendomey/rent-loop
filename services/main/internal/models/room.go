package models

import "github.com/lib/pq"

// Room represents a room within a unit in a property in the system
type Room struct {
	BaseModelSoftDelete
	UnitID string `gorm:"not null;index;"`
	Unit   Unit   `gorm:"foreignKey:UnitID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`

	Type        string         `gorm:"not null;index;"` // BEDROOM | BATHROOM | KITCHEN | LIVING_ROOM | DINING_ROOM | OFFICE | OTHER
	Name        string         `gorm:"not null;"`       // e.g., "Living Room", "Master Bedroom"
	Description *string        `gorm:"type:text;"`
	Features    pq.StringArray `gorm:"type:text[]"` // [e.g. "Ensuite", "Walk-in Closet", 'Balcony', 'AC']

	Area *float64 // in square feet or square meters

	CreatedById string `gorm:"not null;"`
	CreatedBy   ClientUser
}
