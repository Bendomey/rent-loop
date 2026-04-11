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

type ExpenseHandler struct {
	service services.ExpenseService
	appCtx  pkg.AppContext
}

func NewExpenseHandler(appCtx pkg.AppContext, service services.ExpenseService) ExpenseHandler {
	return ExpenseHandler{appCtx: appCtx, service: service}
}

// ─── Request Bodies / Query Types ─────────────────────────────────────────────
type ListExpensesQuery struct {
	lib.FilterQueryInput
	ContextType *string `json:"context_type,omitempty" query:"context_type" validate:"omitempty,oneof=LEASE MAINTENANCE" description:"Filter by context type"`
}

type AddExpenseBody struct {
	ContextType                 string  `json:"context_type"                   validate:"required,oneof=LEASE MAINTENANCE"`
	ContextLeaseID              *string `json:"context_lease_id"               validate:"omitempty,uuid4"`
	ContextMaintenanceRequestID *string `json:"context_maintenance_request_id" validate:"omitempty,uuid4"`
	Description                 string  `json:"description"                    validate:"required"`
	Amount                      int64   `json:"amount"                         validate:"required,gt=0"`
	Currency                    string  `json:"currency"                       validate:"omitempty"`
}

type GenerateExpenseInvoicePayerBody struct {
	Amount    int64  `json:"amount"     validate:"required,gt=0"`
	PayerType string `json:"payer_type" validate:"required,oneof=TENANT PROPERTY_OWNER EXTERNAL"`
	PayeeType string `json:"payee_type" validate:"required,oneof=TENANT PROPERTY_OWNER EXTERNAL"`
}

type GenerateExpenseInvoiceBody struct {
	Payers []GenerateExpenseInvoicePayerBody `json:"payers" validate:"required,min=1,dive"`
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

// AddExpense godoc
//
//	@Summary		Add an expense to a property
//	@Description	Create a new expense scoped to a property (context_type determines lease or maintenance) (Admin)
//	@Tags			Expenses
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	path		string										true	"Property ID"
//	@Param			body		body		AddExpenseBody								true	"Expense details"
//	@Success		201			{object}	object{data=transformations.OutputExpense}	"Created expense"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		422			{object}	lib.HTTPError								"Validation error"
//	@Failure		500			{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/expenses [post]
func (h *ExpenseHandler) AddExpense(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body AddExpenseBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	expense, err := h.service.AddExpense(r.Context(), services.AddExpenseInput{
		PropertyID:                  chi.URLParam(r, "property_id"),
		ContextType:                 body.ContextType,
		ContextLeaseID:              body.ContextLeaseID,
		ContextMaintenanceRequestID: body.ContextMaintenanceRequestID,
		Description:                 body.Description,
		Amount:                      body.Amount,
		Currency:                    body.Currency,
		ClientUserID:                currentUser.ID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBExpenseToRest(expense),
	})
}

// GetExpense godoc
//
//	@Summary		Get a single expense
//	@Description	Fetch a single expense by ID scoped to a property (Admin)
//	@Tags			Expenses
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	path		string										true	"Property ID"
//	@Param			expense_id	path		string										true	"Expense ID"
//	@Success		200			{object}	object{data=transformations.OutputExpense}	"Expense"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError								"Expense not found"
//	@Failure		500			{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/expenses/{expense_id} [get]
func (h *ExpenseHandler) GetExpense(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	expense, err := h.service.GetExpense(r.Context(), chi.URLParam(r, "expense_id"))
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBExpenseToRest(expense),
	})
}

// DeleteExpense godoc
//
//	@Summary		Delete an expense
//	@Description	Remove an expense record scoped to a property (Admin)
//	@Tags			Expenses
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	path		string				true	"Property ID"
//	@Param			expense_id	path		string				true	"Expense ID"
//	@Success		200			{object}	object{data=bool}	"Expense deleted successfully"
//	@Failure		401			{object}	string				"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError		"Expense not found"
//	@Failure		500			{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/expenses/{expense_id} [delete]
func (h *ExpenseHandler) DeleteExpense(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := h.service.DeleteExpense(r.Context(), chi.URLParam(r, "expense_id")); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": true})
}

// GenerateExpenseInvoice godoc
//
//	@Summary		Generate invoices from an expense
//	@Description	Create one invoice per payer from a specific expense (Admin)
//	@Tags			Expenses
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	path		string											true	"Property ID"
//	@Param			expense_id	path		string											true	"Expense ID"
//	@Param			body		body		GenerateExpenseInvoiceBody						true	"Payers for this expense"
//	@Success		201			{object}	object{data=[]transformations.OutputInvoice}	"Generated invoices"
//	@Failure		400			{object}	lib.HTTPError									"Validation error or no payers provided"
//	@Failure		401			{object}	string											"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError									"Expense not found"
//	@Failure		422			{object}	lib.HTTPError									"Validation error"
//	@Failure		500			{object}	string											"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/expenses/{expense_id}/generate:invoice [post]
func (h *ExpenseHandler) GenerateExpenseInvoice(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body GenerateExpenseInvoiceBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	var payers []services.GenerateExpenseInvoicePayerInput
	for _, p := range body.Payers {
		payers = append(payers, services.GenerateExpenseInvoicePayerInput{
			Amount:    p.Amount,
			PayerType: p.PayerType,
			PayeeType: p.PayeeType,
		})
	}

	invoices, err := h.service.GenerateExpenseInvoice(
		r.Context(),
		services.GenerateExpenseInvoiceInput{
			ExpenseID: chi.URLParam(r, "expense_id"),
			ClientID:  currentUser.ClientID,
			Payers:    payers,
		},
	)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	rows := make([]any, len(invoices))
	for i := range invoices {
		rows[i] = transformations.DBInvoiceToRest(&invoices[i])
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{"data": rows})
}

// ListPropertyExpenses godoc
//
//	@Summary		List all expenses for a property
//	@Description	List all expenses (across all contexts) scoped to a property (Admin)
//	@Tags			Expenses
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	path		string																								true	"Property ID"
//	@Param			q			query		ListExpensesQuery																					false	"Query parameters"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputExpense,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Expenses"
//	@Failure		401			{object}	string																								"Invalid or absent authentication token"
//	@Failure		500			{object}	string																								"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/expenses [get]
func (h *ExpenseHandler) ListPropertyExpenses(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var listQuery ListExpensesQuery
	if !lib.ValidateRequest(h.appCtx.Validator, listQuery, w) {
		return
	}

	filterQuery, err := lib.GenerateQuery(r.URL.Query())
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	filters := repository.ListExpensesFilter{
		PropertyID: chi.URLParam(r, "property_id"),
	}

	expenses, listErr := h.service.ListExpenses(r.Context(), *filterQuery, filters)
	count, countErr := h.service.CountExpenses(r.Context(), *filterQuery, filters)
	if listErr != nil {
		HandleErrorResponse(w, listErr)
		return
	}
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]any, len(expenses))
	for i := range expenses {
		rows[i] = transformations.DBExpenseToRest(&expenses[i])
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}

// ListLeaseExpenses godoc
//
//	@Summary		List expenses for a lease
//	@Description	List expenses with pagination scoped to a lease (Admin)
//	@Tags			Expenses
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	path		string																								true	"Property ID"
//	@Param			lease_id	path		string																								true	"Lease ID"
//	@Param			q			query		ListExpensesQuery																					false	"Query parameters"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputExpense,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Expenses"
//	@Failure		401			{object}	string																								"Invalid or absent authentication token"
//	@Failure		500			{object}	string																								"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/expenses [get]
func (h *ExpenseHandler) ListLeaseExpenses(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var listQuery ListExpensesQuery
	if !lib.ValidateRequest(h.appCtx.Validator, listQuery, w) {
		return
	}

	filterQuery, err := lib.GenerateQuery(r.URL.Query())
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	leaseID := chi.URLParam(r, "lease_id")
	filters := repository.ListExpensesFilter{
		PropertyID:     chi.URLParam(r, "property_id"),
		ContextLeaseID: &leaseID,
	}

	expenses, listErr := h.service.ListExpenses(r.Context(), *filterQuery, filters)
	count, countErr := h.service.CountExpenses(r.Context(), *filterQuery, filters)
	if listErr != nil {
		HandleErrorResponse(w, listErr)
		return
	}
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]any, len(expenses))
	for i := range expenses {
		rows[i] = transformations.DBExpenseToRest(&expenses[i])
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}

// ListMRExpenses godoc
//
//	@Summary		List expenses for a maintenance request
//	@Description	List expenses with pagination scoped to a maintenance request (Admin)
//	@Tags			Expenses
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id				path		string																								true	"Property ID"
//	@Param			maintenance_request_id	path		string																								true	"Maintenance Request ID"
//	@Param			q						query		ListExpensesQuery																					false	"Query parameters"
//	@Success		200						{object}	object{data=object{rows=[]transformations.OutputExpense,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Expenses"
//	@Failure		401						{object}	string																								"Invalid or absent authentication token"
//	@Failure		500						{object}	string																								"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/maintenance-requests/{maintenance_request_id}/expenses [get]
func (h *ExpenseHandler) ListMRExpenses(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var listQuery ListExpensesQuery
	if !lib.ValidateRequest(h.appCtx.Validator, listQuery, w) {
		return
	}

	filterQuery, err := lib.GenerateQuery(r.URL.Query())
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	mrID := chi.URLParam(r, "maintenance_request_id")
	filters := repository.ListExpensesFilter{
		PropertyID:                  chi.URLParam(r, "property_id"),
		ContextMaintenanceRequestID: &mrID,
	}

	expenses, listErr := h.service.ListExpenses(r.Context(), *filterQuery, filters)
	count, countErr := h.service.CountExpenses(r.Context(), *filterQuery, filters)
	if listErr != nil {
		HandleErrorResponse(w, listErr)
		return
	}
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	rows := make([]any, len(expenses))
	for i := range expenses {
		rows[i] = transformations.DBExpenseToRest(&expenses[i])
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, rows, count))
}
