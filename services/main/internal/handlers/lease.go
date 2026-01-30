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

type LeaseHandler struct {
	appCtx  pkg.AppContext
	service services.LeaseService
}

func NewLeaseHandler(appCtx pkg.AppContext, service services.LeaseService) LeaseHandler {
	return LeaseHandler{appCtx: appCtx, service: service}
}

type UpdateLeaseRequest struct {
	PaymentFrequency                                *string    `json:"payment_frequency,omitempty"                                      example:"monthly"                              description:"Frequency of rent payments"`
	MoveInDate                                      *time.Time `json:"move_in_date,omitempty"                                           example:"2024-07-01T00:00:00Z"                 description:"Tenant move-in date (RFC3339 format)"`
	StayDurationFrequency                           *string    `json:"stay_duration_frequency,omitempty"                                example:"months"                               description:"Unit of stay duration (e.g., months, years)"`
	StayDuration                                    *int64     `json:"stay_duration,omitempty"                                          example:"12"                                   description:"Length of stay in specified frequency"`
	KeyHandoverDate                                 *time.Time `json:"key_handover_date,omitempty"                                      example:"2024-07-01T09:00:00Z"                 description:"Date and time for key handover (RFC3339 format)"`
	UtilityTransfersDate                            *time.Time `json:"utility_transfers_date,omitempty"                                 example:"2024-07-02T10:00:00Z"                 description:"Date for utility transfers (RFC3339 format)"`
	PropertyInspectionDate                          *time.Time `json:"property_inspection_date,omitempty"                               example:"2024-06-30T15:00:00Z"                 description:"Date for property inspection (RFC3339 format)"`
	LeaseAggreementDocumentMode                     *string    `json:"lease_agreement_document_mode,omitempty"                          example:"digital"                              description:"Mode of lease agreement document (e.g., digital, paper)"`
	LeaseAgreementDocumentUrl                       *string    `json:"lease_agreement_document_url,omitempty"                           example:"https://example.com/lease.pdf"        description:"URL to the lease agreement document"`
	LeaseAgreementDocumentPropertyManagerSignedById *string    `json:"lease_agreement_document_property_manager_signed_by_id,omitempty" example:"b3b2c9d0-6c8a-4e8b-9e7a-abcdef123456" description:"ID of property manager who signed the lease agreement"`
	LeaseAgreementDocumentPropertyManagerSignedAt   *time.Time `json:"lease_agreement_document_property_manager_signed_at,omitempty"    example:"2024-06-15T12:00:00Z"                 description:"Timestamp when property manager signed the lease agreement"`
	LeaseAgreementDocumentTenantSignedAt            *time.Time `json:"lease_agreement_document_tenant_signed_at,omitempty"              example:"2024-06-16T14:00:00Z"                 description:"Timestamp when tenant signed the lease agreement"`
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
		LeaseID:                     leaseID,
		PaymentFrequency:            body.PaymentFrequency,
		MoveInDate:                  body.MoveInDate,
		StayDurationFrequency:       body.StayDurationFrequency,
		StayDuration:                body.StayDuration,
		KeyHandoverDate:             body.KeyHandoverDate,
		UtilityTransfersDate:        body.UtilityTransfersDate,
		PropertyInspectionDate:      body.PropertyInspectionDate,
		LeaseAggreementDocumentMode: body.LeaseAggreementDocumentMode,
		LeaseAgreementDocumentUrl:   body.LeaseAgreementDocumentUrl,
		LeaseAgreementDocumentPropertyManagerSignedById: body.LeaseAgreementDocumentPropertyManagerSignedById,
		LeaseAgreementDocumentPropertyManagerSignedAt:   body.LeaseAgreementDocumentPropertyManagerSignedAt,
		LeaseAgreementDocumentTenantSignedAt:            body.LeaseAgreementDocumentTenantSignedAt,
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

type GetLeaseQuery struct {
	lib.GetOneQueryInput
}

// GetLeaseByID godoc
//
//	@Summary		Get lease
//	@Description	Get lease
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id	path		string											true	"Lease ID"
//	@Param			q			query		GetLeaseQuery									true	"Leases"
//	@Success		200			{object}	object{data=transformations.OutputAdminLease}	"Lease"
//	@Failure		400			{object}	lib.HTTPError									"Error occurred when getting lease"
//	@Failure		401			{object}	string											"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError									"Lease not found"
//	@Failure		500			{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id} [get]
func (h *LeaseHandler) GetLeaseByID(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")

	populate := GetPopulateFields(r)
	query := repository.GetLeaseQuery{
		ID:       leaseID,
		Populate: populate,
	}

	lease, err := h.service.GetByIDWithPopulate(r.Context(), query)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminLeaseToRest(lease),
	})
}
