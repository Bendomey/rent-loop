package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type TenantApplicationHandler struct {
	appCtx  pkg.AppContext
	service services.TenantApplicationService
}

func NewTenantApplicationHandler(
	appCtx pkg.AppContext,
	service services.TenantApplicationService,
) TenantApplicationHandler {
	return TenantApplicationHandler{appCtx: appCtx, service: service}
}

// TenantApplication.Status.InProgress, TenantApplication.Status.Cancelled, TenantApplication.Status.Completed
type CreateTenantApplicationRequest struct {
	DesiredUnitId                  string    `json:"desired_unit_id"                   validate:"required,uuid"                                                                                                            example:"b4d0243c-6581-4104-8185-d83a45ebe41b" description:"Desired unit ID"`
	RentFee                        int64     `json:"rent_fee"                          validate:"required,gte=0"                                                                                                           example:"1200"                                 description:"Rent fee amount"`
	RentFeeCurrency                string    `json:"rent_fee_currency"                 validate:"required"                                                                                                                 example:"USD"                                  description:"Rent fee currency"`
	FirstName                      string    `json:"first_name"                        validate:"required"                                                                                                                 example:"John"                                 description:"First name of the applicant"`
	OtherNames                     *string   `json:"other_names,omitempty"             validate:"omitempty"                                                                                                                example:"Michael"                              description:"Other names of the applicant"`
	LastName                       string    `json:"last_name"                         validate:"required"                                                                                                                 example:"Doe"                                  description:"Last name of the applicant"`
	Email                          *string   `json:"email,omitempty"                   validate:"omitempty,email"                                                                                                          example:"john.doe@example.com"                 description:"Email address of the applicant"`
	Phone                          string    `json:"phone"                             validate:"required,e164"                                                                                                            example:"+233281234569"                        description:"Phone number of the applicant"`
	Gender                         string    `json:"gender"                            validate:"required"                                                                                                                 example:"Male"                                 description:"Gender of the applicant"`
	DateOfBirth                    time.Time `json:"date_of_birth"                     validate:"required"                                                                                                                 example:"1990-01-01T00:00:00Z"                 description:"Date of birth of the applicant"`
	Nationality                    string    `json:"nationality"                       validate:"required"                                                                                                                 example:"Ghanaian"                             description:"Nationality of the applicant"`
	MaritalStatus                  string    `json:"marital_status"                    validate:"required"                                                                                                                 example:"Single"                               description:"Marital status of the applicant"`
	IDNumber                       string    `json:"id_number"                         validate:"required"                                                                                                                 example:"GHA-123456789"                        description:"ID number of the applicant"`
	CurrentAddress                 string    `json:"current_address"                   validate:"required"                                                                                                                 example:"123 Main St, Accra"                   description:"Current address of the applicant"`
	EmergencyContactName           string    `json:"emergency_contact_name"            validate:"required"                                                                                                                 example:"Jane Doe"                             description:"Emergency contact name"`
	EmergencyContactPhone          string    `json:"emergency_contact_phone"           validate:"required,e164"                                                                                                            example:"+233281434579"                        description:"Emergency contact phone"`
	RelationshipToEmergencyContact string    `json:"relationship_to_emergency_contact" validate:"required"                                                                                                                 example:"Sister"                               description:"Relationship to emergency contact"`
	Occupation                     string    `json:"occupation"                        validate:"required"                                                                                                                 example:"Software Engineer"                    description:"Occupation of the applicant"`
	Employer                       string    `json:"employer"                          validate:"required"                                                                                                                 example:"Acme Corp"                            description:"Employer of the applicant"`
	OccupationAddress              string    `json:"occupation_address"                validate:"required"                                                                                                                 example:"456 Tech Ave, Accra"                  description:"Occupation address"`
	Status                         string    `json:"status"                            validate:"required,oneof=TenantApplication.Status.InProgress TenantApplication.Status.Cancelled TenantApplication.Status.Completed" example:"TenantApplication.Status.InProgress"  description:"Status of the application. Can be TenantApplication.Status.InProgress, TenantApplication.Status.Cancelled, TenantApplication.Status.Completed"`
}

// CreateTenantApplication godoc
//
//	@Summary		Create a new tenant application
//	@Description	Create a new tenant application
//	@Tags			TenantApplication
//	@Accept			json
//	@Produce		json
//	@Param			body	body		CreateTenantApplicationRequest							true	"Create Tenant Application Request Body"
//	@Success		201		{object}	object{data=transformations.OutputTenantApplication}	"Tenant application created successfully"
//	@Failure		400		{object}	lib.HTTPError											"Error occurred when creating a tenant application"
//	@Failure		422		{object}	lib.HTTPError											"Validation error"
//	@Failure		500		{object}	string													"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications [post]
func (h *TenantApplicationHandler) CreateTenantApplication(w http.ResponseWriter, r *http.Request) {
	var body CreateTenantApplicationRequest

	decodeErr := json.NewDecoder(r.Body).Decode(&body)
	if decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.CreateTenantApplicationInput{
		DesiredUnitId:                  body.DesiredUnitId,
		RentFee:                        body.RentFee,
		RentFeeCurrency:                body.RentFeeCurrency,
		FirstName:                      body.FirstName,
		OtherNames:                     body.OtherNames,
		LastName:                       body.LastName,
		Email:                          body.Email,
		Phone:                          body.Phone,
		Gender:                         body.Gender,
		DateOfBirth:                    body.DateOfBirth,
		Nationality:                    body.Nationality,
		MaritalStatus:                  body.MaritalStatus,
		IDNumber:                       body.IDNumber,
		CurrentAddress:                 body.CurrentAddress,
		EmergencyContactName:           body.EmergencyContactName,
		EmergencyContactPhone:          body.EmergencyContactPhone,
		RelationshipToEmergencyContact: body.RelationshipToEmergencyContact,
		Occupation:                     body.Occupation,
		Employer:                       body.Employer,
		OccupationAddress:              body.OccupationAddress,
		Status:                         body.Status,
	}

	tenantApplication, createTenantApplicationErr := h.service.CreateTenantApplication(r.Context(), input)
	if createTenantApplicationErr != nil {
		HandleErrorResponse(w, createTenantApplicationErr)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBTenantApplicationToRest(tenantApplication),
	})
}
