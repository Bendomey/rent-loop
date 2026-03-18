package transformations

import (
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputLeaseChecklistItem struct {
	ID               string `json:"id"                 example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	LeaseChecklistId string `json:"lease_checklist_id" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	// LeaseChecklist   OutputLeaseChecklist `json:"lease_checklist"`
	Description string   `json:"description"        example:"Checked in"`
	Status      string   `json:"status"             example:"FUNCTIONAL"`
	Notes       *string  `json:"notes,omitempty"    example:"Some notes about this item"`
	Photos      []string `json:"photos,omitempty"   example:"https://example.com/photo1.jpg"`
	CreatedAt   string   `json:"created_at"         example:"2024-06-01T09:00:00Z"`
	UpdatedAt   string   `json:"updated_at"         example:"2024-06-10T09:00:00Z"`
}

func DBLeaseChecklistItemToRest(i *models.LeaseChecklistItem) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":                 i.ID,
		"lease_checklist_id": i.LeaseChecklistId,
		// "lease_checklist":    DBLeaseChecklistToRest(&i.LeaseChecklist),
		"description": i.Description,
		"status":      i.Status,
		"notes":       i.Notes,
		"photos":      i.Photos,
		"created_at":  i.CreatedAt,
		"updated_at":  i.UpdatedAt,
	}

	return data
}
