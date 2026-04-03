package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type AgreementHandler struct {
	service services.AgreementService
	appCtx  pkg.AppContext
}

func NewAgreementHandler(appCtx pkg.AppContext, service services.AgreementService) AgreementHandler {
	return AgreementHandler{service, appCtx}
}

// GetAgreements godoc
//
//	@Summary		List active agreements with acceptance status
//	@Description	Returns all active agreements, each enriched with whether the current user has accepted it
//	@Tags			Agreements
//	@Security		BearerAuth
//	@Produce		json
//	@Success		200	{object}	object{data=[]transformations.OutputAgreement}
//	@Failure		401	{object}	string
//	@Failure		500	{object}	string
//	@Router			/api/v1/admin/agreements [get]
func (h *AgreementHandler) GetAgreements(w http.ResponseWriter, r *http.Request) {
	currentUser, currentUserOk := lib.ClientUserFromContext(r.Context())
	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	agreements, err := h.service.GetActiveAgreementsForUser(r.Context(), currentUser.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	output := make([]interface{}, 0, len(agreements))
	for _, a := range agreements {
		output = append(output, transformations.AgreementWithAcceptanceToRest(a))
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": output,
	})
}

// AcceptAgreement godoc
//
//	@Summary		Accept an agreement (OWNER only)
//	@Description	Records that the current OWNER user has accepted the specified agreement
//	@Tags			Agreements
//	@Security		BearerAuth
//	@Produce		json
//	@Param			agreement_id	path		string	true	"Agreement ID"
//	@Success		200				{object}	object{data=object}
//	@Failure		400				{object}	lib.HTTPError
//	@Failure		401				{object}	string
//	@Failure		500				{object}	string
//	@Router			/api/v1/admin/agreements/{agreement_id}/accept [post]
func (h *AgreementHandler) AcceptAgreement(w http.ResponseWriter, r *http.Request) {
	currentUser, currentUserOk := lib.ClientUserFromContext(r.Context())
	if !currentUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	agreementID := chi.URLParam(r, "agreement_id")

	// Extract IP address from request
	ipAddress := r.Header.Get("X-Forwarded-For")
	if ipAddress == "" {
		ipAddress = r.RemoteAddr
	} else {
		// X-Forwarded-For can be a comma-separated list; take the first one
		ipAddress = strings.TrimSpace(strings.Split(ipAddress, ",")[0])
	}

	acceptance, err := h.service.AcceptAgreement(r.Context(), currentUser.ID, agreementID, ipAddress)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": map[string]interface{}{
			"id":             acceptance.ID.String(),
			"client_user_id": acceptance.ClientUserID,
			"agreement_id":   acceptance.AgreementID,
			"version":        acceptance.Version,
			"accepted_at":    acceptance.AcceptedAt,
			"ip_address":     acceptance.IPAddress,
		},
	})
}

// ===== Admin Handlers =====

type AdminCreateAgreementRequest struct {
	Name          string    `json:"name"           validate:"required" example:"Landlord Agreement"`
	Version       string    `json:"version"        validate:"required" example:"v1.1"`
	Content       string    `json:"content"        validate:"required"`
	EffectiveDate time.Time `json:"effective_date" validate:"required" example:"2026-04-03T00:00:00Z"`
}

// AdminCreateAgreement godoc
//
//	@Summary		Create a new agreement (Admin)
//	@Description	Creates a new agreement version. Not active by default.
//	@Tags			Agreements
//	@Security		BearerAuth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		AdminCreateAgreementRequest	true	"Agreement details"
//	@Success		201		{object}	object{data=transformations.OutputAgreement}
//	@Failure		400		{object}	lib.HTTPError
//	@Failure		401		{object}	string
//	@Router			/api/v1/admin/system/agreements [post]
func (h *AgreementHandler) AdminCreateAgreement(w http.ResponseWriter, r *http.Request) {
	var body AdminCreateAgreementRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	agreement, err := h.service.AdminCreateAgreement(r.Context(), services.AdminCreateAgreementInput{
		Name:          body.Name,
		Version:       body.Version,
		Content:       body.Content,
		EffectiveDate: body.EffectiveDate,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": transformations.AgreementToRest(agreement),
	})
}

type AdminUpdateAgreementRequest struct {
	Name          *string    `json:"name,omitempty"           validate:"omitempty" example:"Landlord Agreement"`
	Version       *string    `json:"version,omitempty"        validate:"omitempty" example:"v1.1"`
	Content       *string    `json:"content,omitempty"        validate:"omitempty"`
	EffectiveDate *time.Time `json:"effective_date,omitempty" validate:"omitempty" example:"2026-04-03T00:00:00Z"`
}

// AdminUpdateAgreement godoc
//
//	@Summary		Update an agreement (Admin)
//	@Description	Updates fields of an existing agreement version
//	@Tags			Agreements
//	@Security		BearerAuth
//	@Accept			json
//	@Produce		json
//	@Param			agreement_id	path		string						true	"Agreement ID"
//	@Param			body			body		AdminUpdateAgreementRequest	true	"Fields to update"
//	@Success		200				{object}	object{data=transformations.OutputAgreement}
//	@Failure		400				{object}	lib.HTTPError
//	@Failure		401				{object}	string
//	@Router			/api/v1/admin/system/agreements/{agreement_id} [patch]
func (h *AgreementHandler) AdminUpdateAgreement(w http.ResponseWriter, r *http.Request) {
	agreementID := chi.URLParam(r, "agreement_id")

	var body AdminUpdateAgreementRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	agreement, err := h.service.AdminUpdateAgreement(r.Context(), services.AdminUpdateAgreementInput{
		AgreementID:   agreementID,
		Name:          body.Name,
		Version:       body.Version,
		Content:       body.Content,
		EffectiveDate: body.EffectiveDate,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": transformations.AgreementToRest(agreement),
	})
}

// AdminActivateAgreement godoc
//
//	@Summary		Activate an agreement version (Admin)
//	@Description	Sets is_active=true on the specified agreement, making it require acceptance from all OWNERs
//	@Tags			Agreements
//	@Security		BearerAuth
//	@Produce		json
//	@Param			agreement_id	path		string	true	"Agreement ID"
//	@Success		200				{object}	object{data=transformations.OutputAgreement}
//	@Failure		400				{object}	lib.HTTPError
//	@Failure		401				{object}	string
//	@Router			/api/v1/admin/system/agreements/{agreement_id}/activate [patch]
func (h *AgreementHandler) AdminActivateAgreement(w http.ResponseWriter, r *http.Request) {
	agreementID := chi.URLParam(r, "agreement_id")

	agreement, err := h.service.AdminActivateAgreement(r.Context(), agreementID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": transformations.AgreementToRest(agreement),
	})
}

// AdminListAgreements godoc
//
//	@Summary		List all agreements (Admin)
//	@Description	Returns all agreement versions including inactive ones
//	@Tags			Agreements
//	@Security		BearerAuth
//	@Produce		json
//	@Success		200	{object}	object{data=[]transformations.OutputAgreement}
//	@Failure		401	{object}	string
//	@Router			/api/v1/admin/system/agreements [get]
func (h *AgreementHandler) AdminListAgreements(w http.ResponseWriter, r *http.Request) {
	agreements, err := h.service.AdminListAgreements(r.Context())
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	output := make([]interface{}, 0, len(agreements))
	for i := range agreements {
		output = append(output, transformations.AgreementToRest(&agreements[i]))
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": output,
	})
}
