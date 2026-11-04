package queue

import (
	"context"
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/clients/gatekeeper"
	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/lib/emailtemplates"
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

// nextOverdueReminder picks the latest threshold reached and returns it with
// every earlier one to mark as sent. An invoice first seen days late (issued
// late, or the cron was down) gets one reminder, not a daily backlog of stale
// ones that tells the tenant "1 day overdue" on day six.
func nextOverdueReminder(daysPastDue int, sent []string) (string, []string) {
	for i, threshold := range overdueThresholds {
		if daysPastDue < threshold.days {
			continue
		}
		if slices.Contains(sent, threshold.key) {
			return "", nil
		}

		marks := make([]string, 0, len(overdueThresholds)-i)
		for _, covered := range overdueThresholds[i:] {
			if !slices.Contains(sent, covered.key) {
				marks = append(marks, covered.key)
			}
		}
		return threshold.key, marks
	}

	return "", nil
}

func daysOverdueLabel(days int) string {
	if days == 1 {
		return "1 day"
	}
	return fmt.Sprintf("%d days", days)
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

			due := invoice.DueDate
			dueLoc := due.Location()
			now := time.Now().In(dueLoc)
			// Normalize to calendar dates (start of day) in the due date's location.
			nowDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, dueLoc)
			dueDate := time.Date(due.Year(), due.Month(), due.Day(), 0, 0, 0, 0, dueLoc)
			daysUntilDue := int(dueDate.Sub(nowDate).Hours() / 24)

			var reminderKey string
			var reminderMarks []string
			var subject, emailTemplateName, smsBodyTemplate string
			daysOverdue := daysOverdueLabel(-daysUntilDue)

			if daysUntilDue == 1 {
				// Pre-due: due tomorrow (next calendar day)
				if !slices.Contains(invoice.RemindersSent, "pre_due_1d") {
					reminderKey = "pre_due_1d"
					reminderMarks = []string{reminderKey}
					subject = lib.INVOICE_PRE_DUE_1D_SUBJECT
					emailTemplateName = "invoice/pre-due-1d"
					smsBodyTemplate = lib.INVOICE_PRE_DUE_1D_SMS_BODY
				}
			} else if daysUntilDue < 0 {
				reminderKey, reminderMarks = nextOverdueReminder(-daysUntilDue, invoice.RemindersSent)
				if reminderKey != "" {
					subject, emailTemplateName, smsBodyTemplate = overdueTemplate(reminderKey)
					subject = strings.ReplaceAll(subject, "{{days_overdue}}", daysOverdue)
				}
			}

			if reminderKey == "" {
				continue
			}

			if invoice.PayerLease == nil || invoice.PayerLease.TenantId == "" {
				log.WithField("invoice_id", invoice.ID.String()).
					Warn("[Cron] invoice has no payer lease/tenant, skipping reminder")
				failCount++
				continue
			}
			tenant := &invoice.PayerLease.Tenant

			// Unit comes from PayerLease now that Invoice.ContextLease is gone;
			// this branch already guarantees PayerLease is present.
			unitName := invoice.PayerLease.Unit.Name

			reminderData := emailtemplates.InvoiceReminderData{
				TenantName:  tenant.FirstName,
				InvoiceCode: invoice.Code,
				UnitName:    unitName,
				Currency:    invoice.Currency,
				Amount:      lib.FormatAmount(lib.PesewasToCedis(int64(invoice.TotalAmount))),
				DueDate:     invoice.DueDate.Format("2 Jan 2006"),
				DaysOverdue: daysOverdue,
			}
			smsMessage := strings.NewReplacer(
				"{{tenant_name}}", tenant.FirstName,
				"{{invoice_code}}", invoice.Code,
				"{{unit_name}}", unitName,
				"{{currency}}", invoice.Currency,
				"{{amount}}", lib.FormatAmount(lib.PesewasToCedis(int64(invoice.TotalAmount))),
				"{{due_date}}", invoice.DueDate.Format("2 Jan 2006"),
				"{{days_overdue}}", daysOverdue,
			).Replace(smsBodyTemplate)

			channelSucceeded := false

			if tenant.Email != nil {
				htmlBody, textBody, renderErr := appCtx.EmailEngine.Render(emailTemplateName, reminderData)
				if renderErr != nil {
					log.WithError(renderErr).
						WithField("invoice_id", invoice.ID.String()).
						Error("[Cron] failed to render invoice reminder email template")
					failCount++
					continue
				}
				if err := pkg.SendEmail(appCtx.Config, pkg.SendEmailInput{
					Recipient: *tenant.Email,
					Subject:   subject,
					HtmlBody:  htmlBody,
					TextBody:  textBody,
				}); err != nil {
					log.WithError(err).
						WithField("invoice_id", invoice.ID.String()).
						Error("[Cron] failed to send invoice reminder email")
				} else {
					channelSucceeded = true
				}
			}

			if err := appCtx.Clients.GatekeeperAPI.SendSMS(ctx, gatekeeper.SendSMSInput{
				Recipient: tenant.Phone,
				Message:   smsMessage,
			}); err != nil {
				log.WithError(err).
					WithField("invoice_id", invoice.ID.String()).
					Error("[Cron] failed to send invoice reminder SMS")
			} else {
				channelSucceeded = true
			}

			if tenant.TenantAccount != nil {
				invoiceID := invoice.ID.String()
				tenantAccountID := tenant.TenantAccount.ID.String()
				if err := notificationSvc.SendToTenantAccount(
					ctx,
					tenantAccountID,
					subject,
					smsMessage,
					map[string]string{
						"type":         "INVOICE_REMINDER",
						"invoice_id":   invoiceID,
						"invoice_code": invoice.Code,
						"reminder_key": reminderKey,
					},
				); err != nil {
					log.WithError(err).
						WithField("invoice_id", invoice.ID.String()).
						Error("[Cron] failed to send invoice reminder notification")
				} else {
					channelSucceeded = true
				}
			}

			// Only mark reminder as sent if at least one channel succeeded
			if !channelSucceeded {
				failCount++
				continue
			}

			invoice.RemindersSent = append(invoice.RemindersSent, reminderMarks...)
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

func overdueTemplate(key string) (subject, emailTemplateName, smsBody string) {
	switch key {
	case "overdue_1d":
		return lib.INVOICE_OVERDUE_1D_SUBJECT, "invoice/overdue-1d", lib.INVOICE_OVERDUE_1D_SMS_BODY
	case "overdue_3d":
		return lib.INVOICE_OVERDUE_3D_SUBJECT, "invoice/overdue-3d", lib.INVOICE_OVERDUE_3D_SMS_BODY
	case "overdue_7d":
		return lib.INVOICE_OVERDUE_7D_SUBJECT, "invoice/overdue-7d", lib.INVOICE_OVERDUE_7D_SMS_BODY
	case "overdue_14d":
		return lib.INVOICE_OVERDUE_14D_SUBJECT, "invoice/overdue-14d", lib.INVOICE_OVERDUE_14D_SMS_BODY
	default:
		return lib.INVOICE_OVERDUE_1D_SUBJECT, "invoice/overdue-1d", lib.INVOICE_OVERDUE_1D_SMS_BODY
	}
}
