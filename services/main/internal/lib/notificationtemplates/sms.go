package notificationtemplates

import (
	"fmt"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
)

// ResolveSMS returns the fully-interpolated SMS body for a given event.
// The data map keys match the {{placeholder}} names in each template constant.
// Returns an error if the event has no registered SMS template.
func ResolveSMS(event string, data map[string]any) (string, error) {
	tmpl, ok := smsTemplates[event]
	if !ok {
		return "", fmt.Errorf("notificationtemplates: no SMS template for event %q", event)
	}
	return interpolate(tmpl, data), nil
}

// interpolate replaces every {{key}} occurrence with the corresponding value
// from the data map. Missing keys render as an empty string.
func interpolate(tmpl string, data map[string]any) string {
	pairs := make([]string, 0, len(data)*2)
	for k, v := range data {
		pairs = append(pairs, "{{"+k+"}}", fmt.Sprintf("%v", v))
	}
	return strings.NewReplacer(pairs...).Replace(tmpl)
}

// smsTemplates maps event names to SMS body templates.
// Template variables use {{snake_case}} placeholders that match the keys
// callers put into CreateNotificationInput.Data.
var smsTemplates = map[string]string{
	// ─── Invoice ──────────────────────────────────────────────────────────────
	"INVOICE_CREATED":     lib.INVOICE_CREATED_SMS_BODY,
	"INVOICE_PAID":        lib.INVOICE_PAID_SMS_BODY,
	"INVOICE_VOIDED":      lib.INVOICE_VOIDED_SMS_BODY,
	"INVOICE_PRE_DUE_1D":  lib.INVOICE_PRE_DUE_1D_SMS_BODY,
	"INVOICE_OVERDUE_1D":  lib.INVOICE_OVERDUE_1D_SMS_BODY,
	"INVOICE_OVERDUE_3D":  lib.INVOICE_OVERDUE_3D_SMS_BODY,
	"INVOICE_OVERDUE_7D":  lib.INVOICE_OVERDUE_7D_SMS_BODY,
	"INVOICE_OVERDUE_14D": lib.INVOICE_OVERDUE_14D_SMS_BODY,

	// ─── Lease ────────────────────────────────────────────────────────────────
	"LEASE_ACTIVATED":  lib.LEASE_ACTIVATED_SMS_BODY,
	"LEASE_CANCELLED":  lib.LEASE_CANCELLED_SMS_BODY,
	"LEASE_TERMINATED": lib.LEASE_TERMINATED_SMS_BODY,

	// ─── Tenant Application ───────────────────────────────────────────────────
	"TENANT_APPLICATION_SUBMITTED": lib.TENANT_APPLICATION_SUBMITTED_SMS_BODY,
	"TENANT_APPLICATION_APPROVED":  lib.TENANT_APPLICATION_APPROVED_SMS_BODY,
	"TENANT_APPLICATION_CANCELLED": lib.TENANT_CANCELLED_SMS_BODY,

	// ─── Maintenance ──────────────────────────────────────────────────────────
	"MAINTENANCE_REQUEST_CREATED": `New maintenance request from {{tenant_name}} for {{unit_name}}: {{title}} ({{priority}}).`,

	// ─── Payment ──────────────────────────────────────────────────────────────
	"PAYMENT_OFFLINE_SUBMITTED": `Hi {{property_manager_name}}, {{tenant_name}} submitted an offline payment for invoice {{invoice_code}} ({{currency}} {{amount}}).`,

	// ─── Booking ──────────────────────────────────────────────────────────────
	"BOOKING_CREATED":           lib.BOOKING_CREATED_SMS_BODY,
	"BOOKING_CONFIRMED":         lib.BOOKING_CONFIRMED_SMS_BODY,
	"BOOKING_CANCELLED":         lib.BOOKING_CANCELLED_SMS_BODY,
	"BOOKING_CHECKIN_REMINDER":  lib.BOOKING_CHECKIN_REMINDER_SMS_BODY,
	"BOOKING_CHECKOUT_REMINDER": lib.BOOKING_CHECKOUT_REMINDER_SMS_BODY,

	// ─── Announcement ─────────────────────────────────────────────────────────
	"ANNOUNCEMENT_PUBLISHED": lib.ANNOUNCEMENT_SMS_BODY,

	// ─── Lease Checklist ──────────────────────────────────────────────────────
	"LEASE_CHECKLIST_ACKNOWLEDGED": `{{tenant_name}} has responded to the {{checklist_type}} checklist for {{unit_name}}.`,
}
