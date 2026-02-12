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
	PaymentFrequency                                *string    `json:"payment_frequency,omitempty"                                      validate:"omitempty,oneof=Hourly Daily Monthly Quarterly BiAnnually Annually OneTime" example:"Monthly"                              description:"Frequency of rent payments"`
	MoveInDate                                      *time.Time `json:"move_in_date,omitempty"                                           validate:"omitempty"                                                                  example:"2024-07-01T00:00:00Z"                 description:"Tenant move-in date (RFC3339 format)"`
	StayDurationFrequency                           *string    `json:"stay_duration_frequency,omitempty"                                validate:"omitempty,oneof=Hours Days Months"                                          example:"Hours"                                description:"Unit of stay duration (e.g., months, years)"`
	StayDuration                                    *int64     `json:"stay_duration,omitempty"                                          validate:"omitempty,gte=0"                                                            example:"12"                                   description:"Length of stay in specified frequency"`
	KeyHandoverDate                                 *time.Time `json:"key_handover_date,omitempty"                                      validate:"omitempty"                                                                  example:"2024-07-01T09:00:00Z"                 description:"Date and time for key handover (RFC3339 format)"`
	UtilityTransfersDate                            *time.Time `json:"utility_transfers_date,omitempty"                                 validate:"omitempty"                                                                  example:"2024-07-02T10:00:00Z"                 description:"Date for utility transfers (RFC3339 format)"`
	PropertyInspectionDate                          *time.Time `json:"property_inspection_date,omitempty"                               validate:"omitempty"                                                                  example:"2024-06-30T15:00:00Z"                 description:"Date for property inspection (RFC3339 format)"`
	LeaseAggreementDocumentMode                     *string    `json:"lease_agreement_document_mode,omitempty"                          validate:"omitempty,oneof=MANUAL ONLINE"                                              example:"MANUAL"                               description:"Mode of lease agreement document (e.g., digital, paper)"`
	LeaseAgreementDocumentUrl                       *string    `json:"lease_agreement_document_url,omitempty"                           validate:"omitempty,url"                                                              example:"https://example.com/lease.pdf"        description:"URL to the lease agreement document"`
	LeaseAgreementDocumentPropertyManagerSignedById *string    `json:"lease_agreement_document_property_manager_signed_by_id,omitempty" validate:"omitempty,uuid4"                                                            example:"b3b2c9d0-6c8a-4e8b-9e7a-abcdef123456" description:"ID of property manager who signed the lease agreement"`
	LeaseAgreementDocumentPropertyManagerSignedAt   *time.Time `json:"lease_agreement_document_property_manager_signed_at,omitempty"    validate:"omitempty"                                                                  example:"2024-06-15T12:00:00Z"                 description:"Timestamp when property manager signed the lease agreement"`
	LeaseAgreementDocumentTenantSignedAt            *time.Time `json:"lease_agreement_document_tenant_signed_at,omitempty"              validate:"omitempty"                                                                  example:"2024-06-16T14:00:00Z"                 description:"Timestamp when tenant signed the lease agreement"`
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

type ListLeasesQuery struct {
	lib.FilterQueryInput
	Status                     *string   `json:"status,omitempty"                        validate:"omitempty,oneof=Lease.Status.Pending Lease.Status.Active Lease.Status.Terminated Lease.Status.Completed Lease.Status.Cancelled" example:"Lease.Status.Pending"                 description:"Lease status"`
	ParentLeaseId              *string   `json:"parent_lease_id,omitempty"               validate:"omitempty,uuid"                                                                                                                 example:"b4d0243c-6581-4104-8185-d83a45ebe41b" description:"Parent lease ID"`
	PaymentFrequency           *string   `json:"payment_frequency,omitempty"             validate:"omitempty,oneof=Hourly Daily Monthly Quarterly BiAnnually Annually OneTime"                                                     example:"Hourly"                               description:"Frequency of rent payments"`
	StayDurationFrequency      *string   `json:"stay_duration_frequency,omitempty"       validate:"omitempty,oneof=Hours Days Months"                                                                                              example:"Hours"                                description:"Unit of stay duration (e.g., months, years)"`
	LeaseAgreementDocumentMode *string   `json:"lease_agreement_document_mode,omitempty" validate:"omitempty,oneof=MANUAL ONLINE"                                                                                                  example:"MANUAL"                               description:"Mode of lease agreement document (e.g., digital, paper)"`
	UnitIds                    *[]string `json:"unit_ids,omitempty"                      validate:"omitempty,dive,uuid4"                                                                                                           example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"List of unit IDs to filter by"                           collectionFormat:"multi"`
	IDs                        *[]string `json:"ids,omitempty"                           validate:"omitempty,dive,uuid4"                                                                                                           example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"List of lease IDs to filter by"                          collectionFormat:"multi"`
}

// ListLeasesByTenant godoc
//
//	@Summary		List leases by tenant
//	@Description	List leases by tenant
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			tenant_id	path		string			true	"Tenant ID"
//	@Param			q			query		ListLeasesQuery	true	"Leases"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputAdminLease,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400			{object}	lib.HTTPError	"An error occurred while filtering leases"
//	@Failure		401			{object}	string			"Absent or invalid authentication token"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/tenants/{tenant_id}/leases [get]
func (h *LeaseHandler) ListLeasesByTenant(w http.ResponseWriter, r *http.Request) {
	filterQuery, filterQueryErr := lib.GenerateQuery(r.URL.Query())
	if filterQueryErr != nil {
		HandleErrorResponse(w, filterQueryErr)
		return
	}

	isFilterQueryPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFilterQueryPassedValidation {
		return
	}

	tenantID := chi.URLParam(r, "tenant_id")

	input := repository.ListLeasesFilter{
		FilterQuery:                *filterQuery,
		TenantID:                   &tenantID,
		Status:                     lib.NullOrString(r.URL.Query().Get("status")),
		ParentLeaseID:              lib.NullOrString(r.URL.Query().Get("parent_lease_id")),
		PaymentFrequency:           lib.NullOrString(r.URL.Query().Get("payment_frequency")),
		StayDurationFrequency:      lib.NullOrString(r.URL.Query().Get("stay_duration_frequency")),
		LeaseAgreementDocumentMode: lib.NullOrString(r.URL.Query().Get("lease_agreement_document_mode")),
		UnitIds:                    lib.NullOrStringArray(r.URL.Query()["unit_ids"]),
		IDs:                        lib.NullOrStringArray(r.URL.Query()["ids"]),
	}

	leases, leasesErr := h.service.ListLeases(r.Context(), input)
	if leasesErr != nil {
		HandleErrorResponse(w, leasesErr)
		return
	}

	leasesCount, leasesCountErr := h.service.CountLeases(r.Context(), input)
	if leasesCountErr != nil {
		HandleErrorResponse(w, leasesCountErr)
		return
	}

	leasesTransformed := make([]any, 0)
	for _, lease := range leases {
		leasesTransformed = append(
			leasesTransformed,
			transformations.DBAdminLeaseToRest(&lease),
		)
	}

	json.NewEncoder(w).
		Encode(lib.ReturnListResponse(filterQuery, leasesTransformed, leasesCount))
}

// ListLeasesByProperty godoc
//
//	@Summary		List leases by property
//	@Description	List leases by property
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string			true	"Property ID"
//	@Param			q			query		ListLeasesQuery	true	"Leases"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputAdminLease,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400			{object}	lib.HTTPError	"An error occurred while filtering leases"
//	@Failure		401			{object}	string			"Absent or invalid authentication token"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/properties/{property_id}/leases [get]
func (h *LeaseHandler) ListLeasesByProperty(w http.ResponseWriter, r *http.Request) {
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

	input := repository.ListLeasesFilter{
		FilterQuery:                *filterQuery,
		PropertyID:                 &propertyID,
		Status:                     lib.NullOrString(r.URL.Query().Get("status")),
		ParentLeaseID:              lib.NullOrString(r.URL.Query().Get("parent_lease_id")),
		PaymentFrequency:           lib.NullOrString(r.URL.Query().Get("payment_frequency")),
		StayDurationFrequency:      lib.NullOrString(r.URL.Query().Get("stay_duration_frequency")),
		LeaseAgreementDocumentMode: lib.NullOrString(r.URL.Query().Get("lease_agreement_document_mode")),
		UnitIds:                    lib.NullOrStringArray(r.URL.Query()["unit_ids"]),
		IDs:                        lib.NullOrStringArray(r.URL.Query()["ids"]),
	}

	leases, leasesErr := h.service.ListLeases(r.Context(), input)
	if leasesErr != nil {
		HandleErrorResponse(w, leasesErr)
		return
	}

	leasesCount, leasesCountErr := h.service.CountLeases(r.Context(), input)
	if leasesCountErr != nil {
		HandleErrorResponse(w, leasesCountErr)
		return
	}

	leasesTransformed := make([]any, 0)
	for _, lease := range leases {
		leasesTransformed = append(
			leasesTransformed,
			transformations.DBAdminLeaseToRest(&lease),
		)
	}

	json.NewEncoder(w).
		Encode(lib.ReturnListResponse(filterQuery, leasesTransformed, leasesCount))
}

// ActivateLease godoc
//
//	@Summary		Activate lease
//	@Description	Activate lease
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id	path		string			true	"Lease ID"
//	@Success		204			{object}	nil				"Lease Activated Successfully"
//	@Failure		400			{object}	lib.HTTPError	"Error occurred when activating lease"
//	@Failure		401			{object}	string			"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError	"Lease not found"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/status:active [patch]
func (h *LeaseHandler) ActivateLease(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")

	err := h.service.ActivateLease(r.Context(), leaseID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type CancelLeaseRequest struct {
	CancellationReason string `json:"cancellation_reason" example:"Lease was cancelled due to a tenant's request."`
}

// CancelLease godoc
//
//	@Summary		Cancel lease
//	@Description	Cancel lease
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id	path		string				true	"Lease ID"
//	@Param			body		body		CancelLeaseRequest	true	"Cancel lease request body"
//	@Success		204			{object}	nil					"Lease Cancelled Successfully"
//	@Failure		400			{object}	lib.HTTPError		"Error occurred when cancelling lease"
//	@Failure		401			{object}	string				"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError		"Lease not found"
//	@Failure		422			{object}	lib.HTTPError		"Validation error"
//	@Failure		500			{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/status:cancelled [patch]
func (h *LeaseHandler) CancelLease(w http.ResponseWriter, r *http.Request) {
	var body CancelLeaseRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")

	err := h.service.CancelLease(r.Context(), services.CancelLeaseInput{
		LeaseID:            leaseID,
		CancellationReason: body.CancellationReason,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
