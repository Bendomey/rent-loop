package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputLeaseTermination struct {
	ID      string `json:"id"      example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Code    string `json:"code"    example:"2606ABC123"`
	LeaseID string `json:"lease_id" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`

	Type   string `json:"type"   example:"MUTUAL_AGREEMENT"`
	Reason string `json:"reason" example:"Both parties agreed to end the tenancy"`
	Status string `json:"status" example:"LeaseTermination.Status.InProgress"`

	LeaseChecklistID *string              `json:"lease_checklist_id,omitempty" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	LeaseChecklist   *OutputLeaseChecklist `json:"lease_checklist,omitempty"`

	DocumentMode *string `json:"document_mode,omitempty" example:"MANUAL"`
	DocumentUrl  *string `json:"document_url,omitempty"  example:"https://example.com/termination.pdf"`
	DocumentID   *string `json:"document_id,omitempty"   example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`

	InitiatedById string           `json:"initiated_by_id" example:"b3b2c9d0-6c8a-4e8b-9e7a-abcdef123456"`
	InitiatedBy   *OutputClientUser `json:"initiated_by,omitempty"`

	CompletedAt   *time.Time        `json:"completed_at,omitempty"    example:"2024-12-01T10:00:00Z"`
	CompletedById *string           `json:"completed_by_id,omitempty" example:"b3b2c9d0-6c8a-4e8b-9e7a-abcdef123456"`
	CompletedBy   *OutputClientUser `json:"completed_by,omitempty"`

	CancelledAt   *time.Time        `json:"cancelled_at,omitempty"    example:"2024-12-01T10:00:00Z"`
	CancelledById *string           `json:"cancelled_by_id,omitempty" example:"b3b2c9d0-6c8a-4e8b-9e7a-abcdef123456"`
	CancelledBy   *OutputClientUser `json:"cancelled_by,omitempty"`

	CreatedAt time.Time `json:"created_at" example:"2024-06-01T09:00:00Z"`
	UpdatedAt time.Time `json:"updated_at" example:"2024-06-10T09:00:00Z"`
}

func DBLeaseTerminationToRest(t *models.LeaseTermination) any {
	if t == nil || t.ID == uuid.Nil {
		return nil
	}

	return map[string]any{
		"id":                 t.ID,
		"code":               t.Code,
		"lease_id":           t.LeaseID,
		"type":               t.Type,
		"reason":             t.Reason,
		"status":             t.Status,
		"lease_checklist_id": t.LeaseChecklistID,
		"lease_checklist":    DBLeaseChecklistToRest(t.LeaseChecklist),
		"document_mode":      t.DocumentMode,
		"document_url":       t.DocumentUrl,
		"document_id":        t.DocumentID,
		"initiated_by_id":    t.InitiatedById,
		"initiated_by":       DBClientUserToRest(&t.InitiatedBy),
		"completed_at":       t.CompletedAt,
		"completed_by_id":    t.CompletedById,
		"completed_by":       DBClientUserToRest(t.CompletedBy),
		"cancelled_at":       t.CancelledAt,
		"cancelled_by_id":    t.CancelledById,
		"cancelled_by":       DBClientUserToRest(t.CancelledBy),
		"created_at":         t.CreatedAt,
		"updated_at":         t.UpdatedAt,
	}
}
