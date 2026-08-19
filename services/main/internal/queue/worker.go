package queue

import (
	"context"
	"fmt"
	"time"

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
			FinancialAccountInvoicingHandlers(svcs.Financials.Issuance),
			InvoiceReminderHandlers(repo.InvoiceRepository, appCtx, svcs.NotificationService),
			ForexSyncHandlers(svcs.ExchangeRateService),
			AccountClosureHandlers(svcs.Financials.Closure),
			LeaseLifecycleHandlers(
				repo.LeaseRepository,
				repo.LeaseChecklistRepository,
				svcs.LeaseService,
				svcs.NotificationService,
				appCtx,
			),
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

	scheduler := asynq.NewScheduler(opt, &asynq.SchedulerOpts{Location: time.UTC})

	// TODO:  Hourly — catches Hourly leases on time;(bring this back when our redis resources support it)
	// Every day at midnight. Accounts with nothing due inside their lead
	// window are skipped naturally — the sweep reads charge state rather than
	// a cursor, so running it more often than necessary is harmless.
	if _, err = scheduler.Register(
		"0 0 * * *",
		asynq.NewTask(TypeFinancialAccountInvoiceIssuance, nil),
		asynq.MaxRetry(1),
	); err != nil {
		raven.CaptureError(err, nil)
		log.Fatal("failed to register invoice issuance schedule:", err)
	}

	// Every day at midnight — reminders are day-granularity (pre_due_1d, overdue_Nd).
	if _, err = scheduler.Register(
		"0 0 * * *",
		asynq.NewTask(TypeInvoiceReminder, nil),
		asynq.MaxRetry(1),
	); err != nil {
		raven.CaptureError(err, nil)
		log.Fatal("failed to register invoice reminder schedule:", err)
	}

	// Daily at 02:00 UTC — fetch USD-base rates from OpenExchangeRates.
	if _, err = scheduler.Register("0 2 * * *", asynq.NewTask(TypeForexSync, nil), asynq.MaxRetry(2)); err != nil {
		raven.CaptureError(err, nil)
		log.Fatal("failed to register forex sync schedule:", err)
	}

	// Daily at 08:00 UTC — business-hours-friendly for tenant/manager visibility.
	if _, err = scheduler.Register(
		"0 8 * * *",
		asynq.NewTask(TypeLeaseMoveOutReminder, nil),
		asynq.MaxRetry(1),
	); err != nil {
		raven.CaptureError(err, nil)
		log.Fatal("failed to register lease move-out reminder schedule:", err)
	}

	// Daily at midnight — auto-activates Pending leases whose move-in date has
	// arrived. Registered alongside the completion job rather than ordered
	// before it: asynq gives no ordering guarantee between two schedules at
	// the same instant, so dueForActivationScope excludes leases already past
	// move-out instead, leaving the two jobs independent whichever runs first.
	if _, err = scheduler.Register(
		"0 0 * * *",
		asynq.NewTask(TypeLeaseActivation, nil),
		asynq.MaxRetry(1),
	); err != nil {
		raven.CaptureError(err, nil)
		log.Fatal("failed to register lease activation schedule:", err)
	}

	// Daily at midnight — auto-completes leases whose move-out date has passed.
	if _, err = scheduler.Register(
		"0 0 * * *",
		asynq.NewTask(TypeLeaseCompletion, nil),
		asynq.MaxRetry(1),
	); err != nil {
		raven.CaptureError(err, nil)
		log.Fatal("failed to register lease completion schedule:", err)
	}

	// Daily at 01:00 UTC — after the midnight lease sweeps, so an account whose
	// last lease completed tonight is already eligible when this runs. The
	// ordering is a convenience, not a requirement: the sweep reads state, so
	// an account missed tonight is simply closed tomorrow.
	if _, err = scheduler.Register(
		"0 1 * * *",
		asynq.NewTask(TypeFinancialAccountClosure, nil),
		asynq.MaxRetry(1),
	); err != nil {
		raven.CaptureError(err, nil)
		log.Fatal("failed to register account closure schedule:", err)
	}

	go func() {
		if err := scheduler.Run(); err != nil {
			raven.CaptureError(err, nil)
			log.Fatal("scheduler error:", err)
		}
	}()

	log.Info("Cron scheduler started")
}
