// Package notificationtemplates centralises per-event template resolution for
// all three delivery channels: email, SMS, and push.
// Each resolver takes the notification's Data map (map[string]any) and returns
// whatever the delivery worker needs to dispatch that channel.
package notificationtemplates

import (
	"fmt"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/lib/emailtemplates"
)

// EmailResolution is what the delivery worker needs to send an email.
type EmailResolution struct {
	Subject      string
	TemplateName string // key into emailtemplates.Engine
	TemplateData any    // typed struct passed to Engine.Render
}

// ResolveEmail returns the email template and data for a given event.
// Returns an error if the event has no registered email template.
func ResolveEmail(event string, data map[string]any) (EmailResolution, error) {
	switch event {
	// ─── Invoice ──────────────────────────────────────────────────────────────
	case "INVOICE_CREATED":
		return EmailResolution{
			Subject:      lib.INVOICE_CREATED_SUBJECT,
			TemplateName: "invoice/created",
			TemplateData: emailtemplates.InvoiceCreatedData{
				TenantName:  str(data, "tenant_name"),
				InvoiceCode: str(data, "invoice_code"),
				Currency:    str(data, "currency"),
				Amount:      str(data, "amount"),
			},
		}, nil

	case "INVOICE_PAID":
		return EmailResolution{
			Subject:      lib.INVOICE_PAID_SUBJECT,
			TemplateName: "invoice/paid",
			TemplateData: emailtemplates.InvoicePaidData{
				TenantName:  str(data, "tenant_name"),
				InvoiceCode: str(data, "invoice_code"),
				UnitName:    str(data, "unit_name"),
				Currency:    str(data, "currency"),
				Amount:      str(data, "amount"),
			},
		}, nil

	case "INVOICE_VOIDED":
		return EmailResolution{
			Subject:      lib.INVOICE_VOIDED_SUBJECT,
			TemplateName: "invoice/voided",
			TemplateData: emailtemplates.InvoiceVoidedData{
				TenantName:  str(data, "tenant_name"),
				InvoiceCode: str(data, "invoice_code"),
			},
		}, nil

	case "INVOICE_PRE_DUE_1D":
		return EmailResolution{
			Subject:      lib.INVOICE_PRE_DUE_1D_SUBJECT,
			TemplateName: "invoice/pre-due-1d",
			TemplateData: emailtemplates.InvoiceReminderData{
				TenantName:  str(data, "tenant_name"),
				InvoiceCode: str(data, "invoice_code"),
				UnitName:    str(data, "unit_name"),
				Currency:    str(data, "currency"),
				Amount:      str(data, "amount"),
				DueDate:     str(data, "due_date"),
			},
		}, nil

	case "INVOICE_OVERDUE_1D":
		return EmailResolution{
			Subject:      lib.INVOICE_OVERDUE_1D_SUBJECT,
			TemplateName: "invoice/overdue-1d",
			TemplateData: invoiceReminderData(data),
		}, nil

	case "INVOICE_OVERDUE_3D":
		return EmailResolution{
			Subject:      lib.INVOICE_OVERDUE_3D_SUBJECT,
			TemplateName: "invoice/overdue-3d",
			TemplateData: invoiceReminderData(data),
		}, nil

	case "INVOICE_OVERDUE_7D":
		return EmailResolution{
			Subject:      lib.INVOICE_OVERDUE_7D_SUBJECT,
			TemplateName: "invoice/overdue-7d",
			TemplateData: invoiceReminderData(data),
		}, nil

	case "INVOICE_OVERDUE_14D":
		return EmailResolution{
			Subject:      lib.INVOICE_OVERDUE_14D_SUBJECT,
			TemplateName: "invoice/overdue-14d",
			TemplateData: invoiceReminderData(data),
		}, nil

	// ─── Lease ────────────────────────────────────────────────────────────────
	case "LEASE_ACTIVATED":
		return EmailResolution{
			Subject:      lib.LEASE_ACTIVATED_SUBJECT,
			TemplateName: "lease/activated",
			TemplateData: emailtemplates.LeaseActivatedData{
				TenantName: str(data, "tenant_name"),
				UnitName:   str(data, "unit_name"),
				MoveInDate: str(data, "move_in_date"),
			},
		}, nil

	case "LEASE_CANCELLED":
		return EmailResolution{
			Subject:      lib.LEASE_CANCELLED_SUBJECT,
			TemplateName: "lease/cancelled",
			TemplateData: emailtemplates.LeaseCancelledData{
				TenantName:         str(data, "tenant_name"),
				UnitName:           str(data, "unit_name"),
				CancellationReason: str(data, "cancellation_reason"),
			},
		}, nil

	case "LEASE_TERMINATED":
		return EmailResolution{
			Subject:      lib.LEASE_TERMINATED_SUBJECT,
			TemplateName: "lease/terminated",
			TemplateData: emailtemplates.LeaseTerminatedData{
				TenantName:        str(data, "tenant_name"),
				UnitName:          str(data, "unit_name"),
				TerminationReason: str(data, "termination_reason"),
			},
		}, nil

	// ─── Tenant Application ───────────────────────────────────────────────────
	case "TENANT_APPLICATION_SUBMITTED":
		return EmailResolution{
			Subject:      lib.TENANT_APPLICATION_SUBMITTED_SUBJECT,
			TemplateName: "tenant-application/submitted",
			TemplateData: emailtemplates.TenantApplicationSubmittedData{
				ApplicantName:   str(data, "applicant_name"),
				UnitName:        str(data, "unit_name"),
				ApplicationCode: str(data, "application_code"),
				SubmissionDate:  str(data, "submission_date"),
			},
		}, nil

	case "TENANT_APPLICATION_APPROVED":
		return EmailResolution{
			Subject:      lib.TENANT_APPLICATION_APPROVED_SUBJECT,
			TemplateName: "tenant-application/approved",
			TemplateData: emailtemplates.TenantApplicationApprovedData{
				ApplicantName:   str(data, "applicant_name"),
				UnitName:        str(data, "unit_name"),
				ApplicationCode: str(data, "application_code"),
				PhoneNumber:     str(data, "phone_number"),
			},
		}, nil

	case "TENANT_APPLICATION_CANCELLED":
		return EmailResolution{
			Subject:      lib.TENANT_CANCELLED_SUBJECT,
			TemplateName: "tenant-application/cancelled",
			TemplateData: emailtemplates.TenantApplicationCancelledData{
				ApplicantName:   str(data, "applicant_name"),
				ApplicationCode: str(data, "application_code"),
				Reason:          str(data, "reason"),
			},
		}, nil

	// ─── Maintenance ──────────────────────────────────────────────────────────
	case "MAINTENANCE_REQUEST_CREATED":
		return EmailResolution{
			Subject:      lib.PM_MAINTENANCE_REQUEST_CREATED_SUBJECT,
			TemplateName: "maintenance/created",
			TemplateData: emailtemplates.MaintenanceRequestCreatedData{
				TenantName: str(data, "tenant_name"),
				UnitName:   str(data, "unit_name"),
				Title:      str(data, "title"),
				Category:   str(data, "category"),
				Priority:   str(data, "priority"),
			},
		}, nil

	// ─── Payment ──────────────────────────────────────────────────────────────
	case "PAYMENT_OFFLINE_SUBMITTED":
		return EmailResolution{
			Subject:      lib.PM_OFFLINE_PAYMENT_SUBMITTED_SUBJECT,
			TemplateName: "payment/offline-submitted",
			TemplateData: emailtemplates.OfflinePaymentSubmittedData{
				TenantName:  str(data, "tenant_name"),
				UnitName:    str(data, "unit_name"),
				InvoiceCode: str(data, "invoice_code"),
				Currency:    str(data, "currency"),
				Amount:      str(data, "amount"),
			},
		}, nil

	// ─── Booking ──────────────────────────────────────────────────────────────
	case "BOOKING_CREATED":
		return EmailResolution{
			Subject:      lib.BOOKING_CREATED_SUBJECT,
			TemplateName: "booking/created",
			TemplateData: emailtemplates.BookingCreatedData{
				GuestName:    str(data, "guest_name"),
				UnitName:     str(data, "unit_name"),
				CheckInDate:  str(data, "check_in_date"),
				CheckOutDate: str(data, "check_out_date"),
				Rate:         str(data, "rate"),
				Currency:     str(data, "currency"),
				TrackingCode: str(data, "tracking_code"),
			},
		}, nil

	case "BOOKING_CONFIRMED":
		return EmailResolution{
			Subject:      lib.BOOKING_CONFIRMED_SUBJECT,
			TemplateName: "booking/confirmed",
			TemplateData: emailtemplates.BookingConfirmedData{
				GuestName:    str(data, "guest_name"),
				UnitName:     str(data, "unit_name"),
				CheckInDate:  str(data, "check_in_date"),
				CheckInCode:  str(data, "check_in_code"),
				CheckOutDate: str(data, "check_out_date"),
				TrackingCode: str(data, "tracking_code"),
			},
		}, nil

	case "BOOKING_CANCELLED":
		return EmailResolution{
			Subject:      lib.BOOKING_CANCELLED_SUBJECT,
			TemplateName: "booking/cancelled",
			TemplateData: emailtemplates.BookingCancelledData{
				GuestName:          str(data, "guest_name"),
				UnitName:           str(data, "unit_name"),
				CheckInDate:        str(data, "check_in_date"),
				CheckOutDate:       str(data, "check_out_date"),
				TrackingCode:       str(data, "tracking_code"),
				CancellationReason: str(data, "cancellation_reason"),
			},
		}, nil

	// ─── Announcement ─────────────────────────────────────────────────────────
	case "ANNOUNCEMENT_PUBLISHED":
		return EmailResolution{
			Subject:      lib.ANNOUNCEMENT_EMAIL_SUBJECT,
			TemplateName: "announcement/announcement",
			TemplateData: emailtemplates.AnnouncementData{
				AnnouncementType:    str(data, "announcement_type"),
				AnnouncementTitle:   str(data, "announcement_title"),
				AnnouncementContent: str(data, "announcement_content"),
			},
		}, nil

	// ─── Lease Checklist ──────────────────────────────────────────────────────
	case "LEASE_CHECKLIST_ACKNOWLEDGED":
		return EmailResolution{
			Subject:      lib.PM_CHECKLIST_ACKNOWLEDGED_SUBJECT,
			TemplateName: "maintenance/checklist-acknowledged",
			TemplateData: emailtemplates.ChecklistAcknowledgedData{
				TenantName:    str(data, "tenant_name"),
				UnitName:      str(data, "unit_name"),
				ChecklistType: str(data, "checklist_type"),
				Action:        str(data, "action"),
			},
		}, nil
	}

	return EmailResolution{}, fmt.Errorf("notificationtemplates: no email template for event %q", event)
}

// ─── helpers ──────────────────────────────────────────────────────────────────

func str(data map[string]any, key string) string {
	if v, ok := data[key]; ok {
		return fmt.Sprintf("%v", v)
	}
	return ""
}

func invoiceReminderData(data map[string]any) emailtemplates.InvoiceReminderData {
	return emailtemplates.InvoiceReminderData{
		TenantName:  str(data, "tenant_name"),
		InvoiceCode: str(data, "invoice_code"),
		UnitName:    str(data, "unit_name"),
		Currency:    str(data, "currency"),
		Amount:      str(data, "amount"),
		DueDate:     str(data, "due_date"),
	}
}
