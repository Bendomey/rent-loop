package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputLeaseChecklist struct {
	ID                 string                               `json:"id"                              example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	LeaseId            string                               `json:"lease_id"                        example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Lease              *OutputAdminLease                    `json:"lease,omitempty"`
	Type               string                               `json:"type"                            example:"CHECK_IN"`
	Status             string                               `json:"status"                          example:"DRAFT"`
	Round              int                                  `json:"round"                           example:"1"`
	CheckInChecklistId *string                              `json:"check_in_checklist_id,omitempty" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	CheckInChecklist   *OutputLeaseChecklist                `json:"check_in_checklist,omitempty"`
	SubmittedAt        *time.Time                           `json:"submitted_at,omitempty"          example:"2024-06-01T09:00:00Z"`
	Items              []OutputLeaseChecklistItem           `json:"items,omitempty"`
	Acknowledgments    []OutputLeaseChecklistAcknowledgment `json:"acknowledgments,omitempty"`
	CreatedById        string                               `json:"created_by_id,omitempty"         example:"72432ce6-5620-4ecf-a862-4bf2140556a1"`
	CreatedBy          *OutputClientUser                    `json:"created_by,omitempty"`
	CreatedAt          time.Time                            `json:"created_at"                      example:"2024-06-01T09:00:00Z"`
	UpdatedAt          time.Time                            `json:"updated_at"                      example:"2024-06-10T09:00:00Z"`
}

func DBLeaseChecklistToRest(i *models.LeaseChecklist) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	items := []any(nil)
	for _, item := range i.Items {
		items = append(items, DBLeaseChecklistItemToRest(&item))
	}

	acknowledgments := []any(nil)
	for _, ack := range i.Acknowledgments {
		acknowledgments = append(acknowledgments, DBLeaseChecklistAcknowledgmentToRest(&ack))
	}

	data := map[string]any{
		"id":                    i.ID.String(),
		"lease_id":              i.LeaseId,
		"lease":                 DBAdminLeaseToRest(&i.Lease),
		"type":                  i.Type,
		"status":                i.Status,
		"round":                 i.Round,
		"check_in_checklist_id": i.CheckInChecklistId,
		"check_in_checklist":    DBLeaseChecklistToRest(i.CheckInChecklist),
		"submitted_at":          i.SubmittedAt,
		"items":                 items,
		"acknowledgments":       acknowledgments,
		"created_by_id":         i.CreatedById,
		"created_by":            DBClientUserToRest(&i.CreatedBy),
		"created_at":            i.CreatedAt,
		"updated_at":            i.UpdatedAt,
	}

	return data
}
