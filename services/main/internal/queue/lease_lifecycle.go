package queue

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/lib/emailtemplates"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/hibiken/asynq"
	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// ─── Task types ───────────────────────────────────────────────────────────────

const (
	TypeLeaseMoveOutReminder = "lease:moveout-reminder"
	TypeLeaseCompletion      = "lease:complete"
)

// ─── Reminder thresholds ────────────────────────────────────────────────────

type moveOutReminderThreshold struct {
	days int
	key  string
}

// Descending order matters: handleLeaseMoveOutReminder picks the first
// (largest) unsent threshold whose day count has been reached, so a missed
// cron run still delivers the closest applicable reminder instead of
// silently skipping it.
var moveOutReminderThresholds = []moveOutReminderThreshold{
	{30, "moveout_30d"},
	{14, "moveout_14d"},
	{7, "moveout_7d"},
	{1, "moveout_1d"},
}

// shortLeaseReminderThresholds applies to every real lease (hours-based
// leases aren't offered by the product, so moveOutReminderThresholds above
// is effectively dead code kept only for that unreachable case). A 30/14-day
// heads-up doesn't make sense — and telescopes into back-to-back sends — for
// leases with short total durations, so day/month leases just get the two
// closest-to-moveout reminders.
var shortLeaseReminderThresholds = []moveOutReminderThreshold{
	{7, "moveout_7d"},
	{1, "moveout_1d"},
}

func isHourlyFrequency(frequency string) bool {
	switch strings.ToLower(frequency) {
	case "hours", "hour":
		return true
	default:
		return false
	}
}

// ─── Dependencies ───────────────────────────────────────────────────────────

type leaseLifecycleDeps struct {
	leaseRepo          repository.LeaseRepository
	leaseChecklistRepo repository.LeaseChecklistRepository
	leaseService       services.LeaseService
	notificationSvc    services.NotificationService
	appCtx             pkg.AppContext
}

// managerCache memoizes the resolved OWNER fallback per ClientID for the
// duration of a single cron run, so leases sharing an owner (e.g. several
// pending leases on the same account) don't each trigger their own DB
// round-trip to re-resolve the same manager.
type managerCache map[string]*models.ClientUser

// LeaseLifecycleHandlers registers the move-out reminder and auto-completion
// task handlers onto the serve mux. Both belong to the same "lease lifecycle"
// domain, but are kept as two independently-scheduled, independently-
// retryable task types — a failure in reminder sending must never be able to
// block a lease from completing and releasing its unit, and vice versa.
func LeaseLifecycleHandlers(
	leaseRepo repository.LeaseRepository,
	leaseChecklistRepo repository.LeaseChecklistRepository,
	leaseService services.LeaseService,
	notificationSvc services.NotificationService,
	appCtx pkg.AppContext,
) HandlerRegistrar {
	deps := leaseLifecycleDeps{
		leaseRepo:          leaseRepo,
		leaseChecklistRepo: leaseChecklistRepo,
		leaseService:       leaseService,
		notificationSvc:    notificationSvc,
		appCtx:             appCtx,
	}
	return func(mux *asynq.ServeMux) {
		mux.HandleFunc(TypeLeaseMoveOutReminder, handleLeaseMoveOutReminder(deps))
		mux.HandleFunc(TypeLeaseCompletion, handleLeaseCompletion(deps))
	}
}

// resolveCachedManagerRecipient wraps LeaseService.ResolveManagerRecipient
// with a per-cron-run cache keyed by ClientID, so leases sharing an owner
// fallback don't each trigger their own DB round-trip. The resolution logic
// itself lives once in the service, since CompleteLease needs it too.
func resolveCachedManagerRecipient(
	ctx context.Context,
	deps leaseLifecycleDeps,
	lease *models.Lease,
	cache managerCache,
) (*models.ClientUser, error) {
	if lease.ActivatedBy != nil && lease.ActivatedBy.User.Email != "" {
		return lease.ActivatedBy, nil
	}

	clientID := lease.Unit.Property.ClientID
	if cached, ok := cache[clientID]; ok {
		return cached, nil
	}

	manager, err := deps.leaseService.ResolveManagerRecipient(ctx, lease)
	if err != nil {
		return nil, err
	}

	cache[clientID] = manager
	return manager, nil
}

// ─── Job 1: move-out reminders ──────────────────────────────────────────────

func handleLeaseMoveOutReminder(deps leaseLifecycleDeps) asynq.HandlerFunc {
	return func(ctx context.Context, t *asynq.Task) error {
		leases, err := deps.leaseRepo.ListForMoveOutReminders(ctx)
		if err != nil {
			log.WithError(err).Error("[Cron] failed to list leases for move-out reminders")
			return err
		}

		managers := managerCache{}
		var successCount, failCount int
		for i := range *leases {
			lease := &(*leases)[i]
			if lease.MoveOutDate == nil {
				continue
			}

			moveOutLoc := lease.MoveOutDate.Location()
			now := time.Now().In(moveOutLoc)
			nowDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, moveOutLoc)
			moveOutDate := time.Date(
				lease.MoveOutDate.Year(), lease.MoveOutDate.Month(), lease.MoveOutDate.Day(),
				0, 0, 0, 0, moveOutLoc,
			)
			daysUntilMoveOut := int(moveOutDate.Sub(nowDate).Hours() / 24)

			thresholds := shortLeaseReminderThresholds
			if isHourlyFrequency(lease.StayDurationFrequency) {
				thresholds = moveOutReminderThresholds
			}

			var reminderKey string
			for _, threshold := range thresholds {
				if daysUntilMoveOut <= threshold.days && !slices.Contains(lease.RemindersSent, threshold.key) {
					reminderKey = threshold.key
					break
				}
			}

			if reminderKey == "" {
				continue
			}

			if !sendMoveOutReminder(ctx, deps, lease, daysUntilMoveOut, managers) {
				failCount++
				continue
			}

			lease.RemindersSent = append(lease.RemindersSent, reminderKey)
			if updateErr := deps.leaseRepo.Update(ctx, lease); updateErr != nil {
				log.WithError(updateErr).WithField("lease_id", lease.ID.String()).
					Error("[Cron] failed to update lease reminders_sent")
				failCount++
				continue
			}

			successCount++
		}

		log.Infof("[Cron] lease move-out reminders complete: %d sent, %d failed", successCount, failCount)
		return nil
	}
}

// sendMoveOutReminder notifies the tenant and the resolved manager for a
// single lease. Returns true if at least one channel succeeded for either
// audience, gating whether the threshold key is recorded as sent.
func sendMoveOutReminder(
	ctx context.Context,
	deps leaseLifecycleDeps,
	lease *models.Lease,
	daysUntilMoveOut int,
	managers managerCache,
) bool {
	channelSucceeded := false
	unitName := lease.Unit.Name
	moveOutDateStr := lease.MoveOutDate.Format("2 Jan 2006")
	daysStr := fmt.Sprintf("%d", daysUntilMoveOut)

	smsMessage := strings.NewReplacer(
		"{{tenant_name}}", lease.Tenant.FirstName,
		"{{unit_name}}", unitName,
		"{{days_remaining}}", daysStr,
		"{{move_out_date}}", moveOutDateStr,
	).Replace(lib.LEASE_MOVEOUT_REMINDER_SMS_BODY)

	if lease.Tenant.Email != nil {
		htmlBody, textBody, renderErr := deps.appCtx.EmailEngine.Render(
			"lease/moveout-reminder",
			emailtemplates.LeaseMoveOutReminderData{
				TenantName:    lease.Tenant.FirstName,
				UnitName:      unitName,
				DaysRemaining: daysUntilMoveOut,
				MoveOutDate:   moveOutDateStr,
			},
		)
		if renderErr != nil {
			log.WithError(renderErr).WithField("lease_id", lease.ID.String()).
				Error("[Cron] failed to render lease/moveout-reminder email template")
		} else if err := pkg.SendEmail(deps.appCtx.Config, pkg.SendEmailInput{
			Recipient: *lease.Tenant.Email,
			Subject:   lib.LEASE_MOVEOUT_REMINDER_SUBJECT,
			HtmlBody:  htmlBody,
			TextBody:  textBody,
		}); err != nil {
			log.WithError(err).WithField("lease_id", lease.ID.String()).
				Error("[Cron] failed to send lease move-out reminder email")
		} else {
			channelSucceeded = true
		}
	}

	if err := deps.appCtx.Clients.GatekeeperAPI.SendSMS(ctx, gatekeeper.SendSMSInput{
		Recipient: lease.Tenant.Phone,
		Message:   smsMessage,
	}); err != nil {
		log.WithError(err).WithField("lease_id", lease.ID.String()).
			Error("[Cron] failed to send lease move-out reminder SMS")
	} else {
		channelSucceeded = true
	}

	if lease.Tenant.TenantAccount != nil {
		if err := deps.notificationSvc.SendToTenantAccount(
			ctx,
			lease.Tenant.TenantAccount.ID.String(),
			lib.LEASE_MOVEOUT_REMINDER_SUBJECT,
			smsMessage,
			map[string]string{"type": "LEASE_MOVEOUT_REMINDER", "lease_id": lease.ID.String()},
		); err != nil {
			log.WithError(err).WithField("lease_id", lease.ID.String()).
				Error("[Cron] failed to send lease move-out reminder notification")
		} else {
			channelSucceeded = true
		}
	}

	manager, managerErr := resolveCachedManagerRecipient(ctx, deps, lease, managers)
	if managerErr != nil {
		log.WithError(managerErr).WithField("lease_id", lease.ID.String()).
			Warn("[Cron] failed to resolve manager recipient for move-out reminder")
		return channelSucceeded
	}

	moveOutReportStatus := "Not yet created"
	checklist, checklistErr := deps.leaseChecklistRepo.GetCheckOutChecklist(ctx, lease.ID.String())
	if checklistErr != nil && !errors.Is(checklistErr, gorm.ErrRecordNotFound) {
		log.WithError(checklistErr).WithField("lease_id", lease.ID.String()).
			Error("[Cron] failed to look up move-out checklist")
	} else if checklistErr == nil && checklist != nil {
		switch checklist.Status {
		case "ACKNOWLEDGED":
			moveOutReportStatus = "Done"
		case "DISPUTED":
			moveOutReportStatus = "Needs your attention"
		default:
			moveOutReportStatus = "In progress"
		}
	}

	if manager.User.Email != "" {
		htmlBody, textBody, renderErr := deps.appCtx.EmailEngine.Render(
			"lease/moveout-reminder-manager",
			emailtemplates.LeaseMoveOutReminderManagerData{
				ManagerName:         manager.User.Name,
				TenantName:          lease.Tenant.FirstName,
				UnitName:            unitName,
				DaysRemaining:       daysUntilMoveOut,
				MoveOutDate:         moveOutDateStr,
				MoveOutReportStatus: moveOutReportStatus,
			},
		)
		if renderErr != nil {
			log.WithError(renderErr).WithField("lease_id", lease.ID.String()).
				Error("[Cron] failed to render lease/moveout-reminder-manager email template")
		} else if err := pkg.SendEmail(deps.appCtx.Config, pkg.SendEmailInput{
			Recipient: manager.User.Email,
			Subject:   lib.PM_LEASE_MOVEOUT_REMINDER_SUBJECT,
			HtmlBody:  htmlBody,
			TextBody:  textBody,
		}); err != nil {
			log.WithError(err).WithField("lease_id", lease.ID.String()).
				Error("[Cron] failed to send lease move-out reminder email to manager")
		} else {
			channelSucceeded = true
		}
	}

	return channelSucceeded
}

// ─── Job 2: auto-completion ─────────────────────────────────────────────────

// handleLeaseCompletion just resolves which leases are due, then delegates
// the transition and its notifications entirely to
// LeaseService.CompleteLease — the transactional atomicity and the
// tenant/manager notifications live together there.
func handleLeaseCompletion(deps leaseLifecycleDeps) asynq.HandlerFunc {
	return func(ctx context.Context, t *asynq.Task) error {
		leases, err := deps.leaseRepo.ListDueForCompletion(ctx)
		if err != nil {
			log.WithError(err).Error("[Cron] failed to list leases due for completion")
			return err
		}

		var successCount, failCount int
		for i := range *leases {
			leaseID := (*leases)[i].ID.String()

			if _, completeErr := deps.leaseService.CompleteLease(ctx, leaseID); completeErr != nil {
				log.WithError(completeErr).WithField("lease_id", leaseID).
					Error("[Cron] failed to complete lease")
				failCount++
				continue
			}

			successCount++
		}

		log.Infof("[Cron] lease completion complete: %d completed, %d failed", successCount, failCount)
		return nil
	}
}
