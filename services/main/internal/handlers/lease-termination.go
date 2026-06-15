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

type LeaseTerminationHandler struct {
	appCtx         pkg.AppContext
	service        services.LeaseTerminationService
	invoiceService services.InvoiceService
}

func NewLeaseTerminationHandler(appCtx pkg.AppContext, service services.LeaseTerminationService, invoiceService services.InvoiceService) LeaseTerminationHandler {
	return LeaseTerminationHandler{appCtx: appCtx, service: service, invoiceService: invoiceService}
}

type CreateLeaseTerminationRequest struct {
	Type   string `json:"type"   validate:"required,oneof=EVICTION MUTUAL_AGREEMENT TENANT_INITIATED" example:"MUTUAL_AGREEMENT"    description:"Termination type"`
	Reason string `json:"reason" validate:"required"                                                  example:"Both parties agreed" description:"Detailed reason for termination"`
}

// CreateLeaseTermination godoc
//
//	@Summary		Create lease termination (Admin)
//	@Description	Start a lease termination process for an active lease
//	@Tags			LeaseTermination
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			client_id		path		string											true	"Client ID"
//	@Param			property_id		path		string											true	"Property ID"
//	@Param			lease_id		path		string											true	"Lease ID"
//	@Param			body			body		CreateLeaseTerminationRequest					true	"Create termination request body"
//	@Success		201				{object}	object{data=transformations.OutputLeaseTermination}	"Termination Created"
//	@Failure		400				{object}	lib.HTTPError										"Lease not Active or InProgress termination already exists"
//	@Failure		401				{object}	string											"Invalid or absent authentication token"
//	@Failure		422				{object}	lib.HTTPError									"Validation error"
//	@Failure		500				{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/terminations [post]
func (h *LeaseTerminationHandler) CreateLeaseTermination(w http.ResponseWriter, r *http.Request) {
	clientUser, clientUserOk := lib.ClientUserFromContext(r.Context())
	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateLeaseTerminationRequest
	leaseID := chi.URLParam(r, "lease_id")

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	termination, err := h.service.Create(r.Context(), services.CreateLeaseTerminationInput{
		LeaseID:       leaseID,
		Type:          body.Type,
		Reason:        body.Reason,
		InitiatedById: clientUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBLeaseTerminationToRest(termination),
	})
}

type ListLeaseTerminationsQuery struct {
	lib.FilterQueryInput
	Status *string `json:"status,omitempty" validate:"omitempty,oneof=LeaseTermination.Status.InProgress LeaseTermination.Status.Completed LeaseTermination.Status.Cancelled" example:"LeaseTermination.Status.InProgress" description:"Termination status"`
}

// ListLeaseTerminations godoc
//
//	@Summary		List lease terminations (Admin)
//	@Description	List terminations for a lease
//	@Tags			LeaseTermination
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			client_id	path		string						true	"Client ID"
//	@Param			property_id	path		string						true	"Property ID"
//	@Param			lease_id	path		string						true	"Lease ID"
//	@Param			q			query		ListLeaseTerminationsQuery	true	"Query parameters"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputLeaseTermination,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400			{object}	lib.HTTPError				"Error occurred"
//	@Failure		401			{object}	string						"Invalid or absent authentication token"
//	@Failure		500			{object}	string						"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/terminations [get]
func (h *LeaseTerminationHandler) ListLeaseTerminations(w http.ResponseWriter, r *http.Request) {
	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, filterQuery, w) {
		return
	}

	leaseID := chi.URLParam(r, "lease_id")

	filter := repository.ListLeaseTerminationsFilter{
		FilterQuery: *filterQuery,
		LeaseID:     &leaseID,
		Status:      lib.NullOrString(r.URL.Query().Get("status")),
	}

	terminations, err := h.service.List(r.Context(), filter)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	count, countErr := h.service.Count(r.Context(), filter)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]any, len(terminations))
	for i, t := range terminations {
		rows[i] = transformations.DBLeaseTerminationToRest(&t)
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}

// GetLeaseTermination godoc
//
//	@Summary		Get lease termination (Admin)
//	@Description	Get a single lease termination by ID
//	@Tags			LeaseTermination
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			client_id		path		string											true	"Client ID"
//	@Param			property_id		path		string											true	"Property ID"
//	@Param			lease_id		path		string											true	"Lease ID"
//	@Param			termination_id	path		string											true	"Termination ID"
//	@Success		200				{object}	object{data=transformations.OutputLeaseTermination}	"Termination"
//	@Failure		401				{object}	string											"Invalid or absent authentication token"
//	@Failure		404				{object}	lib.HTTPError									"Not found"
//	@Failure		500				{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/terminations/{termination_id} [get]
func (h *LeaseTerminationHandler) GetLeaseTermination(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")
	terminationID := chi.URLParam(r, "termination_id")
	populate := GetPopulateFields(r)

	termination, err := h.service.GetOne(r.Context(), repository.GetTerminatedLeaseQuery{
		ID:       terminationID,
		LeaseID:  leaseID,
		Populate: populate,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBLeaseTerminationToRest(termination),
	})
}

// CreateInvoice godoc
//
//	@Summary		Create lease termination invoice (Admin)
//	@Description	Create a new invoice for a lease termination (Admin)
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			client_id		path		string					true	"Client ID"
//	@Param			property_id	path		string					true	"Property ID"
//	@Param			lease_id		path		string					true	"Lease ID"
//	@Param			termination_id	path		string				true	"Termination ID"
//	@Param			body		body		CreateInvoiceRequest		true	"Create invoice request body"
//	@Success		201			{object}	object{data=transformations.OutputInvoice}	"Invoice created successfully"
//	@Failure		400			{object}	lib.HTTPError				"Error occurred when creating invoice"
//	@Failure		401			{object}	string				"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError				"Lease termination not found"
//	@Failure		422			{object}	lib.HTTPError				"Validation error"
//	@Failure		500			{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/terminations/{termination_id}/invoices [post]

func createLeaseTerminationInvoice(w http.ResponseWriter, r *http.Request, appCtx pkg.AppContext, invoiceService services.InvoiceService, terminationService services.LeaseTerminationService) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")
	terminationID := chi.URLParam(r, "termination_id")
	propertyID := chi.URLParam(r, "property_id")
	clientID := chi.URLParam(r, "client_id")

	var body CreateInvoiceRequest
	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(appCtx.Validator, body, w) {
		return
	}

	_, err := terminationService.GetOne(r.Context(), repository.GetTerminatedLeaseQuery{
		ID:      terminationID,
		LeaseID: leaseID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	lineItems := make([]services.LineItemInput, len(body.LineItems))
	for i, item := range body.LineItems {
		lineItems[i] = services.LineItemInput{
			Label:       item.Label,
			Category:    item.Category,
			Quantity:    item.Quantity,
			UnitAmount:  item.UnitAmount,
			TotalAmount: item.UnitAmount * item.Quantity,
			Currency:    item.Currency,
			Metadata:    item.Metadata,
		}
	}

	totalAmount := int64(0)
	currency := "GHS"
	if len(lineItems) > 0 {
		currency = lineItems[0].Currency
	}
	for _, item := range lineItems {
		totalAmount += item.TotalAmount
	}

	input := services.CreateInvoiceInput{
		ClientID:                  &clientID,
		PropertyID:                &propertyID,
		PayerType:                 body.PayerType,
		PayeeType:                 body.PayeeType,
		ContextType:               "LEASE_TERMINATION",
		ContextLeaseTerminationID: &terminationID,
		TotalAmount:               totalAmount,
		Taxes:                     0,
		SubTotal:                  totalAmount,
		Currency:                  currency,
		Status:                    "DRAFT",
		DueDate:                   nil,
		LineItems:                 lineItems,
	}

	if body.DueDate != nil {
		dueDate, parseErr := time.Parse(time.RFC3339, *body.DueDate)
		if parseErr != nil {
			http.Error(w, "Invalid due date format", http.StatusUnprocessableEntity)
			return
		}
		input.DueDate = &dueDate
	}

	invoice, err := invoiceService.CreateInvoice(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBInvoiceToRest(invoice),
	})
}

// CreateLeaseTerminationInvoice godoc
//
//	@Summary		Create lease termination invoice (Admin)
//	@Description	Create a new invoice for a lease termination (Admin)
//	@Tags			LeaseTermination
//	@Accept		json
//	@Security	BearerAuth
//	@Produce		json
//	@Param		client_id		path		string					true	"Client ID"
//	@Param		property_id	path		string					true	"Property ID"
//	@Param		lease_id		path		string					true	"Lease ID"
//	@Param		termination_id	path		string				true	"Termination ID"
//	@Param		body		body		CreateInvoiceRequest		true	"Create invoice request body"
//	@Success		201		{object}	object{data=transformations.OutputInvoice}	"Invoice created successfully"
//	@Failure		400		{object}	lib.HTTPError				"Error occurred when creating invoice"
//	@Failure		401		{object}	string				"Invalid or absent authentication token"
//	@Failure		404		{object}	lib.HTTPError				"Lease termination not found"
//	@Failure		422		{object}	lib.HTTPError				"Validation error"
//	@Failure		500		{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/terminations/{termination_id}/invoices [post]
func (h *LeaseTerminationHandler) CreateLeaseTerminationInvoice(w http.ResponseWriter, r *http.Request) {
	createLeaseTerminationInvoice(w, r, h.appCtx, h.invoiceService, h.service)
}

type UpdateLeaseTerminationRequest struct {
	Type             *string              `json:"type,omitempty"               validate:"omitempty,oneof=EVICTION MUTUAL_AGREEMENT TENANT_INITIATED" example:"EVICTION"              description:"Termination type"`
	Reason           *string              `json:"reason,omitempty"             validate:"omitempty,min=1"                                             example:"Non-payment of rent"  description:"Detailed reason for termination"`
	DocumentMode     lib.Optional[string] `json:"document_mode,omitempty"      swaggertype:"string"                                                   description:"MANUAL or ONLINE"`
	DocumentUrl      lib.Optional[string] `json:"document_url,omitempty"       swaggertype:"string"                                                   description:"External termination agreement URL (MANUAL mode)"`
	DocumentId       lib.Optional[string] `json:"document_id,omitempty"        swaggertype:"string"                                                   description:"Library document ID (ONLINE mode)"`
	LeaseChecklistID lib.Optional[string] `json:"lease_checklist_id,omitempty" swaggertype:"string"                                                   description:"Move-out checklist ID"`
}

// UpdateLeaseTermination godoc
//
//	@Summary		Update lease termination (Admin)
//	@Description	Update fields on an InProgress lease termination
//	@Tags			LeaseTermination
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			client_id		path		string											true	"Client ID"
//	@Param			property_id		path		string											true	"Property ID"
//	@Param			lease_id		path		string											true	"Lease ID"
//	@Param			termination_id	path		string											true	"Termination ID"
//	@Param			body			body		UpdateLeaseTerminationRequest					true	"Update request body"
//	@Success		200				{object}	object{data=transformations.OutputLeaseTermination}	"Updated"
//	@Failure		400				{object}	lib.HTTPError									"Termination not InProgress"
//	@Failure		401				{object}	string											"Invalid or absent authentication token"
//	@Failure		404				{object}	lib.HTTPError									"Not found"
//	@Failure		422				{object}	lib.HTTPError									"Validation error"
//	@Failure		500				{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/terminations/{termination_id} [patch]
func (h *LeaseTerminationHandler) UpdateLeaseTermination(w http.ResponseWriter, r *http.Request) {
	var body UpdateLeaseTerminationRequest
	leaseID := chi.URLParam(r, "lease_id")
	terminationID := chi.URLParam(r, "termination_id")

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	termination, err := h.service.Update(r.Context(), services.UpdateLeaseTerminationInput{
		ID:               terminationID,
		LeaseID:          leaseID,
		Type:             body.Type,
		Reason:           body.Reason,
		DocumentMode:     body.DocumentMode,
		DocumentUrl:      body.DocumentUrl,
		DocumentId:       body.DocumentId,
		LeaseChecklistID: body.LeaseChecklistID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBLeaseTerminationToRest(termination),
	})
}

// CompleteLeaseTermination godoc
//
//	@Summary		Complete lease termination (Admin)
//	@Description	Complete a lease termination — sets lease to Terminated and releases the unit (transactional)
//	@Tags			LeaseTermination
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			client_id		path		string	true	"Client ID"
//	@Param			property_id		path		string	true	"Property ID"
//	@Param			lease_id		path		string	true	"Lease ID"
//	@Param			termination_id	path		string	true	"Termination ID"
//	@Success		204				{object}	nil		"Completed"
//	@Failure		400				{object}	lib.HTTPError	"Termination not InProgress"
//	@Failure		401				{object}	string			"Invalid or absent authentication token"
//	@Failure		404				{object}	lib.HTTPError	"Not found"
//	@Failure		500				{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/terminations/{termination_id}/complete [patch]
func (h *LeaseTerminationHandler) CompleteLeaseTermination(w http.ResponseWriter, r *http.Request) {
	clientUser, clientUserOk := lib.ClientUserFromContext(r.Context())
	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")
	terminationID := chi.URLParam(r, "termination_id")

	err := h.service.Complete(r.Context(), services.CompleteLeaseTerminationInput{
		ID:           terminationID,
		LeaseID:      leaseID,
		ClientUserID: clientUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// CancelLeaseTermination godoc
//
//	@Summary		Cancel lease termination (Admin)
//	@Description	Cancel an in-progress lease termination — lease remains Active
//	@Tags			LeaseTermination
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			client_id		path		string	true	"Client ID"
//	@Param			property_id		path		string	true	"Property ID"
//	@Param			lease_id		path		string	true	"Lease ID"
//	@Param			termination_id	path		string	true	"Termination ID"
//	@Success		204				{object}	nil		"Cancelled"
//	@Failure		400				{object}	lib.HTTPError	"Termination not InProgress"
//	@Failure		401				{object}	string			"Invalid or absent authentication token"
//	@Failure		404				{object}	lib.HTTPError	"Not found"
//	@Failure		500				{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/terminations/{termination_id}/cancel [patch]
func (h *LeaseTerminationHandler) CancelLeaseTermination(w http.ResponseWriter, r *http.Request) {
	clientUser, clientUserOk := lib.ClientUserFromContext(r.Context())
	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")
	terminationID := chi.URLParam(r, "termination_id")

	err := h.service.Cancel(r.Context(), services.CancelLeaseTerminationInput{
		ID:           terminationID,
		LeaseID:      leaseID,
		ClientUserID: clientUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
