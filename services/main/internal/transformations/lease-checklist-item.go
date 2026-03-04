package transformations

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputLeaseChecklistItem struct {
	ID          string `json:"id"          example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Description string `json:"description" example:"Checked in"`
	Status      string `json:"status"      example:"FUNCTIONAL"`
	CreatedAt   string `json:"created_at"  example:"2024-06-01T09:00:00Z"`
	UpdatedAt   string `json:"updated_at"  example:"2024-06-10T09:00:00Z"`
}

func DBLeaseChecklistItemToRest(i *models.LeaseChecklistItem) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":          i.ID,
		"description": i.Description,
		"status":      i.Status,
		"created_at":  i.CreatedAt,
		"updated_at":  i.UpdatedAt,
	}

	return data
}
