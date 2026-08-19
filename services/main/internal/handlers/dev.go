package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/services/financials"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

// DevHandler exposes operations that exist only to make non-production
// environments testable. Its routes are registered exclusively when
// Config.Env != "production" (see internal/router/client-user.go), so nothing
// here is reachable in production regardless of authentication.
type DevHandler struct {
	financials   *financials.Financials
	leaseService services.LeaseService
	appCtx       pkg.AppContext
}

func NewDevHandler(
	appCtx pkg.AppContext,
	financialsFacade *financials.Financials,
	leaseService services.LeaseService,
) DevHandler {
	return DevHandler{appCtx: appCtx, financials: financialsFacade, leaseService: leaseService}
}

type RunInvoiceIssuanceBody struct {
	// AsOf is the instant the sweep should believe it is running at. Omit it
	// for the wall clock. Twelve months of billing can therefore be exercised
	// in twelve calls without touching any due date.
	AsOf *string `json:"as_of,omitempty"                example:"2027-03-03T00:00:00Z"`
	// FinancialAccountID restricts the sweep to a single account. Omit it and
	// every billable account is swept, exactly as the cron does. Scenarios set
	// it so that exercising issuance does not advance unrelated ledgers.
	FinancialAccountID *string `json:"financial_account_id,omitempty"`
}

type RunInvoiceIssuanceResponse struct {
	Issued int    `json:"issued" example:"1"`
	Failed int    `json:"failed" example:"0"`
	AsOf   string `json:"as_of"  example:"2027-03-03T00:00:00Z"`
}

// RunInvoiceIssuance godoc
//
//	@Summary		Run the invoice issuance sweep (non-production only)
//	@Description	Runs the same sweep the `0 6 * * *` cron runs, optionally at a supplied instant. Registered only when the server's environment is not production. Exists so end-to-end scenarios can bill a full lease term without waiting twelve months or rewriting due dates.
//	@Tags			Dev
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		RunInvoiceIssuanceBody					false	"Optional instant to run the sweep at"
//	@Success		200		{object}	object{data=RunInvoiceIssuanceResponse}	"Sweep completed"
//	@Failure		400		{object}	lib.HTTPError							"as_of is not a valid RFC3339 timestamp"
//	@Failure		401		{object}	string									"Invalid or absent authentication token"
//	@Failure		500		{object}	string									"An unexpected error occurred"
//	@Router			/api/v1/dev/jobs/invoice-issuance [post]
func (h *DevHandler) RunInvoiceIssuance(w http.ResponseWriter, r *http.Request) {
	// The sweep is global — it iterates every billable account, so there is no
	// client or property to scope to. This route sits in the top-level
	// protected group, where UserFromContext (not ClientUserFromContext) is
	// what the auth middleware populates.
	if _, ok := lib.UserFromContext(r.Context()); !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// An absent body means "now" — the endpoint stays usable as a plain
	// manual trigger, not only as a time machine.
	var body RunInvoiceIssuanceBody
	if r.Body != nil {
		_ = json.NewDecoder(r.Body).Decode(&body)
	}

	asOf := time.Now()
	if body.AsOf != nil && *body.AsOf != "" {
		parsed, parseErr := time.Parse(time.RFC3339, *body.AsOf)
		if parseErr != nil {
			HandleErrorResponse(w, pkg.BadRequestError("InvalidAsOf", nil))
			return
		}
		asOf = parsed
	}

	var issued, failed int
	var err error
	if body.FinancialAccountID != nil && *body.FinancialAccountID != "" {
		issued, failed, err = h.financials.Issuance.IssueDueInvoicesForAccount(
			r.Context(), *body.FinancialAccountID, asOf,
		)
	} else {
		issued, failed, err = h.financials.Issuance.IssueDueInvoices(r.Context(), asOf)
	}
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": RunInvoiceIssuanceResponse{
			Issued: issued,
			Failed: failed,
			AsOf:   asOf.Format(time.RFC3339),
		},
	})
}

type RunLeaseLifecycleBody struct {
	// LeaseID restricts both sweeps to a single lease. Omit it and every due
	// lease transitions, exactly as the crons do. Scenarios set it so that
	// exercising the lifecycle does not advance unrelated leases.
	LeaseID *string `json:"lease_id,omitempty"`
}

type RunLeaseLifecycleResponse struct {
	Activated int `json:"activated" example:"1"`
	Completed int `json:"completed" example:"1"`
	Failed    int `json:"failed"    example:"0"`
}

// RunLeaseLifecycle godoc
//
//	@Summary		Run the lease lifecycle sweeps (non-production only)
//	@Description	Runs the activation and completion sweeps the `0 0 * * *` crons run, in that order. Registered only when the server's environment is not production. Exists so end-to-end scenarios can drive a lease from Pending through Active to Completed without waiting for a term to elapse.
//	@Tags			Dev
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		RunLeaseLifecycleBody					false	"Optional lease to restrict the sweeps to"
//	@Success		200		{object}	object{data=RunLeaseLifecycleResponse}	"Sweeps completed"
//	@Failure		401		{object}	string									"Invalid or absent authentication token"
//	@Failure		500		{object}	string									"An unexpected error occurred"
//	@Router			/api/v1/dev/jobs/lease-lifecycle [post]
func (h *DevHandler) RunLeaseLifecycle(w http.ResponseWriter, r *http.Request) {
	// Both sweeps are global — they iterate every lease, so there is no client
	// or property to scope to. This route sits in the top-level protected
	// group, where UserFromContext is what the auth middleware populates.
	if _, ok := lib.UserFromContext(r.Context()); !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// An absent body means "every due lease" — the endpoint stays usable as a
	// plain manual trigger, not only as a scoped one.
	var body RunLeaseLifecycleBody
	if r.Body != nil {
		_ = json.NewDecoder(r.Body).Decode(&body)
	}

	onlyLeaseID := ""
	if body.LeaseID != nil {
		onlyLeaseID = *body.LeaseID
	}

	activated, activationFailures, err := h.leaseService.ActivateDueLeases(r.Context(), onlyLeaseID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	// Activation first, so a lease that reaches move-in and move-out inside a
	// single scenario passes through Active rather than skipping it. The cron
	// pair cannot rely on this ordering — see the note in RegisterScheduler —
	// which is why dueForActivationScope excludes leases already past move-out
	// rather than depending on who runs first.
	completed, completionFailures, err := h.leaseService.CompleteDueLeases(r.Context(), onlyLeaseID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": RunLeaseLifecycleResponse{
			Activated: activated,
			Completed: completed,
			Failed:    activationFailures + completionFailures,
		},
	})
}

type RunAccountClosureBody struct {
	// AsOf is the instant the sweep should believe it is running at. Omit it
	// for the wall clock. The 90-day grace period can therefore be crossed in
	// one call without back-dating closure_eligible_at.
	AsOf *string `json:"as_of,omitempty"                example:"2027-03-03T00:00:00Z"`
	// FinancialAccountID restricts the sweep to a single account, so a
	// scenario does not close unrelated ledgers as a side effect.
	FinancialAccountID *string `json:"financial_account_id,omitempty"`
}

type RunAccountClosureResponse struct {
	Closed  int    `json:"closed"  example:"1"`
	Skipped int    `json:"skipped" example:"0"`
	AsOf    string `json:"as_of"   example:"2027-03-03T00:00:00Z"`
}

// RunAccountClosure godoc
//
//	@Summary		Run the account closure sweep (non-production only)
//	@Description	Runs the same sweep the `0 1 * * *` cron runs, optionally at a supplied instant. Registered only when the server's environment is not production. Exists so end-to-end scenarios can cross the 90-day grace period without back-dating rows. This is deliberately not an operational action: a property manager never closes an account by hand.
//	@Tags			Dev
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		RunAccountClosureBody					false	"Optional instant and account to sweep"
//	@Success		200		{object}	object{data=RunAccountClosureResponse}	"Sweep completed"
//	@Failure		400		{object}	lib.HTTPError							"as_of is not a valid RFC3339 timestamp"
//	@Failure		401		{object}	string									"Invalid or absent authentication token"
//	@Failure		500		{object}	string									"An unexpected error occurred"
//	@Router			/api/v1/dev/jobs/account-closure [post]
func (h *DevHandler) RunAccountClosure(w http.ResponseWriter, r *http.Request) {
	// Global sweep, so there is no client or property to scope to. This route
	// sits in the top-level protected group where UserFromContext is what the
	// auth middleware populates.
	if _, ok := lib.UserFromContext(r.Context()); !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)

		return
	}

	var body RunAccountClosureBody
	// An absent body is the manual trigger, not an error.
	_ = json.NewDecoder(r.Body).Decode(&body)

	asOf := time.Now()

	if body.AsOf != nil {
		parsed, parseErr := time.Parse(time.RFC3339, *body.AsOf)
		if parseErr != nil {
			http.Error(w, "invalid 'as_of' timestamp", http.StatusBadRequest)

			return
		}

		asOf = parsed
	}

	only := ""
	if body.FinancialAccountID != nil {
		only = *body.FinancialAccountID
	}

	closed, skipped, err := h.financials.Closure.CloseDueAccounts(r.Context(), asOf, only)
	if err != nil {
		HandleErrorResponse(w, err)

		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": RunAccountClosureResponse{
			Closed:  closed,
			Skipped: skipped,
			AsOf:    asOf.Format(time.RFC3339),
		},
	})
}
