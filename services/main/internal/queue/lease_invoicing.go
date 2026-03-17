package queue

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/hibiken/asynq"
	log "github.com/sirupsen/logrus"
)

// ─── Task types ───────────────────────────────────────────────────────────────

const TypeLeaseRentInvoiceGeneration = "lease:rent-invoice-generation"

// ─── Worker handlers ──────────────────────────────────────────────────────────

// LeaseInvoicingHandlers returns a HandlerRegistrar that wires up the lease
// rent invoice generation task handler onto the serve mux.
func LeaseInvoicingHandlers(leaseRepo repository.LeaseRepository, leaseSvc services.LeaseService) HandlerRegistrar {
	return func(mux *asynq.ServeMux) {
		mux.HandleFunc(TypeLeaseRentInvoiceGeneration, handleLeaseRentInvoiceGeneration(leaseRepo, leaseSvc))
	}
}

func handleLeaseRentInvoiceGeneration(repo repository.LeaseRepository, svc services.LeaseService) asynq.HandlerFunc {
	return func(ctx context.Context, t *asynq.Task) error {
		leases, err := repo.ListDueForBilling(ctx)
		if err != nil {
			log.WithError(err).Error("[Cron] failed to list leases due for billing")
			return err
		}

		var successCount, failCount int
		for _, lease := range *leases {
			leaseID := lease.ID.String()
			if err := svc.GenerateLeaseRentInvoice(ctx, leaseID); err != nil {
				log.WithError(err).WithField("lease_id", leaseID).Error("[Cron] failed to generate rent invoice")
				failCount++
				continue
			}
			successCount++
		}

		log.Infof(
			"[Cron] rent invoice generation complete: %d succeeded, %d failed, %d total",
			successCount,
			failCount,
			len(*leases),
		)
		return nil
	}
}
