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

type PaymentAccountHandler struct {
	appCtx  pkg.AppContext
	service services.PaymentAccountService
}

func NewPaymentAccountHandler(appCtx pkg.AppContext, service services.PaymentAccountService) PaymentAccountHandler {
	return PaymentAccountHandler{appCtx, service}
}

type CreatePaymentAccountRequest struct {
	Rail       string          `json:"rail"                 validate:"required,oneof=MOMO BANK_TRANSFER CARD OFFLINE" example:"MOMO"       description:"Payment rail type"`
	Provider   *string         `json:"provider,omitempty"   validate:"omitempty,oneof=MTN VODAFONE AIRTELTIGO"        example:"MTN"        description:"Payment provider (e.g., MTN, VODAFONE)"`
	Identifier *string         `json:"identifier,omitempty" validate:"omitempty"                                      example:"0241234567" description:"Account identifier (phone number, account number, etc.)"`
	Metadata   *map[string]any `json:"metadata,omitempty"                                                                                  description:"Additional metadata for the payment account"`
	IsDefault  bool            `json:"is_default"           validate:"omitempty"                                      example:"false"      description:"Whether this is the default payment account"`
	Status     string          `json:"status"               validate:"required,oneof=ACTIVE DISABLED"                 example:"ACTIVE"     description:"Status of the payment account"`
}

// CreatePaymentAccount godoc
//
//	@Summary		Creates a new payment account
//	@Description	Create a new payment account for a client
//	@Tags			Payment Accounts
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			body	body		CreatePaymentAccountRequest							true	"Create Payment Account Request Body"
//	@Success		201		{object}	object{data=transformations.OutputPaymentAccount}	"Payment account created successfully"
//	@Failure		400		{object}	lib.HTTPError										"Error occurred when creating a payment account"
//	@Failure		401		{object}	string												"Invalid or absent authentication token"
//	@Failure		500		{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/payment-accounts [post]
func (h *PaymentAccountHandler) CreatePaymentAccount(w http.ResponseWriter, r *http.Request) {
	currentClientUser, currentClientUserOk := lib.ClientUserFromContext(r.Context())

	if !currentClientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreatePaymentAccountRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	paymentAccount, err := h.service.CreatePaymentAccount(r.Context(), services.CreatePaymentAccountInput{
		OwnerType:  "PROPERTY_OWNER",
		ClientID:   currentClientUser.ClientID,
		Rail:       body.Rail,
		Provider:   body.Provider,
		Identifier: body.Identifier,
		Metadata:   body.Metadata,
		IsDefault:  body.IsDefault,
		Status:     body.Status,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBPaymentAccountToRest(paymentAccount),
	})
}

type ListPaymentAccountsFilterRequest struct {
	lib.FilterQueryInput
	OwnerTypes []string `json:"owner_types" validate:"omitempty,dive,oneof=PROPERTY_OWNER RENTLOOP SYSTEM"`
	Rail       *string  `json:"rail"        validate:"omitempty,oneof=MOMO BANK_TRANSFER CARD OFFLINE"`
	Provider   *string  `json:"provider"    validate:"omitempty,oneof=MTN VODAFONE AIRTELTIGO BANK_API"`
	IsDefault  *bool    `json:"is_default"  validate:"omitempty"`
	Status     *string  `json:"status"      validate:"omitempty,oneof=ACTIVE DISABLED"`
	IDs        []string `json:"ids"         validate:"omitempty,dive,uuid4"                                example:"a8098c1a-f86e-11da-bd1a-00112444be1e" description:"List of property block IDs to filter by" collectionFormat:"multi"`
}

// ListPaymentAccounts godoc
//
//	@Summary		Get all payment accounts
//	@Description	Get all payment accounts for the current client
//	@Tags			Payment Accounts
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			q	query		ListPaymentAccountsFilterRequest	true	"Payment Accounts Filter"
//	@Success		200	{object}	object{data=object{rows=[]transformations.OutputPaymentAccount,meta=lib.HTTPReturnPaginatedMetaResponse}}
//	@Failure		400	{object}	lib.HTTPError
//	@Failure		401	{object}	string
//	@Failure		500	{object}	string
//	@Router			/api/v1/payment-accounts [get]
func (h *PaymentAccountHandler) ListPaymentAccounts(w http.ResponseWriter, r *http.Request) {
	clientUser, clientUserOk := lib.ClientUserFromContext(r.Context())

	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	isFiltersPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFiltersPassedValidation {
		return
	}

	input := repository.ListPaymentAccountsFilter{
		FilterQuery: *filterQuery,
		ClientID:    &clientUser.ClientID,
		OwnerTypes:  lib.NullOrStringArray(r.URL.Query()["owner_types"]),
		Rail:        lib.NullOrString(r.URL.Query().Get("rail")),
		Provider:    lib.NullOrString(r.URL.Query().Get("provider")),
		IsDefault:   lib.NullOrBool(r.URL.Query().Get("is_default")),
		Status:      lib.NullOrString(r.URL.Query().Get("status")),
		IDs:         lib.NullOrStringArray(r.URL.Query()["ids"]),
	}

	paymentAccounts, paymentAccountsErr := h.service.ListPaymentAccounts(r.Context(), input)
	if paymentAccountsErr != nil {
		HandleErrorResponse(w, paymentAccountsErr)
		return
	}

	count, countErr := h.service.CountPaymentAccounts(r.Context(), input)
	if countErr != nil {
		HandleErrorResponse(w, countErr)
		return
	}

	paymentAccountsTransformed := make([]any, 0)
	for _, paymentAccount := range paymentAccounts {
		paymentAccountsTransformed = append(
			paymentAccountsTransformed,
			transformations.DBPaymentAccountToRest(&paymentAccount),
		)
	}

	json.NewEncoder(w).Encode(lib.ReturnListResponse(filterQuery, paymentAccountsTransformed, count))
}

type GetPaymentAccountQuery struct {
	lib.GetOneQueryInput
}

// GetPaymentAccountById godoc
//
//	@Summary		Get payment account by ID
//	@Description	Get payment account by ID
//	@Tags			Payment Accounts
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			payment_account_id	path		string					true	"Payment Account ID"
//	@Param			q					query		GetPaymentAccountQuery	true	"Payment Account Query"
//	@Success		200					{object}	object{data=transformations.OutputPaymentAccount}
//	@Failure		400					{object}	lib.HTTPError	"Error occurred when fetching a payment account"
//	@Failure		401					{object}	string			"Invalid or absent authentication token"
//	@Failure		404					{object}	lib.HTTPError	"Payment account not found"
//	@Failure		500					{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/payment-accounts/{payment_account_id} [get]
func (h *PaymentAccountHandler) GetPaymentAccountById(w http.ResponseWriter, r *http.Request) {
	_, clientUserOk := lib.ClientUserFromContext(r.Context())
	if !clientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	paymentAccountID := chi.URLParam(r, "payment_account_id")
	filterQuery, filterErr := lib.GenerateQuery(r.URL.Query())
	if filterErr != nil {
		HandleErrorResponse(w, filterErr)
		return
	}

	isFilterQueryPassedValidation := lib.ValidateRequest(h.appCtx.Validator, filterQuery, w)
	if !isFilterQueryPassedValidation {
		return
	}

	query := repository.GetPaymentAccountQuery{
		ID:       paymentAccountID,
		Populate: filterQuery.Populate,
	}

	paymentAccount, err := h.service.GetPaymentAccount(r.Context(), query)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBPaymentAccountToRest(paymentAccount),
	})
}

type UpdatePaymentAccountRequest struct {
	Provider   *string         `json:"provider"   validate:"omitempty"                       example:"MTN"        description:"Payment provider"`
	Identifier *string         `json:"identifier" validate:"omitempty"                       example:"0241234567" description:"Account identifier"`
	Metadata   *map[string]any `json:"metadata"                                                                   description:"Additional metadata"`
	IsDefault  *bool           `json:"is_default" validate:"omitempty"                       example:"true"       description:"Whether this is the default account"`
	Status     *string         `json:"status"     validate:"omitempty,oneof=ACTIVE DISABLED" example:"ACTIVE"     description:"Account status"`
}

// UpdatePaymentAccount godoc
//
//	@Summary		Update an existing payment account
//	@Description	Update an existing payment account
//	@Tags			Payment Accounts
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			payment_account_id	path		string												true	"Payment Account ID"	format(uuid4)
//	@Param			body				body		UpdatePaymentAccountRequest							true	"Payment account details"
//	@Success		200					{object}	object{data=transformations.OutputPaymentAccount}	"Payment account updated successfully"
//	@Failure		400					{object}	lib.HTTPError										"Error occurred when updating a payment account"
//	@Failure		401					{object}	string												"Invalid or absent authentication token"
//	@Failure		404					{object}	lib.HTTPError										"Payment account not found"
//	@Failure		500					{object}	string												"An unexpected error occurred"
//	@Router			/api/v1/payment-accounts/{payment_account_id} [patch]
func (h *PaymentAccountHandler) UpdatePaymentAccount(w http.ResponseWriter, r *http.Request) {
	currentClientUser, currentClientUserOk := lib.ClientUserFromContext(r.Context())

	if !currentClientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body UpdatePaymentAccountRequest

	if decodeErr := json.NewDecoder(r.Body).Decode(&body); decodeErr != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}

	isPassedValidation := lib.ValidateRequest(h.appCtx.Validator, body, w)

	if !isPassedValidation {
		return
	}

	paymentAccountID := chi.URLParam(r, "payment_account_id")

	input := services.UpdatePaymentAccountInput{
		PaymentAccountID: paymentAccountID,
		ClientID:         currentClientUser.ClientID,
		Provider:         body.Provider,
		Identifier:       body.Identifier,
		Metadata:         body.Metadata,
		IsDefault:        body.IsDefault,
		Status:           body.Status,
	}

	paymentAccount, updateErr := h.service.UpdatePaymentAccount(r.Context(), input)

	if updateErr != nil {
		HandleErrorResponse(w, updateErr)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBPaymentAccountToRest(paymentAccount),
	})
}

// DeletePaymentAccount godoc
//
//	@Summary		Delete a payment account
//	@Description	Delete a payment account
//	@Tags			Payment Accounts
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			payment_account_id	path		string			true	"Payment Account ID"
//	@Success		204					{object}	nil				"Payment account deleted successfully"
//	@Failure		400					{object}	lib.HTTPError	"Error occurred when deleting a payment account"
//	@Failure		401					{object}	string			"Invalid or absent authentication token"
//	@Failure		500					{object}	string			"An unexpected error occurred"
//	@Router			/api/v1/payment-accounts/{payment_account_id} [delete]
func (h *PaymentAccountHandler) DeletePaymentAccount(w http.ResponseWriter, r *http.Request) {
	currentClientUser, currentClientUserOk := lib.ClientUserFromContext(r.Context())
	if !currentClientUserOk {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	paymentAccountID := chi.URLParam(r, "payment_account_id")

	input := services.DeletePaymentAccountInput{
		PaymentAccountID: paymentAccountID,
		ClientID:         currentClientUser.ClientID,
	}

	deleteErr := h.service.DeletePaymentAccount(r.Context(), input)
	if deleteErr != nil {
		HandleErrorResponse(w, deleteErr)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
