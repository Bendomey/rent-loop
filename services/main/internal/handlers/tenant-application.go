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

// TenantApplication.Status.InProgress, TenantApplication.Status.Cancelled, TenantApplication.Status.Completed
type CreateTenantApplicationRequest struct {
	DesiredUnitId                  string    `json:"desired_unit_id"                   validate:"required,uuid"                                                 example:"b4d0243c-6581-4104-8185-d83a45ebe41b"    description:"Desired unit ID"`
	FirstName                      string    `json:"first_name"                        validate:"required"                                                      example:"John"                                    description:"First name of the applicant"`
	OtherNames                     *string   `json:"other_names,omitempty"             validate:"omitempty"                                                     example:"Michael"                                 description:"Other names of the applicant"`
	LastName                       string    `json:"last_name"                         validate:"required"                                                      example:"Doe"                                     description:"Last name of the applicant"`
	Email                          *string   `json:"email,omitempty"                   validate:"omitempty,email"                                               example:"john.doe@example.com"                    description:"Email address of the applicant"`
	Phone                          string    `json:"phone"                             validate:"required,e164"                                                 example:"+233281234569"                           description:"Phone number of the applicant"`
	Gender                         string    `json:"gender"                            validate:"required,oneof=MALE FEMALE"                                    example:"MALE"                                    description:"Gender of the applicant"`
	DateOfBirth                    time.Time `json:"date_of_birth"                     validate:"required"                                                      example:"1990-01-01T00:00:00Z"                    description:"Date of birth of the applicant"`
	Nationality                    string    `json:"nationality"                       validate:"required"                                                      example:"Ghanaian"                                description:"Nationality of the applicant"`
	MaritalStatus                  string    `json:"marital_status"                    validate:"required,oneof=SINGLE MARRIED DIVORCED WIDOWED"                example:"SINGLE"                                  description:"Marital status of the applicant"`
	IDType                         string    `json:"id_type"                           validate:"required,oneof=GHANA_CARD NATIONAL_ID PASSPORT DRIVER_LICENSE" example:"GHANA_CARD"                              description:"ID type of the applicant"`
	IDNumber                       string    `json:"id_number"                         validate:"required"                                                      example:"GHA-123456789"                           description:"ID number of the applicant"`
	IDFrontUrl                     *string   `json:"id_front_url,omitempty"            validate:"omitempty,url"                                                 example:"https://example.com/id_front.jpg"        description:"ID front image URL"`
	IDBackUrl                      *string   `json:"id_back_url,omitempty"             validate:"omitempty,url"                                                 example:"https://example.com/id_back.jpg"         description:"ID back image URL"`
	CurrentAddress                 string    `json:"current_address"                   validate:"required"                                                      example:"123 Main St, Accra"                      description:"Current address of the applicant"`
	EmergencyContactName           string    `json:"emergency_contact_name"            validate:"required"                                                      example:"Jane Doe"                                description:"Emergency contact name"`
	EmergencyContactPhone          string    `json:"emergency_contact_phone"           validate:"required,e164"                                                 example:"+233281434579"                           description:"Emergency contact phone"`
	RelationshipToEmergencyContact string    `json:"relationship_to_emergency_contact" validate:"required"                                                      example:"Sister"                                  description:"Relationship to emergency contact"`
	Occupation                     string    `json:"occupation"                        validate:"required"                                                      example:"Software Engineer"                       description:"Occupation of the applicant"`
	Employer                       string    `json:"employer"                          validate:"required"                                                      example:"Acme Corp"                               description:"Employer of the applicant"`
	EmployerType                   string    `json:"employer_type"                     validate:"required,oneof=WORKER STUDENT"                                 example:"WORKER"                                  description:"Employer type of the applicant"`
	ProofOfIncomeUrl               *string   `json:"proof_of_income_url,omitempty"     validate:"omitempty,url"                                                 example:"https://example.com/proof_of_income.jpg" description:"Proof of income URL"`
	OccupationAddress              string    `json:"occupation_address"                validate:"required"                                                      example:"456 Tech Ave, Accra"                     description:"Occupation address"`
	ProfilePhotoUrl                *string   `json:"profile_photo_url,omitempty"       validate:"omitempty,url"                                                 example:"https://example.com/photo.jpg"           description:"Profile photo URL"`
	CreatedById                    string    `json:"created_by_id"                     validate:"required,uuid"                                                 example:"72432ce6-5620-4ecf-a862-4bf2140556a1"    description:"ID of the user who created the tenant application"`
}

// CreateTenantApplication godoc
//
//	@Summary		Create a new tenant application
//	@Description	Create a new tenant application
//	@Tags			TenantApplication
//	@Accept			json
//	@Produce		json
//	@Param			body	body		CreateTenantApplicationRequest								true	"Create Tenant Application Request Body"
//	@Success		201		{object}	object{data=transformations.OutputAdminTenantApplication}	"Tenant application created successfully"
//	@Failure		400		{object}	lib.HTTPError												"Error occurred when creating a tenant application"
//	@Failure		422		{object}	lib.HTTPError												"Validation error"
//	@Failure		500		{object}	string														"An unexpected error occurred"
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

	tenantApplicationTransformed, transformErr := transformations.DBAdminTenantApplicationToRest(
		h.services,
		tenantApplication,
	)
	if transformErr != nil {
		HandleErrorResponse(w, transformErr)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": tenantApplicationTransformed,
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
	StayDurationFrequency        *string   `json:"stay_duration_frequency,omitempty"         validate:"omitempty,oneof=HOURS DAYS MONTHS"`
	PaymentFrequency             *string   `json:"payment_frequency,omitempty"               validate:"omitempty,oneof=HOURLY DAILY MONTHLY QUARTERLY BIANNUALLY ANNUALLY ONETIME"`
	InitialDepositPaymentMethod  *string   `json:"initial_deposit_payment_method,omitempty"  validate:"omitempty,oneof=ONLINE CASH EXTERNAL"`
	SecurityDepositPaymentMethod *string   `json:"security_deposit_payment_method,omitempty" validate:"omitempty,oneof=ONLINE CASH EXTERNAL"`
	Gender                       *string   `json:"gender,omitempty"                          validate:"omitempty,oneof=MALE FEMALE"`
	MaritalStatus                *string   `json:"marital_status,omitempty"                  validate:"omitempty,oneof=SINGLE MARRIED DIVORCED WIDOWED"`
	CreatedById                  *string   `json:"created_by_id,omitempty"                   validate:"omitempty,uuid"                                                                                                            example:"72432ce6-5620-4ecf-a862-4bf2140556a1"   description:"ID of the user who created the tenant application"`
	DesiredUnitId                *string   `json:"desired_unit_id,omitempty"                 validate:"omitempty,uuid"                                                                                                            example:"72432ce6-5620-4ecf-a862-4bf2140556a1"   description:"ID of the unit that the tenant application is desired for"`
	PropertyId                   *string   `json:"property_id,omitempty"                     validate:"omitempty,uuid"                                                                                                            example:"72432ce6-5620-4ecf-a862-4bf2140556a1"   description:"ID of the property to filter tenant applications by"`
	Email                        *[]string `json:"email,omitempty"                           validate:"omitempty,dive,email"                                                                                                      example:"john.doe@example.com,email@example.com" description:"Email address of the applicant"                            collectionFormat:"multi"`
	Phone                        *[]string `json:"phone,omitempty"                           validate:"omitempty,dive,e164"                                                                                                       example:"+233281234569,+233281234569"            description:"Phone number of the applicant"                             collectionFormat:"multi"`
	IDs                          []string  `json:"ids"                                       validate:"omitempty,dive,uuid4"                                                                                                      example:"a8098c1a-f86e-11da-bd1a-00112444be1e"   description:"List of tenant application IDs to filter by"               collectionFormat:"multi"`
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
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputAdminTenantApplication,meta=lib.HTTPReturnPaginatedMetaResponse}}
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
		IDs:                          lib.NullOrStringArray(r.URL.Query()["ids"]),
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
		tenantApplicationTransformed, transformErr := transformations.DBAdminTenantApplicationToRest(
			h.services,
			&tenantApplication,
		)

		if transformErr != nil {
			HandleErrorResponse(w, transformErr)
			return
		}

		tenantApplicationsTransformed = append(
			tenantApplicationsTransformed,
			tenantApplicationTransformed,
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
//	@Param			tenant_application_id	path		string														true	"Tenant application ID"
//	@Param			q						query		GetTenantApplicationQuery									true	"Tenant application"
//	@Success		200						{object}	object{data=transformations.OutputAdminTenantApplication}	"Tenant application retrieved successfully"
//	@Failure		400						{object}	lib.HTTPError												"Error occurred when fetching a tenant application"
//	@Failure		401						{object}	string														"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError												"Tenant application not found"
//	@Failure		500						{object}	string														"An unexpected error occurred"
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

	tenantApplicationTransformed, transformErr := transformations.DBAdminTenantApplicationToRest(
		h.services,
		tenantApplication,
	)
	if transformErr != nil {
		HandleErrorResponse(w, transformErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": tenantApplicationTransformed,
	})
}

type UpdateTenantApplicationRequest struct {
	DesiredUnitId                  *string                 `json:"desired_unit_id,omitempty"                   validate:"omitempty,uuid"                                                 example:"b4d0243c-6581-4104-8185-d83a45ebe41b" description:"Desired unit ID"`
	RentFee                        *int64                  `json:"rent_fee,omitempty"                          validate:"omitempty"                                                      example:"1000"                                 description:"Rent fee of the applicant"`
	RentFeeCurrency                *string                 `json:"rent_fee_currency,omitempty"                 validate:"omitempty"                                                      example:"GHS"                                  description:"Rent fee currency of the applicant"`
	FirstName                      *string                 `json:"first_name,omitempty"                        validate:"omitempty"                                                      example:"John"                                 description:"First name of the applicant"`
	LastName                       *string                 `json:"last_name,omitempty"                         validate:"omitempty"                                                      example:"Doe"                                  description:"Last name of the applicant"`
	Phone                          *string                 `json:"phone,omitempty"                             validate:"omitempty,e164"                                                 example:"+233281234569"                        description:"Phone number of the applicant"`
	Gender                         *string                 `json:"gender,omitempty"                            validate:"omitempty,oneof=MALE FEMALE"                                    example:"MALE"                                 description:"Gender of the applicant"`
	DateOfBirth                    *time.Time              `json:"date_of_birth,omitempty"                     validate:"omitempty"                                                      example:"1990-01-01T00:00:00Z"                 description:"Date of birth of the applicant"`
	Nationality                    *string                 `json:"nationality,omitempty"                       validate:"omitempty"                                                      example:"Ghanaian"                             description:"Nationality of the applicant"`
	MaritalStatus                  *string                 `json:"marital_status,omitempty"                    validate:"omitempty,oneof=SINGLE MARRIED DIVORCED WIDOWED"                example:"SINGLE"                               description:"Marital status of the applicant"`
	IDNumber                       *string                 `json:"id_number,omitempty"                         validate:"omitempty"                                                      example:"GHA-123456789"                        description:"ID number of the applicant"`
	CurrentAddress                 *string                 `json:"current_address,omitempty"                   validate:"omitempty"                                                      example:"123 Main St, Accra"                   description:"Current address of the applicant"`
	EmergencyContactName           *string                 `json:"emergency_contact_name,omitempty"            validate:"omitempty"                                                      example:"Jane Doe"                             description:"Emergency contact name"`
	EmergencyContactPhone          *string                 `json:"emergency_contact_phone,omitempty"           validate:"omitempty,e164"                                                 example:"+233281434579"                        description:"Emergency contact phone"`
	RelationshipToEmergencyContact *string                 `json:"relationship_to_emergency_contact,omitempty" validate:"omitempty"                                                      example:"Sister"                               description:"Relationship to emergency contact"`
	Occupation                     *string                 `json:"occupation,omitempty"                        validate:"omitempty"                                                      example:"Software Engineer"                    description:"Occupation of the applicant"`
	Employer                       *string                 `json:"employer,omitempty"                          validate:"omitempty"                                                      example:"Acme Corp"                            description:"Employer of the applicant"`
	EmployerType                   lib.Optional[string]    `json:"employer_type,omitempty"                     validate:"omitempty,oneof=WORKER STUDENT"                                 example:"WORKER"                               description:"Employer type of the applicant"     swaggertype:"string"`
	OccupationAddress              *string                 `json:"occupation_address,omitempty"                validate:"omitempty"                                                      example:"456 Tech Ave, Accra"                  description:"Occupation address"`
	DesiredMoveInDate              lib.Optional[time.Time] `json:"desired_move_in_date,omitempty"              validate:"omitempty"                                                                                                     description:"Desired move in date"               swaggertype:"string"`
	StayDurationFrequency          lib.Optional[string]    `json:"stay_duration_frequency,omitempty"           validate:"omitempty"                                                                                                     description:"Stay duration frequency"            swaggertype:"string"`
	StayDuration                   lib.Optional[int64]     `json:"stay_duration,omitempty"                     validate:"omitempty"                                                                                                     description:"Stay duration"                      swaggertype:"integer"`
	PaymentFrequency               lib.Optional[string]    `json:"payment_frequency,omitempty"                 validate:"omitempty"                                                                                                     description:"Payment frequency"                  swaggertype:"string"`
	InitialDepositFee              lib.Optional[int64]     `json:"initial_deposit_fee,omitempty"               validate:"omitempty"                                                                                                     description:"Initial deposit fee"                swaggertype:"integer"`
	InitialDepositPaymentMethod    *string                 `json:"initial_deposit_payment_method,omitempty"    validate:"omitempty,oneof=ONLINE CASH EXTERNAL"                           example:"ONLINE"                               description:"Initial deposit payment method"`
	InitialDepositReferenceNumber  *string                 `json:"initial_deposit_reference_number,omitempty"  validate:"omitempty"                                                      example:"123456789"                            description:"Initial deposit reference number"`
	InitialDepositPaidAt           *time.Time              `json:"initial_deposit_paid_at,omitempty"           validate:"omitempty"                                                      example:"2023-01-01T00:00:00Z"                 description:"Initial deposit paid at"`
	SecurityDepositFee             lib.Optional[int64]     `json:"security_deposit_fee,omitempty"              validate:"omitempty"                                                                                                     description:"Security deposit fee"               swaggertype:"integer"`
	SecurityDepositFeeCurrency     *string                 `json:"security_deposit_fee_currency,omitempty"     validate:"omitempty"                                                      example:"GHS"                                  description:"Security deposit fee currency"`
	SecurityDepositPaymentMethod   *string                 `json:"security_deposit_payment_method,omitempty"   validate:"omitempty,oneof=ONLINE CASH EXTERNAL"                           example:"ONLINE"                               description:"Security deposit payment method"`
	SecurityDepositReferenceNumber *string                 `json:"security_deposit_reference_number,omitempty" validate:"omitempty"                                                      example:"123456789"                            description:"Security deposit reference number"`
	SecurityDepositPaidAt          *time.Time              `json:"security_deposit_paid_at,omitempty"          validate:"omitempty"                                                      example:"2023-01-01T00:00:00Z"                 description:"Security deposit paid at"`
	OtherNames                     lib.Optional[string]    `json:"other_names,omitempty"                       validate:"omitempty"                                                                                                     description:"Other names of the applicant"       swaggertype:"string"`
	Email                          lib.Optional[string]    `json:"email,omitempty"                             validate:"omitempty"                                                                                                     description:"Email address of the applicant"     swaggertype:"string"`
	ProfilePhotoUrl                lib.Optional[string]    `json:"profile_photo_url,omitempty"                 validate:"omitempty"                                                                                                     description:"Profile photo URL"                  swaggertype:"string"`
	IDType                         *string                 `json:"id_type,omitempty"                           validate:"omitempty,oneof=GHANA_CARD NATIONAL_ID PASSPORT DRIVER_LICENSE" example:"GHANA_CARD"                           description:"ID type of the applicant"`
	IDFrontUrl                     lib.Optional[string]    `json:"id_front_url,omitempty"                      validate:"omitempty"                                                                                                     description:"ID front image URL"                 swaggertype:"string"`
	IDBackUrl                      lib.Optional[string]    `json:"id_back_url,omitempty"                       validate:"omitempty"                                                                                                     description:"ID back image URL"                  swaggertype:"string"`
	PreviousLandlordName           lib.Optional[string]    `json:"previous_landlord_name,omitempty"            validate:"omitempty"                                                                                                     description:"Previous landlord name"             swaggertype:"string"`
	PreviousLandlordPhone          lib.Optional[string]    `json:"previous_landlord_phone,omitempty"           validate:"omitempty"                                                                                                     description:"Previous landlord phone"            swaggertype:"string"`
	PreviousTenancyPeriod          lib.Optional[string]    `json:"previous_tenancy_period,omitempty"           validate:"omitempty"                                                                                                     description:"Previous tenancy period"            swaggertype:"string"`
	ProofOfIncomeUrl               lib.Optional[string]    `json:"proof_of_income_url,omitempty"               validate:"omitempty"                                                                                                     description:"Proof of income URL"                swaggertype:"string"`
	LeaseAgreementDocumentMode     lib.Optional[string]    `json:"lease_agreement_document_mode,omitempty"     validate:"omitempty"                                                                                                     description:"Lease agreement document mode"      swaggertype:"string"`
	LeaseAgreementDocumentUrl      lib.Optional[string]    `json:"lease_agreement_document_url,omitempty"      validate:"omitempty"                                                                                                     description:"Lease agreement document URL"       swaggertype:"string"`
	LeaseAgreementDocumentID       lib.Optional[string]    `json:"lease_agreement_document_id,omitempty"       validate:"omitempty"                                                                                                     description:"Lease agreement document ID"        swaggertype:"string"`
	LeaseAgreementDocumentStatus   lib.Optional[string]    `json:"lease_agreement_document_status,omitempty"   validate:"omitempty"                                                                                                     description:"Lease agreement document status"    swaggertype:"string"`
}

// UpdateTenantApplication godoc
//
//	@Summary		Update a tenant application
//	@Description	Update a tenant application
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			tenant_application_id	path		string														true	"Tenant application ID"
//	@Param			body					body		UpdateTenantApplicationRequest								true	"Update Tenant Application Request Body"
//	@Success		200						{object}	object{data=transformations.OutputAdminTenantApplication}	"Tenant application updated successfully"
//	@Failure		400						{object}	lib.HTTPError												"Error occurred when updating a tenant application"
//	@Failure		401						{object}	string														"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError												"Tenant application not found"
//	@Failure		422						{object}	lib.HTTPError												"Validation error"
//	@Failure		500						{object}	string														"An unexpected error occurred"
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
		EmployerType:                   body.EmployerType,
		OccupationAddress:              body.OccupationAddress,
		DesiredMoveInDate:              body.DesiredMoveInDate,
		StayDurationFrequency:          body.StayDurationFrequency,
		StayDuration:                   body.StayDuration,
		PaymentFrequency:               body.PaymentFrequency,
		InitialDepositFee:              body.InitialDepositFee,
		InitialDepositPaymentMethod:    body.InitialDepositPaymentMethod,
		InitialDepositReferenceNumber:  body.InitialDepositReferenceNumber,
		InitialDepositPaidAt:           body.InitialDepositPaidAt,
		SecurityDepositFee:             body.SecurityDepositFee,
		SecurityDepositFeeCurrency:     body.SecurityDepositFeeCurrency,
		SecurityDepositPaymentMethod:   body.SecurityDepositPaymentMethod,
		SecurityDepositReferenceNumber: body.SecurityDepositReferenceNumber,
		SecurityDepositPaidAt:          body.SecurityDepositPaidAt,
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

	tenantApplicationTransformed, transformErr := transformations.DBAdminTenantApplicationToRest(
		h.services,
		tenantApplication,
	)
	if transformErr != nil {
		HandleErrorResponse(w, transformErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": tenantApplicationTransformed,
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

type CancelTenantApplicationRequest struct {
	Reason string `json:"reason" validate:"required,min=1" example:"Tenant application cancelled due to incomplete application"`
}

// CancelTenantApplication godoc
//
//	@Summary		Cancel a tenant application
//	@Description	Cancel a tenant application
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			tenant_application_id	path	string							true	"Tenant application ID"
//	@Param			body					body	CancelTenantApplicationRequest	true	"Cancel Tenant Application Request Body"
//	@Success		204						"Tenant application cancelled successfully"
//	@Failure		400						{object}	lib.HTTPError	"Error occurred when cancelling a tenant application"
//	@Failure		401						{object}	string			"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError	"Tenant application not found"
//	@Failure		422						{object}	lib.HTTPError	"Validation error"
//	@Failure		500						{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/{tenant_application_id}/cancel [patch]
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
//	@Summary		Approve a tenant application
//	@Description	Approve a tenant application
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			tenant_application_id	path	string	true	"Tenant application ID"
//	@Success		204						"Tenant application approved successfully"
//	@Failure		400						{object}	lib.HTTPError	"Error occurred when approving a tenant application"
//	@Failure		401						{object}	string			"Invalid or absent authentication token"
//	@Failure		403						{object}	lib.HTTPError	"Tenant application not approved"
//	@Failure		404						{object}	lib.HTTPError	"Tenant application not found"
//	@Failure		409						{object}	lib.HTTPError	"Tenant application already approved"
//	@Failure		422						{object}	lib.HTTPError	"Validation error"
//	@Failure		500						{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/{tenant_application_id}/approve [patch]
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
//	@Summary		Generate an invoice for a tenant application
//	@Description	Generate an invoice for a tenant application (security deposit and/or initial deposit)
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			tenant_application_id	path		string										true	"Tenant application ID"
//	@Param			body					body		GenerateInvoiceRequest						false	"Generate Invoice Request Body"
//	@Success		201						{object}	object{data=transformations.OutputInvoice}	"Invoice generated successfully"
//	@Failure		400						{object}	lib.HTTPError								"Error occurred when generating invoice"
//	@Failure		401						{object}	string										"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError								"Tenant application not found"
//	@Failure		422						{object}	lib.HTTPError								"Validation error"
//	@Failure		500						{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/{tenant_application_id}/invoice:generate [post]
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

	transformed, transformErr := transformations.DBInvoiceToRest(h.services, invoice)
	if transformErr != nil {
		HandleErrorResponse(w, transformErr)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformed,
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
//	@Summary		Pay an invoice for a tenant application
//	@Description	Pay an invoice for a tenant application (security deposit and/or initial deposit)
//	@Tags			TenantApplication
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			tenant_application_id	path	string	true	"Tenant application ID"
//	@Param			invoice_id				path	string	true	"Invoice ID"
//	@Success		204						"Invoice paid successfully"
//	@Failure		400						{object}	lib.HTTPError	"Error occurred when paying invoice"
//	@Failure		401						{object}	string			"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError	"Tenant application or invoice not found"
//	@Failure		422						{object}	lib.HTTPError	"Validation error"
//	@Failure		500						{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/tenant-applications/{tenant_application_id}/invoice/{invoice_id}/pay [post]
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
