package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type MaintenanceRequestFinancialHandler struct {
	service              services.MaintenanceRequestFinancialService
	tenantAccountService services.TenantAccountService
	appCtx               pkg.AppContext
}

func NewMaintenanceRequestFinancialHandler(
	appCtx pkg.AppContext,
	service services.MaintenanceRequestFinancialService,
	tenantAccountService services.TenantAccountService,
) MaintenanceRequestFinancialHandler {
	return MaintenanceRequestFinancialHandler{
		appCtx:               appCtx,
		service:              service,
		tenantAccountService: tenantAccountService,
	}
}

// ─── Request Bodies / Query Types ─────────────────────────────────────────────

type ListFinancialsQuery struct {
	lib.FilterQueryInput
	SettlementType *string `json:"settlement_type,omitempty" query:"settlement_type" validate:"omitempty,oneof=RECORD_ONLY TENANT_CHARGE VENDOR_EXPENSE" description:"Filter by settlement type"`
}

// CreateFinancialBody's conditional requirements — a vendor name when the type
// is VENDOR_EXPENSE — are enforced in the service, because a validate tag
// cannot express "required only when this other field has that value".
type CreateFinancialBody struct {
	Description    string `json:"description"     validate:"required"`
	Amount         int64  `json:"amount"          validate:"required,gt=0"`
	Currency       string `json:"currency"        validate:"omitempty"`
	SettlementType string `json:"settlement_type" validate:"required,oneof=RECORD_ONLY TENANT_CHARGE VENDOR_EXPENSE"`

	ChargeCategory string  `json:"charge_category" validate:"omitempty,oneof=MAINTENANCE_CHARGE DAMAGE_CHARGE UTILITY OTHER"`
	ChargeDueDate  *string `json:"charge_due_date" validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`

	ExpenseCategory  string  `json:"expense_category"  validate:"omitempty,oneof=REPAIRS UTILITIES INSURANCE LANDSCAPING SECURITY MANAGEMENT OTHER"`
	VendorName       string  `json:"vendor_name"       validate:"omitempty"`
	VendorContact    *string `json:"vendor_contact"    validate:"omitempty"`
	DueDate          *string `json:"due_date"          validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	AlreadyPaid      bool    `json:"already_paid"`
	PaymentProvider  *string `json:"payment_provider"  validate:"omitempty"`
	PaymentReference *string `json:"payment_reference" validate:"omitempty"`
}

type UpdateFinancialBody struct {
	Description       *string `json:"description,omitempty"`
	NewSettlementType *string `json:"settlement_type,omitempty"  validate:"omitempty,oneof=RECORD_ONLY TENANT_CHARGE VENDOR_EXPENSE"`
	ChargeCategory    string  `json:"charge_category,omitempty"  validate:"omitempty,oneof=MAINTENANCE_CHARGE DAMAGE_CHARGE UTILITY OTHER"`
	ChargeDueDate     *string `json:"charge_due_date,omitempty"  validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	ExpenseCategory   string  `json:"expense_category,omitempty" validate:"omitempty,oneof=REPAIRS UTILITIES INSURANCE LANDSCAPING SECURITY MANAGEMENT OTHER"`
	VendorName        string  `json:"vendor_name,omitempty"`
	VendorContact     *string `json:"vendor_contact,omitempty"`
}

type VoidFinancialBody struct {
	Reason string `json:"reason" validate:"required"`
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

// CreateFinancial godoc
//
//	@Summary		Log a financial line on a maintenance request
//	@Description	Record what part of a request cost and who settles it: nobody (RECORD_ONLY), the tenant on the request's lease (TENANT_CHARGE, which creates a charge on their financial account), or an external vendor (VENDOR_EXPENSE, which creates an expense and its bill). TENANT_CHARGE is refused when the request has no lease (Admin)
//	@Tags			MaintenanceRequestFinancials
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			client_id				path		string															true	"Client ID"
//	@Param			property_id				path		string															true	"Property ID"
//	@Param			maintenance_request_id	path		string															true	"Maintenance Request ID"
//	@Param			body					body		CreateFinancialBody												true	"Financial line details"
//	@Success		201						{object}	object{data=transformations.OutputMaintenanceRequestFinancial}	"Created financial line"
//	@Failure		400						{object}	lib.HTTPError													"Request has no lease, vendor name missing, or amount not positive"
//	@Failure		401						{object}	string															"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError													"Maintenance request not found"
//	@Failure		422						{object}	lib.HTTPError													"Validation error"
//	@Failure		500						{object}	string															"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/maintenance-requests/{maintenance_request_id}/financials [post]
func (h *MaintenanceRequestFinancialHandler) CreateFinancial(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateFinancialBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	financial, err := h.service.CreateFinancial(r.Context(), services.CreateFinancialInput{
		MaintenanceRequestID: chi.URLParam(r, "maintenance_request_id"),
		Description:          body.Description,
		Amount:               body.Amount,
		Currency:             body.Currency,
		SettlementType:       body.SettlementType,
		ClientUserID:         currentUser.ID,
		ChargeCategory:       body.ChargeCategory,
		ChargeDueDate:        parseOptionalRFC3339(body.ChargeDueDate),
		ExpenseCategory:      body.ExpenseCategory,
		VendorName:           body.VendorName,
		VendorContact:        body.VendorContact,
		DueDate:              parseOptionalRFC3339(body.DueDate),
		AlreadyPaid:          body.AlreadyPaid,
		PaymentProvider:      body.PaymentProvider,
		PaymentReference:     body.PaymentReference,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBMaintenanceRequestFinancialToRest(financial),
	})
}

// ListFinancials godoc
//
//	@Summary		List a maintenance request's financial lines
//	@Description	List every costed line on a request, with its derived status and whether it can still be edited (Admin)
//	@Tags			MaintenanceRequestFinancials
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			client_id				path		string																													true	"Client ID"
//	@Param			property_id				path		string																													true	"Property ID"
//	@Param			maintenance_request_id	path		string																													true	"Maintenance Request ID"
//	@Param			q						query		ListFinancialsQuery																										false	"Query parameters"
//	@Success		200						{object}	object{data=object{rows=[]transformations.OutputMaintenanceRequestFinancial,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Financial lines"
//	@Failure		401						{object}	string																													"Invalid or absent authentication token"
//	@Failure		500						{object}	string																													"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/maintenance-requests/{maintenance_request_id}/financials [get]
func (h *MaintenanceRequestFinancialHandler) ListFinancials(w http.ResponseWriter, r *http.Request) {
	if _, ok := lib.ClientUserFromContext(r.Context()); !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filterQuery, err := lib.GenerateQuery(r.URL.Query())
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	mrID := chi.URLParam(r, "maintenance_request_id")
	filters := repository.ListMaintenanceRequestFinancialsFilter{
		MaintenanceRequestID: &mrID,
		SettlementType:       optionalQueryParam(r, "settlement_type"),
	}

	h.respondWithList(w, r, *filterQuery, filters, transformations.DBMaintenanceRequestFinancialToRest)
}

// UpdateFinancial godoc
//
//	@Summary		Edit or convert a financial line
//	@Description	Change a line's description, or convert who settles it. Conversion voids the old charge or expense and creates the new one, because a charge and an expense are obligations to different parties. Refused once the line has been billed or paid (Admin)
//	@Tags			MaintenanceRequestFinancials
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			client_id				path		string															true	"Client ID"
//	@Param			property_id				path		string															true	"Property ID"
//	@Param			maintenance_request_id	path		string															true	"Maintenance Request ID"
//	@Param			financial_id			path		string															true	"Financial line ID"
//	@Param			body					body		UpdateFinancialBody												true	"Fields to change"
//	@Success		200						{object}	object{data=transformations.OutputMaintenanceRequestFinancial}	"Updated financial line"
//	@Failure		400						{object}	lib.HTTPError													"Line is billed or settled and frozen"
//	@Failure		401						{object}	string															"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError													"Financial line not found"
//	@Failure		422						{object}	lib.HTTPError													"Validation error"
//	@Failure		500						{object}	string															"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/maintenance-requests/{maintenance_request_id}/financials/{financial_id} [patch]
func (h *MaintenanceRequestFinancialHandler) UpdateFinancial(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body UpdateFinancialBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	financial, err := h.service.UpdateFinancial(r.Context(), services.UpdateFinancialInput{
		FinancialID:       chi.URLParam(r, "financial_id"),
		Description:       body.Description,
		NewSettlementType: body.NewSettlementType,
		ClientUserID:      currentUser.ID,
		ChargeCategory:    body.ChargeCategory,
		ChargeDueDate:     parseOptionalRFC3339(body.ChargeDueDate),
		ExpenseCategory:   body.ExpenseCategory,
		VendorName:        body.VendorName,
		VendorContact:     body.VendorContact,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBMaintenanceRequestFinancialToRest(financial),
	})
}

// VoidFinancial godoc
//
//	@Summary		Void a financial line
//	@Description	Withdraw a line and whatever obligation it created — the tenant's charge, or the vendor's expense and its bill. Refused once the line has been billed or paid (Admin)
//	@Tags			MaintenanceRequestFinancials
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			client_id				path		string				true	"Client ID"
//	@Param			property_id				path		string				true	"Property ID"
//	@Param			maintenance_request_id	path		string				true	"Maintenance Request ID"
//	@Param			financial_id			path		string				true	"Financial line ID"
//	@Param			body					body		VoidFinancialBody	true	"Reason for voiding"
//	@Success		200						{object}	object{data=bool}	"Financial line voided"
//	@Failure		400						{object}	lib.HTTPError		"Line is billed or settled and frozen"
//	@Failure		401						{object}	string				"Invalid or absent authentication token"
//	@Failure		404						{object}	lib.HTTPError		"Financial line not found"
//	@Failure		422						{object}	lib.HTTPError		"Validation error"
//	@Failure		500						{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/maintenance-requests/{maintenance_request_id}/financials/{financial_id}/void [patch]
func (h *MaintenanceRequestFinancialHandler) VoidFinancial(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body VoidFinancialBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	err := h.service.VoidFinancial(
		r.Context(),
		chi.URLParam(r, "financial_id"),
		body.Reason,
		&currentUser.ID,
	)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": true})
}

// TenantListFinancials godoc
//
//	@Summary		List the charges a maintenance request raised against you
//	@Description	Returns only lines the caller is being charged for. Vendor expenses and record-only lines are excluded in the query, so what the landlord paid a contractor is never exposed (Tenant)
//	@Tags			MaintenanceRequestFinancials
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			maintenance_request_id	path		string																		true	"Maintenance Request ID"
//	@Success		200						{object}	object{data=object{rows=[]object,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Charges raised against the caller"
//	@Failure		401						{object}	string																		"Invalid or absent authentication token"
//	@Failure		500						{object}	string																		"An unexpected error occurred"
//	@Router			/api/v1/leases/{lease_id}/maintenance-requests/{maintenance_request_id}/financials [get]
func (h *MaintenanceRequestFinancialHandler) TenantListFinancials(w http.ResponseWriter, r *http.Request) {
	tenantAccount, ok := lib.TenantAccountFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	account, accountErr := h.tenantAccountService.GetMe(r.Context(), tenantAccount.ID)
	if accountErr != nil {
		HandleErrorResponse(w, accountErr)
		return
	}

	filterQuery, err := lib.GenerateQuery(r.URL.Query())
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	mrID := chi.URLParam(r, "maintenance_request_id")
	settlementType := "TENANT_CHARGE"
	filters := repository.ListMaintenanceRequestFinancialsFilter{
		MaintenanceRequestID: &mrID,
		SettlementType:       &settlementType,
		TenantID:             &account.TenantId,
	}

	h.respondWithList(w, r, *filterQuery, filters, transformations.DBTenantMaintenanceRequestFinancialToRest)
}

func (h *MaintenanceRequestFinancialHandler) respondWithList(
	w http.ResponseWriter,
	r *http.Request,
	filterQuery lib.FilterQuery,
	filters repository.ListMaintenanceRequestFinancialsFilter,
	transform func(*models.MaintenanceRequestFinancial) any,
) {
	financials, listErr := h.service.ListFinancials(r.Context(), filterQuery, filters)
	if listErr != nil {
		HandleErrorResponse(w, listErr)
		return
	}

	count, countErr := h.service.CountFinancials(r.Context(), filterQuery, filters)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]any, len(financials))
	for i := range financials {
		rows[i] = transform(&financials[i])
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(&filterQuery, rows, count))
}
