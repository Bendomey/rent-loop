package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
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
	DesiredUnitId                  string    `json:"desired_unit_id"                   validate:"required,uuid"   example:"b4d0243c-6581-4104-8185-d83a45ebe41b" description:"Desired unit ID"`
	FirstName                      string    `json:"first_name"                        validate:"required"        example:"John"                                 description:"First name of the applicant"`
	OtherNames                     *string   `json:"other_names,omitempty"             validate:"omitempty"       example:"Michael"                              description:"Other names of the applicant"`
	LastName                       string    `json:"last_name"                         validate:"required"        example:"Doe"                                  description:"Last name of the applicant"`
	Email                          *string   `json:"email,omitempty"                   validate:"omitempty,email" example:"john.doe@example.com"                 description:"Email address of the applicant"`
	Phone                          string    `json:"phone"                             validate:"required,e164"   example:"+233281234569"                        description:"Phone number of the applicant"`
	Gender                         string    `json:"gender"                            validate:"required"        example:"Male"                                 description:"Gender of the applicant"`
	DateOfBirth                    time.Time `json:"date_of_birth"                     validate:"required"        example:"1990-01-01T00:00:00Z"                 description:"Date of birth of the applicant"`
	Nationality                    string    `json:"nationality"                       validate:"required"        example:"Ghanaian"                             description:"Nationality of the applicant"`
	MaritalStatus                  string    `json:"marital_status"                    validate:"required"        example:"Single"                               description:"Marital status of the applicant"`
	IDNumber                       string    `json:"id_number"                         validate:"required"        example:"GHA-123456789"                        description:"ID number of the applicant"`
	CurrentAddress                 string    `json:"current_address"                   validate:"required"        example:"123 Main St, Accra"                   description:"Current address of the applicant"`
	EmergencyContactName           string    `json:"emergency_contact_name"            validate:"required"        example:"Jane Doe"                             description:"Emergency contact name"`
	EmergencyContactPhone          string    `json:"emergency_contact_phone"           validate:"required,e164"   example:"+233281434579"                        description:"Emergency contact phone"`
	RelationshipToEmergencyContact string    `json:"relationship_to_emergency_contact" validate:"required"        example:"Sister"                               description:"Relationship to emergency contact"`
	Occupation                     string    `json:"occupation"                        validate:"required"        example:"Software Engineer"                    description:"Occupation of the applicant"`
	Employer                       string    `json:"employer"                          validate:"required"        example:"Acme Corp"                            description:"Employer of the applicant"`
	OccupationAddress              string    `json:"occupation_address"                validate:"required"        example:"456 Tech Ave, Accra"                  description:"Occupation address"`
	CreatedById                    string    `json:"created_by_id"                     validate:"required,uuid"   example:"72432ce6-5620-4ecf-a862-4bf2140556a1" description:"ID of the user who created the tenant application"`
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
		CreatedById:                    body.CreatedById,
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

type SendTenantInviteRequest struct {
	Email  *string `json:"email,omitempty" validate:"omitempty,email" example:"john.doe@example.com"                 description:"Email address of the applicant"`
	Phone  *string `json:"phone,omitempty" validate:"omitempty,e164"  example:"+233281234569"                        description:"Phone number of the applicant"`
	UnitId string  `json:"unit_id"         validate:"required,uuid"   example:"b4d0243c-6581-4104-8185-d83a45ebe41b" description:"Desired unit ID"`
}

// SendTenantInvite godoc
//
//	@Summary		Sends a tenant invite to a possible tenant
//	@Description	Sends a tenant invite to a possible tenant
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body	SendTenantInviteRequest	true	"Send Tenant Invite Request Body"
//	@Success		204		"Tenant invite sent successfully"
//	@Failure		400		{object}	lib.HTTPError	"Error occurred when sending tenant invite"
//	@Failure		401		{object}	string			"Invalid or absent authentication token"
//	@Failure		404		{object}	lib.HTTPError	"TenantApplication not found"
//	@Failure		422		{object}	string			"Validation error"
//	@Failure		500		{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/invite [post]
func (h *TenantApplicationHandler) SendTenantInvite(w http.ResponseWriter, r *http.Request) {
	adminClientUser, adminClientUserOk := lib.ClientUserFromContext(r.Context())
	if !adminClientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var body SendTenantInviteRequest

	decodeErr := json.NewDecoder(r.Body).Decode(&body)
	if decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.InviteTenantInput{
		Email:   body.Email,
		Phone:   body.Phone,
		UnitId:  body.UnitId,
		AdminId: adminClientUser.ID,
	}

	sendInviteErr := h.service.InviteTenant(r.Context(), input)
	if sendInviteErr != nil {
		HandleErrorResponse(w, sendInviteErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type ListTenantApplicationsQuery struct {
	lib.FilterQueryInput
	Status                       *string   `json:"status,omitempty"                          validate:"omitempty,oneof=TenantApplication.Status.InProgress TenantApplication.Status.Cancelled TenantApplication.Status.Completed"`
	StayDurationFrequency        *string   `json:"stay_duration_frequency,omitempty"         validate:"omitempty,oneof=Hours Days Months"`
	PaymentFrequency             *string   `json:"payment_frequency,omitempty"               validate:"omitempty,oneof=Hourly Daily Monthly Quarterly BiAnnually Annually OneTime"`
	InitialDepositPaymentMethod  *string   `json:"initial_deposit_payment_method,omitempty"  validate:"omitempty,oneof=ONLINE CASH EXTERNAL"`
	SecurityDepositPaymentMethod *string   `json:"security_deposit_payment_method,omitempty" validate:"omitempty,oneof=ONLINE CASH EXTERNAL"`
	Gender                       *string   `json:"gender,omitempty"                          validate:"omitempty,oneof=Male Female"`
	MaritalStatus                *string   `json:"marital_status,omitempty"                  validate:"omitempty,oneof=Single Married Divorced Widowed"`
	CreatedById                  *string   `json:"created_by_id,omitempty"                   validate:"omitempty,uuid"                                                                                                            example:"72432ce6-5620-4ecf-a862-4bf2140556a1"   description:"ID of the user who created the tenant application"`
	DesiredUnitId                *string   `json:"desired_unit_id,omitempty"                 validate:"omitempty,uuid"                                                                                                            example:"72432ce6-5620-4ecf-a862-4bf2140556a1"   description:"ID of the unit that the tenant application is desired for"`
	Email                        *[]string `json:"email,omitempty"                           validate:"omitempty,dive,email"                                                                                                      example:"john.doe@example.com,email@example.com" description:"Email address of the applicant"                            collectionFormat:"multi"`
	Phone                        *[]string `json:"phone,omitempty"                           validate:"omitempty,dive,e164"                                                                                                       example:"+233281234569,+233281234569"            description:"Phone number of the applicant"                             collectionFormat:"multi"`
}

// ListTenantApplications godoc
//
//	@Summary		List all tenant applications
//	@Description	List all tenant applications
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q	query		ListTenantApplicationsQuery	true	"Tenant applications"
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputTenantApplication,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400	{object}	lib.HTTPError	"An error occurred while filtering tenant applications"
//	@Failure		401	{object}	string			"Absent or invalid authentication token"
//	@Failure		500	{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications [get]
func (h *TenantApplicationHandler) ListTenantApplications(w http.ResponseWriter, r *http.Request) {
	filterQuery, filterQueryErr := lib.GenerateQuery(r.URL.Query())
	if filterQueryErr != nil {
		HandleErrorResponse(w, filterQueryErr)
		return
	}

	isFilterQueryPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFilterQueryPassedValidation {
		return
	}

	input := repository.ListTenantApplicationsQuery{
		FilterQuery:                  *filterQuery,
		Status:                       lib.NullOrString(r.URL.Query().Get("status")),
		StayDurationFrequency:        lib.NullOrString(r.URL.Query().Get("stay_duration_frequency")),
		PaymentFrequency:             lib.NullOrString(r.URL.Query().Get("payment_frequency")),
		InitialDepositPaymentMethod:  lib.NullOrString(r.URL.Query().Get("initial_deposit_payment_method")),
		SecurityDepositPaymentMethod: lib.NullOrString(r.URL.Query().Get("security_deposit_payment_method")),
		Gender:                       lib.NullOrString(r.URL.Query().Get("gender")),
		MaritalStatus:                lib.NullOrString(r.URL.Query().Get("marital_status")),
		CreatedById:                  lib.NullOrString(r.URL.Query().Get("created_by_id")),
		DesiredUnitId:                lib.NullOrString(r.URL.Query().Get("desired_unit_id")),
		Email:                        lib.NullOrStringArray(r.URL.Query()["email"]),
		Phone:                        lib.NullOrStringArray(r.URL.Query()["phone"]),
	}

	tenantApplications, tenantApplicationsErr := h.service.ListTenantApplications(r.Context(), input)
	if tenantApplicationsErr != nil {
		HandleErrorResponse(w, tenantApplicationsErr)
		return
	}

	tenantApplicationsCount, tenantApplicationsCountErr := h.service.CountTenantApplications(r.Context(), input)
	if tenantApplicationsCountErr != nil {
		HandleErrorResponse(w, tenantApplicationsCountErr)
		return
	}

	tenantApplicationsTransformed := make([]any, 0)
	for _, tenantApplication := range tenantApplications {
		tenantApplicationsTransformed = append(
			tenantApplicationsTransformed,
			transformations.DBTenantApplicationToRest(&tenantApplication),
		)
	}

	json.NewEncoder(w).
		Encode(lib.ReturnListResponse(filterQuery, tenantApplicationsTransformed, tenantApplicationsCount))
}
