package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputLeaseChecklistAcknowledgment struct {
	ID               string               `json:"id"                 example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	LeaseChecklistId string               `json:"lease_checklist_id" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	LeaseChecklist   OutputLeaseChecklist `json:"lease_checklist"`
	TenantAccountId  string               `json:"tenant_account_id"  example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	TenantAccount    OutputTenantAccount  `json:"tenant_account"`
	Round            int                  `json:"round"              example:"1"`
	SubmittedAt      time.Time            `json:"submitted_at"       example:"2024-06-01T09:00:00Z"`
	Action           string               `json:"action"             example:"ACKNOWLEDGED"`
	Comment          *string              `json:"comment,omitempty"`
	CreatedAt        time.Time            `json:"created_at"         example:"2024-06-01T09:00:00Z"`
	UpdatedAt        time.Time            `json:"updated_at"         example:"2024-06-01T09:00:00Z"`
}

func DBLeaseChecklistAcknowledgmentToRest(a *models.LeaseChecklistAcknowledgment) any {
	if a == nil || a.ID == uuid.Nil {
		return nil
	}

	return map[string]any{
		"id":                 a.ID.String(),
		"lease_checklist_id": a.LeaseChecklistId,
		"lease_checklist":    DBLeaseChecklistToRest(&a.LeaseChecklist),
		"tenant_account_id":  a.TenantAccountId,
		"tenant_account":     DBTenantAccountToRest(&a.TenantAccount),
		"round":              a.Round,
		"submitted_at":       a.SubmittedAt,
		"action":             a.Action,
		"comment":            a.Comment,
		"created_at":         a.CreatedAt,
		"updated_at":         a.UpdatedAt,
	}
}
