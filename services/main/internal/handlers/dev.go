package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services/financials"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

// DevHandler exposes operations that exist only to make non-production
// environments testable. Its routes are registered exclusively when
// Config.Env != "production" (see internal/router/client-user.go), so nothing
// here is reachable in production regardless of authentication.
type DevHandler struct {
	financials *financials.Financials
	appCtx     pkg.AppContext
}

func NewDevHandler(appCtx pkg.AppContext, financialsFacade *financials.Financials) DevHandler {
	return DevHandler{appCtx: appCtx, financials: financialsFacade}
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
