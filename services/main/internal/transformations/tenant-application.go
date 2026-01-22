package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputTenantApplication struct {
	ID string `json:"id" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`

	Code *string `json:"code,omitempty" example:"9ucfjd3p"`

	Status string `json:"status" example:"TenantApplication.Status.InProgress"`

	CompletedAt   *time.Time        `json:"completed_at,omitempty"    example:"2024-06-01T12:00:00Z"`
	CompletedById *string           `json:"completed_by_id,omitempty" example:"user-123"`
	CompletedBy   *OutputClientUser `json:"completed_by,omitempty"`

	CancelledAt   *time.Time        `json:"cancelled_at,omitempty"    example:"2024-06-02T12:00:00Z"`
	CancelledById *string           `json:"cancelled_by_id,omitempty" example:"user-456"`
	CancelledBy   *OutputClientUser `json:"cancelled_by,omitempty"`

	DesiredUnitId string     `json:"desired_unit_id" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	DesiredUnit   OutputUnit `json:"desired_unit"`

	DesiredMoveInDate     *time.Time `json:"desired_move_in_date,omitempty"    example:"2024-07-01T00:00:00Z"`
	StayDurationFrequency *string    `json:"stay_duration_frequency,omitempty" example:"monthly"`
	StayDuration          *int64     `json:"stay_duration,omitempty"           example:"12"`

	RentFee          int64   `json:"rent_fee"                    example:"1500"`
	RentFeeCurrency  string  `json:"rent_fee_currency"           example:"USD"`
	PaymentFrequency *string `json:"payment_frequency,omitempty" example:"monthly"`

	InitialDepositFee             *int64     `json:"initial_deposit_fee,omitempty"              example:"500"`
	InitialDepositPaymentMethod   *string    `json:"initial_deposit_payment_method,omitempty"   example:"ONLINE"`
	InitialDepositReferenceNumber *string    `json:"initial_deposit_reference_number,omitempty" example:"REF123"`
	InitialDepositPaidAt          *time.Time `json:"initial_deposit_paid_at,omitempty"          example:"2024-06-05T10:00:00Z"`
	InitialDepositPaymentId       *string    `json:"initial_deposit_payment_id,omitempty"       example:"pay-001"`

	SecurityDepositFee         *int64  `json:"security_deposit_fee,omitempty"          example:"1000"`
	SecurityDepositFeeCurrency *string `json:"security_deposit_fee_currency,omitempty" example:"USD"`

	SecurityDepositPaymentMethod   *string    `json:"security_deposit_payment_method,omitempty"   example:"ONLINE"`
	SecurityDepositReferenceNumber *string    `json:"security_deposit_reference_number,omitempty" example:"SECREF456"`
	SecurityDepositPaidAt          *time.Time `json:"security_deposit_paid_at,omitempty"          example:"2024-06-06T11:00:00Z"`
	SecurityDepositPaymentId       *string    `json:"security_deposit_payment_id,omitempty"       example:"pay-002"`

	LeaseAggreementDocumentMode                     *string           `json:"lease_aggreement_document_mode,omitempty"                         example:"MANUAL"`
	LeaseAgreementDocumentUrl                       *string           `json:"lease_agreement_document_url,omitempty"                           example:"https://example.com/lease.pdf"`
	LeaseAgreementDocumentPropertyManagerSignedById *string           `json:"lease_agreement_document_property_manager_signed_by_id,omitempty" example:"user-789"`
	LeaseAgreementDocumentPropertyManagerSignedBy   *OutputClientUser `json:"lease_agreement_document_property_manager_signed_by,omitempty"`
	LeaseAgreementDocumentPropertyManagerSignedAt   *time.Time        `json:"lease_agreement_document_property_manager_signed_at,omitempty"    example:"2024-06-07T12:00:00Z"`
	LeaseAgreementDocumentTenantSignedAt            *time.Time        `json:"lease_agreement_document_tenant_signed_at,omitempty"              example:"2024-06-08T12:00:00Z"`

	FirstName       string    `json:"first_name"                  example:"John"`
	OtherNames      *string   `json:"other_names,omitempty"       example:"Michael"`
	LastName        string    `json:"last_name"                   example:"Doe"`
	Email           *string   `json:"email,omitempty"             example:"john.doe@example.com"`
	Phone           string    `json:"phone"                       example:"+1234567890"`
	Gender          string    `json:"gender"                      example:"male"`
	DateOfBirth     time.Time `json:"date_of_birth"               example:"1990-01-01"`
	Nationality     string    `json:"nationality"                 example:"Ghanaian"`
	MaritalStatus   string    `json:"marital_status"              example:"single"`
	ProfilePhotoUrl *string   `json:"profile_photo_url,omitempty" example:"https://example.com/photo.jpg"`
	IDType          string    `json:"id_type"                     example:"ghana_card"`
	IDNumber        string    `json:"id_number"                   example:"ID123456"`
	IDFrontUrl      *string   `json:"id_front_url,omitempty"      example:"https://example.com/id-front.jpg"`
	IDBackUrl       *string   `json:"id_back_url,omitempty"       example:"https://example.com/id-back.jpg"`

	PreviousLandlordName  *string `json:"previous_landlord_name,omitempty"  example:"Jane Smith"`
	PreviousLandlordPhone *string `json:"previous_landlord_phone,omitempty" example:"+1987654321"`
	PreviousTenancyPeriod *string `json:"previous_tenancy_period,omitempty" example:"2022-2023"`

	CurrentAddress                 string `json:"current_address"                   example:"123 Main St, Accra"`
	EmergencyContactName           string `json:"emergency_contact_name"            example:"Mary Doe"`
	EmergencyContactPhone          string `json:"emergency_contact_phone"           example:"+1122334455"`
	RelationshipToEmergencyContact string `json:"relationship_to_emergency_contact" example:"sister"`

	Occupation        string  `json:"occupation"                    example:"Software Engineer"`
	Employer          string  `json:"employer"                      example:"Tech Ltd."`
	OccupationAddress string  `json:"occupation_address"            example:"456 Tech Ave, Accra"`
	ProofOfIncomeUrl  *string `json:"proof_of_income_url,omitempty" example:"https://example.com/income.pdf"`

	CreatedById *string           `json:"created_by_id,omitempty" example:"72432ce6-5620-4ecf-a862-4bf2140556a1"`
	CreatedBy   *OutputClientUser `json:"created_by,omitempty"`

	CreatedAt time.Time `json:"created_at" example:"2024-06-01T09:00:00Z"`
	UpdatedAt time.Time `json:"updated_at" example:"2024-06-10T09:00:00Z"`
}

func DBTenantApplicationToRest(i *models.TenantApplication) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":                                i.ID.String(),
		"code":                              i.Code,
		"status":                            i.Status,
		"completed_at":                      i.CompletedAt,
		"completed_by_id":                   i.CompletedById,
		"completed_by":                      DBClientUserToRest(i.CompletedBy),
		"cancelled_at":                      i.CancelledAt,
		"cancelled_by_id":                   i.CancelledById,
		"cancelled_by":                      DBClientUserToRest(i.CancelledBy),
		"desired_unit_id":                   i.DesiredUnitId,
		"desired_unit":                      DBUnitToRest(&i.DesiredUnit),
		"desired_move_in_date":              i.DesiredMoveInDate,
		"stay_duration_frequency":           i.StayDurationFrequency,
		"stay_duration":                     i.StayDuration,
		"rent_fee":                          i.RentFee,
		"rent_fee_currency":                 i.RentFeeCurrency,
		"payment_frequency":                 i.PaymentFrequency,
		"initial_deposit_fee":               i.InitialDepositFee,
		"initial_deposit_payment_method":    i.InitialDepositPaymentMethod,
		"initial_deposit_reference_number":  i.InitialDepositReferenceNumber,
		"initial_deposit_paid_at":           i.InitialDepositPaidAt,
		"initial_deposit_payment_id":        i.InitialDepositPaymentId,
		"security_deposit_fee":              i.SecurityDepositFee,
		"security_deposit_fee_currency":     i.SecurityDepositFeeCurrency,
		"security_deposit_payment_method":   i.SecurityDepositPaymentMethod,
		"security_deposit_reference_number": i.SecurityDepositReferenceNumber,
		"security_deposit_paid_at":          i.SecurityDepositPaidAt,
		"security_deposit_payment_id":       i.SecurityDepositPaymentId,
		"lease_aggreement_document_mode":    i.LeaseAggreementDocumentMode,
		"lease_agreement_document_url":      i.LeaseAgreementDocumentUrl,
		"lease_agreement_document_property_manager_signed_by_id": i.LeaseAgreementDocumentPropertyManagerSignedById,
		"lease_agreement_document_property_manager_signed_by": DBClientUserToRest(
			i.LeaseAgreementDocumentPropertyManagerSignedBy,
		),
		"lease_agreement_document_property_manager_signed_at": i.LeaseAgreementDocumentPropertyManagerSignedAt,
		"lease_agreement_document_tenant_signed_at":           i.LeaseAgreementDocumentTenantSignedAt,
		"first_name":                        i.FirstName,
		"other_names":                       i.OtherNames,
		"last_name":                         i.LastName,
		"email":                             i.Email,
		"phone":                             i.Phone,
		"gender":                            i.Gender,
		"date_of_birth":                     i.DateOfBirth,
		"nationality":                       i.Nationality,
		"marital_status":                    i.MaritalStatus,
		"profile_photo_url":                 i.ProfilePhotoUrl,
		"id_type":                           i.IDType,
		"id_number":                         i.IDNumber,
		"id_front_url":                      i.IDFrontUrl,
		"id_back_url":                       i.IDBackUrl,
		"previous_landlord_name":            i.PreviousLandlordName,
		"previous_landlord_phone":           i.PreviousLandlordPhone,
		"previous_tenancy_period":           i.PreviousTenancyPeriod,
		"current_address":                   i.CurrentAddress,
		"emergency_contact_name":            i.EmergencyContactName,
		"emergency_contact_phone":           i.EmergencyContactPhone,
		"relationship_to_emergency_contact": i.RelationshipToEmergencyContact,
		"occupation":                        i.Occupation,
		"employer":                          i.Employer,
		"occupation_address":                i.OccupationAddress,
		"proof_of_income_url":               i.ProofOfIncomeUrl,
		"created_by_id":                     i.CreatedById,
		"created_by":                        DBClientUserToRest(i.CreatedBy),
		"created_at":                        i.CreatedAt,
		"updated_at":                        i.UpdatedAt,
	}

	return data
}
