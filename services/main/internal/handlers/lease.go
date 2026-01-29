package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type LeaseHandler struct {
	appCtx  pkg.AppContext
	service services.LeaseService
}

func NewLeaseHandler(appCtx pkg.AppContext, service services.LeaseService) LeaseHandler {
	return LeaseHandler{appCtx: appCtx, service: service}
}

type UpdateLeaseRequest struct {
	MoveInDate             *time.Time `json:"move_in_date,omitempty"             example:"2024-07-01T00:00:00Z" description:"Tenant move-in date (RFC3339 format)"`
	KeyHandoverDate        *time.Time `json:"key_handover_date,omitempty"        example:"2024-07-01T09:00:00Z" description:"Date and time for key handover (RFC3339 format)"`
	UtilityTransfersDate   *time.Time `json:"utility_transfers_date,omitempty"   example:"2024-07-02T10:00:00Z" description:"Date for utility transfers (RFC3339 format)"`
	PropertyInspectionDate *time.Time `json:"property_inspection_date,omitempty" example:"2024-06-30T15:00:00Z" description:"Date for property inspection (RFC3339 format)"`
}

// UpdateLease godoc
//
//	@Summary		Update lease
//	@Description	Update lease
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id	path		string											true	"Lease ID"
//	@Param			body		body		UpdateLeaseRequest								true	"Update lease request body"
//	@Success		200			{object}	object{data=transformations.OutputAdminLease}	"Lease Updated Successfully"
//	@Failure		400			{object}	lib.HTTPError									"Error occurred when updating lease"
//	@Failure		401			{object}	string											"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError									"Lease not found"
//	@Failure		422			{object}	lib.HTTPError									"Validation error"
//	@Failure		500			{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id} [patch]
func (h *LeaseHandler) UpdateLease(w http.ResponseWriter, r *http.Request) {
	var body UpdateLeaseRequest
	leaseID := chi.URLParam(r, "lease_id")

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.UpdateLeaseInput{
		LeaseID:                leaseID,
		MoveInDate:             body.MoveInDate,
		KeyHandoverDate:        body.KeyHandoverDate,
		UtilityTransfersDate:   body.UtilityTransfersDate,
		PropertyInspectionDate: body.PropertyInspectionDate,
	}

	lease, err := h.service.UpdateLease(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminLeaseToRest(lease),
	})
}
