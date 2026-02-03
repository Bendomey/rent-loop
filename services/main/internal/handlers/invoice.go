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

type InvoiceHandler struct {
	appCtx  pkg.AppContext
	service services.InvoiceService
}

func NewInvoiceHandler(appCtx pkg.AppContext, service services.InvoiceService) InvoiceHandler {
	return InvoiceHandler{appCtx: appCtx, service: service}
}

type CreateLineItemRequest struct {
	Label       string          `json:"label"        validate:"required"                                                                            example:"January Rent"  description:"Label for the line item"`
	Category    string          `json:"category"     validate:"required,oneof=RENT SECURITY_DEPOSIT INITIAL_DEPOSIT MAINTENANCE_FEE SAAS_FEE EXPENSE" example:"RENT"          description:"Category of line item"`
	Quantity    int64           `json:"quantity"     validate:"required,min=1"                                                                       example:"1"             description:"Quantity"`
	UnitAmount  int64           `json:"unit_amount"  validate:"required,min=0"                                                                        example:"100000"        description:"Unit amount in smallest currency unit"`
	TotalAmount int64           `json:"total_amount" validate:"required,min=0"                                                                        example:"100000"        description:"Total amount in smallest currency unit"`
	Currency    string          `json:"currency"     validate:"required"                                                                              example:"GHS"           description:"Currency code"`
	Metadata    *map[string]any `json:"metadata,omitempty"                                                                                            description:"Additional metadata"`
}

type CreateInvoiceRequest struct {
	PayerType                   string                  `json:"payer_type"                     validate:"required,oneof=TENANT PROPERTY_OWNER"                                                  example:"TENANT"              description:"Who is paying the invoice"`
	PayerClientID               *string                 `json:"payer_client_id,omitempty"      example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"                                                    description:"Client ID of the payer"`
	PayerPropertyID             *string                 `json:"payer_property_id,omitempty"    example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"                                                    description:"Property ID of the payer"`
	PayerTenantID               *string                 `json:"payer_tenant_id,omitempty"      example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"                                                    description:"Tenant ID of the payer"`
	PayeeType                   string                  `json:"payee_type"                     validate:"required,oneof=PROPERTY_OWNER RENTLOOP"                                                example:"PROPERTY_OWNER"      description:"Who is receiving the payment"`
	PayeeClientID               *string                 `json:"payee_client_id,omitempty"      example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"                                                    description:"Client ID of the payee"`
	ContextType                 string                  `json:"context_type"                   validate:"required,oneof=TENANT_APPLICATION LEASE_RENT MAINTENANCE SAAS_FEE GENERAL_EXPENSE"     example:"LEASE_RENT"          description:"Context of the invoice"`
	ContextTenantApplicationID  *string                 `json:"context_tenant_application_id,omitempty"  example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"                                          description:"Tenant application ID"`
	ContextLeaseID              *string                 `json:"context_lease_id,omitempty"               example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"                                          description:"Lease ID"`
	ContextMaintenanceRequestID *string                 `json:"context_maintenance_request_id,omitempty" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"                                          description:"Maintenance request ID"`
	TotalAmount                 int64                   `json:"total_amount"                   validate:"required,min=0"                                                                         example:"100000"              description:"Total amount in smallest currency unit"`
	Taxes                       int64                   `json:"taxes"                          validate:"min=0"                                                                                  example:"0"                   description:"Taxes in smallest currency unit"`
	SubTotal                    int64                   `json:"sub_total"                      validate:"required,min=0"                                                                         example:"100000"              description:"Subtotal in smallest currency unit"`
	Currency                    string                  `json:"currency"                       validate:"required"                                                                               example:"GHS"                 description:"Currency code"`
	DueDate                     *time.Time              `json:"due_date,omitempty"             example:"2024-07-01T00:00:00Z"                                                                    description:"Due date"`
	AllowedPaymentRails         []string                `json:"allowed_payment_rails"          validate:"required,dive,oneof=MOMO BANK OFFLINE CARD"                                            example:"MOMO,BANK"           description:"Allowed payment rails"`
	LineItems                   []CreateLineItemRequest `json:"line_items,omitempty"           validate:"omitempty,dive"                                                                         description:"Initial line items for the invoice"`
}

// CreateInvoice godoc
//
//	@Summary		Create invoice
//	@Description	Create a new invoice
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		CreateInvoiceRequest							true	"Create invoice request body"
//	@Success		201		{object}	object{data=transformations.OutputInvoice}		"Invoice Created Successfully"
//	@Failure		400		{object}	lib.HTTPError									"Error occurred when creating invoice"
//	@Failure		401		{object}	string											"Invalid or absent authentication token"
//	@Failure		422		{object}	lib.HTTPError									"Validation error"
//	@Failure		500		{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/invoices [post]
func (h *InvoiceHandler) CreateInvoice(w http.ResponseWriter, r *http.Request) {
	var body CreateInvoiceRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)
	if !isPassedValidation {
		return
	}

	// Map line items from request to service input
	var lineItems []services.LineItemInput
	for _, item := range body.LineItems {
		lineItems = append(lineItems, services.LineItemInput{
			Label:       item.Label,
			Category:    item.Category,
			Quantity:    item.Quantity,
			UnitAmount:  item.UnitAmount,
			TotalAmount: item.TotalAmount,
			Currency:    item.Currency,
			Metadata:    item.Metadata,
		})
	}

	input := services.CreateInvoiceInput{
		PayerType:                   body.PayerType,
		PayerClientID:               body.PayerClientID,
		PayerPropertyID:             body.PayerPropertyID,
		PayerTenantID:               body.PayerTenantID,
		PayeeType:                   body.PayeeType,
		PayeeClientID:               body.PayeeClientID,
		ContextType:                 body.ContextType,
		ContextTenantApplicationID:  body.ContextTenantApplicationID,
		ContextLeaseID:              body.ContextLeaseID,
		ContextMaintenanceRequestID: body.ContextMaintenanceRequestID,
		TotalAmount:                 body.TotalAmount,
		Taxes:                       body.Taxes,
		SubTotal:                    body.SubTotal,
		Currency:                    body.Currency,
		DueDate:                     body.DueDate,
		AllowedPaymentRails:         body.AllowedPaymentRails,
		LineItems:                   lineItems,
	}

	invoice, err := h.service.CreateInvoice(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBInvoiceToRest(invoice),
	})
}

type UpdateInvoiceRequest struct {
	Status              *string    `json:"status,omitempty"               validate:"omitempty,oneof=DRAFT ISSUED PARTIALLY_PAID PAID VOID"    example:"ISSUED"              description:"Invoice status"`
	TotalAmount         *int64     `json:"total_amount,omitempty"         validate:"omitempty,min=0"                                          example:"100000"              description:"Total amount in smallest currency unit"`
	Taxes               *int64     `json:"taxes,omitempty"                validate:"omitempty,min=0"                                          example:"0"                   description:"Taxes in smallest currency unit"`
	SubTotal            *int64     `json:"sub_total,omitempty"            validate:"omitempty,min=0"                                          example:"100000"              description:"Subtotal in smallest currency unit"`
	DueDate             *time.Time `json:"due_date,omitempty"             example:"2024-07-01T00:00:00Z"                                      description:"Due date"`
	IssuedAt            *time.Time `json:"issued_at,omitempty"            example:"2024-06-15T00:00:00Z"                                      description:"Issued date"`
	PaidAt              *time.Time `json:"paid_at,omitempty"              example:"2024-06-20T00:00:00Z"                                      description:"Paid date"`
	VoidedAt            *time.Time `json:"voided_at,omitempty"            example:"2024-06-25T00:00:00Z"                                      description:"Voided date"`
	AllowedPaymentRails *[]string  `json:"allowed_payment_rails,omitempty" validate:"omitempty,dive,oneof=MOMO BANK OFFLINE CARD"             example:"MOMO,BANK"           description:"Allowed payment rails"`
}

// UpdateInvoice godoc
//
//	@Summary		Update invoice
//	@Description	Update an existing invoice
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			invoice_id	path		string											true	"Invoice ID"
//	@Param			body		body		UpdateInvoiceRequest							true	"Update invoice request body"
//	@Success		200			{object}	object{data=transformations.OutputInvoice}		"Invoice Updated Successfully"
//	@Failure		400			{object}	lib.HTTPError									"Error occurred when updating invoice"
//	@Failure		401			{object}	string											"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError									"Invoice not found"
//	@Failure		422			{object}	lib.HTTPError									"Validation error"
//	@Failure		500			{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/invoices/{invoice_id} [patch]
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
		TotalAmount:         body.TotalAmount,
		Taxes:               body.Taxes,
		SubTotal:            body.SubTotal,
		DueDate:             body.DueDate,
		IssuedAt:            body.IssuedAt,
		PaidAt:              body.PaidAt,
		VoidedAt:            body.VoidedAt,
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

type GetInvoiceQuery struct {
	lib.GetOneQueryInput
}

// GetInvoiceByID godoc
//
//	@Summary		Get invoice
//	@Description	Get invoice by ID
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			invoice_id	path		string											true	"Invoice ID"
//	@Param			q			query		GetInvoiceQuery									true	"Query parameters"
//	@Success		200			{object}	object{data=transformations.OutputInvoice}		"Invoice"
//	@Failure		400			{object}	lib.HTTPError									"Error occurred when getting invoice"
//	@Failure		401			{object}	string											"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError									"Invoice not found"
//	@Failure		500			{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/invoices/{invoice_id} [get]
func (h *InvoiceHandler) GetInvoiceByID(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "invoice_id")

	populate := GetPopulateFields(r)
	query := repository.GetInvoiceQuery{
		ID:       invoiceID,
		Populate: populate,
	}

	invoice, err := h.service.GetByID(r.Context(), query)
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
	PayerType     *string `json:"payer_type"      query:"payer_type"`
	PayerClientID *string `json:"payer_client_id" query:"payer_client_id"`
	PayerTenantID *string `json:"payer_tenant_id" query:"payer_tenant_id"`
	PayeeType     *string `json:"payee_type"      query:"payee_type"`
	PayeeClientID *string `json:"payee_client_id" query:"payee_client_id"`
	ContextType   *string `json:"context_type"    query:"context_type"`
	Status        *string `json:"status"          query:"status"`
}

// ListInvoices godoc
//
//	@Summary		List invoices
//	@Description	List invoices with optional filters
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q	query		ListInvoicesQuery								true	"Query parameters"
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputInvoice,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Invoices"
//	@Failure		400	{object}	lib.HTTPError									"Error occurred when listing invoices"
//	@Failure		401	{object}	string											"Invalid or absent authentication token"
//	@Failure		500	{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/invoices [get]
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
		Status:        lib.NullOrString(r.URL.Query().Get("status")),
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
	Label       string          `json:"label"        validate:"required"      example:"January Rent"    description:"Label for the line item"`
	Category    string          `json:"category"     validate:"required,oneof=RENT SECURITY_DEPOSIT INITIAL_DEPOSIT MAINTENANCE_FEE SAAS_FEE EXPENSE"  example:"RENT"  description:"Category of line item"`
	Quantity    int64           `json:"quantity"     validate:"required,min=1" example:"1"               description:"Quantity"`
	UnitAmount  int64           `json:"unit_amount"  validate:"required,min=0" example:"100000"          description:"Unit amount in smallest currency unit"`
	TotalAmount int64           `json:"total_amount" validate:"required,min=0" example:"100000"          description:"Total amount in smallest currency unit"`
	Currency    string          `json:"currency"     validate:"required"       example:"GHS"             description:"Currency code"`
	Metadata    *map[string]any `json:"metadata,omitempty"                     description:"Additional metadata"`
}

// AddLineItem godoc
//
//	@Summary		Add line item to invoice
//	@Description	Add a line item to an existing invoice
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			invoice_id	path		string												true	"Invoice ID"
//	@Param			body		body		AddLineItemRequest								true	"Add line item request body"
//	@Success		201			{object}	object{data=transformations.OutputInvoiceLineItem}	"Line Item Added Successfully"
//	@Failure		400			{object}	lib.HTTPError										"Error occurred when adding line item"
//	@Failure		401			{object}	string												"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError										"Invoice not found"
//	@Failure		422			{object}	lib.HTTPError										"Validation error"
//	@Failure		500			{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/invoices/{invoice_id}/line-items [post]
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
//	@Summary		Get line items for an invoice
//	@Description	Get all line items for an invoice
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			invoice_id	path		string													true	"Invoice ID"
//	@Success		200			{object}	object{data=[]transformations.OutputInvoiceLineItem}	"Line Items"
//	@Failure		400			{object}	lib.HTTPError											"Error occurred when getting line items"
//	@Failure		401			{object}	string													"Invalid or absent authentication token"
//	@Failure		500			{object}	string													"An unexpected error occurred"
//	@Router			/api/v1/invoices/{invoice_id}/line-items [get]
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
