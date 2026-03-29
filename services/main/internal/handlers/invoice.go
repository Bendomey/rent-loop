package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type InvoiceHandler struct {
	appCtx               pkg.AppContext
	service              services.InvoiceService
	services             services.Services
	tenantAccountService services.TenantAccountService
}

func NewInvoiceHandler(appCtx pkg.AppContext, services services.Services) InvoiceHandler {
	return InvoiceHandler{
		appCtx:               appCtx,
		service:              services.InvoiceService,
		services:             services,
		tenantAccountService: services.TenantAccountService,
	}
}

type UpdateInvoiceRequest struct {
	Status              *string   `json:"status,omitempty"                validate:"omitempty,oneof=DRAFT ISSUED PARTIALLY_PAID PAID VOID" example:"ISSUED"    description:"Invoice status"`
	AllowedPaymentRails *[]string `json:"allowed_payment_rails,omitempty" validate:"omitempty,dive,oneof=MOMO BANK OFFLINE CARD"           example:"MOMO,BANK" description:"Allowed payment rails"`
}

// UpdateInvoice godoc
//
//	@Summary		Update invoice (Admin)
//	@Description	Update an existing invoice (Admin)
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string										true	"Property ID"
//	@Param			invoice_id	path		string										true	"Invoice ID"
//	@Param			body		body		UpdateInvoiceRequest						true	"Update invoice request body"
//	@Success		200			{object}	object{data=transformations.OutputInvoice}	"Invoice Updated Successfully"
//	@Failure		400			{object}	lib.HTTPError								"Error occurred when updating invoice"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError								"Invoice not found"
//	@Failure		422			{object}	lib.HTTPError								"Validation error"
//	@Failure		500			{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/admin/properties/{property_id}/invoices/{invoice_id} [patch]
func (h *InvoiceHandler) UpdateInvoice(w http.ResponseWriter, r *http.Request) {
	var body UpdateInvoiceRequest
	invoiceID := chi.URLParam(r, "invoice_id")

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.UpdateInvoiceInput{
		InvoiceID:           invoiceID,
		Status:              body.Status,
		AllowedPaymentRails: body.AllowedPaymentRails,
	}

	invoice, err := h.service.UpdateInvoice(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBInvoiceToRest(invoice),
	})
}

type VoidInvoiceBody struct {
	VoidedReason *string `json:"voided_reason" validate:"omitempty"`
}

// VoidInvoice godoc
//
//	@Summary		Void invoice (Admin)
//	@Description	Void an existing invoice (Admin)
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string										true	"Property ID"
//	@Param			invoice_id	path		string										true	"Invoice ID"
//	@Param			body		body		VoidInvoiceBody								false	"Optional void reason"
//	@Success		200			{object}	object{data=transformations.OutputInvoice}	"Invoice Voided Successfully"
//	@Failure		400			{object}	lib.HTTPError								"Error occurred when voiding invoice"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError								"Invoice not found"
//	@Failure		422			{object}	lib.HTTPError								"Validation error"
//	@Failure		500			{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/admin/properties/{property_id}/invoices/{invoice_id}/void [patch]
func (h *InvoiceHandler) VoidInvoice(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	invoiceID := chi.URLParam(r, "invoice_id")

	var body VoidInvoiceBody
	if r.Body != nil && r.ContentLength != 0 {
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
			return
		}
	}

	currentUserID := currentUser.ID
	input := services.VoidInvoiceInput{
		InvoiceID:            invoiceID,
		VoidedReason:         body.VoidedReason,
		VoidedByClientUserID: &currentUserID,
	}

	invoice, err := h.service.VoidInvoice(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBInvoiceToRest(invoice),
	})
}

type GetInvoiceQuery struct {
	lib.GetOneQueryInput
}

// GetInvoiceByID godoc
//
//	@Summary		Get invoice (Admin)
//	@Description	Get invoice by ID (Admin)
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string										true	"Property ID"
//	@Param			invoice_id	path		string										true	"Invoice ID"
//	@Param			q			query		GetInvoiceQuery								true	"Query parameters"
//	@Success		200			{object}	object{data=transformations.OutputInvoice}	"Invoice"
//	@Failure		400			{object}	lib.HTTPError								"Error occurred when getting invoice"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError								"Invoice not found"
//	@Failure		500			{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/admin/properties/{property_id}/invoices/{invoice_id} [get]
func (h *InvoiceHandler) GetInvoiceByID(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "invoice_id")

	populate := GetPopulateFields(r)
	query := repository.GetInvoiceQuery{
		Query:    map[string]any{"id": invoiceID},
		Populate: populate,
	}

	invoice, err := h.service.GetByQuery(r.Context(), query)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBInvoiceToRest(invoice),
	})
}

type ListInvoicesQuery struct {
	lib.FilterQueryInput
	PayerType     *string   `json:"payer_type"      query:"payer_type"`
	PayerClientID *string   `json:"payer_client_id" query:"payer_client_id"`
	PayerTenantID *string   `json:"payer_tenant_id" query:"payer_tenant_id"`
	PayeeType     *string   `json:"payee_type"      query:"payee_type"`
	PayeeClientID *string   `json:"payee_client_id" query:"payee_client_id"`
	ContextType   *string   `json:"context_type"    query:"context_type"`
	Status        *[]string `json:"status"          query:"status"          validate:"omitempty,dive,oneof=DRAFT ISSUED PARTIALLY_PAID PAID VOID"`
	Active        *bool     `json:"active"          query:"active"                                                                                description:"Filter invoices by active status. true for active invoices, false for VOID invoices"`
}

// ListInvoices godoc
//
//	@Summary		List invoices (Admin)
//	@Description	List invoices with optional filters (Admin)
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string																								true	"Property ID"
//	@Param			q			query		ListInvoicesQuery																					true	"Query parameters"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputInvoice,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Invoices"
//	@Failure		400			{object}	lib.HTTPError																						"Error occurred when listing invoices"
//	@Failure		401			{object}	string																								"Invalid or absent authentication token"
//	@Failure		500			{object}	string																								"An unexpected error occurred"
//	@Router			/api/v1/admin/properties/{property_id}/invoices [get]
func (h *InvoiceHandler) ListInvoices(w http.ResponseWriter, r *http.Request) {
	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	isFiltersPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFiltersPassedValidation {
		return
	}

	input := repository.ListInvoicesFilter{
		FilterQuery:   *filterQuery,
		PayerType:     lib.NullOrString(r.URL.Query().Get("payer_type")),
		PayerClientID: lib.NullOrString(r.URL.Query().Get("payer_client_id")),
		PayerTenantID: lib.NullOrString(r.URL.Query().Get("payer_tenant_id")),
		PayeeType:     lib.NullOrString(r.URL.Query().Get("payee_type")),
		PayeeClientID: lib.NullOrString(r.URL.Query().Get("payee_client_id")),
		ContextType:   lib.NullOrString(r.URL.Query().Get("context_type")),
		Status:        lib.NullOrStringArray(r.URL.Query()["status"]),
		Active:        lib.NullOrBool(r.URL.Query().Get("active")),
		PropertyID:    lib.NullOrString(chi.URLParam(r, "property_id")),
	}

	invoices, count, err := h.service.ListInvoices(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	data := make([]interface{}, len(*invoices))
	for i, invoice := range *invoices {
		data[i] = transformations.DBInvoiceToRest(&invoice)
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, data, count))
}

type AddLineItemRequest struct {
	Label       string          `json:"label"              validate:"required"                                                                              example:"January Rent" description:"Label for the line item"`
	Category    string          `json:"category"           validate:"required,oneof=RENT SECURITY_DEPOSIT INITIAL_DEPOSIT MAINTENANCE_FEE SAAS_FEE EXPENSE" example:"RENT"         description:"Category of line item"`
	Quantity    int64           `json:"quantity"           validate:"required,min=1"                                                                        example:"1"            description:"Quantity"`
	UnitAmount  int64           `json:"unit_amount"        validate:"required,min=0"                                                                        example:"100000"       description:"Unit amount in smallest currency unit"`
	TotalAmount int64           `json:"total_amount"       validate:"required,min=0"                                                                        example:"100000"       description:"Total amount in smallest currency unit"`
	Currency    string          `json:"currency"           validate:"required"                                                                              example:"GHS"          description:"Currency code"`
	Metadata    *map[string]any `json:"metadata,omitempty"                                                                                                                         description:"Additional metadata"`
}

// AddLineItem godoc
//
//	@Summary		Add line item to invoice (Admin)
//	@Description	Add a line item to an existing invoice (Admin)
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string												true	"Property ID"
//	@Param			invoice_id	path		string												true	"Invoice ID"
//	@Param			body		body		AddLineItemRequest									true	"Add line item request body"
//	@Success		201			{object}	object{data=transformations.OutputInvoiceLineItem}	"Line Item Added Successfully"
//	@Failure		400			{object}	lib.HTTPError										"Error occurred when adding line item"
//	@Failure		401			{object}	string												"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError										"Invoice not found"
//	@Failure		422			{object}	lib.HTTPError										"Validation error"
//	@Failure		500			{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/admin/properties/{property_id}/invoices/{invoice_id}/line-items [post]
func (h *InvoiceHandler) AddLineItem(w http.ResponseWriter, r *http.Request) {
	var body AddLineItemRequest
	invoiceID := chi.URLParam(r, "invoice_id")

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	input := services.AddLineItemInput{
		InvoiceID:   invoiceID,
		Label:       body.Label,
		Category:    body.Category,
		Quantity:    body.Quantity,
		UnitAmount:  body.UnitAmount,
		TotalAmount: body.TotalAmount,
		Currency:    body.Currency,
		Metadata:    body.Metadata,
	}

	lineItem, err := h.service.AddLineItem(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBInvoiceLineItemToRest(lineItem),
	})
}

// GetLineItems godoc
//
//	@Summary		Get line items for an invoice (Admin)
//	@Description	Get all line items for an invoice (Admin)
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string													true	"Property ID"
//	@Param			invoice_id	path		string													true	"Invoice ID"
//	@Success		200			{object}	object{data=[]transformations.OutputInvoiceLineItem}	"Line Items"
//	@Failure		400			{object}	lib.HTTPError											"Error occurred when getting line items"
//	@Failure		401			{object}	string													"Invalid or absent authentication token"
//	@Failure		500			{object}	string													"An unexpected error occurred"
//	@Router			/api/v1/admin/properties/{property_id}/invoices/{invoice_id}/line-items [get]
func (h *InvoiceHandler) GetLineItems(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "invoice_id")

	lineItems, err := h.service.GetLineItems(r.Context(), invoiceID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	data := make([]any, len(lineItems))
	for i, lineItem := range lineItems {
		data[i] = transformations.DBInvoiceLineItemToRest(&lineItem)
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": data,
	})
}

// DeleteInvoice godoc
//
//	@Summary		Delete invoice (Admin)
//	@Description	Delete an invoice in DRAFT or VOID status (Admin)
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path	string	true	"Property ID"
//	@Param			invoice_id	path	string	true	"Invoice ID"
//	@Success		204			"Invoice Deleted Successfully"
//	@Failure		400			{object}	lib.HTTPError	"Invoice cannot be deleted in its current status"
//	@Failure		401			{object}	string			"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError	"Invoice not found"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/properties/{property_id}/invoices/{invoice_id} [delete]
func (h *InvoiceHandler) DeleteInvoice(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "invoice_id")

	err := h.service.DeleteInvoice(r.Context(), invoiceID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// RemoveLineItem godoc
//
//	@Summary		Remove line item from invoice (Admin)
//	@Description	Remove a line item from an existing draft invoice (Admin)
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id		path	string	true	"Property ID"
//	@Param			invoice_id		path	string	true	"Invoice ID"
//	@Param			line_item_id	path	string	true	"Line Item ID"
//	@Success		204				"Line Item Removed Successfully"
//	@Failure		400				{object}	lib.HTTPError	"Error occurred when removing line item"
//	@Failure		401				{object}	string			"Invalid or absent authentication token"
//	@Failure		404				{object}	lib.HTTPError	"Invoice or line item not found"
//	@Failure		500				{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/admin/properties/{property_id}/invoices/{invoice_id}/line-items/{line_item_id} [delete]
func (h *InvoiceHandler) RemoveLineItem(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "invoice_id")
	lineItemID := chi.URLParam(r, "line_item_id")

	input := services.RemoveLineItemInput{
		InvoiceID:  invoiceID,
		LineItemID: lineItemID,
	}

	err := h.service.RemoveLineItem(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type TenantListInvoicesQuery struct {
	lib.FilterQueryInput
	ContextTenantApplicationID *string   `json:"context_tenant_application_id" query:"context_tenant_application_id" validate:"omitempty,uuid4"`
	Status                     *[]string `json:"status"                        query:"status"                        validate:"omitempty,dive,oneof=DRAFT ISSUED PARTIALLY_PAID PAID VOID"`
	Active                     *bool     `json:"active"                        query:"active"                        validate:"omitempty"`
}

// TenantListInvoices godoc
//
//	@Summary		List invoices for a lease (Tenant)
//	@Description	List invoices for a specific lease scoped to the authenticated tenant. Returns both LEASE_RENT and TENANT_APPLICATION invoices.
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id	path		string																								true	"Lease ID"
//	@Param			q			query		TenantListInvoicesQuery																				true	"Query parameters"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputInvoice,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Invoices"
//	@Failure		400			{object}	lib.HTTPError																						"Invalid query parameters"
//	@Failure		401			{object}	string																								"Invalid or absent authentication token"
//	@Failure		500			{object}	string																								"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/invoices [get]
func (h *InvoiceHandler) TenantListInvoices(w http.ResponseWriter, r *http.Request) {
	tenantAccount, ok := lib.TenantAccountFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	account, err := h.tenantAccountService.GetMe(r.Context(), tenantAccount.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	query := TenantListInvoicesQuery{
		ContextTenantApplicationID: lib.NullOrString(r.URL.Query().Get("context_tenant_application_id")),
		Status:                     lib.NullOrStringArray(r.URL.Query()["status"]),
		Active:                     lib.NullOrBool(r.URL.Query().Get("active")),
	}

	if !lib.ValidateRequest(h.appCtx.Validator, query, w) {
		return
	}

	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	if !lib.ValidateRequest(h.appCtx.Validator, filterQuery, w) {
		return
	}

	leaseID := chi.URLParam(r, "lease_id")

	input := repository.TenantListInvoicesFilter{
		FilterQuery:         *filterQuery,
		TenantID:            account.TenantId,
		LeaseID:             leaseID,
		TenantApplicationID: query.ContextTenantApplicationID,
		Status:              query.Status,
		Active:              query.Active,
	}

	invoices, count, err := h.service.TenantListInvoices(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	data := make([]interface{}, len(*invoices))
	for i, invoice := range *invoices {
		data[i] = transformations.DBInvoiceToRest(&invoice)
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, data, count))
}

// TenantInvoiceStats godoc
//
//	@Summary		Get invoice stats for a lease (Tenant)
//	@Description	Returns invoice counts and amounts grouped by status for the authenticated tenant's lease.
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id	path		string												true	"Lease ID"
//	@Success		200			{object}	object{data=transformations.InvoiceStatsResponse}	"Invoice stats"
//	@Failure		401			{object}	string												"Invalid or absent authentication token"
//	@Failure		500			{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/invoices/stats [get]
func (h *InvoiceHandler) TenantInvoiceStats(w http.ResponseWriter, r *http.Request) {
	tenantAccount, ok := lib.TenantAccountFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	account, err := h.tenantAccountService.GetMe(r.Context(), tenantAccount.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")
	lease, err := h.services.LeaseService.GetByIDWithPopulate(r.Context(), repository.GetLeaseQuery{
		ID: leaseID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	if lease.TenantId != account.TenantId {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var tenantApplicationID *string
	if lease.TenantApplicationId != "" {
		tenantApplicationID = &lease.TenantApplicationId
	}

	stats, err := h.service.TenantInvoiceStats(r.Context(), account.TenantId, leaseID, tenantApplicationID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	resp := transformations.InvoiceStatsResponse{}
	for _, s := range stats {
		switch s.Status {
		case "ISSUED":
			resp.IssuedCount = s.Count
			resp.OutstandingAmount += s.TotalAmount
		case "PARTIALLY_PAID":
			resp.PartiallyPaidCount = s.Count
			resp.OutstandingAmount += s.TotalAmount
		case "PAID":
			resp.PaidCount = s.Count
			resp.PaidAmount = s.TotalAmount
		}
	}

	json.NewEncoder(w).Encode(map[string]any{"data": resp})
}

// TenantGetInvoice godoc
//
//	@Summary		Get a single invoice (Tenant)
//	@Description	Get a single invoice by ID, scoped to the authenticated tenant. Returns line items and payments.
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id	path		string	true	"Lease ID"
//	@Param			invoice_id	path		string	true	"Invoice ID"
//	@Success		200			{object}	object{data=transformations.OutputInvoice}
//	@Failure		401			{object}	string			"Invalid or absent authentication token"
//	@Failure		403			{object}	string			"Forbidden"
//	@Failure		404			{object}	lib.HTTPError	"Invoice not found"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/invoices/{invoice_id} [get]
func (h *InvoiceHandler) TenantGetInvoice(w http.ResponseWriter, r *http.Request) {
	tenantAccount, ok := lib.TenantAccountFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	account, err := h.tenantAccountService.GetMe(r.Context(), tenantAccount.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")
	lease, err := h.services.LeaseService.GetByIDWithPopulate(r.Context(), repository.GetLeaseQuery{
		ID: leaseID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	if lease.TenantId != account.TenantId {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	invoiceID := chi.URLParam(r, "invoice_id")
	populate := []string{"LineItems", "Payments"}

	invoice, err := h.service.GetByQuery(r.Context(), repository.GetInvoiceQuery{
		Query:    map[string]any{"id": invoiceID},
		Populate: &populate,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	ownedByTenant := (invoice.PayerTenantID != nil && *invoice.PayerTenantID == account.TenantId) ||
		(invoice.ContextTenantApplicationID != nil && *invoice.ContextTenantApplicationID == lease.TenantApplicationId)

	if !ownedByTenant {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBInvoiceToRest(invoice),
	})
}

// TenantListPaymentAccounts godoc
//
//	@Summary		List payment accounts for a lease's property manager (Tenant)
//	@Description	Returns active payment accounts belonging to the property manager (client) of the unit associated with the lease. Used by tenants to know where to send payments.
//	@Tags			PaymentAccount
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			lease_id	path		string	true	"Lease ID"
//	@Success		200			{object}	object{data=[]transformations.OutputPaymentAccount}
//	@Failure		401			{object}	string			"Invalid or absent authentication token"
//	@Failure		403			{object}	string			"Forbidden"
//	@Failure		404			{object}	lib.HTTPError	"Lease not found"
//	@Failure		500			{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/payment-accounts [get]
func (h *InvoiceHandler) TenantListPaymentAccounts(w http.ResponseWriter, r *http.Request) {
	tenantAccount, ok := lib.TenantAccountFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	account, err := h.tenantAccountService.GetMe(r.Context(), tenantAccount.ID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")

	// Fetch lease with unit and property to resolve the client (property manager)
	lease, err := h.services.LeaseService.GetByIDWithPopulate(r.Context(), repository.GetLeaseQuery{
		ID:       leaseID,
		Populate: &[]string{"Unit.Property"},
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	// Verify the authenticated tenant owns this lease
	if lease.TenantId != account.TenantId {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	clientID := lease.Unit.Property.ClientID
	activeStatus := "ACTIVE"
	ownerTypes := []string{"PROPERTY_OWNER"}

	paymentAccounts, err := h.services.PaymentAccountService.ListPaymentAccounts(
		r.Context(),
		repository.ListPaymentAccountsFilter{
			ClientID:   &clientID,
			Status:     &activeStatus,
			OwnerTypes: &ownerTypes,
		},
	)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	data := make([]any, len(paymentAccounts))
	for i, pa := range paymentAccounts {
		data[i] = transformations.DBPaymentAccountToRest(&pa)
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": data,
	})
}
