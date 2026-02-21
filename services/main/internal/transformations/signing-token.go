package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputAdminSigningToken struct {
	ID                  string                        `json:"id"                              example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Token               string                        `json:"token"                           example:"2602ABC123-a8f3b2c1d4e5"`
	DocumentID          string                        `json:"document_id"                     example:"550e8400-e29b-41d4-a716-446655440000"`
	Document            *OutputAdminDocument          `json:"document,omitempty"`
	TenantApplicationID *string                       `json:"tenant_application_id,omitempty" example:"660e8400-e29b-41d4-a716-446655440000"`
	TenantApplication   *OutputAdminTenantApplication `json:"tenant_application,omitempty"`
	LeaseID             *string                       `json:"lease_id,omitempty"              example:"770e8400-e29b-41d4-a716-446655440000"`
	Lease               *OutputAdminLease             `json:"lease,omitempty"`
	Role                string                        `json:"role"                            example:"TENANT"`
	SignerName          *string                       `json:"signer_name,omitempty"           example:"Jane Doe"`
	SignerEmail         *string                       `json:"signer_email,omitempty"          example:"jane@example.com"`
	SignerPhone         *string                       `json:"signer_phone,omitempty"          example:"+233201234567"`
	CreatedByID         string                        `json:"created_by_id"                   example:"880e8400-e29b-41d4-a716-446655440000"`
	CreatedBy           *OutputClientUser             `json:"created_by,omitempty"`
	SignedAt            *time.Time                    `json:"signed_at,omitempty"             example:"2024-06-15T14:30:00Z"`
	LastAccessedAt      *time.Time                    `json:"last_accessed_at,omitempty"      example:"2024-06-14T10:00:00Z"`
	ExpiresAt           time.Time                     `json:"expires_at"                      example:"2024-06-22T09:00:00Z"`
	DocumentSignatureID *string                       `json:"document_signature_id,omitempty" example:"990e8400-e29b-41d4-a716-446655440000"`
	DocumentSignature   *OutputDocumentSignature      `json:"document_signature,omitempty"`
	CreatedAt           time.Time                     `json:"created_at"                      example:"2024-06-01T09:00:00Z"`
	UpdatedAt           time.Time                     `json:"updated_at"                      example:"2024-06-10T09:00:00Z"`
}

func DBAdminSigningTokenToRest(i *models.SigningToken) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":                    i.ID.String(),
		"token":                 i.Token,
		"document_id":           i.DocumentID,
		"document":              DBAdminDocumentToRestDocument(&i.Document),
		"tenant_application_id": i.TenantApplicationID,
		"tenant_application":    DBAdminTenantApplicationToRest(i.TenantApplication),
		"lease_id":              i.LeaseID,
		"lease":                 DBAdminLeaseToRest(i.Lease),
		"role":                  i.Role,
		"signer_name":           i.SignerName,
		"signer_email":          i.SignerEmail,
		"signer_phone":          i.SignerPhone,
		"created_by_id":         i.CreatedByID,
		"created_by":            DBClientUserToRest(&i.CreatedBy),
		"signed_at":             i.SignedAt,
		"last_accessed_at":      i.LastAccessedAt,
		"expires_at":            i.ExpiresAt,
		"document_signature_id": i.DocumentSignatureID,
		"document_signature":    DBDocumentSignatureToRest(i.DocumentSignature),
		"created_at":            i.CreatedAt,
		"updated_at":            i.UpdatedAt,
	}

	return data
}

type OutputSigningToken struct {
	ID                  string                   `json:"id"                              example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Token               string                   `json:"token"                           example:"2602ABC123-a8f3b2c1d4e5"`
	DocumentID          string                   `json:"document_id"                     example:"550e8400-e29b-41d4-a716-446655440000"`
	Document            *OutputDocument          `json:"document,omitempty"`
	TenantApplicationID *string                  `json:"tenant_application_id,omitempty" example:"660e8400-e29b-41d4-a716-446655440000"`
	TenantApplication   *OutputTenantApplication `json:"tenant_application,omitempty"`
	LeaseID             *string                  `json:"lease_id,omitempty"              example:"770e8400-e29b-41d4-a716-446655440000"`
	Lease               *OutputLease             `json:"lease,omitempty"`
	Role                string                   `json:"role"                            example:"TENANT"`
	SignerName          *string                  `json:"signer_name,omitempty"           example:"Jane Doe"`
	SignerEmail         *string                  `json:"signer_email,omitempty"          example:"jane@example.com"`
	SignerPhone         *string                  `json:"signer_phone,omitempty"          example:"+233201234567"`
	SignedAt            *time.Time               `json:"signed_at,omitempty"             example:"2024-06-15T14:30:00Z"`
	LastAccessedAt      *time.Time               `json:"last_accessed_at,omitempty"      example:"2024-06-14T10:00:00Z"`
	ExpiresAt           time.Time                `json:"expires_at"                      example:"2024-06-22T09:00:00Z"`
	DocumentSignatureID *string                  `json:"document_signature_id,omitempty" example:"990e8400-e29b-41d4-a716-446655440000"`
	DocumentSignature   *OutputDocumentSignature `json:"document_signature,omitempty"`
	CreatedAt           time.Time                `json:"created_at"                      example:"2024-06-01T09:00:00Z"`
	UpdatedAt           time.Time                `json:"updated_at"                      example:"2024-06-10T09:00:00Z"`
}

func DBSigningTokenToRest(i *models.SigningToken) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":                    i.ID.String(),
		"token":                 i.Token,
		"document_id":           i.DocumentID,
		"document":              DBDocumentToRestDocument(&i.Document),
		"tenant_application_id": i.TenantApplicationID,
		"tenant_application":    DBTenantApplicationToRest(i.TenantApplication),
		"lease_id":              i.LeaseID,
		"lease":                 DBLeaseToRest(i.Lease),
		"role":                  i.Role,
		"signer_name":           i.SignerName,
		"signer_email":          i.SignerEmail,
		"signer_phone":          i.SignerPhone,
		"signed_at":             i.SignedAt,
		"last_accessed_at":      i.LastAccessedAt,
		"expires_at":            i.ExpiresAt,
		"document_signature_id": i.DocumentSignatureID,
		"document_signature":    DBDocumentSignatureToRest(i.DocumentSignature),
		"created_at":            i.CreatedAt,
		"updated_at":            i.UpdatedAt,
	}

	return data
}
