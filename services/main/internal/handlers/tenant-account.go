package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

type TenantAccountHandler struct {
	appCtx  pkg.AppContext
	service services.TenantAccountService
}

func NewTenantAccountHandler(appCtx pkg.AppContext, service services.TenantAccountService) TenantAccountHandler {
	return TenantAccountHandler{appCtx: appCtx, service: service}
}

// GetMe godoc
//
//	@Summary		Get my tenant account (Tenant)
//	@Description	Get the authenticated tenant's account with their profile
//	@Tags			TenantAccount
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Success		200	{object}	object{data=transformations.OutputTenantAccount}	"Tenant account retrieved successfully"
//	@Failure		401	{object}	string												"Invalid or absent authentication token"
//	@Failure		404	{object}	lib.HTTPError										"Tenant account not found"
//	@Failure		500	{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/tenant-accounts/me [get]
func (h *TenantAccountHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	tenantAccount, tenantAccountOk := lib.TenantAccountFromContext(r.Context())
	if !tenantAccountOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	account, err := h.service.GetMe(r.Context(), tenantAccount.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBTenantAccountToRest(account),
	})
}
