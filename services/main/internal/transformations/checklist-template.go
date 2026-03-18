package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputChecklistTemplateItem struct {
	ID          string    `json:"id"          example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Category    string    `json:"category"    example:"Living Room"`
	Description string    `json:"description" example:"Walls"`
	CreatedAt   time.Time `json:"created_at"  example:"2024-06-01T09:00:00Z"`
	UpdatedAt   time.Time `json:"updated_at"  example:"2024-06-01T09:00:00Z"`
}

type OutputChecklistTemplate struct {
	ID        string                        `json:"id"         example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	UnitType  string                        `json:"unit_type"  example:"APARTMENT"`
	Name      string                        `json:"name"       example:"Default Apartment Checklist"`
	Items     []OutputChecklistTemplateItem `json:"items"`
	CreatedAt time.Time                     `json:"created_at" example:"2024-06-01T09:00:00Z"`
	UpdatedAt time.Time                     `json:"updated_at" example:"2024-06-01T09:00:00Z"`
}

func DBChecklistTemplateToRest(t *models.ChecklistTemplate) any {
	if t == nil || t.ID == uuid.Nil {
		return nil
	}

	items := make([]any, 0, len(t.Items))
	for _, item := range t.Items {
		items = append(items, map[string]any{
			"id":          item.ID.String(),
			"category":    item.Category,
			"description": item.Description,
			"created_at":  item.CreatedAt,
			"updated_at":  item.UpdatedAt,
		})
	}

	return map[string]any{
		"id":         t.ID.String(),
		"unit_type":  t.UnitType,
		"name":       t.Name,
		"items":      items,
		"created_at": t.CreatedAt,
		"updated_at": t.UpdatedAt,
	}
}
