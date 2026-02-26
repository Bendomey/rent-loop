package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputAdminDocumentSignature struct {
	ID         string               `json:"id"                       example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	DocumentID string               `json:"document_id"              example:"550e8400-e29b-41d4-a716-446655440000"`
	Document   *OutputAdminDocument `json:"document,omitempty"`
	// TenantApplicationID *string                       `json:"tenant_application_id,omitempty" example:"660e8400-e29b-41d4-a716-446655440000"`
	// TenantApplication   *OutputAdminTenantApplication `json:"tenant_application,omitempty"`
	// LeaseID             *string                       `json:"lease_id,omitempty"              example:"770e8400-e29b-41d4-a716-446655440000"`
	// Lease               *OutputAdminLease             `json:"lease,omitempty"`
	Role         string            `json:"role"                     example:"TENANT"`
	SignatureUrl string            `json:"signature_url"            example:"https://s3.amazonaws.com/signatures/sig.png"`
	SignedByName *string           `json:"signed_by_name,omitempty" example:"John Doe"`
	SignedByID   *string           `json:"signed_by_id,omitempty"   example:"880e8400-e29b-41d4-a716-446655440000"`
	SignedBy     *OutputClientUser `json:"signed_by,omitempty"`
	IPAddress    string            `json:"ip_address"               example:"192.168.1.1"`
	CreatedAt    time.Time         `json:"created_at"               example:"2024-06-01T09:00:00Z"`
	UpdatedAt    time.Time         `json:"updated_at"               example:"2024-06-10T09:00:00Z"`
}

func DBAdminDocumentSignatureToRest(i *models.DocumentSignature) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	// tenantApplication, tenantApplicationErr := DBAdminTenantApplicationToRest(services, i.TenantApplication)
	// if tenantApplicationErr != nil {
	// 	return nil, tenantApplicationErr
	// }
	// lease, leaseErr := DBAdminLeaseToRest(services, i.Lease)
	// if leaseErr != nil {
	// 	return nil, leaseErr
	// }

	data := map[string]any{
		"id":                    i.ID.String(),
		"document_id":           i.DocumentID,
		"document":              DBAdminDocumentToRestDocument(&i.Document),
		"tenant_application_id": i.TenantApplicationID,
		// "tenant_application":    tenantApplication,
		"lease_id": i.LeaseID,
		// "lease":                 lease,
		"role":           i.Role,
		"signature_url":  i.SignatureUrl,
		"signed_by_name": i.SignedByName,
		"signed_by_id":   i.SignedByID,
		"signed_by":      DBClientUserToRest(i.SignedBy),
		"ip_address":     i.IPAddress,
		"created_at":     i.CreatedAt,
		"updated_at":     i.UpdatedAt,
	}

	return data
}

func DBAdminDocumentSignaturesToRest(i *[]models.DocumentSignature) any {
	if i == nil {
		return nil
	}

	signatures := make([]any, 0)
	for _, sig := range *i {
		signatures = append(signatures, DBAdminDocumentSignatureToRest(&sig))
	}

	return signatures
}

type OutputDocumentSignature struct {
	ID                  string                   `json:"id"                              example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	DocumentID          string                   `json:"document_id"                     example:"550e8400-e29b-41d4-a716-446655440000"`
	Document            *OutputDocument          `json:"document,omitempty"`
	TenantApplicationID *string                  `json:"tenant_application_id,omitempty" example:"660e8400-e29b-41d4-a716-446655440000"`
	TenantApplication   *OutputTenantApplication `json:"tenant_application,omitempty"`
	LeaseID             *string                  `json:"lease_id,omitempty"              example:"770e8400-e29b-41d4-a716-446655440000"`
	Lease               *OutputLease             `json:"lease,omitempty"`
	Role                string                   `json:"role"                            example:"TENANT"`
	SignatureUrl        string                   `json:"signature_url"                   example:"https://s3.amazonaws.com/signatures/sig.png"`
	SignedByName        *string                  `json:"signed_by_name,omitempty"        example:"John Doe"`
	IPAddress           string                   `json:"ip_address"                      example:"192.168.1.1"`
	CreatedAt           time.Time                `json:"created_at"                      example:"2024-06-01T09:00:00Z"`
	UpdatedAt           time.Time                `json:"updated_at"                      example:"2024-06-10T09:00:00Z"`
}

func DBDocumentSignatureToRest(i *models.DocumentSignature) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":                    i.ID.String(),
		"document_id":           i.DocumentID,
		"document":              DBDocumentToRestDocument(&i.Document),
		"tenant_application_id": i.TenantApplicationID,
		"tenant_application":    DBTenantApplicationToRest(i.TenantApplication),
		"lease_id":              i.LeaseID,
		"lease":                 DBLeaseToRest(i.Lease),
		"role":                  i.Role,
		"signature_url":         i.SignatureUrl,
		"signed_by_name":        i.SignedByName,
		"ip_address":            i.IPAddress,
		"created_at":            i.CreatedAt,
		"updated_at":            i.UpdatedAt,
	}

	return data
}

func DBDocumentSignaturesToRest(i *[]models.DocumentSignature) any {
	if i == nil {
		return nil
	}

	signatures := make([]any, 0)
	for _, sig := range *i {
		signatures = append(signatures, DBDocumentSignatureToRest(&sig))
	}

	return signatures
}
