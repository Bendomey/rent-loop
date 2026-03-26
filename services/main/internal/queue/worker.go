package queue

import (
	"context"
	"fmt"

	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/getsentry/raven-go"
	"github.com/hibiken/asynq"
	log "github.com/sirupsen/logrus"
)

// HandlerRegistrar registers task handlers onto an asynq.ServeMux.
// Each feature module (e.g. announcements.go) exposes a function of this type.
type HandlerRegistrar func(*asynq.ServeMux)

func NewServer(redisURL string) (*asynq.Server, error) {
	opt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		return nil, fmt.Errorf("queue: parse redis URI: %w", err)
	}
	return asynq.NewServer(opt, asynq.Config{
		Concurrency: 10,
		Queues:      map[string]int{"default": 1},
		ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
			log.WithError(err).WithField("task_type", task.Type()).Error("[Queue] task failed")
		}),
	}), nil
}

// NewServeMux builds an asynq.ServeMux from one or more HandlerRegistrar functions.
// Add a new registrar for each feature module:
//
//	queue.NewServeMux(
//	    queue.AnnouncementHandlers(svc),
//	    queue.SomeOtherHandlers(otherSvc),
//	)
func NewServeMux(registrars ...HandlerRegistrar) *asynq.ServeMux {
	mux := asynq.NewServeMux()
	for _, register := range registrars {
		register(mux)
	}
	return mux
}

func RegisterWorkers(redisURL string, appCtx pkg.AppContext, repo repository.Repository, svcs services.Services) {
	queueServer, err := NewServer(redisURL)
	if err != nil {
		raven.CaptureError(err, nil)
		log.Fatal("failed to create queue server:", err)
	}

	go func() {
		mux := NewServeMux(
			AnnouncementHandlers(svcs.AnnouncementService),
			LeaseInvoicingHandlers(repo.LeaseRepository, svcs.LeaseService),
			InvoiceReminderHandlers(repo.InvoiceRepository, appCtx, svcs.NotificationService),
		)
		if err := queueServer.Run(mux); err != nil {
			raven.CaptureError(err, nil)
			log.Fatal("queue server error:", err)
		}
	}()

	log.Info("Queue worker started")
}

func RegisterScheduler(redisURL string) {
	opt, err := asynq.ParseRedisURI(redisURL)
	if err != nil {
		raven.CaptureError(err, nil)
		log.Fatal("failed to parse redis URI for scheduler:", err)
	}

	scheduler := asynq.NewScheduler(opt, nil)

	// TODO:  Hourly — catches Hourly leases on time;(bring this back when our redis resources support it)
	// Every day at midnight longer-frequency leases are
	// skipped naturally when NextBillingDate is still in the future.
	if _, err = scheduler.Register("0 0 * * *", asynq.NewTask(TypeLeaseRentInvoiceGeneration, nil), asynq.MaxRetry(1)); err != nil {
		raven.CaptureError(err, nil)
		log.Fatal("failed to register lease invoicing schedule:", err)
	}

	// Every day at midnight — reminders are day-granularity (pre_due_1d, overdue_Nd).
	if _, err = scheduler.Register("0 0 * * *", asynq.NewTask(TypeInvoiceReminder, nil), asynq.MaxRetry(1)); err != nil {
		raven.CaptureError(err, nil)
		log.Fatal("failed to register invoice reminder schedule:", err)
	}

	go func() {
		if err := scheduler.Run(); err != nil {
			raven.CaptureError(err, nil)
			log.Fatal("scheduler error:", err)
		}
	}()

	log.Info("Cron scheduler started")
}
