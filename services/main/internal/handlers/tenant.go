package handlers

import (
	"encoding/json"
	"net/http"
	"net/url"

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
//	@Description	Get tenant by ID (Admin)
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
	populateFields := GetPopulateFields(r)

	tenant, err := h.service.GetTenantByID(r.Context(), repository.GetTenantQuery{
		ID:       tenantID,
		Populate: populateFields,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminTenantToRest(tenant),
	})
}

type ListTenantsByPropertyQuery struct {
	lib.FilterQueryInput
	Status *string `json:"status,omitempty" validate:"omitempty,oneof=ACTIVE EXPIRED" example:"ACTIVE" description:"Tenant lease status in the property: ACTIVE (has at least one active lease) or EXPIRED (has no active leases but has past leases)"`
}

// ListTenantsByProperty godoc
//
//	@Summary		List tenants by property (Admin)
//	@Description	List unique tenants for a property with optional status filtering. status=ACTIVE means tenant has at least one active lease; status=EXPIRED means tenant has no active leases but has terminated/completed/cancelled leases.
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

	input := repository.ListTenantsFilter{
		FilterQuery: *filterQuery,
		PropertyID:  &propertyID,
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
		tenantsTransformed = append(tenantsTransformed, transformations.DBAdminTenantToRest(&tenant))
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, tenantsTransformed, tenantsCount))
}
