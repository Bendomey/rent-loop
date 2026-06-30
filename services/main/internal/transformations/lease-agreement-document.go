package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputAdminLeaseAgreementDocument struct {
	ID          string               `json:"id"                     example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	LeaseID     string               `json:"lease_id"               example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Mode        string               `json:"mode"                   example:"ONLINE"`
	DocumentID  *string              `json:"document_id,omitempty"  example:"550e8400-e29b-41d4-a716-446655440000"`
	Document    *OutputAdminDocument `json:"document,omitempty"`
	DocumentUrl *string              `json:"document_url,omitempty" example:"https://example.com/lease.pdf"`
	Status      string               `json:"status"                 example:"DRAFT"`
	Signatures  []any                `json:"signatures"`
	CreatedAt   time.Time            `json:"created_at"             example:"2024-06-01T09:00:00Z"`
	UpdatedAt   time.Time            `json:"updated_at"             example:"2024-06-10T09:00:00Z"`
}

func DBAdminLeaseAgreementDocumentToRest(i *models.LeaseAgreementDocument) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	signatures := make([]any, 0)
	for _, sig := range i.Signatures {
		signatures = append(signatures, DBAdminDocumentSignatureToRest(&sig))
	}

	return map[string]any{
		"id":           i.ID,
		"lease_id":     i.LeaseID,
		"mode":         i.Mode,
		"document_id":  i.DocumentID,
		"document":     DBAdminDocumentToRestDocument(i.Document),
		"document_url": i.DocumentUrl,
		"status":       i.Status,
		"signatures":   signatures,
		"created_at":   i.CreatedAt,
		"updated_at":   i.UpdatedAt,
	}
}
