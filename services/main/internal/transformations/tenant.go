package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputTenant struct {
	ID              string    `json:"id"                          example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
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

	EmergencyContactName           string `json:"emergency_contact_name"            example:"Mary Doe"`
	EmergencyContactPhone          string `json:"emergency_contact_phone"           example:"+1122334455"`
	RelationshipToEmergencyContact string `json:"relationship_to_emergency_contact" example:"sister"`

	Occupation        string  `json:"occupation"                    example:"Software Engineer"`
	Employer          string  `json:"employer"                      example:"Tech Ltd."`
	OccupationAddress string  `json:"occupation_address"            example:"456 Tech Ave, Accra"`
	ProofOfIncomeUrl  *string `json:"proof_of_income_url,omitempty" example:"https://example.com/income.pdf"`
}

type OutputAdminTenant struct {
	OutputTenant

	CreatedById *string           `json:"created_by_id,omitempty" example:"72432ce6-5620-4ecf-a862-4bf2140556a"`
	CreatedBy   *OutputClientUser `json:"created_by,omitempty"`

	CreatedAt time.Time `json:"created_at" example:"2024-06-01T09:00:00Z"`
	UpdatedAt time.Time `json:"updated_at" example:"2024-06-10T09:00:00Z"`
}

func DBAdminTenantToRest(i *models.Tenant) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":                                i.ID,
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
		"emergency_contact_name":            i.EmergencyContactName,
		"emergency_contact_phone":           i.EmergencyContactPhone,
		"relationship_to_emergency_contact": i.RelationshipToEmergencyContact,
		"occupation":                        i.Occupation,
		"employer":                          i.Employer,
		"occupation_address":                i.OccupationAddress,
		"proof_of_income_url":               i.ProofOfIncomeUrl,
		"created_by_id":                     i.CreatedById,
		"created_by":                        DBClientUserToRest(&i.CreatedBy),
		"created_at":                        i.CreatedAt,
		"updated_at":                        i.UpdatedAt,
	}

	return data
}

func DBTenantToRest(i *models.Tenant) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	data := map[string]any{
		"id":                                i.ID,
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
		"emergency_contact_name":            i.EmergencyContactName,
		"emergency_contact_phone":           i.EmergencyContactPhone,
		"relationship_to_emergency_contact": i.RelationshipToEmergencyContact,
		"occupation":                        i.Occupation,
		"employer":                          i.Employer,
		"occupation_address":                i.OccupationAddress,
		"proof_of_income_url":               i.ProofOfIncomeUrl,
	}

	return data
}
