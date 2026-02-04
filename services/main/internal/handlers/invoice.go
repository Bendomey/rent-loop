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
	appCtx  pkg.AppContext
	service services.InvoiceService
}

func NewInvoiceHandler(appCtx pkg.AppContext, service services.InvoiceService) InvoiceHandler {
	return InvoiceHandler{appCtx: appCtx, service: service}
}

type UpdateInvoiceRequest struct {
	Status              *string   `json:"status,omitempty"                validate:"omitempty,oneof=DRAFT ISSUED PARTIALLY_PAID PAID VOID" example:"ISSUED"    description:"Invoice status"`
	AllowedPaymentRails *[]string `json:"allowed_payment_rails,omitempty" validate:"omitempty,dive,oneof=MOMO BANK OFFLINE CARD"           example:"MOMO,BANK" description:"Allowed payment rails"`
}

// UpdateInvoice godoc
//
//	@Summary		Update invoice
//	@Description	Update an existing invoice
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			invoice_id	path		string										true	"Invoice ID"
//	@Param			body		body		UpdateInvoiceRequest						true	"Update invoice request body"
//	@Success		200			{object}	object{data=transformations.OutputInvoice}	"Invoice Updated Successfully"
//	@Failure		400			{object}	lib.HTTPError								"Error occurred when updating invoice"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError								"Invoice not found"
//	@Failure		422			{object}	lib.HTTPError								"Validation error"
//	@Failure		500			{object}	string										"An unexpected error occurred"
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

// VoidInvoice godoc
//
//	@Summary		Void invoice
//	@Description	Void an existing invoice
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			invoice_id	path		string										true	"Invoice ID"
//	@Success		200			{object}	object{data=transformations.OutputInvoice}	"Invoice Voided Successfully"
//	@Failure		400			{object}	lib.HTTPError								"Error occurred when voiding invoice"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError								"Invoice not found"
//	@Failure		422			{object}	lib.HTTPError								"Validation error"
//	@Failure		500			{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/invoices/{invoice_id}/void [patch]
func (h *InvoiceHandler) VoidInvoice(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "invoice_id")

	input := services.VoidInvoiceInput{
		InvoiceID: invoiceID,
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
//	@Summary		Get invoice
//	@Description	Get invoice by ID
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			invoice_id	path		string										true	"Invoice ID"
//	@Param			q			query		GetInvoiceQuery								true	"Query parameters"
//	@Success		200			{object}	object{data=transformations.OutputInvoice}	"Invoice"
//	@Failure		400			{object}	lib.HTTPError								"Error occurred when getting invoice"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError								"Invoice not found"
//	@Failure		500			{object}	string										"An unexpected error occurred"
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
	PayerType     *string  `json:"payer_type"      query:"payer_type"`
	PayerClientID *string  `json:"payer_client_id" query:"payer_client_id"`
	PayerTenantID *string  `json:"payer_tenant_id" query:"payer_tenant_id"`
	PayeeType     *string  `json:"payee_type"      query:"payee_type"`
	PayeeClientID *string  `json:"payee_client_id" query:"payee_client_id"`
	ContextType   *string  `json:"context_type"    query:"context_type"`
	Status        *string  `json:"status"          query:"status"`
	Active        *bool    `json:"active"          query:"active"          description:"Filter invoices by active status. true for active invoices, false for VOID invoices"`
	IDs           []string `json:"ids"                                     description:"List of property block IDs to filter by"                                             validate:"omitempty,dive,uuid4" example:"a8098c1a-f86e-11da-bd1a-00112444be1e" collectionFormat:"multi"`
}

// ListInvoices godoc
//
//	@Summary		List invoices
//	@Description	List invoices with optional filters
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q	query		ListInvoicesQuery																					true	"Query parameters"
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputInvoice,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Invoices"
//	@Failure		400	{object}	lib.HTTPError																						"Error occurred when listing invoices"
//	@Failure		401	{object}	string																								"Invalid or absent authentication token"
//	@Failure		500	{object}	string																								"An unexpected error occurred"
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
		IDs:           lib.NullOrStringArray(r.URL.Query()["ids"]),
		Active:        lib.NullOrBool(r.URL.Query().Get("active")),
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
//	@Summary		Add line item to invoice
//	@Description	Add a line item to an existing invoice
//	@Tags			Invoice
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			invoice_id	path		string												true	"Invoice ID"
//	@Param			body		body		AddLineItemRequest									true	"Add line item request body"
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
