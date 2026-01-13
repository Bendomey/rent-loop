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
	"github.com/go-chi/chi/v5"
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
	PropertyId                   *string   `json:"property_id,omitempty"                     validate:"omitempty,uuid"                                                                                                            example:"72432ce6-5620-4ecf-a862-4bf2140556a1"   description:"ID of the property to filter tenant applications by"`
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
		PropertyId:                   lib.NullOrString(r.URL.Query().Get("property_id")),
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

type GetTenantApplicationQuery struct {
	lib.GetOneQueryInput
}

// GetTenantApplication godoc
//
//	@Summary		Get tenant application
//	@Description	Get tenant application
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			tenant_application_id	path		string													true	"Tenant application ID"
//	@Param			q						query		GetTenantApplicationQuery								true	"Tenant application"
//	@Success		200						{object}	object{data=transformations.OutputTenantApplication}	"Tenant application retrieved successfully"
//	@Failure		400						{object}	lib.HTTPError											"Error occurred when fetching a tenant application"
//	@Failure		401						{object}	string													"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError											"Tenant application not found"
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
		"data": transformations.DBTenantApplicationToRest(tenantApplication),
	})
}

type UpdateTenantApplicationRequest struct {
	DesiredUnitId                  *string    `json:"desired_unit_id,omitempty"                   validate:"omitempty,uuid"                                                             example:"b4d0243c-6581-4104-8185-d83a45ebe41b" description:"Desired unit ID"`
	RentFee                        *int64     `json:"rent_fee,omitempty"                          validate:"omitempty"                                                                  example:"1000"                                 description:"Rent fee of the applicant"`
	RentFeeCurrency                *string    `json:"rent_fee_currency,omitempty"                 validate:"omitempty"                                                                  example:"GHS"                                  description:"Rent fee currency of the applicant"`
	FirstName                      *string    `json:"first_name,omitempty"                        validate:"omitempty"                                                                  example:"John"                                 description:"First name of the applicant"`
	LastName                       *string    `json:"last_name,omitempty"                         validate:"omitempty"                                                                  example:"Doe"                                  description:"Last name of the applicant"`
	Phone                          *string    `json:"phone,omitempty"                             validate:"omitempty,e164"                                                             example:"+233281234569"                        description:"Phone number of the applicant"`
	Gender                         *string    `json:"gender,omitempty"                            validate:"omitempty,oneof=Male Female"                                                example:"Male"                                 description:"Gender of the applicant"`
	DateOfBirth                    *time.Time `json:"date_of_birth,omitempty"                     validate:"omitempty"                                                                  example:"1990-01-01T00:00:00Z"                 description:"Date of birth of the applicant"`
	Nationality                    *string    `json:"nationality,omitempty"                       validate:"omitempty"                                                                  example:"Ghanaian"                             description:"Nationality of the applicant"`
	MaritalStatus                  *string    `json:"marital_status,omitempty"                    validate:"omitempty,oneof=Single Married Divorced Widowed"                            example:"Single"                               description:"Marital status of the applicant"`
	IDNumber                       *string    `json:"id_number,omitempty"                         validate:"omitempty"                                                                  example:"GHA-123456789"                        description:"ID number of the applicant"`
	CurrentAddress                 *string    `json:"current_address,omitempty"                   validate:"omitempty"                                                                  example:"123 Main St, Accra"                   description:"Current address of the applicant"`
	EmergencyContactName           *string    `json:"emergency_contact_name,omitempty"            validate:"omitempty"                                                                  example:"Jane Doe"                             description:"Emergency contact name"`
	EmergencyContactPhone          *string    `json:"emergency_contact_phone,omitempty"           validate:"omitempty,e164"                                                             example:"+233281434579"                        description:"Emergency contact phone"`
	RelationshipToEmergencyContact *string    `json:"relationship_to_emergency_contact,omitempty" validate:"omitempty"                                                                  example:"Sister"                               description:"Relationship to emergency contact"`
	Occupation                     *string    `json:"occupation,omitempty"                        validate:"omitempty"                                                                  example:"Software Engineer"                    description:"Occupation of the applicant"`
	Employer                       *string    `json:"employer,omitempty"                          validate:"omitempty"                                                                  example:"Acme Corp"                            description:"Employer of the applicant"`
	OccupationAddress              *string    `json:"occupation_address,omitempty"                validate:"omitempty"                                                                  example:"456 Tech Ave, Accra"                  description:"Occupation address"`
	DesiredMoveInDate              *time.Time `json:"desired_move_in_date,omitempty"              validate:"omitempty"                                                                  example:"2023-01-01T00:00:00Z"                 description:"Desired move in date"`
	StayDurationFrequency          *string    `json:"stay_duration_frequency,omitempty"           validate:"omitempty,oneof=Hours Days Months"                                          example:"Hours"                                description:"Stay duration frequency"`
	StayDuration                   *int64     `json:"stay_duration,omitempty"                     validate:"omitempty"                                                                  example:"10"                                   description:"Stay duration"`
	PaymentFrequency               *string    `json:"payment_frequency,omitempty"                 validate:"omitempty,oneof=Hourly Daily Monthly Quarterly BiAnnually Annually OneTime" example:"Hourly"                               description:"Payment frequency"`
	InitialDepositFee              *int64     `json:"initial_deposit_fee,omitempty"               validate:"omitempty"                                                                  example:"1000"                                 description:"Initial deposit fee"`
	InitialDepositPaymentMethod    *string    `json:"initial_deposit_payment_method,omitempty"    validate:"omitempty,oneof=ONLINE CASH EXTERNAL"                                       example:"ONLINE"                               description:"Initial deposit payment method"`
	InitialDepositReferenceNumber  *string    `json:"initial_deposit_reference_number,omitempty"  validate:"omitempty"                                                                  example:"123456789"                            description:"Initial deposit reference number"`
	InitialDepositPaidAt           *time.Time `json:"initial_deposit_paid_at,omitempty"           validate:"omitempty"                                                                  example:"2023-01-01T00:00:00Z"                 description:"Initial deposit paid at"`
	InitialDepositPaymentId        *string    `json:"initial_deposit_payment_id,omitempty"        validate:"omitempty"                                                                  example:"123456789"                            description:"Initial deposit payment ID"`
	SecurityDepositFee             *int64     `json:"security_deposit_fee,omitempty"              validate:"omitempty"                                                                  example:"1000"                                 description:"Security deposit fee"`
	SecurityDepositFeeCurrency     *string    `json:"security_deposit_fee_currency,omitempty"     validate:"omitempty"                                                                  example:"GHS"                                  description:"Security deposit fee currency"`
	SecurityDepositPaymentMethod   *string    `json:"security_deposit_payment_method,omitempty"   validate:"omitempty,oneof=ONLINE CASH EXTERNAL"                                       example:"ONLINE"                               description:"Security deposit payment method"`
	SecurityDepositReferenceNumber *string    `json:"security_deposit_reference_number,omitempty" validate:"omitempty"                                                                  example:"123456789"                            description:"Security deposit reference number"`
	SecurityDepositPaidAt          *time.Time `json:"security_deposit_paid_at,omitempty"          validate:"omitempty"                                                                  example:"2023-01-01T00:00:00Z"                 description:"Security deposit paid at"`
	SecurityDepositPaymentId       *string    `json:"security_deposit_payment_id,omitempty"       validate:"omitempty"                                                                  example:"123456789"                            description:"Security deposit payment ID"`
	OtherNames                     *string    `json:"other_names,omitempty"                       validate:"omitempty"                                                                  example:"Michael"                              description:"Other names of the applicant"`
	Email                          *string    `json:"email,omitempty"                             validate:"omitempty,email"                                                            example:"john.doe@example.com"                 description:"Email address of the applicant"`
	ProfilePhotoUrl                *string    `json:"profile_photo_url,omitempty"                 validate:"omitempty,url"                                                              example:"https://example.com/photo.jpg"        description:"Profile photo URL"`
	IDFrontUrl                     *string    `json:"id_front_url,omitempty"                      validate:"omitempty,url"                                                              example:"https://example.com/id-front.jpg"     description:"ID front image URL"`
	IDBackUrl                      *string    `json:"id_back_url,omitempty"                       validate:"omitempty,url"                                                              example:"https://example.com/id-back.jpg"      description:"ID back image URL"`
	PreviousLandlordName           *string    `json:"previous_landlord_name,omitempty"            validate:"omitempty"                                                                  example:"Mr. Smith"                            description:"Previous landlord name"`
	PreviousLandlordPhone          *string    `json:"previous_landlord_phone,omitempty"           validate:"omitempty,e164"                                                             example:"+233281234570"                        description:"Previous landlord phone"`
	PreviousTenancyPeriod          *string    `json:"previous_tenancy_period,omitempty"           validate:"omitempty"                                                                  example:"2020-2022"                            description:"Previous tenancy period"`
	ProofOfIncomeUrl               *string    `json:"proof_of_income_url,omitempty"               validate:"omitempty,url"                                                              example:"https://example.com/income.pdf"       description:"Proof of income URL"`
}

// UpdateTenantApplication godoc
//
//	@Summary		Update a tenant application
//	@Description	Update a tenant application
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			tenant_application_id	path		string													true	"Tenant application ID"
//	@Param			body					body		UpdateTenantApplicationRequest							true	"Update Tenant Application Request Body"
//	@Success		200						{object}	object{data=transformations.OutputTenantApplication}	"Tenant application updated successfully"
//	@Failure		400						{object}	lib.HTTPError											"Error occurred when updating a tenant application"
//	@Failure		401						{object}	string													"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError											"Tenant application not found"
//	@Failure		422						{object}	lib.HTTPError											"Validation error"
//	@Failure		500						{object}	string													"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/{tenant_application_id} [patch]
func (h *TenantApplicationHandler) UpdateTenantApplication(w http.ResponseWriter, r *http.Request) {
	tenantApplicationID := chi.URLParam(r, "tenant_application_id")

	var body UpdateTenantApplicationRequest

	decodeErr := json.NewDecoder(r.Body).Decode(&body)
	if decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
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
		DesiredMoveInDate:              body.DesiredMoveInDate,
		StayDurationFrequency:          body.StayDurationFrequency,
		StayDuration:                   body.StayDuration,
		PaymentFrequency:               body.PaymentFrequency,
		InitialDepositFee:              body.InitialDepositFee,
		InitialDepositPaymentMethod:    body.InitialDepositPaymentMethod,
		InitialDepositReferenceNumber:  body.InitialDepositReferenceNumber,
		InitialDepositPaidAt:           body.InitialDepositPaidAt,
		InitialDepositPaymentId:        body.InitialDepositPaymentId,
		SecurityDepositFee:             body.SecurityDepositFee,
		SecurityDepositFeeCurrency:     body.SecurityDepositFeeCurrency,
		SecurityDepositPaymentMethod:   body.SecurityDepositPaymentMethod,
		SecurityDepositReferenceNumber: body.SecurityDepositReferenceNumber,
		SecurityDepositPaidAt:          body.SecurityDepositPaidAt,
		SecurityDepositPaymentId:       body.SecurityDepositPaymentId,
		OtherNames:                     body.OtherNames,
		Email:                          body.Email,
		ProfilePhotoUrl:                body.ProfilePhotoUrl,
		IDFrontUrl:                     body.IDFrontUrl,
		IDBackUrl:                      body.IDBackUrl,
		PreviousLandlordName:           body.PreviousLandlordName,
		PreviousLandlordPhone:          body.PreviousLandlordPhone,
		PreviousTenancyPeriod:          body.PreviousTenancyPeriod,
		ProofOfIncomeUrl:               body.ProofOfIncomeUrl,
	}

	tenantApplication, updateTenantApplicationErr := h.service.UpdateTenantApplication(r.Context(), input)
	if updateTenantApplicationErr != nil {
		HandleErrorResponse(w, updateTenantApplicationErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBTenantApplicationToRest(tenantApplication),
	})
}

// DeleteTenantApplication godoc
//
//	@Summary		Delete a tenant application
//	@Description	Delete a tenant application. Only applications with status 'TenantApplication.Status.Cancelled' can be deleted.
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			tenant_application_id	path	string	true	"Tenant application ID"
//	@Success		204						"Tenant application deleted successfully"
//	@Failure		400						{object}	lib.HTTPError	"Error occurred when deleting a tenant application or application is not cancelled"
//	@Failure		401						{object}	string			"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError	"Tenant application not found"
//	@Failure		500						{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/{tenant_application_id} [delete]
func (h *TenantApplicationHandler) DeleteTenantApplication(w http.ResponseWriter, r *http.Request) {
	tenantApplicationID := chi.URLParam(r, "tenant_application_id")

	deleteTenantApplicationErr := h.service.DeleteTenantApplication(r.Context(), tenantApplicationID)
	if deleteTenantApplicationErr != nil {
		HandleErrorResponse(w, deleteTenantApplicationErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
