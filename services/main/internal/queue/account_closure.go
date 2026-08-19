package queue

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/services/financials"
	"github.com/hibiken/asynq"
	log "github.com/sirupsen/logrus"
)

const TypeFinancialAccountClosure = "financial-account:closure"

func AccountClosureHandlers(svc financials.ClosureService) HandlerRegistrar {
	return func(mux *asynq.ServeMux) {
		mux.HandleFunc(TypeFinancialAccountClosure, handleAccountClosure(svc))
	}
}

// handleAccountClosure files away tenancies that ended and left nothing behind.
//
// There is nothing to tell anyone about, so it notifies no one: a landlord
// never learns the account existed, let alone that it closed.
func handleAccountClosure(svc financials.ClosureService) asynq.HandlerFunc {
	return func(ctx context.Context, t *asynq.Task) error {
		closed, skipped, err := svc.CloseDueAccounts(ctx, time.Now(), "")
		if err != nil {
			log.WithError(err).Error("[Cron] account closure sweep failed")

			return err
		}

		log.WithFields(log.Fields{"closed": closed, "skipped": skipped}).
			Info("[Cron] account closure sweep complete")

		return nil
	}
}
