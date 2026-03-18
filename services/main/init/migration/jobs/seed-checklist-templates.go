package jobs

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

type templateDef struct {
	unitType string
	name     string
	items    []struct{ category, description string }
}

var checklistTemplates = []templateDef{
	{
		unitType: "APARTMENT",
		name:     "Default Apartment Checklist",
		items: []struct{ category, description string }{
			{"Living Room", "Walls"},
			{"Living Room", "Ceiling"},
			{"Living Room", "Flooring"},
			{"Living Room", "Windows"},
			{"Living Room", "Doors"},
			{"Living Room", "Light fixtures"},
			{"Living Room", "Electrical outlets"},
			{"Living Room", "AC/Fan"},
			{"Kitchen", "Walls"},
			{"Kitchen", "Ceiling"},
			{"Kitchen", "Flooring"},
			{"Kitchen", "Countertops"},
			{"Kitchen", "Sink & faucet"},
			{"Kitchen", "Cabinets"},
			{"Kitchen", "Stove/Oven"},
			{"Kitchen", "Refrigerator"},
			{"Bathroom", "Walls"},
			{"Bathroom", "Ceiling"},
			{"Bathroom", "Flooring"},
			{"Bathroom", "Toilet"},
			{"Bathroom", "Sink & faucet"},
			{"Bathroom", "Shower/Tub"},
			{"Bathroom", "Mirror"},
			{"Bathroom", "Towel racks"},
			{"Bedroom", "Walls"},
			{"Bedroom", "Ceiling"},
			{"Bedroom", "Flooring"},
			{"Bedroom", "Windows"},
			{"Bedroom", "Doors"},
			{"Bedroom", "Closet/Wardrobe"},
			{"Bedroom", "Light fixtures"},
			{"General", "Front door & locks"},
			{"General", "Balcony/Patio"},
			{"General", "Smoke detectors"},
			{"General", "Water heater"},
			{"General", "Plumbing"},
		},
	},
	{
		unitType: "HOUSE",
		name:     "Default House Checklist",
		items: []struct{ category, description string }{
			{"Living Room", "Walls"},
			{"Living Room", "Ceiling"},
			{"Living Room", "Flooring"},
			{"Living Room", "Windows"},
			{"Living Room", "Doors"},
			{"Living Room", "Light fixtures"},
			{"Living Room", "Electrical outlets"},
			{"Living Room", "AC/Fan"},
			{"Kitchen", "Walls"},
			{"Kitchen", "Ceiling"},
			{"Kitchen", "Flooring"},
			{"Kitchen", "Countertops"},
			{"Kitchen", "Sink & faucet"},
			{"Kitchen", "Cabinets"},
			{"Kitchen", "Stove/Oven"},
			{"Kitchen", "Refrigerator"},
			{"Bathroom", "Walls"},
			{"Bathroom", "Ceiling"},
			{"Bathroom", "Flooring"},
			{"Bathroom", "Toilet"},
			{"Bathroom", "Sink & faucet"},
			{"Bathroom", "Shower/Tub"},
			{"Bathroom", "Mirror"},
			{"Bathroom", "Towel racks"},
			{"Bedroom", "Walls"},
			{"Bedroom", "Ceiling"},
			{"Bedroom", "Flooring"},
			{"Bedroom", "Windows"},
			{"Bedroom", "Doors"},
			{"Bedroom", "Closet/Wardrobe"},
			{"Bedroom", "Light fixtures"},
			{"General", "Front door & locks"},
			{"General", "Smoke detectors"},
			{"General", "Water heater"},
			{"General", "Plumbing"},
			{"Exterior", "Roof"},
			{"Exterior", "Gutters"},
			{"Exterior", "Garage"},
			{"Exterior", "Driveway"},
			{"Exterior", "Yard/Garden"},
			{"Exterior", "Fencing"},
			{"Exterior", "Exterior paint"},
		},
	},
	{
		unitType: "STUDIO",
		name:     "Default Studio Checklist",
		items: []struct{ category, description string }{
			{"Main Room", "Walls"},
			{"Main Room", "Ceiling"},
			{"Main Room", "Flooring"},
			{"Main Room", "Windows"},
			{"Main Room", "Doors"},
			{"Main Room", "Light fixtures"},
			{"Main Room", "Electrical outlets"},
			{"Main Room", "AC/Fan"},
			{"Kitchen", "Walls"},
			{"Kitchen", "Ceiling"},
			{"Kitchen", "Flooring"},
			{"Kitchen", "Countertops"},
			{"Kitchen", "Sink & faucet"},
			{"Kitchen", "Cabinets"},
			{"Kitchen", "Stove/Oven"},
			{"Kitchen", "Refrigerator"},
			{"Bathroom", "Walls"},
			{"Bathroom", "Ceiling"},
			{"Bathroom", "Flooring"},
			{"Bathroom", "Toilet"},
			{"Bathroom", "Sink & faucet"},
			{"Bathroom", "Shower/Tub"},
			{"Bathroom", "Mirror"},
			{"General", "Front door & locks"},
			{"General", "Smoke detectors"},
			{"General", "Water heater"},
			{"General", "Plumbing"},
		},
	},
	{
		unitType: "OFFICE",
		name:     "Default Office Checklist",
		items: []struct{ category, description string }{
			{"Main Area", "Walls"},
			{"Main Area", "Ceiling"},
			{"Main Area", "Flooring"},
			{"Main Area", "Windows"},
			{"Main Area", "Doors"},
			{"Main Area", "Light fixtures"},
			{"Main Area", "Electrical outlets"},
			{"Main Area", "AC"},
			{"Restroom", "Walls"},
			{"Restroom", "Flooring"},
			{"Restroom", "Toilet"},
			{"Restroom", "Sink"},
			{"General", "Front door & locks"},
			{"General", "Fire extinguisher"},
			{"General", "Smoke detectors"},
			{"General", "Plumbing"},
			{"General", "Internet/Network ports"},
		},
	},
	{
		unitType: "RETAIL",
		name:     "Default Shop Checklist",
		items: []struct{ category, description string }{
			{"Sales Floor", "Walls"},
			{"Sales Floor", "Ceiling"},
			{"Sales Floor", "Flooring"},
			{"Sales Floor", "Windows"},
			{"Sales Floor", "Doors"},
			{"Sales Floor", "Display fixtures"},
			{"Sales Floor", "Light fixtures"},
			{"Sales Floor", "AC"},
			{"Storage", "Walls"},
			{"Storage", "Flooring"},
			{"Storage", "Shelving"},
			{"Storage", "Doors & locks"},
			{"Restroom", "Walls"},
			{"Restroom", "Flooring"},
			{"Restroom", "Toilet"},
			{"Restroom", "Sink"},
			{"General", "Front door & locks"},
			{"General", "Security system"},
			{"General", "Fire extinguisher"},
			{"General", "Smoke detectors"},
			{"General", "Plumbing"},
		},
	},
}

// SeedChecklistTemplates seeds the system default checklist templates by unit type.
func SeedChecklistTemplates() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202603180002_SEED_CHECKLIST_TEMPLATES",
		Migrate: func(tx *gorm.DB) error {
			for _, def := range checklistTemplates {
				template := models.ChecklistTemplate{
					UnitType: def.unitType,
					Name:     def.name,
				}
				if err := tx.Create(&template).Error; err != nil {
					return err
				}

				templateItems := make([]models.ChecklistTemplateItem, 0, len(def.items))
				for _, item := range def.items {
					templateItems = append(templateItems, models.ChecklistTemplateItem{
						ChecklistTemplateId: template.ID.String(),
						Category:            item.category,
						Description:         item.description,
					})
				}
				if err := tx.Create(&templateItems).Error; err != nil {
					return err
				}
			}
			return nil
		},
		Rollback: func(tx *gorm.DB) error {
			unitTypes := []string{"APARTMENT", "HOUSE", "STUDIO", "OFFICE", "RETAIL"}
			var templates []models.ChecklistTemplate
			if err := tx.Where("unit_type IN ?", unitTypes).Find(&templates).Error; err != nil {
				return err
			}
			for _, t := range templates {
				if err := tx.Where("checklist_template_id = ?", t.ID.String()).Delete(&models.ChecklistTemplateItem{}).Error; err != nil {
					return err
				}
			}
			return tx.Where("unit_type IN ?", unitTypes).Delete(&models.ChecklistTemplate{}).Error
		},
	}
}
