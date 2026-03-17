package queue

import (
	"context"
	"slices"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/hibiken/asynq"
	log "github.com/sirupsen/logrus"
)

// ─── Task types ───────────────────────────────────────────────────────────────

const TypeInvoiceReminder = "invoice:rent-reminder"

// ─── Worker handlers ──────────────────────────────────────────────────────────

// InvoiceReminderHandlers returns a HandlerRegistrar that wires up the invoice
// reminder task handler onto the serve mux.
func InvoiceReminderHandlers(
	invoiceRepo repository.InvoiceRepository,
	appCtx pkg.AppContext,
	notificationSvc services.NotificationService,
) HandlerRegistrar {
	return func(mux *asynq.ServeMux) {
		mux.HandleFunc(TypeInvoiceReminder, handleInvoiceReminder(invoiceRepo, appCtx, notificationSvc))
	}
}

type reminderThreshold struct {
	days int
	key  string
}

var overdueThresholds = []reminderThreshold{
	{14, "overdue_14d"},
	{7, "overdue_7d"},
	{3, "overdue_3d"},
	{1, "overdue_1d"},
}

func handleInvoiceReminder(
	repo repository.InvoiceRepository,
	appCtx pkg.AppContext,
	notificationSvc services.NotificationService,
) asynq.HandlerFunc {
	return func(ctx context.Context, t *asynq.Task) error {
		invoices, err := repo.ListForReminders(ctx)
		if err != nil {
			log.WithError(err).Error("[Cron] failed to list invoices for reminders")
			return err
		}

		var successCount, failCount int
		for i := range *invoices {
			invoice := &(*invoices)[i]
			if invoice.DueDate == nil {
				continue
			}

			hoursUntilDue := time.Until(*invoice.DueDate).Hours()
			var reminderKey string
			var subject, bodyTemplate string

			if hoursUntilDue > 0 && hoursUntilDue <= 24 {
				// Pre-due: due within the next 24 hours
				if !slices.Contains(invoice.RemindersSent, "pre_due_1d") {
					reminderKey = "pre_due_1d"
					subject = lib.INVOICE_PRE_DUE_1D_SUBJECT
					bodyTemplate = lib.INVOICE_PRE_DUE_1D_BODY
				}
			} else if hoursUntilDue < 0 {
				// Overdue: find highest applicable unsent threshold
				daysPastDue := int(-hoursUntilDue / 24)
				for _, threshold := range overdueThresholds {
					if daysPastDue >= threshold.days && !slices.Contains(invoice.RemindersSent, threshold.key) {
						reminderKey = threshold.key
						subject, bodyTemplate = overdueTemplate(threshold.key)
						break
					}
				}
			}

			if reminderKey == "" {
				continue
			}

			tenant := invoice.PayerTenant
			if tenant == nil {
				log.WithField("invoice_id", invoice.ID.String()).
					Warn("[Cron] invoice has no payer tenant, skipping reminder")
				failCount++
				continue
			}

			unitName := ""
			if invoice.ContextLease != nil {
				unitName = invoice.ContextLease.Unit.Name
			}
			dueDate := invoice.DueDate.Format("2 Jan 2006")

			message := strings.NewReplacer(
				"{{tenant_name}}", tenant.FirstName,
				"{{invoice_code}}", invoice.Code,
				"{{unit_name}}", unitName,
				"{{currency}}", invoice.Currency,
				"{{amount}}", lib.FormatAmount(lib.PesewasToCedis(int64(invoice.TotalAmount))),
				"{{due_date}}", dueDate,
			).Replace(bodyTemplate)

			if tenant.Email != nil {
				go pkg.SendEmail(appCtx.Config, pkg.SendEmailInput{
					Recipient: *tenant.Email,
					Subject:   subject,
					TextBody:  message,
				})
			}

			go appCtx.Clients.GatekeeperAPI.SendSMS(context.Background(), gatekeeper.SendSMSInput{
				Recipient: tenant.Phone,
				Message:   message,
			})

			if tenant.TenantAccount != nil {
				invoiceID := invoice.ID.String()
				tenantAccountID := tenant.TenantAccount.ID.String()
				go func() {
					_ = notificationSvc.SendToTenantAccount(
						context.Background(),
						tenantAccountID,
						subject,
						message,
						map[string]string{
							"type":         "INVOICE_REMINDER",
							"invoice_id":   invoiceID,
							"invoice_code": invoice.Code,
							"reminder_key": reminderKey,
						},
					)
				}()
			}

			// Mark reminder as sent
			invoice.RemindersSent = append(invoice.RemindersSent, reminderKey)
			if updateErr := repo.Update(ctx, invoice); updateErr != nil {
				log.WithError(updateErr).WithField("invoice_id", invoice.ID.String()).
					Error("[Cron] failed to update invoice reminders_sent")
				failCount++
				continue
			}

			successCount++
		}

		log.Infof("[Cron] invoice reminders complete: %d sent, %d failed", successCount, failCount)
		return nil
	}
}

func overdueTemplate(key string) (subject, body string) {
	switch key {
	case "overdue_1d":
		return lib.INVOICE_OVERDUE_1D_SUBJECT, lib.INVOICE_OVERDUE_1D_BODY
	case "overdue_3d":
		return lib.INVOICE_OVERDUE_3D_SUBJECT, lib.INVOICE_OVERDUE_3D_BODY
	case "overdue_7d":
		return lib.INVOICE_OVERDUE_7D_SUBJECT, lib.INVOICE_OVERDUE_7D_BODY
	case "overdue_14d":
		return lib.INVOICE_OVERDUE_14D_SUBJECT, lib.INVOICE_OVERDUE_14D_BODY
	default:
		return lib.INVOICE_OVERDUE_1D_SUBJECT, lib.INVOICE_OVERDUE_1D_BODY
	}
}
