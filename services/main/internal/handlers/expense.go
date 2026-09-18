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
	ContextType *string `json:"context_type,omitempty" query:"context_type" validate:"omitempty,oneof=MAINTENANCE GENERAL"                                               description:"Filter by context type"`
	Category    *string `json:"category,omitempty"     query:"category"     validate:"omitempty,oneof=REPAIRS UTILITIES INSURANCE LANDSCAPING SECURITY MANAGEMENT OTHER" description:"Filter by category"`
}

// CreateExpenseBody has no context_type: a maintenance expense is created
// through the maintenance request's financial line, never directly here.
type CreateExpenseBody struct {
	Category         string  `json:"category"          validate:"required,oneof=REPAIRS UTILITIES INSURANCE LANDSCAPING SECURITY MANAGEMENT OTHER"`
	VendorName       string  `json:"vendor_name"       validate:"required"`
	VendorContact    *string `json:"vendor_contact"    validate:"omitempty"`
	Description      string  `json:"description"       validate:"required"`
	Amount           int64   `json:"amount"            validate:"required,gt=0"`
	Currency         string  `json:"currency"          validate:"omitempty"`
	DueDate          *string `json:"due_date"          validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	AlreadyPaid      bool    `json:"already_paid"`
	PaymentProvider  *string `json:"payment_provider"  validate:"omitempty"`
	PaymentReference *string `json:"payment_reference" validate:"omitempty"`
}

type UpdateExpenseBody struct {
	Description   *string `json:"description,omitempty"`
	Category      *string `json:"category,omitempty"       validate:"omitempty,oneof=REPAIRS UTILITIES INSURANCE LANDSCAPING SECURITY MANAGEMENT OTHER"`
	VendorName    *string `json:"vendor_name,omitempty"`
	VendorContact *string `json:"vendor_contact,omitempty"`
}

type VoidExpenseBody struct {
	Reason string `json:"reason" validate:"required"`
}

// optionalQueryParam returns nil for an absent or empty parameter, so an
// unset filter stays unset rather than matching the empty string.
func optionalQueryParam(r *http.Request, key string) *string {
	value := r.URL.Query().Get(key)
	if value == "" {
		return nil
	}
	return &value
}

// parseOptionalRFC3339 turns an optional timestamp string into a time. The
// validator has already rejected a malformed value, so an unparseable string
// here can only be an absent one.
func parseOptionalRFC3339(value *string) *time.Time {
	if value == nil || *value == "" {
		return nil
	}
	parsed, err := time.Parse(time.RFC3339, *value)
	if err != nil {
		return nil
	}
	return &parsed
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

// CreateExpense godoc
//
//	@Summary		Record a general expense
//	@Description	Record money owed to a vendor for a service provided to the property, and raise the bill for it. Set already_paid to settle it in the same step. Maintenance expenses are created through a maintenance request's financial line, not here (Admin)
//	@Tags			Expenses
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			client_id	path		string										true	"Client ID"
//	@Param			property_id	path		string										true	"Property ID"
//	@Param			body		body		CreateExpenseBody							true	"Expense details"
//	@Success		201			{object}	object{data=transformations.OutputExpense}	"Created expense"
//	@Failure		400			{object}	lib.HTTPError								"Vendor name missing or amount not positive"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		422			{object}	lib.HTTPError								"Validation error"
//	@Failure		500			{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/expenses [post]
func (h *ExpenseHandler) CreateExpense(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateExpenseBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	clientID := chi.URLParam(r, "client_id")
	expense, err := h.service.CreateExpense(r.Context(), services.CreateExpenseInput{
		PropertyID:       chi.URLParam(r, "property_id"),
		ClientID:         &clientID,
		ContextType:      "GENERAL",
		Category:         body.Category,
		VendorName:       body.VendorName,
		VendorContact:    body.VendorContact,
		Description:      body.Description,
		Amount:           body.Amount,
		Currency:         body.Currency,
		DueDate:          parseOptionalRFC3339(body.DueDate),
		ClientUserID:     currentUser.ID,
		AlreadyPaid:      body.AlreadyPaid,
		PaymentProvider:  body.PaymentProvider,
		PaymentReference: body.PaymentReference,
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

// UpdateExpense godoc
//
//	@Summary		Update an unpaid expense
//	@Description	Change the description or vendor of an expense nobody has paid yet. Amount and category cannot be changed — void and recreate instead, because the journal entry already posted carries the old figure and debits the account the old category chose (Admin)
//	@Tags			Expenses
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			client_id	path		string										true	"Client ID"
//	@Param			property_id	path		string										true	"Property ID"
//	@Param			expense_id	path		string										true	"Expense ID"
//	@Param			body		body		UpdateExpenseBody							true	"Fields to change"
//	@Success		200			{object}	object{data=transformations.OutputExpense}	"Updated expense"
//	@Failure		400			{object}	lib.HTTPError								"Expense is settled and frozen"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError								"Expense not found"
//	@Failure		422			{object}	lib.HTTPError								"Validation error"
//	@Failure		500			{object}	string										"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/expenses/{expense_id} [patch]
func (h *ExpenseHandler) UpdateExpense(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body UpdateExpenseBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	expense, err := h.service.UpdateExpense(r.Context(), services.UpdateExpenseInput{
		ExpenseID:     chi.URLParam(r, "expense_id"),
		Description:   body.Description,
		Category:      body.Category,
		VendorName:    body.VendorName,
		VendorContact: body.VendorContact,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBExpenseToRest(expense),
	})
}

// VoidExpense godoc
//
//	@Summary		Void an expense
//	@Description	Withdraw an unpaid expense and the bill raised for it. The invoice is voided too, which reverses the journal entry. A paid expense cannot be voided (Admin)
//	@Tags			Expenses
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			client_id	path		string				true	"Client ID"
//	@Param			property_id	path		string				true	"Property ID"
//	@Param			expense_id	path		string				true	"Expense ID"
//	@Param			body		body		VoidExpenseBody		true	"Reason for voiding"
//	@Success		200			{object}	object{data=bool}	"Expense voided"
//	@Failure		400			{object}	lib.HTTPError		"Expense is settled and frozen"
//	@Failure		401			{object}	string				"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError		"Expense not found"
//	@Failure		422			{object}	lib.HTTPError		"Validation error"
//	@Failure		500			{object}	string				"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/expenses/{expense_id}/void [patch]
func (h *ExpenseHandler) VoidExpense(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body VoidExpenseBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	err := h.service.VoidExpense(
		r.Context(),
		chi.URLParam(r, "expense_id"),
		body.Reason,
		&currentUser.ID,
	)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": true})
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

	filterQuery, err := lib.GenerateQuery(r.URL.Query())
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	propertyID := chi.URLParam(r, "property_id")
	propertyIDs := []string{propertyID}
	filters := repository.ListExpensesFilter{
		PropertyIDs: &propertyIDs,
		ContextType: optionalQueryParam(r, "context_type"),
		Category:    optionalQueryParam(r, "category"),
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

// ListExpensesAcrossProperties godoc
//
//	@Summary		List expenses across properties (Admin, mobile)
//	@Description	List expenses across every property the caller has access to, optionally narrowed with one or more property_id query values
//	@Tags			Expenses
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	query		[]string																							false	"Property ID(s) to narrow results to; omit to see every property the caller can access"	collectionFormat(multi)
//	@Param			q			query		ListExpensesQuery																					false	"Query parameters"
//	@Success		200			{object}	object{data=object{rows=[]transformations.OutputExpense,meta=lib.HTTPReturnPaginatedMetaResponse}}	"Expenses"
//	@Failure		401			{object}	string																								"Invalid or absent authentication token"
//	@Failure		403			{object}	string																								"Requested property_id is outside the caller's access scope"
//	@Failure		500			{object}	string																								"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/expenses [get]
func (h *ExpenseHandler) ListExpensesAcrossProperties(w http.ResponseWriter, r *http.Request) {
	_, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filterQuery, err := lib.GenerateQuery(r.URL.Query())
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	propertyIDs, currentUserID, scopeOk := ValidateRequestedPropertyAccess(w, r, h.appCtx)
	if !scopeOk {
		return
	}

	filters := repository.ListExpensesFilter{
		PropertyIDs:  propertyIDs,
		ClientUserID: &currentUserID,
		ContextType:  optionalQueryParam(r, "context_type"),
		Category:     optionalQueryParam(r, "category"),
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
