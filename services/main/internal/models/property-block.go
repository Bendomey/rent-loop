package models

import "github.com/lib/pq"

// PropertyBlock represents a block within a property in the system
type PropertyBlock struct {
	BaseModelSoftDelete
	PropertyID string `gorm:"not null;index;"`
	Property   Property

	Name        string         // e.g., "Block A", "Tower 1"
	Description *string        // e.g., "Block A", "Tower 1"
	Images      pq.StringArray `gorm:"type:text[]"`
}
