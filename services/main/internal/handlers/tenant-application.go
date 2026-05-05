package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type TenantApplicationHandler struct {
	appCtx   pkg.AppContext
	service  services.TenantApplicationService
	services services.Services
}

func NewTenantApplicationHandler(
	appCtx pkg.AppContext,
	services services.Services,
) TenantApplicationHandler {
	return TenantApplicationHandler{
		appCtx:   appCtx,
		service:  services.TenantApplicationService,
		services: services,
	}
}

type AdminCreateTenantApplicationRequest struct {
	DesiredUnitId                  string     `json:"desired_unit_id"                   validate:"required,uuid"                                                  example:"b4d0243c-6581-4104-8185-d83a45ebe41b"    description:"Desired unit ID"`
	FirstName                      string     `json:"first_name"                        validate:"required"                                                       example:"John"                                    description:"First name of the applicant"`
	OtherNames                     *string    `json:"other_names,omitempty"             validate:"omitempty"                                                      example:"Michael"                                 description:"Other names of the applicant"`
	LastName                       string     `json:"last_name"                         validate:"required"                                                       example:"Doe"                                     description:"Last name of the applicant"`
	Email                          *string    `json:"email,omitempty"                   validate:"omitempty,email"                                                example:"john.doe@example.com"                    description:"Email address of the applicant"`
	Phone                          string     `json:"phone"                             validate:"required,e164"                                                  example:"+233281234569"                           description:"Phone number of the applicant"`
	Gender                         string     `json:"gender"                            validate:"required,oneof=MALE FEMALE"                                     example:"MALE"                                    description:"Gender of the applicant"`
	DateOfBirth                    *time.Time `json:"date_of_birth"                     validate:"omitempty"                                                      example:"1990-01-01T00:00:00Z"                    description:"Date of birth of the applicant"`
	Nationality                    *string    `json:"nationality"                       validate:"omitempty"                                                      example:"Ghanaian"                                description:"Nationality of the applicant"`
	MaritalStatus                  *string    `json:"marital_status"                    validate:"omitempty,oneof=SINGLE MARRIED DIVORCED WIDOWED"                example:"SINGLE"                                  description:"Marital status of the applicant"`
	IDType                         *string    `json:"id_type"                           validate:"omitempty,oneof=GHANA_CARD NATIONAL_ID PASSPORT DRIVER_LICENSE" example:"GHANA_CARD"                              description:"ID type of the applicant"`
	IDNumber                       *string    `json:"id_number"                         validate:"omitempty"                                                      example:"GHA-123456789"                           description:"ID number of the applicant"`
	IDFrontUrl                     *string    `json:"id_front_url,omitempty"            validate:"omitempty,url"                                                  example:"https://example.com/id_front.jpg"        description:"ID front image URL"`
	IDBackUrl                      *string    `json:"id_back_url,omitempty"             validate:"omitempty,url"                                                  example:"https://example.com/id_back.jpg"         description:"ID back image URL"`
	CurrentAddress                 *string    `json:"current_address"                   validate:"omitempty"                                                      example:"123 Main St, Accra"                      description:"Current address of the applicant"`
	EmergencyContactName           *string    `json:"emergency_contact_name"            validate:"omitempty"                                                      example:"Jane Doe"                                description:"Emergency contact name"`
	EmergencyContactPhone          *string    `json:"emergency_contact_phone"           validate:"omitempty,e164"                                                 example:"+233281434579"                           description:"Emergency contact phone"`
	RelationshipToEmergencyContact *string    `json:"relationship_to_emergency_contact" validate:"omitempty"                                                      example:"Sister"                                  description:"Relationship to emergency contact"`
	Occupation                     *string    `json:"occupation"                        validate:"omitempty"                                                      example:"Software Engineer"                       description:"Occupation of the applicant"`
	Employer                       *string    `json:"employer"                          validate:"omitempty"                                                      example:"Acme Corp"                               description:"Employer of the applicant"`
	EmployerType                   *string    `json:"employer_type"                     validate:"omitempty,oneof=WORKER STUDENT"                                 example:"WORKER"                                  description:"Employer type of the applicant"`
	ProofOfIncomeUrl               *string    `json:"proof_of_income_url,omitempty"     validate:"omitempty,url"                                                  example:"https://example.com/proof_of_income.jpg" description:"Proof of income URL"`
	OccupationAddress              *string    `json:"occupation_address"                validate:"omitempty"                                                      example:"456 Tech Ave, Accra"                     description:"Occupation address"`
	ProfilePhotoUrl                *string    `json:"profile_photo_url,omitempty"       validate:"omitempty,url"                                                  example:"https://example.com/photo.jpg"           description:"Profile photo URL"`
}

// AdminCreateTenantApplication godoc
//
//	@Summary		Create a new lease application (Admin)
//	@Description	Create a new lease application (Admin)
//	@Tags			TenantApplication
//	@Accept			json
//	@Produce		json
//	@Param			property_id	path		string														true	"Property ID"
//	@Param			body		body		AdminCreateTenantApplicationRequest							true	"Create lease application Request Body"
//	@Success		201			{object}	object{data=transformations.OutputAdminTenantApplication}	"lease application created successfully"
//	@Failure		400			{object}	lib.HTTPError												"Error occurred when creating a lease application"
//	@Failure		422			{object}	lib.HTTPError												"Validation error"
//	@Failure		500			{object}	string														"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/tenant-applications [post]
func (h *TenantApplicationHandler) AdminCreateTenantApplication(w http.ResponseWriter, r *http.Request) {
	currentUser, currentUserOk := lib.ClientUserFromContext(r.Context())
	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body AdminCreateTenantApplicationRequest

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
		IDType:                         body.IDType,
		IDNumber:                       body.IDNumber,
		IDFrontUrl:                     body.IDFrontUrl,
		IDBackUrl:                      body.IDBackUrl,
		CurrentAddress:                 body.CurrentAddress,
		EmergencyContactName:           body.EmergencyContactName,
		EmergencyContactPhone:          body.EmergencyContactPhone,
		RelationshipToEmergencyContact: body.RelationshipToEmergencyContact,
		Occupation:                     body.Occupation,
		Employer:                       body.Employer,
		EmployerType:                   body.EmployerType,
		ProofOfIncomeUrl:               body.ProofOfIncomeUrl,
		OccupationAddress:              body.OccupationAddress,
		ProfilePhotoUrl:                body.ProfilePhotoUrl,
		CreatedById:                    currentUser.ID,
	}

	tenantApplication, createTenantApplicationErr := h.service.CreateTenantApplication(r.Context(), input)
	if createTenantApplicationErr != nil {
		HandleErrorResponse(w, createTenantApplicationErr)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminTenantApplicationToRest(
			tenantApplication,
		),
	})
}

type CreateTenantApplicationRequest struct {
	DesiredUnitId                  string     `json:"desired_unit_id"                   validate:"required,uuid"                                                  example:"b4d0243c-6581-4104-8185-d83a45ebe41b"    description:"Desired unit ID"`
	FirstName                      string     `json:"first_name"                        validate:"required"                                                       example:"John"                                    description:"First name of the applicant"`
	OtherNames                     *string    `json:"other_names,omitempty"             validate:"omitempty"                                                      example:"Michael"                                 description:"Other names of the applicant"`
	LastName                       string     `json:"last_name"                         validate:"required"                                                       example:"Doe"                                     description:"Last name of the applicant"`
	Email                          *string    `json:"email,omitempty"                   validate:"omitempty,email"                                                example:"john.doe@example.com"                    description:"Email address of the applicant"`
	Phone                          string     `json:"phone"                             validate:"required,e164"                                                  example:"+233281234569"                           description:"Phone number of the applicant"`
	Gender                         string     `json:"gender"                            validate:"required,oneof=MALE FEMALE"                                     example:"MALE"                                    description:"Gender of the applicant"`
	DateOfBirth                    *time.Time `json:"date_of_birth"                     validate:"omitempty"                                                      example:"1990-01-01T00:00:00Z"                    description:"Date of birth of the applicant"`
	Nationality                    *string    `json:"nationality"                       validate:"omitempty"                                                      example:"Ghanaian"                                description:"Nationality of the applicant"`
	MaritalStatus                  *string    `json:"marital_status"                    validate:"omitempty,oneof=SINGLE MARRIED DIVORCED WIDOWED"                example:"SINGLE"                                  description:"Marital status of the applicant"`
	IDType                         *string    `json:"id_type"                           validate:"omitempty,oneof=GHANA_CARD NATIONAL_ID PASSPORT DRIVER_LICENSE" example:"GHANA_CARD"                              description:"ID type of the applicant"`
	IDNumber                       *string    `json:"id_number"                         validate:"omitempty"                                                      example:"GHA-123456789"                           description:"ID number of the applicant"`
	IDFrontUrl                     *string    `json:"id_front_url,omitempty"            validate:"omitempty,url"                                                  example:"https://example.com/id_front.jpg"        description:"ID front image URL"`
	IDBackUrl                      *string    `json:"id_back_url,omitempty"             validate:"omitempty,url"                                                  example:"https://example.com/id_back.jpg"         description:"ID back image URL"`
	CurrentAddress                 *string    `json:"current_address"                   validate:"omitempty"                                                      example:"123 Main St, Accra"                      description:"Current address of the applicant"`
	EmergencyContactName           *string    `json:"emergency_contact_name"            validate:"omitempty"                                                      example:"Jane Doe"                                description:"Emergency contact name"`
	EmergencyContactPhone          *string    `json:"emergency_contact_phone"           validate:"omitempty,e164"                                                 example:"+233281434579"                           description:"Emergency contact phone"`
	RelationshipToEmergencyContact *string    `json:"relationship_to_emergency_contact" validate:"omitempty"                                                      example:"Sister"                                  description:"Relationship to emergency contact"`
	Occupation                     *string    `json:"occupation"                        validate:"omitempty"                                                      example:"Software Engineer"                       description:"Occupation of the applicant"`
	Employer                       *string    `json:"employer"                          validate:"omitempty"                                                      example:"Acme Corp"                               description:"Employer of the applicant"`
	EmployerType                   *string    `json:"employer_type"                     validate:"omitempty,oneof=WORKER STUDENT"                                 example:"WORKER"                                  description:"Employer type of the applicant"`
	ProofOfIncomeUrl               *string    `json:"proof_of_income_url,omitempty"     validate:"omitempty,url"                                                  example:"https://example.com/proof_of_income.jpg" description:"Proof of income URL"`
	OccupationAddress              *string    `json:"occupation_address"                validate:"omitempty"                                                      example:"456 Tech Ave, Accra"                     description:"Occupation address"`
	ProfilePhotoUrl                *string    `json:"profile_photo_url,omitempty"       validate:"omitempty,url"                                                  example:"https://example.com/photo.jpg"           description:"Profile photo URL"`
	CreatedById                    string     `json:"created_by_id"                     validate:"required,uuid"                                                  example:"72432ce6-5620-4ecf-a862-4bf2140556a1"    description:"ID of the user who created the lease application"`
}

// CreateTenantApplication godoc
//
//	@Summary		Create a new lease application
//	@Description	Create a new lease application
//	@Tags			TenantApplication
//	@Accept			json
//	@Produce		json
//	@Param			body	body		CreateTenantApplicationRequest							true	"Create lease application Request Body"
//	@Success		201		{object}	object{data=transformations.OutputTenantApplication}	"lease application created successfully"
//	@Failure		400		{object}	lib.HTTPError											"Error occurred when creating a lease application"
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
		IDType:                         body.IDType,
		IDNumber:                       body.IDNumber,
		IDFrontUrl:                     body.IDFrontUrl,
		IDBackUrl:                      body.IDBackUrl,
		CurrentAddress:                 body.CurrentAddress,
		EmergencyContactName:           body.EmergencyContactName,
		EmergencyContactPhone:          body.EmergencyContactPhone,
		RelationshipToEmergencyContact: body.RelationshipToEmergencyContact,
		Occupation:                     body.Occupation,
		Employer:                       body.Employer,
		EmployerType:                   body.EmployerType,
		ProofOfIncomeUrl:               body.ProofOfIncomeUrl,
		OccupationAddress:              body.OccupationAddress,
		ProfilePhotoUrl:                body.ProfilePhotoUrl,
		CreatedById:                    body.CreatedById,
	}

	tenantApplication, createTenantApplicationErr := h.service.CreateTenantApplication(r.Context(), input)
	if createTenantApplicationErr != nil {
		HandleErrorResponse(w, createTenantApplicationErr)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBTenantApplicationToRest(
			tenantApplication,
		),
	})
}

type SendTenantInviteRequest struct {
	Email  *string `json:"email,omitempty" validate:"omitempty,email" example:"john.doe@example.com"                 description:"Email address of the applicant"`
	Phone  *string `json:"phone,omitempty" validate:"omitempty,e164"  example:"+233281234569"                        description:"Phone number of the applicant"`
	UnitId string  `json:"unit_id"         validate:"required,uuid"   example:"b4d0243c-6581-4104-8185-d83a45ebe41b" description:"Desired unit ID"`
}

// SendTenantInvite godoc
//
//	@Summary		Sends a tenant invite to a possible tenant (Admin)
//	@Description	Sends a tenant invite to a possible tenant (Admin)
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path	string					true	"Property ID"
//	@Param			body		body	SendTenantInviteRequest	true	"Send Tenant Invite Request Body"
//	@Success		204			"Tenant invite sent successfully"
//	@Failure		400			{object}	lib.HTTPError	"Error occurred when sending tenant invite"
//	@Failure		401			{object}	string			"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError	"TenantApplication not found"
//	@Failure		422			{object}	string			"Validation error"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/tenant-applications/invite [post]
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
		Email:    body.Email,
		Phone:    body.Phone,
		UnitId:   body.UnitId,
		AdminId:  adminClientUser.ID,
		ClientID: adminClientUser.ClientID,
	}

	sendInviteErr := h.service.InviteTenant(r.Context(), input)
	if sendInviteErr != nil {
		HandleErrorResponse(w, sendInviteErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type BulkCreateTenantApplicationEntry struct {
	Phone          string  `json:"phone"                     validate:"required,e164"                                                  example:"+233281234569"                        description:"Phone number (required)"`
	FirstName      *string `json:"first_name,omitempty"      validate:"omitempty"                                                      example:"John"                                 description:"First name"`
	LastName       *string `json:"last_name,omitempty"       validate:"omitempty"                                                      example:"Doe"                                  description:"Last name"`
	Email          *string `json:"email,omitempty"           validate:"omitempty,email"                                                example:"john.doe@example.com"                 description:"Email address"`
	Gender         *string `json:"gender,omitempty"          validate:"omitempty,oneof=MALE FEMALE"                                    example:"MALE"                                 description:"Gender"`
	DateOfBirth    *string `json:"date_of_birth,omitempty"   validate:"omitempty,datetime=2006-01-02"                                  example:"1990-01-01"                           description:"Date of birth (YYYY-MM-DD)"`
	Nationality    *string `json:"nationality,omitempty"     validate:"omitempty"                                                      example:"Ghanaian"                             description:"Nationality"`
	MaritalStatus  *string `json:"marital_status,omitempty"  validate:"omitempty,oneof=SINGLE MARRIED DIVORCED WIDOWED"                example:"SINGLE"                               description:"Marital status"`
	IDType         *string `json:"id_type,omitempty"         validate:"omitempty,oneof=GHANA_CARD NATIONAL_ID PASSPORT DRIVER_LICENSE" example:"GHANA_CARD"                           description:"ID type"`
	IDNumber       *string `json:"id_number,omitempty"       validate:"omitempty"                                                      example:"GHA-123456789"                        description:"ID number"`
	CurrentAddress *string `json:"current_address,omitempty" validate:"omitempty"                                                      example:"123 Main St, Accra"                   description:"Current address"`
	DesiredUnitId  *string `json:"desired_unit_id,omitempty" validate:"omitempty,uuid"                                                 example:"b4d0243c-6581-4104-8185-d83a45ebe41b" description:"Unit ID"`
	Occupation     *string `json:"occupation,omitempty"      validate:"omitempty"                                                      example:"Software Engineer"                    description:"Occupation"`
	Employer       *string `json:"employer,omitempty"        validate:"omitempty"                                                      example:"Acme Corp"                            description:"Employer"`
}

type BulkCreateTenantApplicationsRequest struct {
	Entries []BulkCreateTenantApplicationEntry `json:"entries" validate:"required,min=1,max=50,dive"`
}

// BulkCreateTenantApplications godoc
//
//	@Summary		Bulk create lease applications from CSV/Excel upload (Admin)
//	@Description	Creates multiple lease applications at once. Only phone is required per entry; all other fields are optional. Tenants are notified via SMS (and email if provided) with a link to complete their profile.
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string														true	"Property ID"
//	@Param			body		body		BulkCreateTenantApplicationsRequest							true	"Bulk Create lease applications Request Body"
//	@Success		201			{object}	object{data=[]transformations.OutputAdminTenantApplication}	"Applications created successfully"
//	@Failure		400			{object}	lib.HTTPError												"Error occurred when creating applications"
//	@Failure		401			{object}	string														"Invalid or absent authentication token"
//	@Failure		422			{object}	lib.HTTPError												"Validation error"
//	@Failure		500			{object}	string														"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/tenant-applications/bulk [post]
func (h *TenantApplicationHandler) BulkCreateTenantApplications(w http.ResponseWriter, r *http.Request) {
	currentUser, currentUserOk := lib.ClientUserFromContext(r.Context())
	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	propertyID := chi.URLParam(r, "property_id")

	var body BulkCreateTenantApplicationsRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	entries := make([]services.BulkCreateTenantApplicationEntry, 0, len(body.Entries))
	for _, e := range body.Entries {
		var dob *time.Time
		if e.DateOfBirth != nil {
			parsed, parseErr := time.Parse("2006-01-02", *e.DateOfBirth)
			if parseErr != nil {
				http.Error(
					w,
					fmt.Sprintf("invalid date_of_birth %q: expected YYYY-MM-DD", *e.DateOfBirth),
					http.StatusUnprocessableEntity,
				)
				return
			}
			dob = &parsed
		}
		entries = append(entries, services.BulkCreateTenantApplicationEntry{
			Phone:          e.Phone,
			FirstName:      e.FirstName,
			LastName:       e.LastName,
			Email:          e.Email,
			Gender:         e.Gender,
			DateOfBirth:    dob,
			Nationality:    e.Nationality,
			MaritalStatus:  e.MaritalStatus,
			IDType:         e.IDType,
			IDNumber:       e.IDNumber,
			CurrentAddress: e.CurrentAddress,
			DesiredUnitId:  e.DesiredUnitId,
			Occupation:     e.Occupation,
			Employer:       e.Employer,
		})
	}

	apps, err := h.service.BulkCreateTenantApplications(r.Context(), services.BulkCreateTenantApplicationsInput{
		Entries:     entries,
		PropertyID:  propertyID,
		CreatedById: currentUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	results := make([]any, 0, len(apps))
	for _, app := range apps {
		results = append(results, transformations.DBAdminTenantApplicationToRest(app))
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": results,
	})
}

type ListTenantApplicationsQuery struct {
	lib.FilterQueryInput
	Status                       *string   `json:"status,omitempty"                          validate:"omitempty,oneof=TenantApplication.Status.InProgress TenantApplication.Status.Cancelled TenantApplication.Status.Completed"`
	StayDurationFrequency        *string   `json:"stay_duration_frequency,omitempty"         validate:"omitempty,oneof=HOURS DAYS MONTHS"`
	PaymentFrequency             *string   `json:"payment_frequency,omitempty"               validate:"omitempty,oneof=HOURLY DAILY MONTHLY QUARTERLY BIANNUALLY ANNUALLY ONETIME"`
	InitialDepositPaymentMethod  *string   `json:"initial_deposit_payment_method,omitempty"  validate:"omitempty,oneof=ONLINE CASH EXTERNAL"`
	SecurityDepositPaymentMethod *string   `json:"security_deposit_payment_method,omitempty" validate:"omitempty,oneof=ONLINE CASH EXTERNAL"`
	Gender                       *string   `json:"gender,omitempty"                          validate:"omitempty,oneof=MALE FEMALE"`
	MaritalStatus                *string   `json:"marital_status,omitempty"                  validate:"omitempty,oneof=SINGLE MARRIED DIVORCED WIDOWED"`
	CreatedById                  *string   `json:"created_by_id,omitempty"                   validate:"omitempty,uuid"                                                                                                            example:"72432ce6-5620-4ecf-a862-4bf2140556a1"   description:"ID of the user who created the lease application"`
	DesiredUnitId                *string   `json:"desired_unit_id,omitempty"                 validate:"omitempty,uuid"                                                                                                            example:"72432ce6-5620-4ecf-a862-4bf2140556a1"   description:"ID of the unit that the lease application is desired for"`
	Email                        *[]string `json:"email,omitempty"                           validate:"omitempty,dive,email"                                                                                                      example:"john.doe@example.com,email@example.com" description:"Email address of the applicant"                           collectionFormat:"multi"`
	Phone                        *[]string `json:"phone,omitempty"                           validate:"omitempty,dive,e164"                                                                                                       example:"+233281234569,+233281234569"            description:"Phone number of the applicant"                            collectionFormat:"multi"`
}

// ListTenantApplications godoc
//
//	@Summary		List all lease applications (Admin)
//	@Description	List all lease applications (Admin)
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string						true	"Property ID"
//	@Param			q			query		ListTenantApplicationsQuery	true	"lease applications"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputAdminTenantApplication,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400			{object}	lib.HTTPError	"An error occurred while filtering lease applications"
//	@Failure		401			{object}	string			"Absent or invalid authentication token"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/tenant-applications [get]
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
		PropertyId:                   lib.NullOrString(chi.URLParam(r, "property_id")),
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
			transformations.DBAdminTenantApplicationToRest(
				&tenantApplication,
			),
		)
	}

	json.NewEncoder(w).
		Encode(lib.ReturnListResponse(filterQuery, tenantApplicationsTransformed, tenantApplicationsCount))
}

type GetTenantApplicationQuery struct {
	lib.GetOneQueryInput
}

// AdminGetTenantApplication godoc
//
//	@Summary		Get lease application (Admin)
//	@Description	Get lease application (Admin)
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id				path		string														true	"Property ID"
//	@Param			tenant_application_id	path		string														true	"lease application ID"
//	@Param			q						query		GetTenantApplicationQuery									true	"lease application"
//	@Success		200						{object}	object{data=transformations.OutputAdminTenantApplication}	"lease application retrieved successfully"
//	@Failure		400						{object}	lib.HTTPError												"Error occurred when fetching a lease application"
//	@Failure		401						{object}	string														"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError												"lease application not found"
//	@Failure		500						{object}	string														"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/tenant-applications/{tenant_application_id} [get]
func (h *TenantApplicationHandler) AdminGetTenantApplication(w http.ResponseWriter, r *http.Request) {
	populate := GetPopulateFields(r)
	tenantApplicationID := chi.URLParam(r, "tenant_application_id")

	query := repository.GetTenantApplicationQuery{
		TenantApplicationID: tenantApplicationID,
		Populate:            populate,
	}

	tenantApplication, getTenantApplicationErr := h.service.GetOneTenantApplication(r.Context(), query)
	if getTenantApplicationErr != nil {
		HandleErrorResponse(w, getTenantApplicationErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminTenantApplicationToRest(
			tenantApplication,
		),
	})
}

// GetTenantApplication godoc
//
//	@Summary		Get lease application
//	@Description	Get lease application
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			tenant_application_id	path		string													true	"lease application ID"
//	@Param			q						query		GetTenantApplicationQuery								true	"lease application"
//	@Success		200						{object}	object{data=transformations.OutputTenantApplication}	"lease application retrieved successfully"
//	@Failure		400						{object}	lib.HTTPError											"Error occurred when fetching a lease application"
//	@Failure		401						{object}	string													"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError											"lease application not found"
//	@Failure		500						{object}	string													"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/{tenant_application_id} [get]
func (h *TenantApplicationHandler) GetTenantApplication(w http.ResponseWriter, r *http.Request) {
	populate := GetPopulateFields(r)
	tenantApplicationID := chi.URLParam(r, "tenant_application_id")

	query := repository.GetTenantApplicationQuery{
		TenantApplicationID: tenantApplicationID,
		Populate:            populate,
	}

	tenantApplication, getTenantApplicationErr := h.service.GetOneTenantApplication(r.Context(), query)
	if getTenantApplicationErr != nil {
		HandleErrorResponse(w, getTenantApplicationErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBTenantApplicationToRest(
			tenantApplication,
		),
	})
}

type AdminUpdateTenantApplicationRequest struct {
	DesiredUnitId                  *string                 `json:"desired_unit_id,omitempty"                   validate:"omitempty,uuid"                                                 example:"b4d0243c-6581-4104-8185-d83a45ebe41b" description:"Desired unit ID"`
	RentFee                        *int64                  `json:"rent_fee,omitempty"                          validate:"omitempty"                                                      example:"1000"                                 description:"Rent fee of the applicant"`
	RentFeeCurrency                *string                 `json:"rent_fee_currency,omitempty"                 validate:"omitempty"                                                      example:"GHS"                                  description:"Rent fee currency of the applicant"`
	FirstName                      *string                 `json:"first_name,omitempty"                        validate:"omitempty"                                                      example:"John"                                 description:"First name of the applicant"`
	LastName                       *string                 `json:"last_name,omitempty"                         validate:"omitempty"                                                      example:"Doe"                                  description:"Last name of the applicant"`
	Phone                          *string                 `json:"phone,omitempty"                             validate:"omitempty,e164"                                                 example:"+233281234569"                        description:"Phone number of the applicant"`
	Gender                         *string                 `json:"gender,omitempty"                            validate:"omitempty,oneof=MALE FEMALE"                                    example:"MALE"                                 description:"Gender of the applicant"`
	DateOfBirth                    *string                 `json:"date_of_birth,omitempty"                     validate:"omitempty,datetime=2006-01-02"                                  example:"1990-01-01"                           description:"Date of birth of the applicant (YYYY-MM-DD)"`
	Nationality                    *string                 `json:"nationality,omitempty"                       validate:"omitempty"                                                      example:"Ghanaian"                             description:"Nationality of the applicant"`
	MaritalStatus                  *string                 `json:"marital_status,omitempty"                    validate:"omitempty,oneof=SINGLE MARRIED DIVORCED WIDOWED"                example:"SINGLE"                               description:"Marital status of the applicant"`
	IDNumber                       *string                 `json:"id_number,omitempty"                         validate:"omitempty"                                                      example:"GHA-123456789"                        description:"ID number of the applicant"`
	CurrentAddress                 *string                 `json:"current_address,omitempty"                   validate:"omitempty"                                                      example:"123 Main St, Accra"                   description:"Current address of the applicant"`
	EmergencyContactName           *string                 `json:"emergency_contact_name,omitempty"            validate:"omitempty"                                                      example:"Jane Doe"                             description:"Emergency contact name"`
	EmergencyContactPhone          *string                 `json:"emergency_contact_phone,omitempty"           validate:"omitempty,e164"                                                 example:"+233281434579"                        description:"Emergency contact phone"`
	RelationshipToEmergencyContact *string                 `json:"relationship_to_emergency_contact,omitempty" validate:"omitempty"                                                      example:"Sister"                               description:"Relationship to emergency contact"`
	Occupation                     *string                 `json:"occupation,omitempty"                        validate:"omitempty"                                                      example:"Software Engineer"                    description:"Occupation of the applicant"`
	Employer                       *string                 `json:"employer,omitempty"                          validate:"omitempty"                                                      example:"Acme Corp"                            description:"Employer of the applicant"`
	EmployerType                   lib.Optional[string]    `json:"employer_type,omitempty"                     validate:"omitempty,oneof=WORKER STUDENT"                                 example:"WORKER"                               description:"Employer type of the applicant"              swaggertype:"string"`
	OccupationAddress              *string                 `json:"occupation_address,omitempty"                validate:"omitempty"                                                      example:"456 Tech Ave, Accra"                  description:"Occupation address"`
	DesiredMoveInDate              lib.Optional[time.Time] `json:"desired_move_in_date,omitempty"              validate:"omitempty"                                                                                                     description:"Desired move in date"                        swaggertype:"string"`
	StayDurationFrequency          lib.Optional[string]    `json:"stay_duration_frequency,omitempty"           validate:"omitempty"                                                                                                     description:"Stay duration frequency"                     swaggertype:"string"`
	StayDuration                   lib.Optional[int64]     `json:"stay_duration,omitempty"                     validate:"omitempty"                                                                                                     description:"Stay duration"                               swaggertype:"integer"`
	PaymentFrequency               lib.Optional[string]    `json:"payment_frequency,omitempty"                 validate:"omitempty"                                                                                                     description:"Payment frequency"                           swaggertype:"string"`
	InitialDepositFee              lib.Optional[int64]     `json:"initial_deposit_fee,omitempty"               validate:"omitempty"                                                                                                     description:"Initial deposit fee"                         swaggertype:"integer"`
	SecurityDepositFee             lib.Optional[int64]     `json:"security_deposit_fee,omitempty"              validate:"omitempty"                                                                                                     description:"Security deposit fee"                        swaggertype:"integer"`
	OtherNames                     lib.Optional[string]    `json:"other_names,omitempty"                       validate:"omitempty"                                                                                                     description:"Other names of the applicant"                swaggertype:"string"`
	Email                          lib.Optional[string]    `json:"email,omitempty"                             validate:"omitempty"                                                                                                     description:"Email address of the applicant"              swaggertype:"string"`
	ProfilePhotoUrl                lib.Optional[string]    `json:"profile_photo_url,omitempty"                 validate:"omitempty"                                                                                                     description:"Profile photo URL"                           swaggertype:"string"`
	IDType                         *string                 `json:"id_type,omitempty"                           validate:"omitempty,oneof=GHANA_CARD NATIONAL_ID PASSPORT DRIVER_LICENSE" example:"GHANA_CARD"                           description:"ID type of the applicant"`
	IDFrontUrl                     lib.Optional[string]    `json:"id_front_url,omitempty"                      validate:"omitempty"                                                                                                     description:"ID front image URL"                          swaggertype:"string"`
	IDBackUrl                      lib.Optional[string]    `json:"id_back_url,omitempty"                       validate:"omitempty"                                                                                                     description:"ID back image URL"                           swaggertype:"string"`
	PreviousLandlordName           lib.Optional[string]    `json:"previous_landlord_name,omitempty"            validate:"omitempty"                                                                                                     description:"Previous landlord name"                      swaggertype:"string"`
	PreviousLandlordPhone          lib.Optional[string]    `json:"previous_landlord_phone,omitempty"           validate:"omitempty"                                                                                                     description:"Previous landlord phone"                     swaggertype:"string"`
	PreviousTenancyPeriod          lib.Optional[string]    `json:"previous_tenancy_period,omitempty"           validate:"omitempty"                                                                                                     description:"Previous tenancy period"                     swaggertype:"string"`
	ProofOfIncomeUrl               lib.Optional[string]    `json:"proof_of_income_url,omitempty"               validate:"omitempty"                                                                                                     description:"Proof of income URL"                         swaggertype:"string"`
	LeaseAgreementDocumentMode     lib.Optional[string]    `json:"lease_agreement_document_mode,omitempty"     validate:"omitempty"                                                                                                     description:"Lease agreement document mode"               swaggertype:"string"`
	LeaseAgreementDocumentUrl      lib.Optional[string]    `json:"lease_agreement_document_url,omitempty"      validate:"omitempty"                                                                                                     description:"Lease agreement document URL"                swaggertype:"string"`
	LeaseAgreementDocumentID       lib.Optional[string]    `json:"lease_agreement_document_id,omitempty"       validate:"omitempty"                                                                                                     description:"Lease agreement document ID"                 swaggertype:"string"`
	LeaseAgreementDocumentStatus   lib.Optional[string]    `json:"lease_agreement_document_status,omitempty"   validate:"omitempty"                                                                                                     description:"Lease agreement document status"             swaggertype:"string"`
}

// AdminUpdateTenantApplication godoc
//
//	@Summary		Update a lease application (Admin)
//	@Description	Update a lease application (Admin)
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id				path		string														true	"Property ID"
//	@Param			tenant_application_id	path		string														true	"lease application ID"
//	@Param			body					body		AdminUpdateTenantApplicationRequest							true	"Update lease application Request Body"
//	@Success		200						{object}	object{data=transformations.OutputAdminTenantApplication}	"lease application updated successfully"
//	@Failure		400						{object}	lib.HTTPError												"Error occurred when updating a lease application"
//	@Failure		401						{object}	string														"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError												"lease application not found"
//	@Failure		422						{object}	lib.HTTPError												"Validation error"
//	@Failure		500						{object}	string														"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/tenant-applications/{tenant_application_id} [patch]
func (h *TenantApplicationHandler) AdminUpdateTenantApplication(w http.ResponseWriter, r *http.Request) {
	tenantApplicationID := chi.URLParam(r, "tenant_application_id")

	var body AdminUpdateTenantApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	var parsedDOB *time.Time
	if body.DateOfBirth != nil {
		t, parseErr := time.Parse("2006-01-02", *body.DateOfBirth)
		if parseErr != nil {
			http.Error(
				w,
				fmt.Sprintf("invalid date_of_birth %q: expected YYYY-MM-DD", *body.DateOfBirth),
				http.StatusUnprocessableEntity,
			)
			return
		}
		parsedDOB = &t
	}

	input := services.UpdateTenantApplicationInput{
		TenantApplicationID:            tenantApplicationID,
		DesiredUnitId:                  body.DesiredUnitId,
		RentFee:                        body.RentFee,
		RentFeeCurrency:                body.RentFeeCurrency,
		FirstName:                      body.FirstName,
		LastName:                       body.LastName,
		Phone:                          body.Phone,
		Gender:                         body.Gender,
		DateOfBirth:                    parsedDOB,
		Nationality:                    body.Nationality,
		MaritalStatus:                  body.MaritalStatus,
		IDNumber:                       body.IDNumber,
		CurrentAddress:                 body.CurrentAddress,
		EmergencyContactName:           body.EmergencyContactName,
		EmergencyContactPhone:          body.EmergencyContactPhone,
		RelationshipToEmergencyContact: body.RelationshipToEmergencyContact,
		Occupation:                     body.Occupation,
		Employer:                       body.Employer,
		EmployerType:                   body.EmployerType,
		OccupationAddress:              body.OccupationAddress,
		DesiredMoveInDate:              body.DesiredMoveInDate,
		StayDurationFrequency:          body.StayDurationFrequency,
		StayDuration:                   body.StayDuration,
		PaymentFrequency:               body.PaymentFrequency,
		InitialDepositFee:              body.InitialDepositFee,
		SecurityDepositFee:             body.SecurityDepositFee,
		OtherNames:                     body.OtherNames,
		Email:                          body.Email,
		ProfilePhotoUrl:                body.ProfilePhotoUrl,
		IDType:                         body.IDType,
		IDFrontUrl:                     body.IDFrontUrl,
		IDBackUrl:                      body.IDBackUrl,
		PreviousLandlordName:           body.PreviousLandlordName,
		PreviousLandlordPhone:          body.PreviousLandlordPhone,
		PreviousTenancyPeriod:          body.PreviousTenancyPeriod,
		ProofOfIncomeUrl:               body.ProofOfIncomeUrl,
		LeaseAgreementDocumentMode:     body.LeaseAgreementDocumentMode,
		LeaseAgreementDocumentUrl:      body.LeaseAgreementDocumentUrl,
		LeaseAgreementDocumentID:       body.LeaseAgreementDocumentID,
		LeaseAgreementDocumentStatus:   body.LeaseAgreementDocumentStatus,
	}

	tenantApplication, updateTenantApplicationErr := h.service.UpdateTenantApplication(r.Context(), input)
	if updateTenantApplicationErr != nil {
		HandleErrorResponse(w, updateTenantApplicationErr)
		return
	}
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminTenantApplicationToRest(
			tenantApplication,
		),
	})
}

type UpdateTenantApplicationRequest struct {
	LeaseAgreementDocumentStatus lib.Optional[string] `json:"lease_agreement_document_status,omitempty" validate:"omitempty" description:"Lease agreement document status" swaggertype:"string"`
}

// UpdateTenantApplication godoc
//
//	@Summary		Update a lease application
//	@Description	Update a lease application
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			tenant_application_id	path		string													true	"lease application ID"
//	@Param			body					body		UpdateTenantApplicationRequest							true	"Update lease application Request Body"
//	@Success		200						{object}	object{data=transformations.OutputTenantApplication}	"lease application updated successfully"
//	@Failure		400						{object}	lib.HTTPError											"Error occurred when updating a lease application"
//	@Failure		401						{object}	string													"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError											"lease application not found"
//	@Failure		422						{object}	lib.HTTPError											"Validation error"
//	@Failure		500						{object}	string													"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/{tenant_application_id} [patch]
func (h *TenantApplicationHandler) UpdateTenantApplication(w http.ResponseWriter, r *http.Request) {
	tenantApplicationID := chi.URLParam(r, "tenant_application_id")

	var body UpdateTenantApplicationRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.UpdateTenantApplicationInput{
		TenantApplicationID:          tenantApplicationID,
		LeaseAgreementDocumentStatus: body.LeaseAgreementDocumentStatus,
	}

	tenantApplication, updateTenantApplicationErr := h.service.UpdateTenantApplication(r.Context(), input)
	if updateTenantApplicationErr != nil {
		HandleErrorResponse(w, updateTenantApplicationErr)
		return
	}
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBTenantApplicationToRest(
			tenantApplication,
		),
	})
}

// DeleteTenantApplication godoc
//
//	@Summary		Delete a lease application (Admin)
//	@Description	Delete a lease application. Only applications with status 'TenantApplication.Status.Cancelled' can be deleted. (Admin)
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id				path	string	true	"Property ID"
//	@Param			tenant_application_id	path	string	true	"lease application ID"
//	@Success		204						"lease application deleted successfully"
//	@Failure		400						{object}	lib.HTTPError	"Error occurred when deleting a lease application or application is not cancelled"
//	@Failure		401						{object}	string			"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError	"lease application not found"
//	@Failure		500						{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/tenant-applications/{tenant_application_id} [delete]
func (h *TenantApplicationHandler) DeleteTenantApplication(w http.ResponseWriter, r *http.Request) {
	tenantApplicationID := chi.URLParam(r, "tenant_application_id")

	deleteTenantApplicationErr := h.service.DeleteTenantApplication(r.Context(), tenantApplicationID)
	if deleteTenantApplicationErr != nil {
		HandleErrorResponse(w, deleteTenantApplicationErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type CancelTenantApplicationRequest struct {
	Reason string `json:"reason" validate:"required,min=1" example:"lease application cancelled due to incomplete application"`
}

// CancelTenantApplication godoc
//
//	@Summary		Cancel a lease application (Admin)
//	@Description	Cancel a lease application (Admin)
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id				path	string							true	"Property ID"
//	@Param			tenant_application_id	path	string							true	"lease application ID"
//	@Param			body					body	CancelTenantApplicationRequest	true	"Cancel lease application Request Body"
//	@Success		204						"lease application cancelled successfully"
//	@Failure		400						{object}	lib.HTTPError	"Error occurred when cancelling a lease application"
//	@Failure		401						{object}	string			"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError	"lease application not found"
//	@Failure		422						{object}	lib.HTTPError	"Validation error"
//	@Failure		500						{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/tenant-applications/{tenant_application_id}/cancel [patch]
func (h *TenantApplicationHandler) CancelTenantApplication(w http.ResponseWriter, r *http.Request) {
	currentClientUser, currentClientUserOk := lib.ClientUserFromContext(r.Context())
	if !currentClientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CancelTenantApplicationRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	tenantApplicationID := chi.URLParam(r, "tenant_application_id")

	cancelTenantApplicationErr := h.service.CancelTenantApplication(r.Context(), services.CancelTenantApplicationInput{
		TenantApplicationID: tenantApplicationID,
		CancelledById:       currentClientUser.ID,
		Reason:              body.Reason,
	})
	if cancelTenantApplicationErr != nil {
		HandleErrorResponse(w, cancelTenantApplicationErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ApproveTenantApplication godoc
//
//	@Summary		Approve a lease application (Admin)
//	@Description	Approve a lease application (Admin)
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id				path	string	true	"Property ID"
//	@Param			tenant_application_id	path	string	true	"lease application ID"
//	@Success		204						"lease application approved successfully"
//	@Failure		400						{object}	lib.HTTPError	"Error occurred when approving a lease application"
//	@Failure		401						{object}	string			"Invalid or absent authentication token"
//	@Failure		403						{object}	lib.HTTPError	"lease application not approved"
//	@Failure		404						{object}	lib.HTTPError	"lease application not found"
//	@Failure		409						{object}	lib.HTTPError	"lease application already approved"
//	@Failure		422						{object}	lib.HTTPError	"Validation error"
//	@Failure		500						{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/tenant-applications/{tenant_application_id}/approve [patch]
func (h *TenantApplicationHandler) ApproveTenantApplication(w http.ResponseWriter, r *http.Request) {
	currentClientUser, currentClientUserOk := lib.ClientUserFromContext(r.Context())
	if !currentClientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tenantApplicationID := chi.URLParam(r, "tenant_application_id")

	approveTenantApplicationErr := h.service.ApproveTenantApplication(
		r.Context(),
		services.ApproveTenantApplicationInput{
			ClientUserID:        currentClientUser.ID,
			TenantApplicationID: tenantApplicationID,
		},
	)
	if approveTenantApplicationErr != nil {
		HandleErrorResponse(w, approveTenantApplicationErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type GenerateInvoiceRequest struct {
	DueDate *time.Time `json:"due_date,omitempty" validate:"omitempty" example:"2024-07-01T00:00:00Z" description:"Due date for the invoice"`
}

// GenerateInvoice godoc
//
//	@Summary		Generate an invoice for a lease application (Admin)
//	@Description	Generate an invoice for a lease application (security deposit and/or initial deposit) (Admin)
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id				path		string										true	"Property ID"
//	@Param			tenant_application_id	path		string										true	"lease application ID"
//	@Param			body					body		GenerateInvoiceRequest						false	"Generate Invoice Request Body"
//	@Success		201						{object}	object{data=transformations.OutputInvoice}	"Invoice generated successfully"
//	@Failure		400						{object}	lib.HTTPError								"Error occurred when generating invoice"
//	@Failure		401						{object}	string										"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError								"lease application not found"
//	@Failure		422						{object}	lib.HTTPError								"Validation error"
//	@Failure		500						{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/tenant-applications/{tenant_application_id}/invoice:generate [post]
func (h *TenantApplicationHandler) GenerateInvoice(w http.ResponseWriter, r *http.Request) {
	_, currentClientUserOk := lib.ClientUserFromContext(r.Context())
	if !currentClientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body GenerateInvoiceRequest
	decodeErr := json.NewDecoder(r.Body).Decode(&body)
	if decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	tenantApplicationID := chi.URLParam(r, "tenant_application_id")

	invoice, generateInvoiceErr := h.service.GenerateInvoice(
		r.Context(),
		services.GenerateInvoiceInput{
			TenantApplicationID: tenantApplicationID,
			DueDate:             body.DueDate,
		},
	)

	if generateInvoiceErr != nil {
		HandleErrorResponse(w, generateInvoiceErr)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBInvoiceToRest(invoice),
	})
}

type PayInvoiceRequest struct {
	PaymentAccountID string          `json:"payment_account_id"  validate:"required,uuid4"                                                example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b" description:"ID of the payment account used"`
	Amount           int64           `json:"amount"              validate:"required"                                                      example:"1000"                                 description:"Amount to pay for the invoice"`
	Provider         string          `json:"provider"            validate:"required,oneof=MTN VODAFONE AIRTELTIGO PAYSTACK BANK_API CASH" example:"CASH"                                 description:"Offline payment provider/method"`
	Reference        *string         `json:"reference,omitempty"                                                                          example:"RCP-2024-001"                         description:"Optional reference number for the payment"`
	Metadata         *map[string]any `json:"metadata,omitempty"                                                                                                                          description:"Additional metadata for the payment"`
}

// PayInvoice godoc
//
//	@Summary		Pay an invoice for a lease application (Admin)
//	@Description	Pay an invoice for a lease application (security deposit and/or initial deposit) (Admin)
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id				path	string				true	"Property ID"
//	@Param			tenant_application_id	path	string				true	"lease application ID"
//	@Param			invoice_id				path	string				true	"Invoice ID"
//	@Param			body					body	PayInvoiceRequest	true	"Pay invoice request body"
//	@Success		204						"Invoice paid successfully"
//	@Failure		400						{object}	lib.HTTPError	"Error occurred when paying invoice"
//	@Failure		401						{object}	string			"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError	"lease application or invoice not found"
//	@Failure		422						{object}	lib.HTTPError	"Validation error"
//	@Failure		500						{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/tenant-applications/{tenant_application_id}/invoice/{invoice_id}/pay [post]
func (h *TenantApplicationHandler) PayInvoice(w http.ResponseWriter, r *http.Request) {
	clientUser, currentClientUserOk := lib.ClientUserFromContext(r.Context())
	if !currentClientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body PayInvoiceRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	tenantApplicationID := chi.URLParam(r, "tenant_application_id")
	invoiceID := chi.URLParam(r, "invoice_id")

	query := repository.GetInvoiceQuery{
		Query: map[string]any{
			"id":                            invoiceID,
			"context_type":                  "TENANT_APPLICATION",
			"context_tenant_application_id": tenantApplicationID,
		},
	}

	_, getInvoiceErr := h.services.InvoiceService.GetByQuery(r.Context(), query)
	if getInvoiceErr != nil {
		HandleErrorResponse(w, getInvoiceErr)
		return
	}

	payment, err := h.services.PaymentService.CreateOfflinePayment(r.Context(), services.CreateOfflinePaymentInput{
		PaymentAccountID: body.PaymentAccountID,
		InvoiceID:        invoiceID,
		Provider:         body.Provider,
		Amount:           body.Amount,
		Reference:        body.Reference,
		Metadata:         body.Metadata,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	// verify offline payment
	_, verifyPaymentErr := h.services.PaymentService.VerifyOfflinePayment(
		r.Context(),
		services.VerifyOfflinePaymentInput{
			PaymentID:    payment.ID.String(),
			VerifiedByID: clientUser.ID,
			IsSuccessful: true,
			Metadata:     body.Metadata,
		},
	)
	if verifyPaymentErr != nil {
		HandleErrorResponse(w, verifyPaymentErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetTenantApplicationByCode godoc
//
//	@Summary		Get lease application by code (public)
//	@Description	Look up a lease application by its unique code. Returns application data including payment invoice.
//	@Tags			TenantApplication
//	@Produce		json
//	@Param			code	path		string													true	"Application code"
//	@Success		200		{object}	object{data=transformations.OutputTenantApplication}	"lease application retrieved"
//	@Failure		404		{object}	lib.HTTPError											"Application not found"
//	@Failure		500		{object}	string													"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/code/{code} [get]
func (h *TenantApplicationHandler) GetTenantApplicationByCode(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	populate := []string{
		"DesiredUnit",
		"DesiredUnit.Property",
		"ApplicationPaymentInvoice",
		"ApplicationPaymentInvoice.LineItems",
	}
	query := repository.GetTenantApplicationQuery{
		Code:     code,
		Populate: &populate,
	}

	ta, err := h.service.GetOneTenantApplication(r.Context(), query)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBTenantApplicationToRest(ta),
	})
}

type UpdateTenantApplicationByCodeRequest struct {
	FirstName                      *string              `json:"first_name,omitempty"                        validate:"omitempty"                                                      example:"John"          description:"First name"`
	LastName                       *string              `json:"last_name,omitempty"                         validate:"omitempty"                                                      example:"Doe"           description:"Last name"`
	Email                          lib.Optional[string] `json:"email,omitempty"                             validate:"omitempty"                                                                              description:"Email address"                     swaggertype:"string"`
	Gender                         *string              `json:"gender,omitempty"                            validate:"omitempty,oneof=MALE FEMALE"                                    example:"MALE"          description:"Gender"`
	DateOfBirth                    *string              `json:"date_of_birth,omitempty"                     validate:"omitempty,datetime=2006-01-02"                                  example:"1990-01-01"    description:"Date of birth (YYYY-MM-DD)"`
	Nationality                    *string              `json:"nationality,omitempty"                       validate:"omitempty"                                                      example:"Ghanaian"      description:"Nationality"`
	MaritalStatus                  *string              `json:"marital_status,omitempty"                    validate:"omitempty,oneof=SINGLE MARRIED DIVORCED WIDOWED"                example:"SINGLE"        description:"Marital status"`
	IDType                         *string              `json:"id_type,omitempty"                           validate:"omitempty,oneof=GHANA_CARD NATIONAL_ID PASSPORT DRIVER_LICENSE" example:"GHANA_CARD"    description:"ID type"`
	IDNumber                       *string              `json:"id_number,omitempty"                         validate:"omitempty"                                                      example:"GHA-123456789" description:"ID number"`
	CurrentAddress                 *string              `json:"current_address,omitempty"                   validate:"omitempty"                                                      example:"123 Main St"   description:"Current address"`
	EmergencyContactName           *string              `json:"emergency_contact_name,omitempty"            validate:"omitempty"                                                      example:"Jane Doe"      description:"Emergency contact name"`
	EmergencyContactPhone          *string              `json:"emergency_contact_phone,omitempty"           validate:"omitempty,e164"                                                 example:"+233281434579" description:"Emergency contact phone"`
	RelationshipToEmergencyContact *string              `json:"relationship_to_emergency_contact,omitempty" validate:"omitempty"                                                      example:"Sister"        description:"Relationship to emergency contact"`
	Occupation                     *string              `json:"occupation,omitempty"                        validate:"omitempty"                                                      example:"Engineer"      description:"Occupation"`
	Employer                       *string              `json:"employer,omitempty"                          validate:"omitempty"                                                      example:"Acme Corp"     description:"Employer"`
	OccupationAddress              *string              `json:"occupation_address,omitempty"                validate:"omitempty"                                                      example:"456 Tech Ave"  description:"Occupation address"`
}

// UpdateTenantApplicationByCode godoc
//
//	@Summary		Update lease application personal info by code (public)
//	@Description	Allows a tenant to fill in or update their personal details on a CSV-created application using the application code.
//	@Tags			TenantApplication
//	@Accept			json
//	@Produce		json
//	@Param			code	path		string													true	"Application code"
//	@Param			body	body		UpdateTenantApplicationByCodeRequest					true	"Update lease application By Code Request Body"
//	@Success		200		{object}	object{data=transformations.OutputTenantApplication}	"lease application updated"
//	@Failure		400		{object}	lib.HTTPError											"Error occurred when updating"
//	@Failure		403		{object}	lib.HTTPError											"Not a CSV-imported application"
//	@Failure		404		{object}	lib.HTTPError											"Application not found"
//	@Failure		422		{object}	lib.HTTPError											"Validation error"
//	@Failure		500		{object}	string													"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/code/{code} [patch]
func (h *TenantApplicationHandler) UpdateTenantApplicationByCode(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	ta, err := h.service.GetOneTenantApplication(r.Context(), repository.GetTenantApplicationQuery{Code: code})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	if ta.Source == nil || *ta.Source != "CSV_BULK" {
		http.Error(w, "This endpoint is only available for CSV-imported applications", http.StatusForbidden)
		return
	}

	var body UpdateTenantApplicationByCodeRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	var parsedDOB *time.Time
	if body.DateOfBirth != nil {
		t, parseErr := time.Parse("2006-01-02", *body.DateOfBirth)
		if parseErr != nil {
			http.Error(
				w,
				fmt.Sprintf("invalid date_of_birth %q: expected YYYY-MM-DD", *body.DateOfBirth),
				http.StatusUnprocessableEntity,
			)
			return
		}
		parsedDOB = &t
	}

	tenantApplicationID := ta.ID.String()
	input := services.UpdateTenantApplicationInput{
		TenantApplicationID:            tenantApplicationID,
		FirstName:                      body.FirstName,
		LastName:                       body.LastName,
		Gender:                         body.Gender,
		DateOfBirth:                    parsedDOB,
		Nationality:                    body.Nationality,
		MaritalStatus:                  body.MaritalStatus,
		IDType:                         body.IDType,
		IDNumber:                       body.IDNumber,
		CurrentAddress:                 body.CurrentAddress,
		EmergencyContactName:           body.EmergencyContactName,
		EmergencyContactPhone:          body.EmergencyContactPhone,
		RelationshipToEmergencyContact: body.RelationshipToEmergencyContact,
		Occupation:                     body.Occupation,
		Employer:                       body.Employer,
		OccupationAddress:              body.OccupationAddress,
		Email:                          body.Email,
	}

	updated, updateErr := h.service.UpdateTenantApplication(r.Context(), input)
	if updateErr != nil {
		HandleErrorResponse(w, updateErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBTenantApplicationToRest(updated),
	})
}

// SendTrackingOtp godoc
//
//	@Summary		Send OTP to lease application phone (public)
//	@Description	Sends a 6-digit OTP to the phone number associated with the given application code.
//	@Tags			TenantApplication
//	@Produce		json
//	@Param			code	path		string						true	"Application code"
//	@Success		200		{object}	object{masked_phone=string}	"OTP sent"
//	@Failure		404		{object}	lib.HTTPError				"Application not found"
//	@Failure		500		{object}	string						"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/code/{code}/otp:send [post]
func (h *TenantApplicationHandler) SendTrackingOtp(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	ta, err := h.service.GetOneTenantApplication(r.Context(), repository.GetTenantApplicationQuery{Code: code})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	sendErr := h.services.AuthService.SendCode(r.Context(), services.SendCodeInput{
		Channel: []string{"SMS"},
		Phone:   &ta.Phone,
	})
	if sendErr != nil {
		HandleErrorResponse(w, sendErr)
		return
	}

	maskedPhone := ta.Phone
	if len(ta.Phone) > 7 {
		maskedPhone = ta.Phone[:4] + "****" + ta.Phone[len(ta.Phone)-3:]
	}

	json.NewEncoder(w).Encode(map[string]any{
		"masked_phone": maskedPhone,
	})
}

type VerifyTrackingOtpRequest struct {
	OtpCode string `json:"otp_code" validate:"required,len=6"`
}

// VerifyTrackingOtp godoc
//
//	@Summary		Verify OTP and retrieve lease application (public)
//	@Description	Verifies the OTP for the application's phone and returns full application data.
//	@Tags			TenantApplication
//	@Accept			json
//	@Produce		json
//	@Param			code	path		string													true	"Application code"
//	@Param			body	body		VerifyTrackingOtpRequest								true	"OTP verification body"
//	@Success		200		{object}	object{data=transformations.OutputTenantApplication}	"OTP verified, application returned"
//	@Failure		400		{object}	lib.HTTPError											"Invalid OTP"
//	@Failure		404		{object}	lib.HTTPError											"Application not found"
//	@Failure		422		{object}	lib.HTTPError											"Validation error"
//	@Failure		500		{object}	string													"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/code/{code}/otp:verify [post]
func (h *TenantApplicationHandler) VerifyTrackingOtp(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	var body VerifyTrackingOtpRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	populate := []string{
		"DesiredUnit",
		"DesiredUnit.Property",
		"ApplicationPaymentInvoice",
		"ApplicationPaymentInvoice.LineItems",
	}
	ta, err := h.service.GetOneTenantApplication(r.Context(), repository.GetTenantApplicationQuery{
		Code:     code,
		Populate: &populate,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	if verifyErr := h.services.AuthService.VerifyCode(r.Context(), services.VerifyCodeInput{
		Code:  body.OtpCode,
		Phone: &ta.Phone,
	}); verifyErr != nil {
		HandleErrorResponse(w, verifyErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBTenantApplicationToRest(ta),
	})
}

type PayTrackingInvoiceRequest struct {
	Provider  string          `json:"provider"            validate:"required,oneof=MTN VODAFONE AIRTELTIGO PAYSTACK BANK_API CASH" example:"CASH"         description:"Offline payment provider"`
	Amount    int64           `json:"amount"              validate:"required,gt=0"                                                 example:"100000"       description:"Payment amount in pesewas"`
	Reference *string         `json:"reference,omitempty"                                                                          example:"RCP-2024-001" description:"Optional reference number"`
	Metadata  *map[string]any `json:"metadata,omitempty"                                                                                                  description:"Additional metadata"`
}

// PayTrackingInvoice godoc
//
//	@Summary		Pay invoice for tracked application (public)
//	@Description	Records an offline payment (PENDING) for an invoice belonging to the given application code.
//	@Tags			TenantApplication
//	@Accept			json
//	@Produce		json
//	@Param			code		path		string										true	"Application code"
//	@Param			invoice_id	path		string										true	"Invoice ID"
//	@Param			body		body		PayTrackingInvoiceRequest					true	"Payment body"
//	@Success		201			{object}	object{data=transformations.OutputPayment}	"Payment recorded"
//	@Failure		400			{object}	lib.HTTPError								"Invalid request"
//	@Failure		404			{object}	lib.HTTPError								"Application or invoice not found"
//	@Failure		422			{object}	lib.HTTPError								"Validation error"
//	@Failure		500			{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/code/{code}/invoice/{invoice_id}/pay [post]
func (h *TenantApplicationHandler) PayTrackingInvoice(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	invoiceID := chi.URLParam(r, "invoice_id")

	var body PayTrackingInvoiceRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	ta, err := h.service.GetOneTenantApplication(r.Context(), repository.GetTenantApplicationQuery{Code: code})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	// Validate invoice belongs to this application
	invoice, invoiceErr := h.services.InvoiceService.GetByQuery(r.Context(), repository.GetInvoiceQuery{
		Query: map[string]any{
			"id":                            invoiceID,
			"context_tenant_application_id": ta.ID.String(),
		},
	})
	if invoiceErr != nil {
		HandleErrorResponse(w, invoiceErr)
		return
	}

	if invoice.PayeeClientID == nil {
		HandleErrorResponse(w, pkg.BadRequestError("InvoiceHasNoPayeeClient", nil))
		return
	}

	// Find the property's active offline payment accounts
	accounts, listErr := h.services.PaymentAccountService.ListPaymentAccounts(
		r.Context(),
		repository.ListPaymentAccountsFilter{
			ClientID: invoice.PayeeClientID,
			Rail:     lib.StringPointer("OFFLINE"),
			Status:   lib.StringPointer("ACTIVE"),
		},
	)
	if listErr != nil || len(accounts) == 0 {
		HandleErrorResponse(w, pkg.BadRequestError("NoOfflinePaymentAccountFound", nil))
		return
	}

	// Prefer default account, fallback to first
	paymentAccount := accounts[0]
	for _, acc := range accounts {
		if acc.IsDefault {
			paymentAccount = acc
			break
		}
	}

	payment, createErr := h.services.PaymentService.CreateOfflinePayment(
		r.Context(),
		services.CreateOfflinePaymentInput{
			PaymentAccountID: paymentAccount.ID.String(),
			InvoiceID:        invoiceID,
			Provider:         body.Provider,
			Amount:           body.Amount,
			Reference:        body.Reference,
			Metadata:         body.Metadata,
		},
	)
	if createErr != nil {
		HandleErrorResponse(w, createErr)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBPaymentToRest(payment),
	})
}
