---
id: RENTL-22
title: Automatic Lease Rent Invoice Generation via Cron
status: Done
assignee: []
created_date: '2026-03-11 18:09'
updated_date: '2026-03-17 13:03'
labels:
  - backend
  - invoicing
  - cron
  - leases
dependencies: []
references:
  - internal/models/lease.go
  - internal/models/invoice.go
  - internal/services/lease.go
  - internal/services/invoice.go
  - internal/services/notification.go
  - internal/services/main.go
  - internal/repository/lease.go
  - init/migration/main.go
  - init/migration/jobs/
  - cmd/rentloop-engine/main.go
priority: high
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

The platform already generates invoices manually for tenant applications (deposits). The next step is to automatically generate recurring rent invoices for **Active** leases based on their `PaymentFrequency`. This requires a scheduled cron job that runs hourly, finds leases due for billing, generates an `ISSUED` invoice (with Fincore accounting entries), notifies the tenant via email/SMS/push, and advances the `NextBillingDate` on the lease.

**Currently missing:**
- No `NextBillingDate` tracking field on the `Lease` model
- No cron/scheduler infrastructure (`robfig/cron` not in `go.mod`)
- No `GenerateLeaseRentInvoice` service method
- No `ListDueForBilling` repository query

**Existing infrastructure to reuse:**
- `InvoiceService.CreateInvoice()` — already handles `LEASE_RENT` context type with Fincore accounting (Debit AR / Credit Rental Income)
- `NotificationService.SendToTenantAccount()` — FCM push notifications via Firebase
- `pkg.SendEmail()` + `GatekeeperAPI.SendSMS()` — fire-and-forget notification pattern
- `lib.WithTransaction()` + `lib.ResolveDB()` — DB transaction pattern
- Versioned migration system via `go-gormigrate` in `init/migration/jobs/`

---

## Implementation Steps

### 1. Add `robfig/cron` dependency
```bash
go get github.com/robfig/cron/v3@latest
```

---

### 2. Add `NextBillingDate` to Lease model
**File:** `internal/models/lease.go`

Add after `ActivatedAt *time.Time`:
```go
NextBillingDate *time.Time
```

---

### 3. New migration
**New file:** `init/migration/jobs/add-lease-next-billing-date.go`

```go
package jobs

import (
    "github.com/go-gormigrate/gormigrate/v2"
    "gorm.io/gorm"
)

func AddLeaseNextBillingDate() *gormigrate.Migration {
    return &gormigrate.Migration{
        ID: "ADD_LEASE_NEXT_BILLING_DATE",
        Migrate: func(db *gorm.DB) error {
            return db.Exec(`ALTER TABLE leases ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ`).Error
        },
        Rollback: func(db *gorm.DB) error {
            return db.Exec(`ALTER TABLE leases DROP COLUMN IF EXISTS next_billing_date`).Error
        },
    }
}
```

**File:** `init/migration/main.go` — append `jobs.AddLeaseNextBillingDate()` to the migrations slice (after line 70).

---

### 4. New repository method
**File:** `internal/repository/lease.go`

Add to `LeaseRepository` interface and implement:
```go
ListDueForBilling(ctx context.Context) (*[]models.Lease, error)
```
Query: `status = 'Lease.Status.Active' AND next_billing_date IS NOT NULL AND next_billing_date <= NOW()`
Preload: `Tenant`, `Unit` (needed for notifications and invoice labeling).

---

### 5. Extend `LeaseService`
**File:** `internal/services/lease.go`

**5a.** Add `GenerateLeaseRentInvoice` to the `LeaseService` interface:
```go
GenerateLeaseRentInvoice(ctx context.Context, leaseID string) error
```

**5b.** Add `invoiceService InvoiceService` and `notificationService NotificationService` to `leaseService` struct and update `NewLeaseService` signature:
```go
func NewLeaseService(appCtx pkg.AppContext, repo repository.LeaseRepository, invoiceService InvoiceService, notificationService NotificationService) LeaseService
```

**5c.** In `ActivateLease`, set `NextBillingDate` before `s.repo.Update(ctx, lease)`:
```go
if lease.PaymentFrequency != nil {
    nextBillingDate, _ := calculateNextBillingDate(time.Now(), *lease.PaymentFrequency)
    lease.NextBillingDate = nextBillingDate // nil for OneTime (won't be picked up by cron)
}
```

**5d.** Implement `GenerateLeaseRentInvoice`:
1. Fetch lease with `Preload("Tenant.TenantAccount")` (in addition to `Unit`) to get the FCM target
2. Validate: `status == Active`, `PaymentFrequency != nil`
3. Call `s.invoiceService.CreateInvoice(...)` with:
   - `PayerType: "TENANT"`, `PayerTenantID: &lease.TenantId`
   - `PayeeType: "PROPERTY_OWNER"`
   - `ContextType: "LEASE_RENT"`, `ContextLeaseID: &leaseIDStr`
   - `Status: "ISSUED"` (posts Fincore journal entry: Debit AR / Credit Rental Income)
   - LineItem: `{Label: "March 2026 Rent", Category: "RENT", Quantity: 1, UnitAmount: lease.RentFee, ...}`
4. Update `lease.NextBillingDate = calculateNextBillingDate(time.Now(), frequency)` and `s.repo.Update()`
5. Fire-and-forget notifications (follow `ActivateLease` pattern in the same file):
   - Email (if `lease.Tenant.Email != nil`)
   - SMS via `GatekeeperAPI.SendSMS`
   - **Push** via `go s.notificationService.SendToTenantAccount(ctx, lease.Tenant.TenantAccount.ID, title, body, data)` where `data` includes `invoice_id` and `invoice_code`

**5e.** Add private helper `calculateNextBillingDate(from time.Time, frequency string) (*time.Time, error)`:
```
Hourly → +1 hour | DAILY → +1 day | WEEKLY → +7 days | MONTHLY → +1 month
Quarterly → +3 months | BiAnnually → +6 months | Annually → +1 year
OneTime → nil (no recurring billing)
```
Note: the codebase mixes case (`DAILY`, `MONTHLY` vs `Hourly`, `Quarterly`, `BiAnnually`) — handle all variants.

---

### 6. New jobs package
**New file:** `internal/jobs/invoice_generation.go`

```go
type RentInvoiceJob struct {
    leaseRepo    repository.LeaseRepository
    leaseService services.LeaseService
}

func (j *RentInvoiceJob) Run() {
    // ListDueForBilling → for each lease, GenerateLeaseRentInvoice
    // Log per-lease errors and continue (batch doesn't abort on one failure)
    // Log success/failure counts at end of run
}

func RegisterJobs(appCtx pkg.AppContext, repo repository.Repository, svcs services.Services) *cron.Cron {
    c := cron.New()
    // Every hour — catches Hourly leases on time; longer-frequency leases are
    // naturally skipped when their NextBillingDate is still in the future.
    c.AddJob("0 * * * *", &RentInvoiceJob{repo.LeaseRepository, svcs.LeaseService})
    c.Start()
    return c
}
```

---

### 7. Wire into `main.go`
**File:** `cmd/rentloop-engine/main.go`

After `handlers := handlers.NewHandlers(...)`, before `r := router.New(...)`:
```go
cronScheduler := jobs.RegisterJobs(appCtx, repository, services)
defer cronScheduler.Stop()
```

---

### 8. Update `services/main.go` call site
**File:** `internal/services/main.go` — line 86:
```go
// Before:
leaseService := NewLeaseService(params.AppCtx, params.Repository.LeaseRepository)
// After:
leaseService := NewLeaseService(params.AppCtx, params.Repository.LeaseRepository, invoiceService, notificationService)
```
Both `invoiceService` (line 40) and `notificationService` (line 38) are already constructed before `leaseService`, no circular dependency.

---

### 9. Email/SMS/Push notification templates
**File:** `internal/lib/` (wherever existing lease email constants live, e.g. `email-templates.go`)

Add constants for invoice notification subject + body (follow the `LEASE_ACTIVATED_SUBJECT` / `LEASE_ACTIVATED_BODY` pattern).

---

## Billing Schedule Logic

The cron runs **every hour** (`0 * * * *`). The `NextBillingDate <= NOW()` DB filter ensures a lease is only picked up when its next billing cycle has arrived. After generating an invoice, `NextBillingDate` is advanced by one full cycle — so re-runs don't double-bill.

**On lease activation:** `NextBillingDate = now + 1 cycle` (tenant gets first invoice one full cycle after activation).

**`OneTime` leases:** `NextBillingDate` is set to `nil` on activation — these leases never appear in `ListDueForBilling`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 run `make update-db` — `next_billing_date TIMESTAMPTZ` column appears on `leases` table
- [ ] #2 Activating a MONTHLY lease sets `next_billing_date = now + 1 month` in DB
- [ ] #3 Activating an Hourly lease sets `next_billing_date = now + 1 hour` in DB
- [ ] #4 Activating a OneTime lease leaves `next_billing_date = NULL`
- [ ] #5 Manually setting `next_billing_date = NOW() - INTERVAL '1 day'` on an Active lease and triggering `job.Run()` creates a new invoice row with `context_type = LEASE_RENT` and `status = ISSUED`
- [ ] #6 After job run, `next_billing_date` on the lease is advanced by 1 cycle
- [ ] #7 Running job again immediately does NOT generate a duplicate invoice (date was already advanced)
- [ ] #8 Tenant receives email, SMS, and push notification when a rent invoice is generated
- [ ] #9 On staging: Fincore journal entry created with Debit AR / Credit Rental Income matching the invoice amount
- [ ] #10 Linting passes: `make lint`
- [ ] #11 Activating a lease where InitialDepositFee covers 2 months sets NextBillingDate = MoveInDate + 2 months
- [ ] #12 Activating a lease where InitialDepositFee = 0 sets NextBillingDate = MoveInDate (cron picks it up on the first run after move-in)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## NextBillingDate Calculation on Lease Activation

The `lease.Meta` JSONB field (set by `ApproveTenantApplication` at services/tenant-application.go:802) already contains `initial_deposit_fee`. No join to TenantApplication needed.

### Logic

```
cyclesCovered = floor(initial_deposit_fee / rent_fee)
NextBillingDate = MoveInDate + (cyclesCovered * cycleDuration)
```

### Examples (MONTHLY, GHS 1000/month, MoveInDate = 1 Mar)
| Initial Deposit | Cycles Covered | NextBillingDate |
|---|---|---|
| GHS 1000 | 1 | 1 Apr |
| GHS 2000 | 2 | 1 May |
| GHS 12000 | 12 | 1 Mar next year (past lease end — cron never fires) |
| GHS 0 | 0 | 1 Mar (bill immediately) |
| OneTime freq | n/a | nil (never billed) |

### Implementation sketch for `ActivateLease`

```go
if lease.PaymentFrequency != nil && *lease.PaymentFrequency != "OneTime" {
    var meta struct {
        InitialDepositFee int64 `json:"initial_deposit_fee"`
    }
    json.Unmarshal(lease.Meta, &meta)

    cyclesCovered := 0
    if lease.RentFee > 0 && meta.InitialDepositFee > 0 {
        cyclesCovered = int(meta.InitialDepositFee / lease.RentFee)
    }

    base := lease.MoveInDate
    for i := 0; i < cyclesCovered; i++ {
        next, _ := calculateNextBillingDate(base, *lease.PaymentFrequency)
        if next == nil { break }
        base = *next
    }
    lease.NextBillingDate = &base
}
```

`calculateNextBillingDate` helper (in lease.go, package-private):
- Hourly → +1 hour
- DAILY → +1 day
- WEEKLY → +7 days
- MONTHLY → +1 month
- Quarterly → +3 months
- BiAnnually → +6 months
- Annually → +1 year
- OneTime → nil

Note: mixed case convention in codebase — handle both `MONTHLY` and `Monthly` variants.
<!-- SECTION:NOTES:END -->
