package models

// ChecklistTemplate is a system-seeded set of items used to pre-populate
// lease checklists based on unit type.
type ChecklistTemplate struct {
	BaseModelSoftDelete
	UnitType string                  `gorm:"not null;index"` // APARTMENT, HOUSE, STUDIO, OFFICE, RETAIL
	Name     string                  `gorm:"not null"`       // e.g. "Default Apartment Checklist"
	Items    []ChecklistTemplateItem `gorm:"foreignKey:ChecklistTemplateId"`
}

// ChecklistTemplateItem is a single item within a ChecklistTemplate.
type ChecklistTemplateItem struct {
	BaseModelSoftDelete
	ChecklistTemplateId string            `gorm:"not null;index"`
	ChecklistTemplate   ChecklistTemplate `gorm:"foreignKey:ChecklistTemplateId"`
	Category            string            `gorm:"not null"` // e.g. "Living Room"
	Description         string            `gorm:"not null"` // e.g. "Walls"
}
