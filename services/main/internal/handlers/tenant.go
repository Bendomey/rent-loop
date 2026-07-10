package handlers

import (
	"encoding/json"
	"net/http"
	"net/url"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type TenantHandler struct {
	appCtx  pkg.AppContext
	service services.TenantService
}

func NewTenantHandler(appCtx pkg.AppContext, service services.TenantService) TenantHandler {
	return TenantHandler{appCtx, service}
}

// GetTenantByPhone godoc
//
//	@Summary		Get tenant by phone
//	@Description	Get tenant by phone
//	@Tags			Tenants
//	@Accept			json
//	@Produce		json
//	@Param			phone	path		string	true	"Phone"
//	@Success		200		{object}	object{data=transformations.OutputTenant}
//	@Failure		400		{object}	lib.HTTPError	"Error occurred when fetching a tenant"
//	@Failure		422		{object}	lib.HTTPError	"Invalid phone number"
//	@Failure		404		{object}	lib.HTTPError	"Tenant not found"
//	@Failure		500		{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/tenants/phone/{phone} [get]
func (h *TenantHandler) GetTenantByPhone(w http.ResponseWriter, r *http.Request) {
	rawPhone := chi.URLParam(r, "phone")
	phone, err := url.PathUnescape(rawPhone)
	if err != nil {
		http.Error(w, "Invalid phone number", http.StatusUnprocessableEntity)
		return
	}

	tenant, getTenantErr := h.service.GetTenantByPhone(r.Context(), phone)
	if getTenantErr != nil {
		HandleErrorResponse(w, getTenantErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBTenantToRest(tenant),
	})
}

type GetTenantQuery struct {
	lib.GetOneQueryInput
}

// GetTenantByID godoc
//
//	@Summary		Get tenant by ID (Admin)
//	@Description	Get tenant by ID, scoped to the property (returns 404 if the tenant has no lease/booking in this property). Includes the tenant's most relevant lease (recent_lease) and booking (recent_booking) for this property.
//	@Tags			Tenants
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string											true	"Property ID"
//	@Param			tenant_id	path		string											true	"Tenant ID"
//	@Param			q			query		GetTenantQuery									true	"Tenant"
//	@Success		200			{object}	object{data=transformations.OutputAdminTenant}	"Tenant retrieved successfully"
//	@Failure		401			{object}	string											"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError									"Tenant not found"
//	@Failure		500			{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/tenants/{tenant_id} [get]
func (h *TenantHandler) GetTenantByID(w http.ResponseWriter, r *http.Request) {
	tenantID := chi.URLParam(r, "tenant_id")
	propertyID := chi.URLParam(r, "property_id")
	populateFields := GetPopulateFields(r)

	tenant, err := h.service.GetTenantByIDForProperty(r.Context(), repository.GetTenantByPropertyQuery{
		ID:         tenantID,
		PropertyID: propertyID,
		Populate:   populateFields,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminTenantToRestWithRecentActivity(tenant),
	})
}

type ListTenantsByPropertyQuery struct {
	lib.FilterQueryInput
	Status *string `json:"status,omitempty" validate:"omitempty,oneof=ACTIVE EXPIRED" example:"ACTIVE" description:"Tenant lease status in the property: ACTIVE (has at least one active lease) or EXPIRED (has no active leases but has past leases)"`
}

// ListTenantsByProperty godoc
//
//	@Summary		List tenants by property (Admin)
//	@Description	List unique tenants for a property with optional status filtering. status=ACTIVE means tenant has at least one active lease; status=EXPIRED means tenant has no active leases but has terminated/completed/cancelled leases. Each tenant includes its most relevant lease (recent_lease) and booking (recent_booking) for this property.
//	@Tags			Tenants
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string						true	"Property ID"
//	@Param			q			query		ListTenantsByPropertyQuery	true	"Filter options"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputAdminTenant,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400			{object}	lib.HTTPError	"An error occurred while filtering tenants"
//	@Failure		401			{object}	string			"Absent or invalid authentication token"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/tenants [get]
func (h *TenantHandler) ListTenantsByProperty(w http.ResponseWriter, r *http.Request) {
	filterQuery, filterQueryErr := lib.GenerateQuery(r.URL.Query())
	if filterQueryErr != nil {
		HandleErrorResponse(w, filterQueryErr)
		return
	}

	isFilterQueryPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFilterQueryPassedValidation {
		return
	}

	propertyID := chi.URLParam(r, "property_id")
	propertyIDs := []string{propertyID}

	input := repository.ListTenantsByPropertyFilter{
		FilterQuery: *filterQuery,
		PropertyIDs: &propertyIDs,
		Status:      lib.NullOrString(r.URL.Query().Get("status")),
	}

	tenants, tenantsErr := h.service.ListTenantsByProperty(r.Context(), input)
	if tenantsErr != nil {
		HandleErrorResponse(w, tenantsErr)
		return
	}

	tenantsCount, tenantsCountErr := h.service.CountTenantsByProperty(r.Context(), input)
	if tenantsCountErr != nil {
		HandleErrorResponse(w, tenantsCountErr)
		return
	}

	tenantsTransformed := make([]any, 0)
	for _, tenant := range *tenants {
		tenantsTransformed = append(
			tenantsTransformed,
			transformations.DBAdminTenantToRestWithRecentActivity(&tenant),
		)
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, tenantsTransformed, tenantsCount))
}

// ListTenantsAcrossProperties godoc
//
//	@Summary		List tenants across properties (Admin, mobile)
//	@Description	List unique tenants across every property the caller has access to, optionally narrowed with one or more property_id query values. status=ACTIVE means tenant has at least one active lease; status=EXPIRED means tenant has no active leases but has past leases.
//	@Tags			Tenants
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	query		[]string					false	"Property ID(s) to narrow results to; omit to see every property the caller can access"	collectionFormat(multi)
//	@Param			q			query		ListTenantsByPropertyQuery	true	"Filter options"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputAdminTenant,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400			{object}	lib.HTTPError	"An error occurred while filtering tenants"
//	@Failure		401			{object}	string			"Absent or invalid authentication token"
//	@Failure		403			{object}	string			"Requested property_id is outside the caller's access scope"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/tenants [get]
func (h *TenantHandler) ListTenantsAcrossProperties(w http.ResponseWriter, r *http.Request) {
	filterQuery, filterQueryErr := lib.GenerateQuery(r.URL.Query())
	if filterQueryErr != nil {
		HandleErrorResponse(w, filterQueryErr)
		return
	}

	isFilterQueryPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFilterQueryPassedValidation {
		return
	}

	propertyIDs, unrestrictedClientID, scopeOk := ResolvePropertyScopeFilter(w, r, h.appCtx)
	if !scopeOk {
		return
	}

	input := repository.ListTenantsByPropertyFilter{
		FilterQuery: *filterQuery,
		PropertyIDs: propertyIDs,
		ClientID:    unrestrictedClientID,
		Status:      lib.NullOrString(r.URL.Query().Get("status")),
	}

	tenants, tenantsErr := h.service.ListTenantsByProperty(r.Context(), input)
	if tenantsErr != nil {
		HandleErrorResponse(w, tenantsErr)
		return
	}

	tenantsCount, tenantsCountErr := h.service.CountTenantsByProperty(r.Context(), input)
	if tenantsCountErr != nil {
		HandleErrorResponse(w, tenantsCountErr)
		return
	}

	tenantsTransformed := make([]any, 0)
	for _, tenant := range *tenants {
		tenantsTransformed = append(
			tenantsTransformed,
			transformations.DBAdminTenantToRestWithRecentActivity(&tenant),
		)
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, tenantsTransformed, tenantsCount))
}

type UpdateTenantRequest struct {
	FirstName *string `json:"first_name" validate:"omitempty,min=1"             example:"John"`
	LastName  *string `json:"last_name"  validate:"omitempty,min=1"             example:"Doe"`
	Gender    *string `json:"gender"     validate:"omitempty,oneof=MALE FEMALE" example:"MALE"`

	OtherNames                     lib.Optional[string]    `json:"other_names"                       swaggertype:"string" example:"Michael"`
	Email                          lib.Optional[string]    `json:"email"                             swaggertype:"string" example:"john.doe@example.com"`
	DateOfBirth                    lib.Optional[time.Time] `json:"date_of_birth"                     swaggertype:"string" example:"1990-01-01"`
	Nationality                    lib.Optional[string]    `json:"nationality"                       swaggertype:"string" example:"Ghanaian"`
	MaritalStatus                  lib.Optional[string]    `json:"marital_status"                    swaggertype:"string" example:"SINGLE"                           validate:"omitempty,oneof=SINGLE MARRIED DIVORCED WIDOWED"`
	ProfilePhotoUrl                lib.Optional[string]    `json:"profile_photo_url"                 swaggertype:"string" example:"https://example.com/photo.jpg"    validate:"omitempty,url"`
	IDType                         lib.Optional[string]    `json:"id_type"                           swaggertype:"string" example:"GHANA_CARD"                       validate:"omitempty,oneof=GHANA_CARD NATIONAL_ID PASSPORT DRIVER_LICENSE"`
	IDNumber                       lib.Optional[string]    `json:"id_number"                         swaggertype:"string" example:"ID123456"`
	IDFrontUrl                     lib.Optional[string]    `json:"id_front_url"                      swaggertype:"string" example:"https://example.com/id-front.jpg" validate:"omitempty,url"`
	IDBackUrl                      lib.Optional[string]    `json:"id_back_url"                       swaggertype:"string" example:"https://example.com/id-back.jpg"  validate:"omitempty,url"`
	EmergencyContactName           lib.Optional[string]    `json:"emergency_contact_name"            swaggertype:"string" example:"Mary Doe"`
	EmergencyContactPhone          lib.Optional[string]    `json:"emergency_contact_phone"           swaggertype:"string" example:"+1122334455"`
	RelationshipToEmergencyContact lib.Optional[string]    `json:"relationship_to_emergency_contact" swaggertype:"string" example:"sister"`
	Occupation                     lib.Optional[string]    `json:"occupation"                        swaggertype:"string" example:"Software Engineer"`
	Employer                       lib.Optional[string]    `json:"employer"                          swaggertype:"string" example:"Tech Ltd."`
	OccupationAddress              lib.Optional[string]    `json:"occupation_address"                swaggertype:"string" example:"456 Tech Ave, Accra"`
	ProofOfIncomeUrl               lib.Optional[string]    `json:"proof_of_income_url"               swaggertype:"string" example:"https://example.com/income.pdf"   validate:"omitempty,url"`
}

// UpdateTenant godoc
//
//	@Summary		Update a tenant
//	@Description	Update a tenant's profile details
//	@Tags			Tenants
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			tenant_id	path		string										true	"Tenant ID"
//	@Param			body		body		UpdateTenantRequest							true	"Tenant details"
//	@Success		200			{object}	object{data=transformations.OutputTenant}	"Tenant updated successfully"
//	@Failure		400			{object}	lib.HTTPError								"Error occurred when updating a tenant"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError								"Tenant not found"
//	@Failure		422			{object}	lib.HTTPError								"Invalid JSON body"
//	@Failure		500			{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/tenants/{tenant_id} [patch]
func (h *TenantHandler) UpdateTenant(w http.ResponseWriter, r *http.Request) {
	var body UpdateTenantRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w); !isPassedValidation {
		return
	}

	tenantID := chi.URLParam(r, "tenant_id")

	input := services.UpdateTenantInput{
		FirstName:                      body.FirstName,
		LastName:                       body.LastName,
		Gender:                         body.Gender,
		OtherNames:                     body.OtherNames,
		Email:                          body.Email,
		DateOfBirth:                    body.DateOfBirth,
		Nationality:                    body.Nationality,
		MaritalStatus:                  body.MaritalStatus,
		ProfilePhotoUrl:                body.ProfilePhotoUrl,
		IDType:                         body.IDType,
		IDNumber:                       body.IDNumber,
		IDFrontUrl:                     body.IDFrontUrl,
		IDBackUrl:                      body.IDBackUrl,
		EmergencyContactName:           body.EmergencyContactName,
		EmergencyContactPhone:          body.EmergencyContactPhone,
		RelationshipToEmergencyContact: body.RelationshipToEmergencyContact,
		Occupation:                     body.Occupation,
		Employer:                       body.Employer,
		OccupationAddress:              body.OccupationAddress,
		ProofOfIncomeUrl:               body.ProofOfIncomeUrl,
	}

	tenant, updateErr := h.service.UpdateTenant(r.Context(), tenantID, input)
	if updateErr != nil {
		HandleErrorResponse(w, updateErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBTenantToRest(tenant),
	})
}
