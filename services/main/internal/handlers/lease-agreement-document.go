package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type LeaseAgreementDocumentHandler struct {
	appCtx  pkg.AppContext
	service services.LeaseAgreementDocumentService
}

func NewLeaseAgreementDocumentHandler(
	appCtx pkg.AppContext,
	service services.LeaseAgreementDocumentService,
) LeaseAgreementDocumentHandler {
	return LeaseAgreementDocumentHandler{appCtx: appCtx, service: service}
}

type CreateLeaseAgreementDocumentRequest struct {
	Mode        string  `json:"mode"         validate:"required,oneof=MANUAL ONLINE" example:"ONLINE"`
	DocumentID  *string `json:"document_id"  validate:"omitempty,uuid"               example:"550e8400-e29b-41d4-a716-446655440000"`
	DocumentUrl *string `json:"document_url" validate:"omitempty,url"                example:"https://example.com/lease.pdf"`
}

// CreateLeaseAgreementDocument godoc
//
//	@Summary		Create lease agreement document
//	@Description	Start the document pipeline for a lease. Status is set to DRAFT.
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string								true	"Property ID"
//	@Param			lease_id	path		string								true	"Lease ID"
//	@Param			body		body		CreateLeaseAgreementDocumentRequest	true	"Request body"
//	@Success		201			{object}	object{data=transformations.OutputAdminLeaseAgreementDocument}
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		422			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/agreement-documents [post]
func (h *LeaseAgreementDocumentHandler) CreateLeaseAgreementDocument(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")

	var body CreateLeaseAgreementDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	doc, err := h.service.CreateLeaseAgreementDocument(r.Context(), services.CreateLeaseAgreementDocumentInput{
		LeaseID:     leaseID,
		Mode:        body.Mode,
		DocumentID:  body.DocumentID,
		DocumentUrl: body.DocumentUrl,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	if encodeErr := json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminLeaseAgreementDocumentToRest(doc),
	}); encodeErr != nil {
		http.Error(w, encodeErr.Error(), http.StatusInternalServerError)
	}
}

// GetLeaseAgreementDocument godoc
//
//	@Summary		Get lease agreement document
//	@Description	Fetch the agreement document pipeline record for a lease, with signatures.
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string	true	"Property ID"
//	@Param			lease_id	path		string	true	"Lease ID"
//	@Success		200			{object}	object{data=transformations.OutputAdminLeaseAgreementDocument}
//	@Failure		401			{object}	string
//	@Failure		404			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/agreement-documents [get]
func (h *LeaseAgreementDocumentHandler) GetLeaseAgreementDocument(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")

	doc, err := h.service.GetByLeaseID(r.Context(), leaseID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	if encodeErr := json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminLeaseAgreementDocumentToRest(doc),
	}); encodeErr != nil {
		http.Error(w, encodeErr.Error(), http.StatusInternalServerError)
	}
}

type UpdateLeaseAgreementDocumentRequest struct {
	Mode        *string `json:"mode"         validate:"omitempty,oneof=MANUAL ONLINE"`
	DocumentID  *string `json:"document_id"  validate:"omitempty,uuid"`
	DocumentUrl *string `json:"document_url" validate:"omitempty,url"`
}

// UpdateLeaseAgreementDocument godoc
//
//	@Summary		Update lease agreement document
//	@Description	Update mode, document_id, or document_url. Only allowed when status is DRAFT.
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string								true	"Property ID"
//	@Param			lease_id	path		string								true	"Lease ID"
//	@Param			body		body		UpdateLeaseAgreementDocumentRequest	true	"Request body"
//	@Success		200			{object}	object{data=transformations.OutputAdminLeaseAgreementDocument}
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		404			{object}	lib.HTTPError
//	@Failure		422			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/agreement-documents [patch]
func (h *LeaseAgreementDocumentHandler) UpdateLeaseAgreementDocument(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")

	var body UpdateLeaseAgreementDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	doc, err := h.service.UpdateLeaseAgreementDocument(r.Context(), services.UpdateLeaseAgreementDocumentInput{
		LeaseID:     leaseID,
		Mode:        body.Mode,
		DocumentID:  body.DocumentID,
		DocumentUrl: body.DocumentUrl,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	if encodeErr := json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminLeaseAgreementDocumentToRest(doc),
	}); encodeErr != nil {
		http.Error(w, encodeErr.Error(), http.StatusInternalServerError)
	}
}

// DeleteLeaseAgreementDocument godoc
//
//	@Summary		Delete lease agreement document
//	@Description	Remove the agreement document pipeline record. Allowed in any status while the PDF has not yet been saved to the lease.
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string	true	"Property ID"
//	@Param			lease_id	path		string	true	"Lease ID"
//	@Success		204			{object}	nil
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		404			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/agreement-documents [delete]
func (h *LeaseAgreementDocumentHandler) DeleteLeaseAgreementDocument(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")

	if err := h.service.DeleteLeaseAgreementDocument(r.Context(), leaseID); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RevertLeaseAgreementDocumentToDraft godoc
//
//	@Summary		Revert lease agreement document to draft
//	@Description	Revert a FINALIZED document back to DRAFT so edits can be made.
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string	true	"Property ID"
//	@Param			lease_id	path		string	true	"Lease ID"
//	@Success		200			{object}	object{data=transformations.OutputAdminLeaseAgreementDocument}
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		404			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/agreement-documents/draft [post]
func (h *LeaseAgreementDocumentHandler) RevertLeaseAgreementDocumentToDraft(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")

	doc, err := h.service.RevertLeaseAgreementDocumentToDraft(r.Context(), leaseID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	if encodeErr := json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminLeaseAgreementDocumentToRest(doc),
	}); encodeErr != nil {
		http.Error(w, encodeErr.Error(), http.StatusInternalServerError)
	}
}

// FinalizeLeaseAgreementDocument godoc
//
//	@Summary		Finalize lease agreement document
//	@Description	Lock the document content and advance status from DRAFT to FINALIZED.
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string	true	"Property ID"
//	@Param			lease_id	path		string	true	"Lease ID"
//	@Success		200			{object}	object{data=transformations.OutputAdminLeaseAgreementDocument}
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		404			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/agreement-documents/finalize [post]
func (h *LeaseAgreementDocumentHandler) FinalizeLeaseAgreementDocument(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")

	doc, err := h.service.FinalizeLeaseAgreementDocument(r.Context(), leaseID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	if encodeErr := json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminLeaseAgreementDocumentToRest(doc),
	}); encodeErr != nil {
		http.Error(w, encodeErr.Error(), http.StatusInternalServerError)
	}
}
