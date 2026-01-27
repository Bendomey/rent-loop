package handlers

import (
	"encoding/json"
	"net/http"
	"net/url"

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
