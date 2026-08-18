package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/services/financials"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type FinancialAccountHandler struct {
	financials     *financials.Financials
	invoiceService services.InvoiceService
	leaseService   services.LeaseService
	appCtx         pkg.AppContext
}

func NewFinancialAccountHandler(
	appCtx pkg.AppContext,
	financialsFacade *financials.Financials,
	invoiceService services.InvoiceService,
	leaseService services.LeaseService,
) FinancialAccountHandler {
	return FinancialAccountHandler{
		appCtx:         appCtx,
		financials:     financialsFacade,
		invoiceService: invoiceService,
		leaseService:   leaseService,
	}
}

// ─── Request Bodies ───────────────────────────────────────────────────────────

type CreateChargeBody struct {
	Name string `json:"name"                                  validate:"required"                                                                                              example:"Water bill — March"`
	// Sign carries direction: a negative amount is a refund of this category.
	// There are deliberately no refund-specific categories.
	Category string `json:"category"                              validate:"required,oneof=RENT SECURITY_DEPOSIT AGENCY_FEE VAT UTILITY DAMAGE_CHARGE EARLY_TERMINATION_FEE OTHER" example:"UTILITY"`
	Amount   int64  `json:"amount"                                validate:"required"                                                                                              example:"10000"`
	Currency string `json:"currency"                              validate:"required,len=3"                                                                                        example:"GHS"`
	DueDate  string `json:"due_date"                              validate:"required"                                                                                              example:"2027-03-01T00:00:00Z"`
	// ReversesChargeInstanceID marks this as a refund of an existing charge.
	// The refund inherits that charge's category and is capped at what was
	// actually settled — you cannot refund money never received.
	ReversesChargeInstanceID *string `json:"reverses_charge_instance_id,omitempty" validate:"omitempty,uuid4"`
}

type VoidChargeBody struct {
	Reason string `json:"reason" validate:"required" example:"Entered in error"`
}

type UpdateBillingPolicyBody struct {
	Cadence             *string `json:"cadence,omitempty"                validate:"omitempty,oneof=EVERY_PERIOD EVERY_N_PERIODS UPFRONT MANUAL" example:"EVERY_N_PERIODS"`
	Interval            *int64  `json:"interval,omitempty"               validate:"omitempty,min=1"                                             example:"12"`
	AutoIssueDaysBefore *int64  `json:"auto_issue_days_before,omitempty" validate:"omitempty,min=0"                                             example:"5"`
}

type ClaimBody struct {
	ChargeInstanceID string `json:"charge_instance_id" validate:"required,uuid4" example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Amount           int64  `json:"amount"             validate:"required"       example:"100000"`
}

// ComposeInvoiceBody composes an invoice from charges. Exactly one of claims or
// amount must be given: claims is the landlord's explicit pick (any mix, full
// or partial), amount is the shortcut that fills oldest-due-date first.
type ComposeInvoiceBody struct {
	Claims  []ClaimBody `json:"claims,omitempty"   validate:"omitempty,dive"`
	Amount  *int64      `json:"amount,omitempty"   validate:"omitempty,min=1" example:"250000"`
	DueDate *string     `json:"due_date,omitempty"                            example:"2027-03-01T00:00:00Z"`
	Issue   bool        `json:"issue"                                         example:"true"`
}

// ─── Response payloads ────────────────────────────────────────────────────────

type CloseAccountBody struct {
	Reason string `json:"reason"                 validate:"required"`
	// RELEASE refunds the held deposit, OFFSET applies it against what is
	// owed, FORFEIT keeps it and requires a reason. Ignored when no deposit
	// is held.
	DepositResolution    string  `json:"deposit_resolution"     validate:"omitempty,oneof=RELEASE OFFSET FORFEIT"`
	DepositForfeitReason *string `json:"deposit_forfeit_reason"`
}

type ReopenAccountBody struct {
	Reason string `json:"reason" validate:"required"`
}

type accountSummaryResponse struct {
	Account           *transformations.OutputFinancialAccount `json:"account"`
	Charges           []*transformations.OutputChargeInstance `json:"charges"`
	TotalCharged      int64                                   `json:"total_charged"`
	TotalSettled      int64                                   `json:"total_settled"`
	OutstandingAmount int64                                   `json:"outstanding_amount"`
	AvailableCredit   int64                                   `json:"available_credit"`
	// ClosureEligibility is the PM's closure checklist: every gate with its
	// blocking reason, so the UI can render the panel without a second call.
	ClosureEligibility *financials.ClosureEligibility `json:"closure_eligibility,omitempty"`
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

// GetAccount godoc
//
//	@Summary		Get a financial account with its balance
//	@Description	Returns the account, every charge with its derived status, and the balance figures. Outstanding amount is the sum of unsettled charges — including charges that have never been invoiced, which is what invoice-derived balances cannot see.
//	@Tags			FinancialAccounts
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id		path		string								true	"Property ID"
//	@Param			account_id		path		string								true	"Financial account ID"
//	@Param			include_voided	query		bool								false	"Include voided charges in the list. Totals are unaffected."
//	@Success		200				{object}	object{data=accountSummaryResponse}	"Financial account summary"
//	@Failure		401				{object}	string								"Invalid or absent authentication token"
//	@Failure		404				{object}	lib.HTTPError						"Financial account not found"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/financial-accounts/{account_id} [get]
func (h *FinancialAccountHandler) GetAccount(w http.ResponseWriter, r *http.Request) {
	if _, ok := lib.ClientUserFromContext(r.Context()); !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	summary, err := h.financials.Accounts.Summary(r.Context(), chi.URLParam(r, "account_id"))
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	payload, restErr := h.summaryToRest(r, summary)
	if restErr != nil {
		HandleErrorResponse(w, restErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": payload})
}

// ListCharges godoc
//
//	@Summary		List the charges on a financial account
//	@Description	Every obligation on the account, oldest due date first, each with a status derived from its invoiced and settled amounts.
//	@Tags			FinancialAccounts
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id		path		string												true	"Property ID"
//	@Param			account_id		path		string												true	"Financial account ID"
//	@Param			include_voided	query		bool												false	"Include voided charges in the list. Totals are unaffected."
//	@Success		200				{object}	object{data=[]transformations.OutputChargeInstance}	"Charges"
//	@Failure		401				{object}	string												"Invalid or absent authentication token"
//	@Failure		404				{object}	lib.HTTPError										"Financial account not found"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/financial-accounts/{account_id}/charges [get]
func (h *FinancialAccountHandler) ListCharges(w http.ResponseWriter, r *http.Request) {
	if _, ok := lib.ClientUserFromContext(r.Context()); !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	summary, err := h.financials.Accounts.Summary(r.Context(), chi.URLParam(r, "account_id"))
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	payload, restErr := h.summaryToRest(r, summary)
	if restErr != nil {
		HandleErrorResponse(w, restErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": payload.Charges})
}

// CreateCharge godoc
//
//	@Summary		Add an ad-hoc charge to a financial account
//	@Description	Adds a one-off obligation with no definition behind it — a damage charge, a utility bill, or a refund. A negative amount is a refund of that category; when it names the charge it reverses, it inherits that category and is capped at what was settled.
//	@Tags			FinancialAccounts
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	path		string												true	"Property ID"
//	@Param			account_id	path		string												true	"Financial account ID"
//	@Param			body		body		CreateChargeBody									true	"Charge to add"
//	@Success		201			{object}	object{data=transformations.OutputChargeInstance}	"Charge created"
//	@Failure		400			{object}	lib.HTTPError										"Zero amount, non-negative reversal, or a reversal exceeding what was settled"
//	@Failure		401			{object}	string												"Invalid or absent authentication token"
//	@Failure		422			{object}	lib.HTTPError										"Validation error"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/financial-accounts/{account_id}/charges [post]
func (h *FinancialAccountHandler) CreateCharge(w http.ResponseWriter, r *http.Request) {
	if _, ok := lib.ClientUserFromContext(r.Context()); !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateChargeBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	dueDate, parseErr := time.Parse(time.RFC3339, body.DueDate)
	if parseErr != nil {
		HandleErrorResponse(w, pkg.BadRequestError("InvalidDueDate", nil))
		return
	}

	charge, err := h.financials.Charges.CreateAdHoc(r.Context(), financials.CreateAdHocChargeInput{
		FinancialAccountID:       chi.URLParam(r, "account_id"),
		Name:                     body.Name,
		Category:                 body.Category,
		Amount:                   body.Amount,
		Currency:                 body.Currency,
		DueDate:                  dueDate,
		ReversesChargeInstanceID: body.ReversesChargeInstanceID,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBChargeInstanceToRest(charge)})
}

// VoidCharge godoc
//
//	@Summary		Void a charge
//	@Description	Removes a charge from the ledger. A charge that has already been invoiced or settled cannot be voided — void the invoice first, which releases its claim.
//	@Tags			FinancialAccounts
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	path		string				true	"Property ID"
//	@Param			account_id	path		string				true	"Financial account ID"
//	@Param			charge_id	path		string				true	"Charge instance ID"
//	@Param			body		body		VoidChargeBody		true	"Void reason"
//	@Success		200			{object}	object{data=bool}	"Charge voided"
//	@Failure		400			{object}	lib.HTTPError		"Charge already voided, or already invoiced/settled"
//	@Failure		401			{object}	string				"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError		"Charge not found"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/financial-accounts/{account_id}/charges/{charge_id}/void [patch]
func (h *FinancialAccountHandler) VoidCharge(w http.ResponseWriter, r *http.Request) {
	if _, ok := lib.ClientUserFromContext(r.Context()); !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body VoidChargeBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	err := h.financials.Charges.VoidInstance(r.Context(), financials.VoidChargeInput{
		ChargeInstanceID: chi.URLParam(r, "charge_id"),
		Reason:           body.Reason,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": true})
}

// UpdateBillingPolicy godoc
//
//	@Summary		Update the rent billing policy on a financial account
//	@Description	Controls how the issuance sweep bills rent: one period at a time, N periods at a time, the whole remaining term upfront, or never (MANUAL). Auto-issue days is the lead time before a charge's due date, not the payment grace after it.
//	@Tags			FinancialAccounts
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	path		string					true	"Property ID"
//	@Param			account_id	path		string					true	"Financial account ID"
//	@Param			body		body		UpdateBillingPolicyBody	true	"Billing policy"
//	@Success		200			{object}	object{data=bool}		"Policy updated"
//	@Failure		400			{object}	lib.HTTPError			"Invalid cadence or interval"
//	@Failure		401			{object}	string					"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError			"Financial account not found"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/financial-accounts/{account_id}/billing-policy [patch]
func (h *FinancialAccountHandler) UpdateBillingPolicy(w http.ResponseWriter, r *http.Request) {
	if _, ok := lib.ClientUserFromContext(r.Context()); !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body UpdateBillingPolicyBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	err := h.financials.Accounts.UpdateBillingPolicy(r.Context(), financials.UpdateBillingPolicyInput{
		FinancialAccountID:  chi.URLParam(r, "account_id"),
		Cadence:             body.Cadence,
		Interval:            body.Interval,
		AutoIssueDaysBefore: body.AutoIssueDaysBefore,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": true})
}

// ComposeInvoice godoc
//
//	@Summary		Compose an invoice from charges on a financial account
//	@Description	The only way an account-backed invoice is created. Each line claims part or all of one charge, so "pay some rent and all of the deposit" is one ordinary document. Give explicit claims, or just an amount to fill oldest-due-date first. Available account credit is consumed before anything is asked for.
//	@Tags			FinancialAccounts
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	path		string										true	"Property ID"
//	@Param			account_id	path		string										true	"Financial account ID"
//	@Param			body		body		ComposeInvoiceBody							true	"Charges to bill"
//	@Success		201			{object}	object{data=transformations.OutputInvoice}	"Invoice composed"
//	@Failure		400			{object}	lib.HTTPError								"No charges selected, a claim exceeding the charge balance, a sign or currency mismatch, or both claims and amount given"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError								"Financial account or charge not found"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/financial-accounts/{account_id}/invoices:compose [post]
func (h *FinancialAccountHandler) ComposeInvoice(w http.ResponseWriter, r *http.Request) {
	if _, ok := lib.ClientUserFromContext(r.Context()); !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body ComposeInvoiceBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	// Exactly one. Both would be ambiguous; neither would bill nothing.
	if (len(body.Claims) == 0) == (body.Amount == nil) {
		HandleErrorResponse(w, pkg.BadRequestError("ProvideEitherClaimsOrAmount", nil))
		return
	}

	accountID := chi.URLParam(r, "account_id")
	summary, summaryErr := h.financials.Accounts.Summary(r.Context(), accountID)
	if summaryErr != nil {
		HandleErrorResponse(w, summaryErr)
		return
	}

	var dueDate *time.Time
	if body.DueDate != nil {
		parsed, parseErr := time.Parse(time.RFC3339, *body.DueDate)
		if parseErr != nil {
			HandleErrorResponse(w, pkg.BadRequestError("InvalidDueDate", nil))
			return
		}
		dueDate = &parsed
	}

	claims := make([]financials.Claim, 0, len(body.Claims))
	for _, claim := range body.Claims {
		claims = append(claims, financials.Claim{
			ChargeInstanceID: claim.ChargeInstanceID,
			Amount:           claim.Amount,
		})
	}

	status := "DRAFT"
	if body.Issue {
		status = "ISSUED"
	}

	// An account that has not yet been approved into a lease bills the
	// application; afterwards it bills the tenant. The charges are identical
	// either way — only the payer label differs.
	//
	// Application-stage is TenantID IS NULL. It used to be LeaseID IS NULL,
	// which stopped being a question the account could answer once one account
	// began spanning several leases.
	payerType := "TENANT_APPLICATION"
	contextType := "TENANT_APPLICATION"
	if summary.Account.TenantID != nil {
		payerType = "TENANT"
		contextType = "LEASE_RENT"
	}

	// The charges being invoiced say which term they belong to; when they are
	// all account-level or disagree, fall back to the account's current lease.
	payerLeaseID := financials.DerivePayerLease(summary.Charges)
	if payerLeaseID == nil {
		if current, curErr := h.leaseService.GetCurrentForAccount(r.Context(), accountID); curErr == nil &&
			current != nil {
			id := current.ID.String()
			payerLeaseID = &id
		}
	}

	input := services.ComposeFromAccountInput{
		FinancialAccountID:   accountID,
		Amount:               body.Amount,
		PayerType:            payerType,
		PayerLeaseID:         payerLeaseID,
		PayeeType:            "PROPERTY_OWNER",
		PayeeClientID:        summary.Account.ClientID,
		ContextType:          contextType,
		DueDate:              dueDate,
		Status:               status,
		NotificationTenantID: summary.Account.TenantID,
	}
	if len(claims) > 0 {
		input.Claims = claims
	}

	invoice, err := h.invoiceService.ComposeFromAccount(r.Context(), input)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBInvoiceToRest(invoice)})
}

// ─── Tenant-facing (read-only) ────────────────────────────────────────────────

// TenantGetAccount godoc
//
//	@Summary		Get the financial account for a lease (tenant)
//	@Description	Read-only. Lets a tenant see what they owe, what they have paid and what is coming. Tenants cannot create charges or issue invoices — the landlord controls issuance, so a tenant pays only what has been issued to them.
//	@Tags			FinancialAccounts
//	@Produce		json
//	@Security		BearerAuth
//	@Param			lease_id		path		string								true	"Lease ID"
//	@Param			include_voided	query		bool								false	"Include voided charges in the list. Totals are unaffected."
//	@Success		200				{object}	object{data=accountSummaryResponse}	"Financial account summary"
//	@Failure		401				{object}	string								"Invalid or absent authentication token"
//	@Failure		403				{object}	lib.HTTPError						"Lease does not belong to this tenant"
//	@Failure		404				{object}	lib.HTTPError						"Financial account not found"
//	@Router			/api/v1/leases/{lease_id}/financial-account [get]
func (h *FinancialAccountHandler) TenantGetAccount(w http.ResponseWriter, r *http.Request) {
	summary, err := h.tenantAccountSummary(r)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	payload, restErr := h.summaryToRest(r, summary)
	if restErr != nil {
		HandleErrorResponse(w, restErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": payload})
}

// TenantListCharges godoc
//
//	@Summary		List charges on a lease's financial account (tenant)
//	@Description	Read-only breakdown of every obligation with its status.
//	@Tags			FinancialAccounts
//	@Produce		json
//	@Security		BearerAuth
//	@Param			lease_id		path		string												true	"Lease ID"
//	@Param			include_voided	query		bool												false	"Include voided charges in the list. Totals are unaffected."
//	@Success		200				{object}	object{data=[]transformations.OutputChargeInstance}	"Charges"
//	@Failure		401				{object}	string												"Invalid or absent authentication token"
//	@Failure		403				{object}	lib.HTTPError										"Lease does not belong to this tenant"
//	@Failure		404				{object}	lib.HTTPError										"Financial account not found"
//	@Router			/api/v1/leases/{lease_id}/financial-account/charges [get]
func (h *FinancialAccountHandler) TenantListCharges(w http.ResponseWriter, r *http.Request) {
	summary, err := h.tenantAccountSummary(r)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	payload, restErr := h.summaryToRest(r, summary)
	if restErr != nil {
		HandleErrorResponse(w, restErr)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": payload.Charges})
}

// tenantAccountSummary resolves the lease's account after confirming the lease
// belongs to the authenticated tenant. Without the ownership check any tenant
// could read any other tenant's balance by guessing a lease ID.
func (h *FinancialAccountHandler) tenantAccountSummary(
	r *http.Request,
) (*financials.AccountSummary, error) {
	tenantAccount, ok := lib.TenantAccountFromContext(r.Context())
	if !ok {
		return nil, pkg.ForbiddenError("Unauthorized", nil)
	}

	leaseID := chi.URLParam(r, "lease_id")
	populate := []string{"Tenant.TenantAccount"}
	lease, leaseErr := h.leaseService.GetByIDWithPopulate(r.Context(), repository.GetLeaseQuery{
		ID:       leaseID,
		Populate: &populate,
	})
	if leaseErr != nil {
		return nil, leaseErr
	}

	if lease.Tenant.TenantAccount == nil || lease.Tenant.TenantAccount.ID.String() != tenantAccount.ID {
		return nil, pkg.ForbiddenError("LeaseDoesNotBelongToTenant", nil)
	}

	if lease.FinancialAccountID == nil {
		return nil, pkg.NotFoundError("FinancialAccountNotFound", nil)
	}

	return h.financials.Accounts.Summary(r.Context(), *lease.FinancialAccountID)
}

// summaryToRest builds the response from the persisted instances rather than
// from AccountSummary.Charges: ChargeView carries only what the arithmetic
// needs, so rendering from it would drop Name, Currency and the derived status.
//
// ?include_voided=true adds voided charges to the list. The totals are
// deliberately NOT affected: they come from AccountSummary, which is computed
// over live charges only, so a voided charge is visible without ever counting
// towards what is owed.
func (h *FinancialAccountHandler) summaryToRest(
	r *http.Request,
	summary *financials.AccountSummary,
) (accountSummaryResponse, error) {
	includeVoided := r.URL.Query().Get("include_voided") == "true"

	// ?lease_id= scopes the charge list to one term. Omitted, the caller sees
	// the whole tenancy. The account totals below are deliberately NOT scoped:
	// a balance split by lease would not equal the account's real balance.
	var leaseID *string
	if raw := r.URL.Query().Get("lease_id"); raw != "" {
		leaseID = &raw
	}

	instances, err := h.financials.Charges.ListInstances(
		r.Context(), summary.Account.ID.String(), leaseID, includeVoided,
	)
	if err != nil {
		return accountSummaryResponse{}, err
	}

	charges := make([]*transformations.OutputChargeInstance, 0, len(instances))
	for i := range instances {
		charges = append(charges, transformations.DBChargeInstanceToRest(&instances[i]))
	}

	response := accountSummaryResponse{
		Account:           transformations.DBFinancialAccountToRest(summary.Account),
		Charges:           charges,
		TotalCharged:      summary.TotalCharged,
		TotalSettled:      summary.TotalSettled,
		OutstandingAmount: summary.OutstandingAmount,
		AvailableCredit:   summary.AvailableCredit,
	}

	// Advisory: a failure here must not fail the read the caller asked for.
	if h.financials.Closure != nil {
		if eligibility, eligErr := h.financials.Closure.Eligibility(
			r.Context(), summary.Account.ID.String(),
		); eligErr == nil {
			response.ClosureEligibility = eligibility
		}
	}

	return response, nil
}

// CloseAccount godoc
//
//	@Summary		Close a financial account
//	@Description	Ends a tenancy's financial relationship and releases the deposit. Every blocking gate must pass: all leases ended, nothing outstanding, and the held deposit resolved. Missing move-out evidence warns but does not block. Releasing or offsetting posts a reversing SECURITY_DEPOSIT charge; forfeiting requires a reason. Writes an audit row rather than flipping a status.
//	@Tags			FinancialAccounts
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	path		string				true	"Property ID"
//	@Param			account_id	path		string				true	"Financial account ID"
//	@Param			body		body		CloseAccountBody	true	"Closure decision"
//	@Success		200			{object}	object{data=bool}	"Account closed"
//	@Failure		400			{object}	lib.HTTPError		"A blocking gate has not passed, the account is already closed, or a forfeit was given without a reason"
//	@Failure		401			{object}	string				"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError		"Financial account not found"
//	@Failure		422			{object}	lib.HTTPError		"Validation error"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/financial-accounts/{account_id}/close [post]
func (h *FinancialAccountHandler) CloseAccount(w http.ResponseWriter, r *http.Request) {
	clientUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CloseAccountBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	resolution := financials.DepositResolution(body.DepositResolution)
	if body.DepositResolution == "" {
		resolution = financials.DepositRelease
	}

	err := h.financials.Closure.Close(r.Context(), financials.CloseAccountInput{
		FinancialAccountID:   chi.URLParam(r, "account_id"),
		ClosedByID:           clientUser.ID,
		Reason:               body.Reason,
		DepositResolution:    resolution,
		DepositForfeitReason: body.DepositForfeitReason,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": true})
}

// ReopenAccount godoc
//
//	@Summary		Reopen a closed financial account
//	@Description	Returns a closed account to ACTIVE. Recorded on the original closure row with the reason, so an accidental closure leaves a trail rather than silently rewriting history. Any deposit refund already posted is NOT reversed — that is a separate charge.
//	@Tags			FinancialAccounts
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	path		string				true	"Property ID"
//	@Param			account_id	path		string				true	"Financial account ID"
//	@Param			body		body		ReopenAccountBody	true	"Reason for reopening"
//	@Success		200			{object}	object{data=bool}	"Account reopened"
//	@Failure		400			{object}	lib.HTTPError		"The account is not closed, or no reason was given"
//	@Failure		401			{object}	string				"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError		"Financial account or its closure record not found"
//	@Failure		422			{object}	lib.HTTPError		"Validation error"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/financial-accounts/{account_id}/reopen [post]
func (h *FinancialAccountHandler) ReopenAccount(w http.ResponseWriter, r *http.Request) {
	clientUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body ReopenAccountBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	err := h.financials.Closure.Reopen(r.Context(), financials.ReopenAccountInput{
		FinancialAccountID: chi.URLParam(r, "account_id"),
		ReopenedByID:       clientUser.ID,
		Reason:             body.Reason,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{"data": true})
}
