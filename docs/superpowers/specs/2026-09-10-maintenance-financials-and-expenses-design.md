# Maintenance Financials & Expense Management — Redesign

Date: 2026-09-10
Scope: `services/main`, `apps/property-manager`, `apps/go`
Related: `docs/superpowers/specs/2026-08-05-tenant-financial-account-design.md`
Verified behaviour: `services/main/scripts/e2e/` (56 scenarios)

Amounts throughout are **minor units** (pesewas): GH₵ 1,000 is `100000`.

---

# Part 0 — Why this exists

The lease-financials work narrowed `models.Expense` to landlord→vendor only.
`ContextType` `LEASE` was dropped, along with `billable_to_tenant`, `paid_by`
and `invoice_id`. The routes for lease expenses and `expenses/{id}/generate:invoice`
were removed with them.

The frontend was never updated. `app/api/expenses/index.ts` still calls both
dead routes and still posts `context_type: 'LEASE'`, and the maintenance
request expenses tab is built entirely around a payer-split invoice form with
no backend behind it. `GetExpense` also populates `"Invoices"`, a relation the
model no longer has.

The narrowing was correct as far as it went. What it left behind is a
maintenance request that can only record money flowing *out* to a vendor, when
in practice a landlord needs three things:

1. record what a job cost, with nobody paying anything
2. recharge the tenant in the affected unit
3. pay an external vendor

This spec introduces a record that expresses all three, and completes the
expense model into something manageable in its own right.

## 0.1 Decisions

| Decision | Choice |
|---|---|
| Financial line shape | One line carries **one** settlement. Splits are multiple lines. |
| Expense nature | A **payable**: money owed to a vendor, not money already gone. |
| Expense scope | `MAINTENANCE` or `GENERAL` — an expense need not have a request behind it. |
| Vendor | Free-text `vendor_name` / `vendor_contact`. No `Vendor` model. |
| Link timing | Created on save; convertible only while clean. |
| Tenant-charge availability | Only when the request has a `LeaseID`. No lease resolution logic. |
| Charge category | New `MAINTENANCE_CHARGE`, plus `DAMAGE_CHARGE`, `UTILITY`, `OTHER`. |
| Tenant visibility | Tenants see their own charges on a request, nothing else. |
| Accounting | **Only invoices post to the ledger.** Expense ↔ Invoice is 1:1, atomic. |

## 0.2 Invariants

These are the rules the implementation must not quietly break.

- **`MaintenanceRequestFinancial` never touches accounting.** It is a record.
  `RECORD_ONLY` lines never reach the books at all. `TENANT_CHARGE` reaches
  them when the lease invoice claiming its `ChargeInstance` is issued.
  `VENDOR_EXPENSE` reaches them through the expense's own invoice.
- **Every ledger posting originates from an invoice** — issuance, void
  reversal, or payment. After this change there is no exception anywhere in
  the service layer.
- **No stored status columns.** Status is derived, following
  `ChargeInstance`'s existing rule: a stored status is a fourth thing to keep
  in sync with three sources, and that desync is what makes a ledger
  untrustworthy.
- **A dirty record is frozen.** Once money has moved, correction is by void,
  never by edit.

---

# Part 1 — Data model

## 1.1 New: `MaintenanceRequestFinancial`

One costed line on a maintenance request. No `Code` — it is a line item, not a
document, consistent with `ChargeInstance` and `InvoiceLineItem`.

```go
// MaintenanceRequestFinancial is one costed line on a maintenance request:
// what it cost, and who if anyone settles it. It is a record only — it posts
// nothing. Money reaches the ledger through the ChargeInstance or the Expense
// it points at, and only when those are invoiced.
type MaintenanceRequestFinancial struct {
	BaseModelSoftDelete

	MaintenanceRequestID string `gorm:"not null;index;"`
	MaintenanceRequest   MaintenanceRequest

	PropertyID string `gorm:"index;"`

	Description string `gorm:"not null;"`
	Amount      int64  `gorm:"not null;"`
	Currency    string `gorm:"not null;default:'GHS'"`

	SettlementType string `gorm:"not null;index;"` // RECORD_ONLY | TENANT_CHARGE | VENDOR_EXPENSE

	ChargeInstanceID *string `gorm:"index;"`
	ChargeInstance   *ChargeInstance

	ExpenseID *string `gorm:"index;"`
	Expense   *Expense

	CreatedByClientUserID string `gorm:"not null;"`
	CreatedByClientUser   ClientUser
}
```

The pairing of `SettlementType` with its link is enforced by a CHECK
constraint, because the Go type cannot express it. `MaintenanceRequestAsset`
already uses this technique for its UNIT/BLOCK rule.

```sql
ALTER TABLE maintenance_request_financials
ADD CONSTRAINT chk_mrf_settlement_link CHECK (
  (settlement_type = 'RECORD_ONLY'    AND charge_instance_id IS NULL AND expense_id IS NULL) OR
  (settlement_type = 'TENANT_CHARGE'  AND charge_instance_id IS NOT NULL AND expense_id IS NULL) OR
  (settlement_type = 'VENDOR_EXPENSE' AND expense_id IS NOT NULL AND charge_instance_id IS NULL)
);
```

`MaintenanceRequest` gains `Financials []MaintenanceRequestFinancial` and
loses `Expenses []Expense`.

## 1.2 `Expense` becomes a payable

```go
type Expense struct {
	BaseModelSoftDelete

	Code string `gorm:"not null;uniqueIndex;"` // EXP-YYMM-XXXXXX

	ContextType string `gorm:"not null;index;"` // MAINTENANCE | GENERAL

	PropertyID string `gorm:"index;"`
	Property   Property

	// REPAIRS | UTILITIES | INSURANCE | LANDSCAPING | SECURITY | MANAGEMENT | OTHER
	Category string `gorm:"not null;index;"`

	// Free text by design. A Vendor directory is a separate subsystem; when it
	// arrives it is an additive vendor_id plus a backfill by name, and nothing
	// here has to be redesigned.
	VendorName    *string
	VendorContact *string

	Description string `gorm:"not null;"`
	Amount      int64  `gorm:"not null;"`
	Currency    string `gorm:"not null;default:'GHS'"`

	VoidedAt     *time.Time
	VoidedReason *string

	CreatedByClientUserID string `gorm:"not null;"`
	CreatedByClientUser   ClientUser

	Invoices []Invoice `gorm:"foreignKey:ContextExpenseID"`
}
```

Removed: `ContextMaintenanceRequestID`. The financial line is now the
authoritative request↔expense link; keeping the FK as well would be a second
source of truth that can disagree.

Not added: `InvoicedAmount` / `SettledAmount`. With a 1:1 invoice both are
derivable from it.

`VendorName` is nullable in the database and required by the create validator.
Legacy rows genuinely do not know who was paid, and writing `"Unknown"` into
them would be inventing data.

## 1.3 `Invoice`

Gains `ContextExpenseID *string` and the `ContextType` value `EXPENSE`. This
is the column the `DropExpenseInvoicePaidByBillable` migration comment already
claims exists — it was never actually added.

## 1.4 Derived status

Neither new concept stores status.

**Expense:**

| Condition | Status |
|---|---|
| `voided_at` set | `VOIDED` |
| no invoice (legacy rows only) | `SETTLED` |
| invoice `PAID` | `SETTLED` |
| invoice `PARTIALLY_PAID` | `PARTIALLY_SETTLED` |
| otherwise | `OUTSTANDING` |

**MaintenanceRequestFinancial:** `RECORD_ONLY` → `RECORDED`; otherwise mirrors
the derived status of the linked `ChargeInstance` or `Expense`.

Both transformations also expose **`is_editable`** — the clean flag from §2.2 —
so the UI stops offering an edit the API is going to refuse. This mirrors how
`RentTermsLocked` is already exposed on `AccountFinancials`.

---

# Part 2 — Services and API

## 2.1 `MaintenanceRequestFinancialService`

New service. Handlers never touch repositories; this service owns the whole
transaction.

```go
CreateFinancial(ctx, CreateFinancialInput) (*models.MaintenanceRequestFinancial, error)
ListFinancials(ctx, mrID string, q lib.FilterQuery) ([]models.MaintenanceRequestFinancial, error)
CountFinancials(ctx, mrID string, q lib.FilterQuery) (int64, error)
UpdateFinancial(ctx, UpdateFinancialInput) error
VoidFinancial(ctx, id, reason string) error
```

`CreateFinancial` branches in one transaction:

| `SettlementType` | Behaviour |
|---|---|
| `RECORD_ONLY` | Writes the row. Nothing else. |
| `TENANT_CHARGE` | Refuses unless `MaintenanceRequest.LeaseID != nil` **and** that lease has a `FinancialAccountID`. Calls `financials.ChargeService.CreateAdHoc` with the caller's category, which applies its own `assertOpen` guard — a closed account refuses the write. Stores `ChargeInstanceID`. |
| `VENDOR_EXPENSE` | Calls `ExpenseService.CreateExpense` with `ContextType: MAINTENANCE`, the vendor fields and the optional already-paid settlement (§2.3). Stores `ExpenseID`. |

Dependencies: `MaintenanceRequestRepository`, `LeaseRepository`,
`financials.ChargeService`, `ExpenseService`. No cycle — `ExpenseService` does
not depend back on it.

## 2.2 The clean guard

Defined once, used by every mutation.

- `TENANT_CHARGE`: the `ChargeInstance` has `InvoicedAmount == 0 &&
  SettledAmount == 0 && VoidedAt == nil`.
- `VENDOR_EXPENSE`: the expense's invoice has no successful payment, and the
  expense is not voided.
- `RECORD_ONLY`: always clean.

Amount edits and settlement-type conversions are refused unless clean.
Conversion is void-old-link + create-new-link inside one transaction. This is
the same rule `RederiveRent` already enforces on the rent schedule.

## 2.3 `ExpenseService`

`AddExpense` becomes `CreateExpense` and takes `Category`, `VendorName`,
`VendorContact`, `ContextType`, and the already-paid settlement block.
`ContextType: MAINTENANCE` is reachable only from
`MaintenanceRequestFinancialService`, never from an HTTP handler.

```go
type CreateExpenseInput struct {
	PropertyID    string
	ContextType   string // GENERAL from the handler; MAINTENANCE from the MRF service
	Category      string
	VendorName    string
	VendorContact *string
	Description   string
	Amount        int64
	Currency      string
	DueDate       *time.Time // vendor payment terms
	ClientUserID  string

	// AlreadyPaid folds "I paid this last week" into one step. Set, the
	// service records an offline payment against the expense's invoice in the
	// same transaction, so the expense lands SETTLED and both journal entries
	// post together. Unset, the expense sits as an open payable.
	AlreadyPaid      bool
	PaidAt           *time.Time // defaults to now
	PaymentRail      *string    // defaults to OFFLINE
	PaymentProvider  *string    // e.g. CASH
	PaymentReference *string
}
```

Every expense creates its invoice in the same transaction — `GENERAL` and
`MAINTENANCE` alike. The rule lives on the expense, not on where it came from,
so there is no second path that reaches the books without one.

`postExpenseJournalEntry` is **deleted**. `ExpenseService` no longer depends on
`AccountingService`.

Also added: `UpdateExpense` (clean only), `VoidExpense` (voids the invoice,
which produces the reversing entry). `DeleteExpense` is removed — an expense
with a posted journal entry cannot be deleted. `GetExpense`'s
`Populate: ["Invoices"]` becomes real.

### Why no invoice-less expense

`RECORD_ONLY` already absorbs every "the cost exists but no money moves" case.
What remains in `VENDOR_EXPENSE` is precisely "the landlord owes a vendor",
which is a payable, which is an invoice.

| Scenario | Where it lands |
|---|---|
| Record what it cost, nobody pays | `RECORD_ONLY` line — never an expense |
| Petty cash, no vendor paperwork | Expense with `already_paid`; the invoice is *our* record, not the vendor's |
| Vendor's bill hasn't arrived | `RECORD_ONLY` now, convert when it lands |
| Legacy backfilled rows | Keep their existing direct entries; no retroactive invoices |

## 2.4 `InvoiceService.CreateExpenseInvoice`

Internal, called only by `ExpenseService`. Builds a non-account-backed invoice
(`FinancialAccountID` nil):

```
PayerType           PROPERTY_OWNER
PayerPropertyID     expense.PropertyID
PayeeType           EXTERNAL          (vendor_name carried on the line label)
ContextType         EXPENSE
ContextExpenseID    expense.ID
Status              ISSUED
AllowedPaymentRails {OFFLINE}
LineItems           one, Category MAINTENANCE_FEE, TotalAmount = expense.Amount
DueDate             expense.DueDate
```

Created `ISSUED`, not `DRAFT`. A draft expense sitting invisible to the books
is exactly the failure the deleted `postExpenseJournalEntry` comment was
worried about.

`PaymentAllocation` requires a non-null `ChargeInstanceID`, so an expense
invoice can never have allocations. It does not need them: `payment.go:137`
and `:282` already branch on `FinancialAccountID != nil`, so non-account-backed
invoices take payments without them.

## 2.5 Routes

`internal/router/client-user.go`. Writes behind
`ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")`.

```
  …/maintenance-requests/{mr_id}/financials              GET, POST
  …/maintenance-requests/{mr_id}/financials/{id}         PATCH
  …/maintenance-requests/{mr_id}/financials/{id}/void    PATCH
  …/maintenance-requests/{mr_id}/expenses                GET    (kept for pm_mobile; joins through financials)

  …/properties/{property_id}/expenses                    GET, POST   (POST is GENERAL only)
  …/properties/{property_id}/expenses/{expense_id}       GET, PATCH
  …/properties/{property_id}/expenses/{id}/void          PATCH
  …/clients/{client_id}/expenses                         GET    (kept)
```

Removed: `DELETE /expenses/{id}`. Not added back:
`POST /expenses/{id}/generate:invoice`, which the frontend still calls and the
backend has not had for some time. No `POST /expenses/{id}/invoices` either —
with the invoice created atomically there is nothing left to connect.

Tenant route (`internal/router/tenant-account.go`):

```
  /v1/tenant/maintenance-requests/{mr_id}/financials     GET
```

Returns only `TENANT_CHARGE` lines whose charge sits on the caller's own
financial account. Vendor expenses and record-only lines are never serialised
on this route — the tenant must not learn what the landlord paid the plumber.

All request and response JSON is snake_case. Every touched handler gets
updated Swagger godoc (`@Param`, `@Accept`, `@Success`, `@Failure`, `@Router`)
and `make generate-docs` is re-run.

---

# Part 3 — Accounting

## 3.1 `MAINTENANCE_CHARGE`

One line in `counterpartAccountFor` (`internal/services/invoice.go:1798`):

```go
case "MAINTENANCE_CHARGE", "DAMAGE_CHARGE", "UTILITY":
	return accounts.MaintenanceReimbursementID
```

That is the whole accounting cost of the new category, because
`counterpartAccountFor` already centralises account-backed routing. The rest
is vocabulary:

- `internal/services/financials/types.go` — `CategoryMaintenanceCharge`
- `internal/handlers/financial-account.go:44` — `oneof` validator
- `internal/handlers/invoice.go:482`, `:645` — `oneof` validators
- `internal/handlers/lease.go:20` — `oneof` validator
- `internal/models/invoice.go` — category doc comment
- frontend label maps

The lease-termination switch at `:1843` is deliberately left alone. A
termination is never a maintenance recharge.

## 3.2 The expense invoice

`buildJournalEntryForInvoice` gains, in the non-account-backed switch:

```go
case "EXPENSE":
	return buildExpenseJournalEntry(invoice, accounts)
```

```
Dr  Maintenance Expense    amount
    Cr  Accounts Payable       amount
```

`buildPaymentJournalLines` gains:

```go
case "EXPENSE":
	// Dr Accounts Payable / Cr Cash — the mirror of the AR case.
```

Both cases are required. Without them the existing `default:` branch would
post `Dr Cash / Cr AR` for a bill the landlord *received*, silently inverting
it. The guard at the top of `buildPaymentJournalLines` bails on
`PayerType == "EXTERNAL"`; an expense invoice is `PayerType: PROPERTY_OWNER`
with `PayeeType: EXTERNAL`, so it correctly falls through.

Void reversal needs no new code — `buildReversingJournalEntry` inverts
whatever `buildJournalEntryForInvoice` produced.

## 3.3 Net effect

A fully-paid expense posts `Dr Expense / Cr AP` then `Dr AP / Cr Cash` —
identical in sum to today's single `Dr Expense / Cr Cash`. The only new
information in the ledger is the window between the two, which is the thing
that was missing: **what the landlord currently owes vendors.**

This is also why the legacy backfill in Part 4 needs no reversing entries.

---

# Part 4 — Migration

The runner does `AutoMigrate` **before** the migration jobs, so every job here
is backfill-and-drop. A rename is not possible; nothing below attempts one.

**Step 0 — AutoMigrate (automatic).** Creates `maintenance_request_financials`;
adds `category`, `vendor_name`, `vendor_contact`, `voided_at`, `voided_reason`
to `expenses`; adds `context_expense_id` to `invoices`.

**Step 1 — `ReportLegacyExpenseShape`** (read-only). Logs counts before
anything mutates: rows by `context_type`, how many carry a maintenance
request, how many carry a `context_lease_id`, how many are orphaned. Runs
first so the `LEASE`-row policy is decided against real numbers.

**Step 2 — `AddMaintenanceRequestFinancialsConstraint`.** Applies the CHECK in
§1.1.

**Step 3 — `BackfillMaintenanceRequestFinancials`.** For every live expense
with `context_maintenance_request_id IS NOT NULL`, inserts one
`VENDOR_EXPENSE` line carrying the expense's description, amount, currency,
property and creator, linked back to it. This is the fix for the
mis-modelling: those rows *were* landlord→vendor costs, they simply had no
line to hang from.

**Step 4 — `BackfillExpenseContextAndCategory`.** Sets `context_type` to
`MAINTENANCE` for step-3 rows and `GENERAL` for the rest, and `category` to
`REPAIRS` for maintenance rows, `OTHER` otherwise. `vendor_name` stays null.

Legacy rows get **no invoice and no new journal entry**. They already posted
`Dr Maintenance Expense / Cr Cash` at creation — the money had already left —
so §1.4 derives them as `SETTLED`. Marking them `OUTSTANDING` would make the
expense page claim the landlord owes vendors for cash already spent.

**Step 5 — `DropExpenseMaintenanceContext`.** Drops
`expenses.context_maintenance_request_id`. Must run after step 3.

**`context_type = 'LEASE'` rows.** These carry a lease but no maintenance
request, and were the old "bill the tenant" path. They are converted to
`GENERAL` expenses with the lease code appended to the description, since no
column survives to hold it.

Three things this deliberately does not do: fabricate `ChargeInstance` rows
(that would create real retroactive obligations on tenant accounts), delete
the rows (data loss), or leave them unreachable. If step 1 reports a large
number, revisit before shipping.

---

# Part 5 — PM portal

`apps/property-manager`. All new UI uses `bg-background` / `text-foreground`
tokens and `dark:` variants, verified in both themes.

| File | Change |
|---|---|
| `app/api/expenses/index.ts` | Rewrite. Delete `useGetLeaseExpenses`, `useGenerateExpenseInvoice`, `useDeleteExpense` — all three call routes that do not exist. Add create (GENERAL, vendor, category, already-paid), update, void, get-with-invoice. Callers pass their own query params; no defaults inside hooks. |
| `app/api/maintenance-request-financials/index.ts` | New — list, create, update, void. |
| `…/maintenance-requests/request/expenses-tab.tsx` | Renamed `financials-tab.tsx`. The two-row payer-split form and its auto-balancing logic are deleted. |
| `…/maintenance-requests/request/index.tsx:384` | Tab renamed **Financials**. |
| `…/occupancy/leases/lease/expenses-tab.tsx` | Deleted and unwired. Maintenance money owed by a tenant now appears as a charge in that lease's financials. |
| `…/property/expenses/{index,controller,components/cards}.tsx` | Reworked into expense management (§5.2). |
| `app/lib/invoice.ts`, `app/lib/constants.ts` | `MAINTENANCE_CHARGE` label, `EXPENSE` invoice context, new query keys. |

## 5.1 Financials tab

Table of lines with a total row. Each row shows description, amount,
settlement type, and derived status, linking through to the charge or the
expense. Convert and void actions render only when `is_editable`.

Create form:

```
Description   [                    ]
Amount        [                    ]
Settled by    ( ) Nobody — record only
              ( ) Tenant            ← hidden entirely when the request has no lease
              ( ) Landlord pays a vendor

  if Tenant:
    Category  [ MAINTENANCE_CHARGE | DAMAGE_CHARGE | UTILITY | OTHER ]

  if Vendor:
    Vendor name     [            ]   (required)
    Vendor contact  [            ]
    Category        [ REPAIRS | UTILITIES | … ]
    Due date        [            ]
    [ ] Already paid
```

The Tenant option is **absent**, not disabled, when `MaintenanceRequest.LeaseID`
is null. There is nothing the PM can do to enable it on this screen.

## 5.2 Expense management page

- Create a `GENERAL` expense: category, vendor, description, amount, due date,
  already-paid toggle.
- List with vendor, context (request code or `GENERAL`), category, amount and
  derived status; filterable by status and category.
- An **owed to vendors** summary — the sum of `OUTSTANDING` and
  `PARTIALLY_SETTLED` amounts. This is the number the whole payable redesign
  exists to produce.
- Detail view showing the linked invoice with a route to record payment, and
  void with a reason.
- Legacy rows with no vendor show "no vendor recorded" and prompt for one.

---

# Part 6 — Tenant app

`apps/go`. `src/modules/main/maintenance_details/root.dart` gains a **Charges
to you** section fed by `GET /v1/tenant/maintenance-requests/{id}/financials`.

Shimmer skeleton loader while pending, pull-to-refresh on the detail screen.
`AsyncValue` is read with `.valueOrNull`, never bare `.value` outside a
`hasValue` guard.

Separable from the backend work if it needs to ship later.

---

# Part 7 — Testing

**Unit** — table-driven tests in the style of
`internal/services/financials/*_test.go` for the clean guard, each conversion
path, the CHECK-constraint pairings, and the derived-status table in §1.4.

**End-to-end** — a new `n` series in `services/main/scripts/e2e/cases/`:

| Case | Asserts |
|---|---|
| `n1-record-only-line.sh` | A `RECORD_ONLY` line moves nothing in the ledger |
| `n2-tenant-charge-line.sh` | Ad-hoc charge lands on the lease account; invoice composes; `MAINTENANCE_CHARGE` routes to Maintenance Reimbursement |
| `n3-vendor-expense-line.sh` | Expense + issued invoice; AP posted; paid; AP cleared to Cash |
| `n4-convert-while-clean.sh` | Conversion succeeds while clean, refused once paid |
| `n5-void-expense.sh` | Voiding reverses AP and voids the invoice |
| `n6-general-expense.sh` | `GENERAL` expense with no request; already-paid toggle settles in one step |
| `n7-no-lease-no-tenant-charge.sh` | `TENANT_CHARGE` refused when the request has no lease |

`./run-all.sh` green before this is considered done.

---

# Out of scope

- **A `Vendor` model and directory** — tracked as **RENTL-57**. Free-text
  names now; an additive `vendor_id` plus a backfill by name later, with
  nothing here redesigned.
- **One vendor bill covering several expenses** — a plumber invoicing three
  units at once. Three expenses with three invoices is a slightly wrong
  picture of one bill; designing for it now buys complexity that may never be
  needed.
- **Splitting a single cost across tenant and vendor within one line.** Two
  lines express it, and itemising is closer to how the cost actually arises.
- **Recurring or scheduled general expenses** — tracked as **RENTL-58**.
