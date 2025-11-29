package models

import "github.com/lib/pq"

// PropertyBlock represents a block within a property in the system
type PropertyBlock struct {
	BaseModelSoftDelete
	PropertyID string `gorm:"not null;index;"`
	Property   Property

	Name        string         `gorm:"not null"` // e.g., "Block A", "Tower 1"
	Description *string        // e.g., "Block A", "Tower 1"
	FloorsCount *int           // number of floors in the block
	UnitsCount  int            `gorm:"not null"` // number of units in the block
	Images      pq.StringArray `gorm:"type:text[]"`

	Status string `gorm:"not null;index;"` // PropertyBlock.Status.Active | PropertyBlock.Status.Inactive | PropertyBlock.Status.Maintenance
}
