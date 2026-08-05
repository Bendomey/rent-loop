package queue

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/services/financials"
	"github.com/hibiken/asynq"
	log "github.com/sirupsen/logrus"
)

// ─── Task types ───────────────────────────────────────────────────────────────

// TypeFinancialAccountInvoiceIssuance replaces TypeLeaseRentInvoiceGeneration.
// The sweep iterates financial accounts, not leases, because charge-instance
// state — not a per-lease cursor — decides what is due. That is what makes
// ad-hoc prepayment self-handling: a landlord who collects six months in
// advance leaves those charges settled and covered, so they stop being
// candidates and the sweep resumes at the right period with nothing to cancel.
const TypeFinancialAccountInvoiceIssuance = "financial-account:invoice-issuance"

// ─── Worker handlers ──────────────────────────────────────────────────────────

// FinancialAccountInvoicingHandlers returns a HandlerRegistrar that wires up
// the invoice issuance sweep onto the serve mux.
func FinancialAccountInvoicingHandlers(svc financials.IssuanceService) HandlerRegistrar {
	return func(mux *asynq.ServeMux) {
		mux.HandleFunc(TypeFinancialAccountInvoiceIssuance, handleInvoiceIssuance(svc))
	}
}

func handleInvoiceIssuance(svc financials.IssuanceService) asynq.HandlerFunc {
	return func(ctx context.Context, t *asynq.Task) error {
		issued, failed, err := svc.IssueDueInvoices(ctx)
		if err != nil {
			log.WithError(err).Error("[Cron] invoice issuance sweep failed")
			return err
		}

		log.Infof("[Cron] invoice issuance complete: %d issued, %d failed", issued, failed)
		return nil
	}
}
