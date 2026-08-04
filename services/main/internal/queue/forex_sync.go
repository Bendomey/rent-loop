package queue

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/hibiken/asynq"
	log "github.com/sirupsen/logrus"
)

const TypeForexSync = "forex:sync"

// ForexSyncHandlers returns a HandlerRegistrar that wires up the daily forex sync task.
func ForexSyncHandlers(svc services.ExchangeRateService) HandlerRegistrar {
	return func(mux *asynq.ServeMux) {
		mux.HandleFunc(TypeForexSync, handleForexSync(svc))
	}
}

func handleForexSync(svc services.ExchangeRateService) asynq.HandlerFunc {
	return func(ctx context.Context, t *asynq.Task) error {
		if err := svc.SyncDailyRates(ctx); err != nil {
			log.WithError(err).Error("[Cron] forex sync failed")
			return err
		}
		log.Info("[Cron] forex sync complete")
		return nil
	}
}
