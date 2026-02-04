package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputAdminLease struct {
	ID                  string `json:"id"                          example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Status              string `json:"status"                      example:"active"`
	UnitId              string `json:"unit_id"                     example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Unit                AdminOutputUnit
	TenantId            string `json:"tenant_id"                   example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Tenant              OutputTenant
	TenantApplicationId string `json:"tenant_application_id"       example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	TenantApplication   OutputTenantApplication
	RentFee             int64          `json:"rent_fee"                    example:"1200"`
	RentFeeCurrency     string         `json:"rent_fee_currency"           example:"USD"`
	PaymentFrequency    *string        `json:"payment_frequency,omitempty" example:"monthly"`
	Meta                map[string]any `json:"meta"`

	MoveInDate            time.Time `json:"move_in_date"            example:"2024-07-01T00:00:00Z"`
	StayDurationFrequency string    `json:"stay_duration_frequency" example:"months"`
	StayDuration          int64     `json:"stay_duration"           example:"12"`

	KeyHandoverDate        *time.Time `json:"key_handover_date"        example:"2024-07-01T09:00:00Z"`
	UtilityTransfersDate   *time.Time `json:"utility_transfers_date"   example:"2024-07-02T10:00:00Z"`
	PropertyInspectionDate *time.Time `json:"property_inspection_date" example:"2024-06-30T15:00:00Z"`

	LeaseAggreementDocumentMode *string `json:"lease_agreement_document_mode,omitempty" example:"digital"`
	LeaseAgreementDocumentUrl   string  `json:"lease_agreement_document_url,omitempty"  example:"https://example.com/lease.pdf"`

	LeaseAgreementDocumentPropertyManagerSignedById *string `json:"lease_agreement_document_property_manager_signed_by_id,omitempty" example:"b3b2c9d0-6c8a-4e8b-9e7a-abcdef123456"`
	LeaseAgreementDocumentPropertyManagerSignedBy   *OutputClientUser
	LeaseAgreementDocumentPropertyManagerSignedAt   *time.Time `json:"lease_agreement_document_property_manager_signed_at,omitempty"    example:"2024-06-15T12:00:00Z"`
	LeaseAgreementDocumentTenantSignedAt            *time.Time `json:"lease_agreement_document_tenant_signed_at,omitempty"              example:"2024-06-16T14:00:00Z"`

	TerminationAgreementDocumentUrl                       *string    `json:"termination_agreement_document_url,omitempty"                           example:"https://example.com/termination.pdf"`
	TerminationAgreementDocumentPropertyManagerSignedAt   *time.Time `json:"termination_agreement_document_property_manager_signed_at,omitempty"    example:"2024-12-01T10:00:00Z"`
	TerminationAgreementDocumentPropertyManagerSignedByID *string    `json:"termination_agreement_document_property_manager_signed_by_id,omitempty" example:"b3b2c9d0-6c8a-4e8b-9e7a-abcdef123456"`
	TerminationAgreementDocumentPropertyManagerSignedBy   *OutputClientUser
	TerminationAgreementDocumentTenantSignedAt            *time.Time `json:"termination_agreement_document_tenant_signed_at,omitempty"              example:"2024-12-02T11:00:00Z"`

	ParentLeaseId *string `json:"parent_lease_id,omitempty" example:"b3b2c9d0-6c8a-4e8b-9e7a-abcdef123456"`

	CreatedAt time.Time `json:"created_at" example:"2024-06-01T09:00:00Z"`
	UpdatedAt time.Time `json:"updated_at" example:"2024-06-10T09:00:00Z"`
}

func DBAdminLeaseToRest(i *models.Lease) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":                            i.ID,
		"status":                        i.Status,
		"unit_id":                       i.UnitId,
		"unit":                          DBAdminUnitToRest(&i.Unit),
		"tenant_id":                     i.TenantId,
		"tenant":                        DBAdminTenantToRest(&i.Tenant),
		"tenant_application_id":         i.TenantApplicationId,
		"tenant_application":            DBTenantApplicationToRest(&i.TenantApplication),
		"rent_fee":                      i.RentFee,
		"rent_fee_currency":             i.RentFeeCurrency,
		"payment_frequency":             i.PaymentFrequency,
		"meta":                          i.Meta,
		"move_in_date":                  i.MoveInDate,
		"stay_duration_frequency":       i.StayDurationFrequency,
		"stay_duration":                 i.StayDuration,
		"key_handover_date":             i.KeyHandoverDate,
		"utility_transfers_date":        i.UtilityTransfersDate,
		"property_inspection_date":      i.PropertyInspectionDate,
		"lease_agreement_document_mode": i.LeaseAggreementDocumentMode,
		"lease_agreement_document_url":  i.LeaseAgreementDocumentUrl,
		"lease_agreement_document_property_manager_signed_by_id":       i.LeaseAgreementDocumentPropertyManagerSignedById,
		"lease_agreement_document_property_manager_signed_at":          i.LeaseAgreementDocumentPropertyManagerSignedAt,
		"lease_agreement_document_tenant_signed_at":                    i.LeaseAgreementDocumentTenantSignedAt,
		"termination_agreement_document_url":                           i.TerminationAgreementDocumentUrl,
		"termination_agreement_document_property_manager_signed_at":    i.TerminationAgreementDocumentPropertyManagerSignedAt,
		"termination_agreement_document_property_manager_signed_by_id": i.TerminationAgreementDocumentPropertyManagerSignedByID,
		"termination_agreement_document_tenant_signed_at":              i.TerminationAgreementDocumentTenantSignedAt,
		"parent_lease_id": i.ParentLeaseId,
		"created_at":      i.CreatedAt,
		"updated_at":      i.UpdatedAt,
	}

	return data
}
