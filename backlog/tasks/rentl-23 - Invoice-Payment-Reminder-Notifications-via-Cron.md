---
id: RENTL-23
title: Invoice Payment Reminder Notifications via Cron
status: In Progress
assignee: []
created_date: '2026-03-11 18:31'
updated_date: '2026-03-17 13:09'
labels:
  - backend
  - invoicing
  - cron
  - notifications
dependencies:
  - RENTL-22
references:
  - internal/models/invoice.go
  - internal/repository/invoice.go
  - internal/jobs/invoice_generation.go
  - internal/services/payment.go
  - init/migration/jobs/
  - init/migration/main.go
priority: medium
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

Following RENTL-22 (invoice generation cron), rent invoices are created on the exact billing/due date. Since the invoice doesn't exist ahead of time, there are no pre-due reminders. Instead, this task implements:

1. **Overdue escalation** — push/email/SMS reminders when a rent invoice remains unpaid past the due date
2. **Payment confirmation** — immediate notification when an invoice is marked `PAID`

No pre-due reminders are needed (invoice is created on due date, tenant is already notified at creation).

---

## Reminder Schedule

| Trigger | Condition | Message tone |
|---|---|---|
| Creation (handled in RENTL-22) | Invoice generated = due today | "Your rent invoice is ready — due today" |
| +1 day overdue | DueDate + 1 day, still ISSUED/PARTIALLY_PAID | "Your payment is 1 day overdue" |
| +3 days overdue | DueDate + 3 days | "Your payment is 3 days overdue — please settle soon" |
| +7 days overdue | DueDate + 7 days | "Urgent: rent 7 days overdue" |
| +14 days overdue | DueDate + 14 days | "Final notice: rent 14 days overdue" |
| Payment received | Invoice transitions to PAID | "Payment confirmed — thank you!" |

---

## Reminder Deduplication

Add a `reminders_sent pq.StringArray` column to the `invoices` table. Values: `"overdue_1d"`, `"overdue_3d"`, `"overdue_7d"`, `"overdue_14d"`. Check before sending; append after sending.

```go
// Check:
alreadySent := slices.Contains(invoice.RemindersSent, "overdue_1d")

// Mark after sending:
invoice.RemindersSent = append(invoice.RemindersSent, "overdue_1d")
repo.Update(ctx, invoice)
```

---

## Implementation Steps

### 1. New migration — add `reminders_sent` to invoices
**New file:** `init/migration/jobs/add-invoice-reminders-sent.go`

```go
func AddInvoiceRemindersSent() *gormigrate.Migration {
    return &gormigrate.Migration{
        ID: "ADD_INVOICE_REMINDERS_SENT",
        Migrate: func(db *gorm.DB) error {
            return db.Exec(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminders_sent TEXT[] NOT NULL DEFAULT '{}'`).Error
        },
        Rollback: func(db *gorm.DB) error {
            return db.Exec(`ALTER TABLE invoices DROP COLUMN IF EXISTS reminders_sent`).Error
        },
    }
}
```

Register in `init/migration/main.go`.

### 2. Add `RemindersSent` to Invoice model
**File:** `internal/models/invoice.go`

```go
RemindersSent pq.StringArray `gorm:"type:text[];default:'{}'"`
```

### 3. New repository method — `ListOverdueForReminders`
**File:** `internal/repository/invoice.go`

```go
ListOverdueForReminders(ctx context.Context) (*[]models.Invoice, error)
```
Query: `context_type = 'LEASE_RENT' AND status IN ('ISSUED', 'PARTIALLY_PAID') AND due_date < NOW()`
Preload: `ContextLease.Tenant.TenantAccount`, `ContextLease.Unit`

### 4. New cron job — `RentOverdueReminderJob`
**File:** `internal/jobs/invoice_reminders.go`

```go
func (j *RentOverdueReminderJob) Run() {
    invoices := repo.ListOverdueForReminders(ctx)
    for _, invoice := range invoices {
        daysPastDue := int(time.Since(*invoice.DueDate).Hours() / 24)
        thresholds := []struct{ days int; key string }{
            {1, "overdue_1d"}, {3, "overdue_3d"}, {7, "overdue_7d"}, {14, "overdue_14d"},
        }
        for _, t := range thresholds {
            if daysPastDue >= t.days && !slices.Contains(invoice.RemindersSent, t.key) {
                // send notifications
                // update invoice.RemindersSent
                break // only send the highest applicable reminder not yet sent
            }
        }
    }
}
```

Register in `RegisterJobs()` alongside `RentInvoiceJob` — same `"0 * * * *"` hourly schedule.

### 5. Payment confirmation notification
**File:** `internal/services/payment.go` (in `VerifyOfflinePayment` or wherever invoice transitions to `PAID`)

When invoice status changes to `PAID`, fire-and-forget:
- Push: `notificationService.SendToTenantAccount(...)` — "Payment confirmed"
- Email + SMS (follow existing pattern)

### 6. Notification templates
**File:** `internal/lib/` (email constants file)

Add constants for:
- `INVOICE_OVERDUE_1D_SUBJECT` / `INVOICE_OVERDUE_1D_BODY`
- `INVOICE_OVERDUE_3D_SUBJECT` / `INVOICE_OVERDUE_3D_BODY`
- `INVOICE_OVERDUE_7D_SUBJECT` / `INVOICE_OVERDUE_7D_BODY`
- `INVOICE_OVERDUE_14D_SUBJECT` / `INVOICE_OVERDUE_14D_BODY`
- `INVOICE_PAID_SUBJECT` / `INVOICE_PAID_BODY`

---

## Critical Files

| File | Change |
|---|---|
| `internal/models/invoice.go` | Add `RemindersSent pq.StringArray` |
| `init/migration/jobs/add-invoice-reminders-sent.go` | **New** — migration |
| `init/migration/main.go` | Register new migration |
| `internal/repository/invoice.go` | Add `ListOverdueForReminders` |
| `internal/jobs/invoice_reminders.go` | **New** — overdue reminder job |
| `internal/jobs/invoice_generation.go` | Register new job in `RegisterJobs()` |
| `internal/services/payment.go` | Add payment confirmation notification |
| `internal/lib/` (email constants) | Add overdue + paid notification templates |
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An ISSUED LEASE_RENT invoice with DueDate = yesterday triggers a `overdue_1d` reminder on next cron run (push + email + SMS sent)
- [ ] #2 Running the cron again does NOT send a duplicate `overdue_1d` reminder (RemindersSent array updated)
- [ ] #3 An invoice 3 days past due receives `overdue_3d` reminder but NOT `overdue_1d` again
- [ ] #4 An invoice 14+ days past due receives `overdue_14d` reminder
- [ ] #5 When an invoice transitions to PAID, tenant receives payment confirmation via push + email + SMS
- [ ] #6 Reminders are NOT sent for PAID or VOID invoices
- [ ] #7 Reminders are NOT sent for non-LEASE_RENT invoices (context_type filter)
- [ ] #8 Linting passes: make lint
<!-- AC:END -->
