# Maintenance Financials & Expense Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the maintenance request's broken "expense" tab with a financials record that can be settled by nobody, by the tenant, or by a vendor — and complete `Expense` into a managed payable with a 1:1 invoice.

**Architecture:** A new `MaintenanceRequestFinancial` line owns the cost and points at *at most one* settlement: a `ChargeInstance` on the lease's financial account, or an `Expense`. The line itself posts nothing to the ledger. `Expense` becomes a payable whose invoice is created atomically with it, so the existing rule — every ledger posting originates from an invoice — holds with no exceptions.

**Tech Stack:** Go 1.x + GORM + chi + gormigrate (`services/main`), React Router v7 + TanStack Query v5 + Tailwind v4 + Shadcn (`apps/property-manager`), Flutter + Riverpod (`apps/go`).

**Spec:** `docs/superpowers/specs/2026-09-10-maintenance-financials-and-expenses-design.md`

## Global Constraints

- **Never run `git commit`.** Project rule (`CLAUDE.md`): leave every change unstaged for the user. Where this plan says "verify", that replaces the usual commit step.
- **Comment sparingly.** Only where the code cannot carry the information — a non-obvious constraint or an invisible decision. Never label a block (`// Actions`), never narrate a change. Applies to tests too.
- **All JSON is snake_case**, request and response.
- **Every touched handler gets Swagger godoc** (`@Summary`, `@Description`, `@Tags`, `@Accept`, `@Produce`, `@Security`, `@Param`, `@Success`, `@Failure`, `@Router`), then `make generate-docs`.
- **Amounts are minor units** (pesewas). GH₵ 1,000 is `100000`.
- **`AutoMigrate` runs before migration jobs.** No job may rename a column; add-and-backfill only.
- **No mocking framework exists in this repo.** Unit tests cover pure functions; DB-backed behaviour is proven by `services/main/scripts/e2e/`. Do not introduce mocks.
- **All PM portal UI must work in dark and light mode.** Use `bg-background` / `text-foreground` / `text-muted-foreground` tokens and `dark:` variants; never hardcode a colour that only works in one mode.
- **Lint before verifying any Go task:** `cd services/main && make lint-fix`.

## Invariants the implementation must not break

1. `MaintenanceRequestFinancial` never calls `AccountingService`.
2. Every ledger posting originates from an invoice — issuance, void reversal, or payment.
3. No stored status columns. Status is derived.
4. A dirty record is frozen; correction is by void, never by edit.

## File structure

**Backend — created**

| File | Responsibility |
|---|---|
| `internal/services/expenses/status.go` | Pure derivation: expense status, expense cleanliness |
| `internal/services/expenses/financial.go` | Pure derivation: financial-line status and editability |
| `internal/services/expenses/status_test.go` | Tests for both of the above |
| `internal/models/maintenance-request-financial.go` | The new line model |
| `internal/repository/maintenance-request-financial.go` | Its repository |
| `internal/services/maintenance-request-financial.go` | The transactional service |
| `internal/transformations/maintenance-request-financial.go` | Its REST shape |
| `internal/handlers/maintenance-request-financial.go` | Its handlers |
| `init/migration/jobs/report-legacy-expense-shape.go` | Read-only census |
| `init/migration/jobs/add-mrf-settlement-constraint.go` | The CHECK constraint |
| `init/migration/jobs/backfill-maintenance-request-financials.go` | Line per legacy MR expense |
| `init/migration/jobs/backfill-expense-context-and-category.go` | `context_type`, `category`, LEASE rows |
| `init/migration/jobs/drop-expense-maintenance-context.go` | Drops the redundant FK |
| `scripts/e2e/cases/n1…n7-*.sh` | Seven end-to-end scenarios |

**Analytics — modified**

| File | Change |
|---|---|
| `services/cube/model/cubes/Expenses.js` | Settlement-aware: LATERAL join to the live bill, `outstandingAmount` / `settledAmount` / `outstandingCount` / `generalAmount` measures, `category` / `vendorName` / `status` dimensions, voided rows excluded from every money measure |

**Backend — modified**

| File | Change |
|---|---|
| `internal/models/expense.go` | Payable fields; drop `ContextMaintenanceRequestID` |
| `internal/models/invoice.go` | `ContextExpenseID`; category doc |
| `internal/models/maintenance-request.go` | `Financials` replaces `Expenses` |
| `internal/services/financials/types.go` | `CategoryMaintenanceCharge` |
| `internal/services/invoice.go` | `MAINTENANCE_CHARGE` routing; `EXPENSE` journal branch; `CreateExpenseInvoice` |
| `internal/services/payment.go` | Extract `settleSuccessfulPayment`; add `RecordExpensePayment`; `EXPENSE` payment branch |
| `internal/services/expense.go` | Full rework; drop `AccountingService` |
| `internal/repository/expense.go` | Filter fields follow the model |
| `internal/transformations/expense.go` | Derived status, vendor, no MR FK |
| `internal/handlers/expense.go`, `financial-account.go`, `invoice.go`, `lease.go` | Bodies and `oneof` validators |
| `internal/router/client-user.go`, `tenant-account.go` | Routes |
| `init/migration/main.go` | Register model + jobs |

**Frontend — see Tasks 13–17.**

---

### Task 1: The `MAINTENANCE_CHARGE` category

A tenant recharged for maintenance currently has to be labelled `DAMAGE_CHARGE`, which is a lie when they asked for the work. The new category routes to the same revenue account, so this is vocabulary plus one routing case.

**Files:**
- Modify: `services/main/internal/services/financials/types.go`
- Modify: `services/main/internal/services/invoice.go:1798`
- Modify: `services/main/internal/handlers/financial-account.go:44`
- Modify: `services/main/internal/handlers/invoice.go:482`, `:645`
- Modify: `services/main/internal/handlers/lease.go:20`
- Modify: `services/main/internal/models/invoice.go` (category doc comment)
- Test: `services/main/internal/services/invoice_category_test.go` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `financials.CategoryMaintenanceCharge = "MAINTENANCE_CHARGE"`, used by Task 9.

- [ ] **Step 1: Write the failing test**

Create `services/main/internal/services/invoice_category_test.go`:

```go
package services

import (
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/config"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

func testAccounts() config.IChartOfAccounts {
	return config.IChartOfAccounts{
		CashBankAccountID:          "cash",
		AccountsReceivableID:       "ar",
		AccountsPayableID:          "ap",
		MaintenanceReimbursementID: "maint-reimb",
		MaintenanceExpenseID:       "maint-exp",
		RentalIncomeID:             "rent-income",
		TenantConcessionsID:        "concessions",
		SecurityDepositsHeldID:     "deposits",
	}
}

func TestCounterpartAccountForMaintenanceCharge(t *testing.T) {
	line := models.InvoiceLineItem{Category: "MAINTENANCE_CHARGE"}
	got := counterpartAccountFor(line, testAccounts(), true)
	if got != "maint-reimb" {
		t.Errorf("got %q, want maint-reimb — a maintenance recharge is reimbursement income", got)
	}
}

// The same account in both directions is what makes a refund a genuine
// reversal rather than an unrelated second posting.
func TestCounterpartAccountForMaintenanceChargeOutbound(t *testing.T) {
	line := models.InvoiceLineItem{Category: "MAINTENANCE_CHARGE"}
	got := counterpartAccountFor(line, testAccounts(), false)
	if got != "maint-reimb" {
		t.Errorf("got %q, want maint-reimb on the outbound side too", got)
	}
}
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd services/main && go test ./internal/services/ -run TestCounterpartAccountForMaintenanceCharge -v`
Expected: FAIL — `got "", want maint-reimb`, because the category falls through to `default: return ""`.

- [ ] **Step 3: Add the routing case**

In `services/main/internal/services/invoice.go`, in `counterpartAccountFor`, change:

```go
	case "DAMAGE_CHARGE", "UTILITY":
		return accounts.MaintenanceReimbursementID
```

to:

```go
	case "MAINTENANCE_CHARGE", "DAMAGE_CHARGE", "UTILITY":
		return accounts.MaintenanceReimbursementID
```

Leave the lease-termination switch further down the file alone. A termination is never a maintenance recharge.

- [ ] **Step 4: Run the test and verify it passes**

Run: `cd services/main && go test ./internal/services/ -run TestCounterpartAccountForMaintenanceCharge -v`
Expected: PASS (both cases).

- [ ] **Step 5: Add the constant**

In `services/main/internal/services/financials/types.go`, beside `CategoryDamageCharge`:

```go
	CategoryMaintenanceCharge   = "MAINTENANCE_CHARGE"
```

- [ ] **Step 6: Widen the validators**

Add `MAINTENANCE_CHARGE` to the `oneof` list in each of these, leaving the rest of each tag untouched:

- `internal/handlers/financial-account.go:44` — `validate:"required,oneof=RENT SECURITY_DEPOSIT AGENCY_FEE VAT UTILITY MAINTENANCE_CHARGE DAMAGE_CHARGE EARLY_TERMINATION_FEE OTHER"`
- `internal/handlers/invoice.go:482` — same list, plus the existing `MAINTENANCE_FEE SAAS_FEE BOOKING_FEE` tail
- `internal/handlers/invoice.go:645` — same as `:482`, keeping `omitempty`
- `internal/handlers/lease.go:20` — `validate:"required,oneof=SECURITY_DEPOSIT AGENCY_FEE VAT UTILITY MAINTENANCE_CHARGE DAMAGE_CHARGE EARLY_TERMINATION_FEE OTHER"`

- [ ] **Step 7: Update the category doc on the model**

In `services/main/internal/models/invoice.go`, in the `Category` comment on `InvoiceLineItem`, change the tenant-charges line to:

```
	//	tenant charges  RENT, SECURITY_DEPOSIT, AGENCY_FEE, VAT, UTILITY,
	//	                MAINTENANCE_CHARGE, DAMAGE_CHARGE,
	//	                EARLY_TERMINATION_FEE, OTHER
```

Make the same addition to the `Category` comment in `internal/models/charge-definition.go`.

- [ ] **Step 8: Verify**

```bash
cd services/main
make lint-fix
go build ./...
go test ./internal/services/... ./internal/services/financials/...
make generate-docs
```
Expected: build clean, all tests pass. Leave changes unstaged.

---

### Task 2: Pure status and cleanliness derivation

No status columns exist, so status is computed. Putting the computation in pure functions is what makes it unit-testable in a repo with no mocking framework — every rule in this task is provable without a database.

**Files:**
- Create: `services/main/internal/services/expenses/status.go`
- Create: `services/main/internal/services/expenses/financial.go`
- Create: `services/main/internal/services/expenses/status_test.go`

**Interfaces:**
- Consumes: nothing.
- Produces, used by Tasks 8, 9, 10 and the transformation layer:
  - `expenses.ExpenseView{HasInvoice bool; InvoiceStatus string; VoidedAt *time.Time}`
  - `expenses.DeriveExpenseStatus(v ExpenseView) string`
  - `expenses.IsExpenseClean(v ExpenseView) bool`
  - `expenses.FinancialView{SettlementType string; Charge *ChargeLinkView; Expense *ExpenseView}`
  - `expenses.ChargeLinkView{InvoicedAmount, SettledAmount int64; VoidedAt *time.Time}`
  - `expenses.DeriveFinancialStatus(v FinancialView) string`
  - `expenses.IsFinancialEditable(v FinancialView) bool`
  - Constants `SettlementRecordOnly`, `SettlementTenantCharge`, `SettlementVendorExpense`

- [ ] **Step 1: Write the failing tests**

Create `services/main/internal/services/expenses/status_test.go`:

```go
package expenses

import (
	"testing"
	"time"
)

func ts() *time.Time {
	t := time.Date(2026, 9, 10, 0, 0, 0, 0, time.UTC)
	return &t
}

func TestDeriveExpenseStatusVoided(t *testing.T) {
	got := DeriveExpenseStatus(ExpenseView{VoidedAt: ts(), HasInvoice: true, InvoiceStatus: "ISSUED"})
	if got != StatusVoided {
		t.Errorf("got %q, want %q — voiding wins over every other state", got, StatusVoided)
	}
}

// Legacy rows migrated from the old model have no invoice. They posted
// Dr Expense / Cr Cash at creation, so the money had already left.
func TestDeriveExpenseStatusLegacyRowIsSettled(t *testing.T) {
	got := DeriveExpenseStatus(ExpenseView{HasInvoice: false})
	if got != StatusSettled {
		t.Errorf("got %q, want %q — a legacy row's cash already left", got, StatusSettled)
	}
}

func TestDeriveExpenseStatusFromInvoice(t *testing.T) {
	cases := map[string]string{
		"DRAFT":          StatusOutstanding,
		"ISSUED":         StatusOutstanding,
		"PARTIALLY_PAID": StatusPartiallySettled,
		"PAID":           StatusSettled,
		"VOID":           StatusOutstanding,
	}
	for invoiceStatus, want := range cases {
		got := DeriveExpenseStatus(ExpenseView{HasInvoice: true, InvoiceStatus: invoiceStatus})
		if got != want {
			t.Errorf("invoice %s: got %q, want %q", invoiceStatus, got, want)
		}
	}
}

func TestIsExpenseCleanUntilPaid(t *testing.T) {
	if !IsExpenseClean(ExpenseView{HasInvoice: true, InvoiceStatus: "ISSUED"}) {
		t.Error("got dirty, want clean — issued but unpaid is still correctable")
	}
	if IsExpenseClean(ExpenseView{HasInvoice: true, InvoiceStatus: "PARTIALLY_PAID"}) {
		t.Error("got clean, want dirty — money has moved")
	}
	if IsExpenseClean(ExpenseView{HasInvoice: true, InvoiceStatus: "PAID"}) {
		t.Error("got clean, want dirty — money has moved")
	}
	if IsExpenseClean(ExpenseView{VoidedAt: ts()}) {
		t.Error("got clean, want dirty — a voided expense is not editable")
	}
}

func TestDeriveFinancialStatusRecordOnly(t *testing.T) {
	got := DeriveFinancialStatus(FinancialView{SettlementType: SettlementRecordOnly})
	if got != StatusRecorded {
		t.Errorf("got %q, want %q", got, StatusRecorded)
	}
}

func TestDeriveFinancialStatusMirrorsCharge(t *testing.T) {
	cases := []struct {
		name string
		view ChargeLinkView
		want string
	}{
		{"untouched", ChargeLinkView{}, StatusOutstanding},
		{"invoiced", ChargeLinkView{InvoicedAmount: 20000}, StatusInvoiced},
		{"part settled", ChargeLinkView{InvoicedAmount: 20000, SettledAmount: 5000}, StatusPartiallySettled},
		{"settled", ChargeLinkView{InvoicedAmount: 20000, SettledAmount: 20000}, StatusSettled},
		{"voided", ChargeLinkView{VoidedAt: ts()}, StatusVoided},
	}
	for _, c := range cases {
		link := c.view
		got := DeriveFinancialStatus(FinancialView{SettlementType: SettlementTenantCharge, Charge: &link, Amount: 20000})
		if got != c.want {
			t.Errorf("%s: got %q, want %q", c.name, got, c.want)
		}
	}
}

func TestIsFinancialEditable(t *testing.T) {
	if !IsFinancialEditable(FinancialView{SettlementType: SettlementRecordOnly}) {
		t.Error("a record-only line is always editable — it links to nothing")
	}
	clean := ChargeLinkView{}
	if !IsFinancialEditable(FinancialView{SettlementType: SettlementTenantCharge, Charge: &clean}) {
		t.Error("an untouched charge is editable")
	}
	billed := ChargeLinkView{InvoicedAmount: 20000}
	if IsFinancialEditable(FinancialView{SettlementType: SettlementTenantCharge, Charge: &billed}) {
		t.Error("an invoiced charge is frozen — the tenant has seen the figure")
	}
	paid := ExpenseView{HasInvoice: true, InvoiceStatus: "PAID"}
	if IsFinancialEditable(FinancialView{SettlementType: SettlementVendorExpense, Expense: &paid}) {
		t.Error("a paid expense is frozen")
	}
}

// A link the type says should be there but is missing must not read as
// editable — a nil link is a broken row, not a clean one.
func TestIsFinancialEditableMissingLinkIsFrozen(t *testing.T) {
	if IsFinancialEditable(FinancialView{SettlementType: SettlementTenantCharge}) {
		t.Error("got editable, want frozen — the charge link is missing")
	}
	if IsFinancialEditable(FinancialView{SettlementType: SettlementVendorExpense}) {
		t.Error("got editable, want frozen — the expense link is missing")
	}
}
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd services/main && go test ./internal/services/expenses/ -v`
Expected: FAIL to build — the package does not exist.

- [ ] **Step 3: Write `status.go`**

Create `services/main/internal/services/expenses/status.go`:

```go
// Package expenses holds the derivation rules for expenses and maintenance
// request financial lines. They live here as pure functions so the rules that
// decide what a landlord may still edit are provable without a database.
package expenses

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

const (
	StatusRecorded         = "RECORDED"
	StatusOutstanding      = "OUTSTANDING"
	StatusInvoiced         = "INVOICED"
	StatusPartiallySettled = "PARTIALLY_SETTLED"
	StatusSettled          = "SETTLED"
	StatusVoided           = "VOIDED"
)

// ExpenseView is the minimum an expense's status depends on.
type ExpenseView struct {
	HasInvoice    bool
	InvoiceStatus string
	VoidedAt      *time.Time
}

// DeriveExpenseStatus computes status rather than storing it. A stored status
// would be a fourth thing to keep in sync with three sources.
//
// An expense with no invoice can only be a row migrated from the old model.
// Those posted Dr Maintenance Expense / Cr Cash when they were created, so the
// money is already gone and calling them OUTSTANDING would tell the landlord
// they owe vendors for cash they have spent.
func DeriveExpenseStatus(v ExpenseView) string {
	switch {
	case v.VoidedAt != nil:
		return StatusVoided
	case !v.HasInvoice:
		return StatusSettled
	case v.InvoiceStatus == "PAID":
		return StatusSettled
	case v.InvoiceStatus == "PARTIALLY_PAID":
		return StatusPartiallySettled
	default:
		return StatusOutstanding
	}
}

// IsExpenseClean reports whether the expense may still be edited, converted or
// voided. The line is drawn at money moving, not at the invoice being issued:
// an issued but unpaid bill can still be withdrawn and reissued.
func IsExpenseClean(v ExpenseView) bool {
	if v.VoidedAt != nil {
		return false
	}
	return v.InvoiceStatus != "PAID" && v.InvoiceStatus != "PARTIALLY_PAID"
}
```

- [ ] **Step 4: Write `financial.go`**

Create `services/main/internal/services/expenses/financial.go`:

```go
package expenses

import "time"

const (
	SettlementRecordOnly    = "RECORD_ONLY"
	SettlementTenantCharge  = "TENANT_CHARGE"
	SettlementVendorExpense = "VENDOR_EXPENSE"
)

// ChargeLinkView is the part of a ChargeInstance a financial line's status
// depends on.
type ChargeLinkView struct {
	InvoicedAmount int64
	SettledAmount  int64
	VoidedAt       *time.Time
}

// FinancialView is a maintenance request financial line and whichever
// settlement it points at. At most one of Charge and Expense is ever set.
type FinancialView struct {
	SettlementType string
	Amount         int64
	Charge         *ChargeLinkView
	Expense        *ExpenseView
}

// DeriveFinancialStatus mirrors whatever the line settles through. A
// RECORD_ONLY line settles through nothing and never reaches the ledger, so it
// has a status of its own.
func DeriveFinancialStatus(v FinancialView) string {
	switch v.SettlementType {
	case SettlementRecordOnly:
		return StatusRecorded
	case SettlementTenantCharge:
		if v.Charge == nil {
			return StatusVoided
		}
		return deriveChargeStatus(*v.Charge, v.Amount)
	case SettlementVendorExpense:
		if v.Expense == nil {
			return StatusVoided
		}
		return DeriveExpenseStatus(*v.Expense)
	default:
		return StatusRecorded
	}
}

func deriveChargeStatus(c ChargeLinkView, amount int64) string {
	switch {
	case c.VoidedAt != nil:
		return StatusVoided
	case c.SettledAmount >= amount && amount > 0:
		return StatusSettled
	case c.SettledAmount > 0:
		return StatusPartiallySettled
	case c.InvoicedAmount > 0:
		return StatusInvoiced
	default:
		return StatusOutstanding
	}
}

// IsFinancialEditable answers the question the UI asks before offering an edit
// or a settlement-type conversion, so the screen stops offering what the API
// is going to refuse.
//
// A missing link on a line whose type demands one is treated as frozen. That
// row is broken, and letting an edit through would compound it.
func IsFinancialEditable(v FinancialView) bool {
	switch v.SettlementType {
	case SettlementRecordOnly:
		return true
	case SettlementTenantCharge:
		if v.Charge == nil {
			return false
		}
		return v.Charge.VoidedAt == nil &&
			v.Charge.InvoicedAmount == 0 &&
			v.Charge.SettledAmount == 0
	case SettlementVendorExpense:
		if v.Expense == nil {
			return false
		}
		return IsExpenseClean(*v.Expense)
	default:
		return false
	}
}
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd services/main && go test ./internal/services/expenses/ -v`
Expected: PASS — all eight tests.

This package must import **nothing but `time`**. The projection from `models.Expense` onto `ExpenseView` cannot live here yet: it reads `VoidedAt` and `Invoices`, which Task 3 adds. It is Task 3's job.

- [ ] **Step 6: Verify**

```bash
cd services/main && make lint-fix && go build ./... && go test ./internal/services/expenses/
```
Leave changes unstaged.

---

### Task 3: Models — the financial line, and `Expense` as a payable

Reshapes three models together, because they do not compile apart: `Expense` loses the FK that `MaintenanceRequest.Expenses` depends on, and the new line model replaces it. No e2e case touches expenses (verified: `grep -rl expense scripts/e2e/cases | wc -l` is 0), so the intermediate state where a maintenance expense cannot yet be created breaks nothing.

**Files:**
- Create: `services/main/internal/models/maintenance-request-financial.go`
- Modify: `services/main/internal/models/expense.go`
- Modify: `services/main/internal/models/invoice.go`
- Modify: `services/main/internal/models/maintenance-request.go`
- Modify: `services/main/internal/repository/expense.go`
- Modify: `services/main/internal/transformations/expense.go`
- Modify: `services/main/internal/services/expense.go`
- Modify: `services/main/internal/handlers/expense.go`
- Modify: `services/main/init/migration/main.go`

**Interfaces:**
- Consumes: `expenses.DeriveExpenseStatus`, `expenses.IsExpenseClean` (Task 2).
- Produces: `models.MaintenanceRequestFinancial`, the reshaped `models.Expense`, `models.Invoice.ContextExpenseID`, `expenses.ExpenseStatusView(e *models.Expense) ExpenseView`, and `repository.ListExpensesFilter{PropertyIDs, ClientUserID, ContextType, Category, MaintenanceRequestID *string}`.

- [ ] **Step 1: Create the financial line model**

Create `services/main/internal/models/maintenance-request-financial.go`:

```go
package models

// MaintenanceRequestFinancial is one costed line on a maintenance request:
// what it cost, and who if anyone settles it.
//
// It posts nothing. Money reaches the ledger through the ChargeInstance or the
// Expense it points at, and only when those are invoiced. A RECORD_ONLY line
// never reaches the ledger at all, which is what lets a landlord write down
// what a job cost without claiming anybody owes it.
//
// SettlementType and its link are paired by a CHECK constraint rather than by
// the Go type, which cannot express "exactly one of these, and it must match
// the discriminator".
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

- [ ] **Step 2: Reshape `Expense`**

Replace the whole of `services/main/internal/models/expense.go`:

```go
package models

import "time"

// Expense is money the landlord owes a vendor for a service provided to them.
//
// It is a payable, not a record of cash already gone: every expense creates an
// invoice in the same transaction, and that invoice is what posts to the
// ledger. Recharging a tenant for the same underlying event is a separate
// MAINTENANCE_CHARGE on their financial account and is deliberately not
// derived from this record — the landlord may recharge more, less, or nothing.
//
// The request an expense belongs to is reached through
// MaintenanceRequestFinancial. A second FK here would be a source of truth
// that could disagree with it.
type Expense struct {
	BaseModelSoftDelete

	Code string `gorm:"not null;uniqueIndex;"` // EXP-YYMM-XXXXXX

	ContextType string `gorm:"not null;index;"` // MAINTENANCE | GENERAL

	PropertyID string `gorm:"index;"`
	Property   Property

	// REPAIRS | UTILITIES | INSURANCE | LANDSCAPING | SECURITY | MANAGEMENT | OTHER
	//
	// The default exists for AutoMigrate, which runs before the migration jobs
	// and cannot add a NOT NULL column to a populated table without one.
	// BackfillExpenseContextAndCategory then corrects the maintenance rows.
	Category string `gorm:"not null;index;default:'OTHER'"`

	// Nullable in the database, required by the create validator. Rows
	// migrated from the old model genuinely do not know who was paid, and a
	// placeholder there would be invented data.
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

- [ ] **Step 3: Add the invoice context**

In `services/main/internal/models/invoice.go`, beside `ContextLeaseTerminationID`:

```go
	ContextExpenseID *string `gorm:"index;"`
	ContextExpense   *Expense
```

and extend the `ContextType` comment to include `'EXPENSE'`.

- [ ] **Step 4: Swap the association on the request**

In `services/main/internal/models/maintenance-request.go`, replace:

```go
	Expenses     []Expense `gorm:"foreignKey:ContextMaintenanceRequestID"`
```

with:

```go
	Financials   []MaintenanceRequestFinancial
```

- [ ] **Step 5: Follow the model in the repository**

In `services/main/internal/repository/expense.go`, replace `ListExpensesFilter`:

```go
type ListExpensesFilter struct {
	PropertyIDs          *[]string
	ClientUserID         *string
	ContextType          *string
	Category             *string
	MaintenanceRequestID *string
}
```

Replace `expenseMaintenanceRequestScope` — the link now lives on the financial line:

```go
func expenseMaintenanceRequestScope(requestID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if requestID == nil {
			return db
		}
		return db.Where(
			"expenses.id IN (?)",
			db.Session(&gorm.Session{NewDB: true}).
				Model(&models.MaintenanceRequestFinancial{}).
				Select("expense_id").
				Where(
					"maintenance_request_id = ? AND expense_id IS NOT NULL AND deleted_at IS NULL",
					*requestID,
				),
		)
	}
}
```

Fix `GetOne`, which is the only method in the file reading `r.DB` directly instead of `lib.ResolveDB(ctx, r.DB)`. Task 8 creates an expense and immediately re-reads it inside a transaction; on the base connection that read would not find the uncommitted row.

```go
	db := lib.ResolveDB(ctx, r.DB).WithContext(ctx).Where("expenses.id = ?", query.ID)
```

Add a category scope beside the context-type one:

```go
func expenseCategoryScope(category *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if category == nil {
			return db
		}
		return db.Where("expenses.category = ?", *category)
	}
}
```

In both `List` and `Count`, change `expenseMaintenanceRequestScope(filters.ContextMaintenanceRequestID)` to `expenseMaintenanceRequestScope(filters.MaintenanceRequestID)` and add `expenseCategoryScope(filters.Category),` after the context-type scope.

- [ ] **Step 5b: Add the projection now the model can carry it**

Create `services/main/internal/services/expenses/project.go`. It is separate from `status.go` so that file stays dependency-free:

```go
package expenses

import "github.com/Bendomey/rent-loop/services/main/internal/models"

// ExpenseStatusView projects the model onto the derivation input. It lives
// beside the rules rather than in the transformation layer so the service and
// the serialiser cannot answer "is this editable?" differently.
//
// Invoices must be preloaded. A voided invoice is skipped: it no longer bills
// anyone, so an expense whose only invoice was voided reads as having none.
func ExpenseStatusView(e *models.Expense) ExpenseView {
	view := ExpenseView{VoidedAt: e.VoidedAt}
	for i := range e.Invoices {
		if e.Invoices[i].Status == "VOID" {
			continue
		}
		view.HasInvoice = true
		view.InvoiceStatus = e.Invoices[i].Status
		break
	}
	return view
}
```

Add its test to `services/main/internal/services/expenses/status_test.go`:

```go
// A voided invoice bills nobody, so an expense whose only invoice was voided
// reads as having none rather than as outstanding.
func TestExpenseStatusViewSkipsVoidedInvoices(t *testing.T) {
	expense := &models.Expense{
		Invoices: []models.Invoice{
			{Status: "VOID"},
			{Status: "PAID"},
		},
	}
	view := ExpenseStatusView(expense)
	if !view.HasInvoice || view.InvoiceStatus != "PAID" {
		t.Errorf("got %+v, want the live PAID invoice", view)
	}

	onlyVoided := &models.Expense{Invoices: []models.Invoice{{Status: "VOID"}}}
	if ExpenseStatusView(onlyVoided).HasInvoice {
		t.Error("got HasInvoice, want false — the only invoice was voided")
	}
}
```

- [ ] **Step 6: Rewrite the transformation**

Replace the whole of `services/main/internal/transformations/expense.go`:

```go
package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/services/expenses"
)

type OutputExpense struct {
	ID                    string    `json:"id"`
	Code                  string    `json:"code"`
	ContextType           string    `json:"context_type"`
	PropertyID            string    `json:"property_id"`
	Category              string    `json:"category"`
	VendorName            *string   `json:"vendor_name,omitempty"`
	VendorContact         *string   `json:"vendor_contact,omitempty"`
	Description           string    `json:"description"`
	Amount                int64     `json:"amount"`
	Currency              string    `json:"currency"`
	Status                string    `json:"status"`
	IsEditable            bool      `json:"is_editable"`
	InvoiceID             *string   `json:"invoice_id,omitempty"`
	VoidedAt              *string   `json:"voided_at,omitempty"`
	VoidedReason          *string   `json:"voided_reason,omitempty"`
	CreatedByClientUserID string    `json:"created_by_client_user_id"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

func DBExpenseToRest(e *models.Expense) any {
	if e == nil {
		return nil
	}

	view := expenses.ExpenseStatusView(e)

	var invoiceID *string
	for i := range e.Invoices {
		if e.Invoices[i].Status != "VOID" {
			id := e.Invoices[i].ID.String()
			invoiceID = &id
			break
		}
	}

	var voidedAt *string
	if e.VoidedAt != nil {
		formatted := e.VoidedAt.Format(time.RFC3339)
		voidedAt = &formatted
	}

	return map[string]any{
		"id":                        e.ID.String(),
		"code":                      e.Code,
		"context_type":              e.ContextType,
		"property_id":               e.PropertyID,
		"category":                  e.Category,
		"vendor_name":               e.VendorName,
		"vendor_contact":            e.VendorContact,
		"description":               e.Description,
		"amount":                    e.Amount,
		"currency":                  e.Currency,
		"status":                    expenses.DeriveExpenseStatus(view),
		"is_editable":               expenses.IsExpenseClean(view),
		"invoice_id":                invoiceID,
		"voided_at":                 voidedAt,
		"voided_reason":             e.VoidedReason,
		"created_by_client_user_id": e.CreatedByClientUserID,
		"created_at":                e.CreatedAt,
		"updated_at":                e.UpdatedAt,
	}
}
```

- [ ] **Step 7: Make the service and handler compile**

These are rewritten properly in Task 8. For now, the minimum to build:

In `services/main/internal/services/expense.go`:
- Delete the `ContextMaintenanceRequestID` field from `AddExpenseInput` and from the `models.Expense` literal in `AddExpense`.
- Add `Category: "REPAIRS",` to that literal.
- Change `populate := []string{"Invoices"}` in `GetExpense` — it is now a real relation, so it stays as is and finally works.

In `services/main/internal/transformations/maintenance-request.go`:
- Delete both `mr.Expenses` loops and both `"expenses"` response keys. Nothing preloads that association, so the key has always serialised as `[]`; Task 9 adds `financials` in its place.

In `services/main/internal/handlers/expense.go`:
- Delete `ContextMaintenanceRequestID` from `AddExpenseBody` and from the `services.AddExpenseInput` literal.
- In `ListExpensesQuery`, change the validator to `validate:"omitempty,oneof=MAINTENANCE GENERAL"`.
- Wherever `repository.ListExpensesFilter{...ContextMaintenanceRequestID: ...}` appears (`ListMRExpenses`), rename the field to `MaintenanceRequestID`.

- [ ] **Step 8: Register for AutoMigrate**

In `services/main/init/migration/main.go`, add after `&models.Expense{},`:

```go
		&models.MaintenanceRequestFinancial{},
```

- [ ] **Step 9: Verify the build**

```bash
cd services/main
make lint-fix
go build ./...
go test ./...
```
Expected: build clean, all existing tests pass. Leave changes unstaged.

---

### Task 4: Migration jobs

Five jobs, in order. `AutoMigrate` has already added every new column and the new table by the time any of these run, which is why none of them attempts a rename.

**Files:**
- Create: `services/main/init/migration/jobs/report-legacy-expense-shape.go`
- Create: `services/main/init/migration/jobs/add-mrf-settlement-constraint.go`
- Create: `services/main/init/migration/jobs/backfill-maintenance-request-financials.go`
- Create: `services/main/init/migration/jobs/backfill-expense-context-and-category.go`
- Create: `services/main/init/migration/jobs/drop-expense-maintenance-context.go`
- Modify: `services/main/init/migration/main.go`

**Interfaces:**
- Consumes: `models.MaintenanceRequestFinancial` and the reshaped `models.Expense` (Task 3).
- Produces: a database in which every legacy maintenance expense has a `VENDOR_EXPENSE` line, and `expenses.context_maintenance_request_id` no longer exists.

- [ ] **Step 1: The read-only census**

Create `services/main/init/migration/jobs/report-legacy-expense-shape.go`:

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// ReportLegacyExpenseShape counts the expense rows this migration is about to
// reshape, before anything mutates. The LEASE-context rows in particular are a
// judgement call, and the count is what makes it an informed one.
func ReportLegacyExpenseShape() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202609100001_REPORT_LEGACY_EXPENSE_SHAPE",
		Migrate: func(db *gorm.DB) error {
			type row struct {
				Bucket string
				Total  int64
			}
			var rows []row
			if err := db.Raw(`
				SELECT
					CASE
						WHEN context_maintenance_request_id IS NOT NULL THEN 'has_maintenance_request'
						WHEN context_lease_id IS NOT NULL THEN 'lease_context_only'
						ELSE 'orphaned'
					END AS bucket,
					COUNT(*) AS total
				FROM expenses
				WHERE deleted_at IS NULL
				GROUP BY 1
			`).Scan(&rows).Error; err != nil {
				return err
			}
			for _, r := range rows {
				log.WithFields(log.Fields{"bucket": r.Bucket, "count": r.Total}).
					Info("[Migration.ReportLegacyExpenseShape] legacy expense census")
			}
			return nil
		},
		Rollback: func(db *gorm.DB) error { return nil },
	}
}
```

Note the guard: `context_lease_id` may not exist on a database that never ran `AddExpenseLeasePropertyContext`. If the census errors on a missing column, wrap the `CASE` branch in `to_regclass`-style defensiveness is overkill — instead confirm the column exists first with `SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='context_lease_id'` and fall back to a two-bucket query when it does not.

- [ ] **Step 2: The CHECK constraint**

Create `services/main/init/migration/jobs/add-mrf-settlement-constraint.go`:

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddMRFSettlementConstraint pairs settlement_type with its link. The Go type
// cannot say "exactly one of these, matching the discriminator", so the
// database says it instead.
func AddMRFSettlementConstraint() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202609100002_ADD_MRF_SETTLEMENT_CONSTRAINT",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				ALTER TABLE maintenance_request_financials
				DROP CONSTRAINT IF EXISTS chk_mrf_settlement_link;
				ALTER TABLE maintenance_request_financials
				ADD CONSTRAINT chk_mrf_settlement_link CHECK (
				  (settlement_type = 'RECORD_ONLY'
				     AND charge_instance_id IS NULL AND expense_id IS NULL) OR
				  (settlement_type = 'TENANT_CHARGE'
				     AND charge_instance_id IS NOT NULL AND expense_id IS NULL) OR
				  (settlement_type = 'VENDOR_EXPENSE'
				     AND expense_id IS NOT NULL AND charge_instance_id IS NULL)
				)
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`
				ALTER TABLE maintenance_request_financials
				DROP CONSTRAINT IF EXISTS chk_mrf_settlement_link
			`).Error
		},
	}
}
```

- [ ] **Step 3: Backfill a line per legacy maintenance expense**

Create `services/main/init/migration/jobs/backfill-maintenance-request-financials.go`:

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// BackfillMaintenanceRequestFinancials gives every legacy maintenance expense
// the line it never had. Those rows were always landlord-to-vendor costs; the
// old model simply had nowhere to record what they belonged to beyond a
// foreign key that is about to be dropped.
func BackfillMaintenanceRequestFinancials() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202609100003_BACKFILL_MAINTENANCE_REQUEST_FINANCIALS",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				INSERT INTO maintenance_request_financials (
					id, created_at, updated_at,
					maintenance_request_id, property_id,
					description, amount, currency,
					settlement_type, expense_id,
					created_by_client_user_id
				)
				SELECT
					uuid_generate_v4(), e.created_at, e.updated_at,
					e.context_maintenance_request_id, e.property_id,
					e.description, e.amount, e.currency,
					'VENDOR_EXPENSE', e.id,
					e.created_by_client_user_id
				FROM expenses e
				WHERE e.deleted_at IS NULL
				  AND e.context_maintenance_request_id IS NOT NULL
				  AND NOT EXISTS (
					SELECT 1 FROM maintenance_request_financials f
					WHERE f.expense_id = e.id AND f.deleted_at IS NULL
				  )
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`
				DELETE FROM maintenance_request_financials
				WHERE settlement_type = 'VENDOR_EXPENSE'
			`).Error
		},
	}
}
```

- [ ] **Step 4: Backfill context and category**

Create `services/main/init/migration/jobs/backfill-expense-context-and-category.go`:

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// BackfillExpenseContextAndCategory settles what the reshaped columns hold for
// rows that predate them.
//
// Legacy rows get no invoice and no new journal entry. They already posted
// Dr Maintenance Expense / Cr Cash when they were created — the money had
// left — and DeriveExpenseStatus reads an invoice-less expense as SETTLED for
// exactly that reason. Marking them outstanding would tell the landlord they
// owe vendors for cash already spent.
//
// LEASE-context rows carried a lease but no request and were the old "bill the
// tenant" path. They become GENERAL expenses with the lease code kept in the
// description, because no column survives to hold it. Fabricating charge
// instances for them would create real retroactive obligations on tenant
// accounts.
func BackfillExpenseContextAndCategory() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202609100004_BACKFILL_EXPENSE_CONTEXT_AND_CATEGORY",
		Migrate: func(db *gorm.DB) error {
			// AutoMigrate has already defaulted every pre-existing row to
			// OTHER. This job runs once, immediately after, so every row it
			// sees is legacy and keying off the request link cannot clobber a
			// category a landlord deliberately chose.
			if err := db.Exec(`
				UPDATE expenses SET category = 'REPAIRS'
				WHERE deleted_at IS NULL
				  AND context_maintenance_request_id IS NOT NULL
			`).Error; err != nil {
				return err
			}

			var hasLeaseColumn int64
			if err := db.Raw(`
				SELECT COUNT(*) FROM information_schema.columns
				WHERE table_name = 'expenses' AND column_name = 'context_lease_id'
			`).Scan(&hasLeaseColumn).Error; err != nil {
				return err
			}

			if hasLeaseColumn > 0 {
				if err := db.Exec(`
					UPDATE expenses e
					SET description = e.description ||
						' (originally recorded against lease ' || l.code || ')'
					FROM leases l
					WHERE l.id = e.context_lease_id
					  AND e.deleted_at IS NULL
					  AND e.context_lease_id IS NOT NULL
					  AND e.description NOT LIKE '%originally recorded against lease%'
				`).Error; err != nil {
					return err
				}
			}

			return db.Exec(`
				UPDATE expenses
				SET context_type = CASE
					WHEN context_maintenance_request_id IS NOT NULL THEN 'MAINTENANCE'
					ELSE 'GENERAL'
				END
				WHERE deleted_at IS NULL
			`).Error
		},
		Rollback: func(db *gorm.DB) error { return nil },
	}
}
```

Confirm `leases` has a `code` column before running; if it does not, drop the lease-code append and use `e.context_lease_id::text` instead.

- [ ] **Step 5: Drop the redundant foreign key**

Create `services/main/init/migration/jobs/drop-expense-maintenance-context.go`:

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// DropExpenseMaintenanceContext removes the second source of truth. After
// BackfillMaintenanceRequestFinancials the line owns the link, and two places
// recording the same relationship is how they come to disagree.
func DropExpenseMaintenanceContext() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202609100005_DROP_EXPENSE_MAINTENANCE_CONTEXT",
		Migrate: func(db *gorm.DB) error {
			return db.Exec(`
				ALTER TABLE expenses DROP COLUMN IF EXISTS context_maintenance_request_id
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`
				ALTER TABLE expenses
				ADD COLUMN IF NOT EXISTS context_maintenance_request_id UUID
					REFERENCES maintenance_requests(id)
			`).Error
		},
	}
}
```

- [ ] **Step 6: Register the jobs in order**

In `services/main/init/migration/main.go`, append to the `migrations` slice, in exactly this order:

```go
		jobs.ReportLegacyExpenseShape(),
		jobs.AddMRFSettlementConstraint(),
		jobs.BackfillMaintenanceRequestFinancials(),
		jobs.BackfillExpenseContextAndCategory(),
		jobs.DropExpenseMaintenanceContext(),
```

The drop must follow the backfill; the rest is ordering for legibility.

- [ ] **Step 7: Run against a local database and verify**

Never point this at production (see the project's standing rule). Confirm the connection is local first:

```bash
cd services/main
direnv exec . sh -c 'echo "$DB_HOST/$DB_NAME"' | grep -E '^(localhost|127\.0\.0\.1)/' || echo "NOT LOCAL — STOP"
make update-db
```

Read the value through `direnv exec` rather than the ambient shell: direnv caches, and a stale export is exactly how a "local" command reaches a remote database.

Expected: the census logs its buckets, then the four mutating jobs run clean.

- [ ] **Step 8: Check the result**

```bash
psql -h "$DB_HOST" -d "$DB_NAME" -c "\d maintenance_request_financials" \
  -c "SELECT settlement_type, count(*) FROM maintenance_request_financials GROUP BY 1;" \
  -c "SELECT context_type, category, count(*) FROM expenses GROUP BY 1,2;" \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name='expenses';"
```

Expected: the CHECK constraint is present, every legacy maintenance expense has a `VENDOR_EXPENSE` line, no expense has an empty `category`, and `context_maintenance_request_id` is gone. Leave changes unstaged.

---

### Task 5: The `EXPENSE` invoice journal branches

> **Decided during execution:** the expense account is routed by category —
> `expenseAccountFor` sends `MANAGEMENT` to `PropertyManagementExpenseID` and
> every other category to `MaintenanceExpenseID`. The category travels on the
> invoice line's `Metadata`, because `VoidInvoice` rebuilds the entry from the
> reloaded invoice; reading it off the expense row would let a reversal pick a
> different account than the issuance. Consequence: `UpdateExpense` freezes
> `Category` exactly as it freezes `Amount` — both decide what the
> already-posted entry says. Insurance, utilities, landscaping and security
> still land in maintenance; a finer split needs new Fincore accounts.

Without both branches the existing `default:` case posts `Dr Cash / Cr AR` for a bill the landlord *received*, silently inverting it. This is the highest-consequence change in the plan, and it is pure functions, so it is fully unit-testable.

**Files:**
- Modify: `services/main/internal/services/invoice.go`
- Test: `services/main/internal/services/invoice_category_test.go` (extend)

**Interfaces:**
- Consumes: `testAccounts()` from Task 1.
- Produces: `buildExpenseJournalEntry(invoice, accounts) []accounting.CreateJournalEntryLineRequest` and the `EXPENSE` case in `buildPaymentJournalLines`, used by Tasks 6 and 7.

- [ ] **Step 1: Write the failing tests**

Append to `services/main/internal/services/invoice_category_test.go`:

```go
func expenseInvoice() *models.Invoice {
	return &models.Invoice{
		Code:        "INV-2609-TEST",
		PayerType:   "PROPERTY_OWNER",
		PayeeType:   "EXTERNAL",
		ContextType: "EXPENSE",
		TotalAmount: 30000,
		Currency:    "GHS",
	}
}

// Issuing a bill the landlord received creates the debt. It must never touch
// Accounts Receivable — nobody owes the landlord anything here.
func TestExpenseInvoiceIssuancePostsPayable(t *testing.T) {
	lines := buildJournalEntryForInvoice(expenseInvoice(), testAccounts())
	if len(lines) != 2 {
		t.Fatalf("got %d lines, want 2", len(lines))
	}
	if lines[0].AccountID != "maint-exp" || lines[0].Debit != 30000 {
		t.Errorf("line 0 = %+v, want debit 30000 to maint-exp", lines[0])
	}
	if lines[1].AccountID != "ap" || lines[1].Credit != 30000 {
		t.Errorf("line 1 = %+v, want credit 30000 to ap", lines[1])
	}
}

func TestExpenseInvoicePaymentClearsPayable(t *testing.T) {
	lines := buildPaymentJournalLines(expenseInvoice(), 30000, testAccounts())
	if len(lines) != 2 {
		t.Fatalf("got %d lines, want 2", len(lines))
	}
	if lines[0].AccountID != "ap" || lines[0].Debit != 30000 {
		t.Errorf("line 0 = %+v, want debit 30000 to ap", lines[0])
	}
	if lines[1].AccountID != "cash" || lines[1].Credit != 30000 {
		t.Errorf("line 1 = %+v, want credit 30000 to cash", lines[1])
	}
}

// A part payment clears only what it covers.
func TestExpenseInvoicePartialPayment(t *testing.T) {
	lines := buildPaymentJournalLines(expenseInvoice(), 10000, testAccounts())
	if lines[0].Debit != 10000 || lines[1].Credit != 10000 {
		t.Errorf("got %+v, want 10000 on both sides", lines)
	}
}

// Issue then pay in full nets to the single entry the old model posted
// directly, which is why migrated rows need no reversing entry.
func TestExpenseIssueThenPayNetsToExpenseOverCash(t *testing.T) {
	issue := buildJournalEntryForInvoice(expenseInvoice(), testAccounts())
	pay := buildPaymentJournalLines(expenseInvoice(), 30000, testAccounts())

	net := map[string]int64{}
	for _, l := range append(issue, pay...) {
		net[l.AccountID] += l.Debit - l.Credit
	}
	if net["ap"] != 0 {
		t.Errorf("accounts payable nets to %d, want 0", net["ap"])
	}
	if net["maint-exp"] != 30000 {
		t.Errorf("maintenance expense nets to %d, want 30000", net["maint-exp"])
	}
	if net["cash"] != -30000 {
		t.Errorf("cash nets to %d, want -30000", net["cash"])
	}
}
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `cd services/main && go test ./internal/services/ -run TestExpenseInvoice -v`
Expected: FAIL — issuance returns 0 lines (`default:` in the context switch), and payment returns the AR pair.

- [ ] **Step 3: Add the issuance branch**

In `services/main/internal/services/invoice.go`, in the non-account-backed switch inside `buildJournalEntryForInvoice`, add before `default:`:

```go
	case "EXPENSE":
		return buildExpenseJournalEntry(invoice, accounts)
```

Then add the builder beside the other `build*JournalEntry` functions:

```go
// buildExpenseJournalEntry records a bill the landlord received. The debt is
// created on issue and cleared on payment, which is what makes "what do I owe
// vendors right now" answerable at all.
//
// It never touches Accounts Receivable: nobody owes the landlord anything on
// an expense invoice.
func buildExpenseJournalEntry(
	invoice *models.Invoice,
	accounts config.IChartOfAccounts,
) []accounting.CreateJournalEntryLineRequest {
	note := fmt.Sprintf("Vendor bill %s", invoice.Code)
	return []accounting.CreateJournalEntryLineRequest{
		{
			AccountID: accounts.MaintenanceExpenseID,
			Debit:     invoice.TotalAmount,
			Credit:    0,
			Notes:     lib.StringPointer(note),
		},
		{
			AccountID: accounts.AccountsPayableID,
			Debit:     0,
			Credit:    invoice.TotalAmount,
			Notes:     lib.StringPointer(note),
		},
	}
}
```

- [ ] **Step 4: Add the payment branch**

In `buildPaymentJournalLines`, add before `default:`:

```go
	case "EXPENSE":
		return []accounting.CreateJournalEntryLineRequest{
			{
				AccountID: accounts.AccountsPayableID,
				Debit:     paymentAmount,
				Credit:    0,
				Notes:     lib.StringPointer(fmt.Sprintf("Payable cleared for invoice %s", invoice.Code)),
			},
			{
				AccountID: accounts.CashBankAccountID,
				Debit:     0,
				Credit:    paymentAmount,
				Notes:     lib.StringPointer(fmt.Sprintf("Vendor paid for invoice %s", invoice.Code)),
			},
		}
```

Do not touch the `PayerType == "EXTERNAL"` guard at the top of the function. An expense invoice is `PayerType: PROPERTY_OWNER` with `PayeeType: EXTERNAL`, so it falls through correctly.

- [ ] **Step 5: Run the tests and verify they pass**

Run: `cd services/main && go test ./internal/services/ -run 'TestExpense' -v`
Expected: PASS — all four.

- [ ] **Step 6: Verify**

```bash
cd services/main && make lint-fix && go build ./... && go test ./...
```
Leave changes unstaged.

---

### Task 6: `InvoiceService.CreateExpenseInvoice`

The invoice for an expense is a bill *received*. It is non-account-backed, so it needs none of the composition machinery — `PaymentAllocation` requires a non-null `ChargeInstanceID` and could never apply to it, and `payment.go` already branches on `FinancialAccountID != nil` so payments work without allocations.

**Files:**
- Modify: `services/main/internal/services/invoice.go`

**Interfaces:**
- Consumes: `buildExpenseJournalEntry` (Task 5), `models.Expense` (Task 3).
- Produces: `InvoiceService.CreateExpenseInvoice(ctx, CreateExpenseInvoiceInput) (*models.Invoice, error)` with
  `CreateExpenseInvoiceInput{ExpenseID, PropertyID string; ClientID *string; VendorName string; Description string; Amount int64; Currency string; DueDate *time.Time}`.
  Used by Task 8.

- [ ] **Step 1: Add the input type and interface method**

In `services/main/internal/services/invoice.go`, beside `CreateInvoiceInput`:

```go
type CreateExpenseInvoiceInput struct {
	ExpenseID   string
	PropertyID  string
	ClientID    *string
	VendorName  string
	Description string
	Amount      int64
	Currency    string
	DueDate     *time.Time
}
```

Add to the `InvoiceService` interface:

```go
	// CreateExpenseInvoice raises the vendor's bill against an expense. It is
	// called only by ExpenseService, in the same transaction that creates the
	// expense: an expense with no invoice would post nothing and vanish from
	// the landlord's books.
	CreateExpenseInvoice(ctx context.Context, input CreateExpenseInvoiceInput) (*models.Invoice, error)
```

- [ ] **Step 2: Implement it**

```go
func (s *invoiceService) CreateExpenseInvoice(
	ctx context.Context,
	input CreateExpenseInvoiceInput,
) (*models.Invoice, error) {
	if input.Amount <= 0 {
		return nil, pkg.BadRequestError("ExpenseAmountMustBePositive", nil)
	}

	currency := input.Currency
	if currency == "" {
		currency = "GHS"
	}

	label := fmt.Sprintf("%s — %s", input.Description, input.VendorName)

	return s.CreateInvoice(ctx, CreateInvoiceInput{
		ClientID:            input.ClientID,
		PropertyID:          &input.PropertyID,
		PayerType:           "PROPERTY_OWNER",
		PayerPropertyID:     &input.PropertyID,
		PayeeType:           "EXTERNAL",
		ContextType:         "EXPENSE",
		ContextExpenseID:    &input.ExpenseID,
		TotalAmount:         input.Amount,
		SubTotal:            input.Amount,
		Currency:            currency,
		Status:              "ISSUED",
		DueDate:             input.DueDate,
		AllowedPaymentRails: []string{"OFFLINE"},
		LineItems: []LineItemInput{
			{
				Label:       label,
				Category:    "MAINTENANCE_FEE",
				Quantity:    1,
				UnitAmount:  input.Amount,
				TotalAmount: input.Amount,
				Currency:    currency,
			},
		},
	})
}
```

- [ ] **Step 3: Carry the new context field through `CreateInvoice`**

Add `ContextExpenseID *string` to `CreateInvoiceInput` beside the other context fields, and set `ContextExpenseID: input.ContextExpenseID,` on the `models.Invoice` literal built inside `CreateInvoice`.

- [ ] **Step 4: Verify**

```bash
cd services/main && make lint-fix && go build ./... && go test ./...
```
Expected: build clean, all tests pass. `recordIssuanceEntry` already fires for a `Status: "ISSUED"` invoice, so the payable posts with no extra wiring. Leave changes unstaged.

---

### Task 7: `PaymentService.RecordExpensePayment`

The already-paid toggle needs a landlord-side settlement path. Rather than duplicating the 60-line settlement block in `VerifyOfflinePayment`, this composes the two calls that already exist — `CreateOfflinePayment` then `VerifyOfflinePayment` — against the seeded `SYSTEM` / `OFFLINE` payment account. The non-account-backed path in `VerifyOfflinePayment` already skips allocations and posts through `buildPaymentJournalLines`, which Task 5 taught about `EXPENSE`.

**Files:**
- Modify: `services/main/internal/services/payment.go`

**Interfaces:**
- Consumes: the `EXPENSE` case in `buildPaymentJournalLines` (Task 5).
- Produces: `PaymentService.RecordExpensePayment(ctx, RecordExpensePaymentInput) (*models.Payment, error)` with
  `RecordExpensePaymentInput{InvoiceID string; Amount int64; Provider *string; Reference *string; ClientUserID string}`.
  Used by Task 8.

- [ ] **Step 1: Add the input type and interface method**

```go
// RecordExpensePaymentInput settles a bill the landlord paid. There is no
// submission-then-verification dance here: the landlord is recording their own
// outgoing payment, so it is successful the moment it is recorded.
type RecordExpensePaymentInput struct {
	InvoiceID    string
	Amount       int64
	Provider     *string
	Reference    *string
	ClientUserID string
}
```

Add `RecordExpensePayment(ctx context.Context, input RecordExpensePaymentInput) (*models.Payment, error)` to the `PaymentService` interface.

- [ ] **Step 2: Implement it**

```go
func (s *paymentService) RecordExpensePayment(
	ctx context.Context,
	input RecordExpensePaymentInput,
) (*models.Payment, error) {
	account, err := s.repoPaymentAccountSystemOffline(ctx)
	if err != nil {
		return nil, err
	}

	provider := "CASH"
	if input.Provider != nil {
		provider = *input.Provider
	}

	payment, err := s.CreateOfflinePayment(ctx, CreateOfflinePaymentInput{
		PaymentAccountID:        account.ID.String(),
		InvoiceID:               input.InvoiceID,
		Provider:                provider,
		Amount:                  input.Amount,
		Reference:               input.Reference,
		InitiatedByClientUserID: &input.ClientUserID,
	})
	if err != nil {
		return nil, err
	}

	return s.VerifyOfflinePayment(ctx, VerifyOfflinePaymentInput{
		VerifiedByID: input.ClientUserID,
		PaymentID:    payment.ID.String(),
		IsSuccessful: true,
	})
}

// repoPaymentAccountSystemOffline finds the account seeded by
// SeedSystemOfflinePaymentAccount. A vendor is external and has no payment
// account of their own, so offline settlement rides the system one.
func (s *paymentService) repoPaymentAccountSystemOffline(
	ctx context.Context,
) (*models.PaymentAccount, error) {
	var account models.PaymentAccount
	err := lib.ResolveDB(ctx, s.appCtx.DB).WithContext(ctx).
		Where("owner_type = ? AND rail = ? AND status = ?", "SYSTEM", "OFFLINE", "ACTIVE").
		First(&account).Error
	if err != nil {
		return nil, pkg.InternalServerError("SystemOfflinePaymentAccountMissing", &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "RecordExpensePayment"},
		})
	}
	return &account, nil
}
```

- [ ] **Step 3: Verify**

```bash
cd services/main && make lint-fix && go build ./... && go test ./...
```
Expected: build clean. Behaviour is proven end-to-end in Task 12 (`n3`, `n6`). Leave changes unstaged.

---

### Task 8: `ExpenseService` rework

**Files:**
- Modify: `services/main/internal/services/expense.go`

**Interfaces:**
- Consumes: `InvoiceService.CreateExpenseInvoice` (Task 6), `PaymentService.RecordExpensePayment` (Task 7), `expenses.IsExpenseClean` (Task 2).
- Produces, used by Tasks 9 and 10:
  - `CreateExpense(ctx, CreateExpenseInput) (*models.Expense, error)`
  - `UpdateExpense(ctx, UpdateExpenseInput) (*models.Expense, error)`
  - `VoidExpense(ctx, expenseID, reason string, voidedBy *string) error`
  - `GetExpense`, `ListExpenses`, `CountExpenses` (unchanged signatures)

- [ ] **Step 1: Replace the input type and drop the accounting dependency**

Delete `postExpenseJournalEntry` entirely, remove `accountingService` from `expenseService` and `ExpenseServiceDeps`, and remove the `accounting` and `log` imports if they become unused. Add `invoiceService InvoiceService` and `paymentService PaymentService` to both, plus `repo repository.ExpenseRepository` which already exists.

```go
type CreateExpenseInput struct {
	PropertyID    string
	ClientID      *string
	ContextType   string // GENERAL from a handler; MAINTENANCE only from the MRF service
	Category      string
	VendorName    string
	VendorContact *string
	Description   string
	Amount        int64
	Currency      string
	DueDate       *time.Time
	ClientUserID  string

	// AlreadyPaid folds "I paid this last week" into one step: the offline
	// payment is recorded in the same transaction, so the expense lands
	// settled and both journal entries post together. Most general expenses
	// are entered after the money has left.
	AlreadyPaid      bool
	PaymentProvider  *string
	PaymentReference *string
}

type UpdateExpenseInput struct {
	ExpenseID     string
	Description   *string
	Category      *string
	VendorName    *string
	VendorContact *string
	Amount        *int64
}
```

- [ ] **Step 2: Implement `CreateExpense`**

```go
func (s *expenseService) CreateExpense(
	ctx context.Context,
	input CreateExpenseInput,
) (*models.Expense, error) {
	if input.Amount <= 0 {
		return nil, pkg.BadRequestError("ExpenseAmountMustBePositive", nil)
	}
	if input.VendorName == "" {
		return nil, pkg.BadRequestError("VendorNameRequired", nil)
	}

	nanoID, err := gonanoid.Generate("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", 6)
	if err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CreateExpense", "action": "generating expense code"},
		})
	}
	year, month, _ := time.Now().Date()
	code := fmt.Sprintf("EXP-%02d%02d-%s", year%100, month, nanoID)

	currency := input.Currency
	if currency == "" {
		currency = "GHS"
	}

	outerTx, hasOuterTx := lib.TransactionFromContext(ctx)
	hasOuterTx = hasOuterTx && outerTx != nil
	transaction := outerTx
	if !hasOuterTx {
		transaction = s.appCtx.DB.Begin()
	}
	transCtx := lib.WithTransaction(ctx, transaction)

	rollback := func() {
		if !hasOuterTx {
			transaction.Rollback()
		}
	}

	vendorName := input.VendorName
	expense := &models.Expense{
		Code:                  code,
		ContextType:           input.ContextType,
		PropertyID:            input.PropertyID,
		Category:              input.Category,
		VendorName:            &vendorName,
		VendorContact:         input.VendorContact,
		Description:           input.Description,
		Amount:                input.Amount,
		Currency:              currency,
		CreatedByClientUserID: input.ClientUserID,
	}

	if err := s.repo.Create(transCtx, expense); err != nil {
		rollback()
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CreateExpense", "action": "creating expense"},
		})
	}

	invoice, err := s.invoiceService.CreateExpenseInvoice(transCtx, CreateExpenseInvoiceInput{
		ExpenseID:   expense.ID.String(),
		PropertyID:  input.PropertyID,
		ClientID:    input.ClientID,
		VendorName:  vendorName,
		Description: input.Description,
		Amount:      input.Amount,
		Currency:    currency,
		DueDate:     input.DueDate,
	})
	if err != nil {
		rollback()
		return nil, err
	}

	if input.AlreadyPaid {
		if _, err := s.paymentService.RecordExpensePayment(transCtx, RecordExpensePaymentInput{
			InvoiceID:    invoice.ID.String(),
			Amount:       input.Amount,
			Provider:     input.PaymentProvider,
			Reference:    input.PaymentReference,
			ClientUserID: input.ClientUserID,
		}); err != nil {
			rollback()
			return nil, err
		}
	}

	if !hasOuterTx {
		if err := transaction.Commit().Error; err != nil {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
				Err:      err,
				Metadata: map[string]string{"function": "CreateExpense", "action": "committing"},
			})
		}
	}

	return s.GetExpense(ctx, expense.ID.String())
}
```

- [ ] **Step 3: Implement `UpdateExpense` behind the clean guard**

```go
func (s *expenseService) UpdateExpense(
	ctx context.Context,
	input UpdateExpenseInput,
) (*models.Expense, error) {
	expense, err := s.GetExpense(ctx, input.ExpenseID)
	if err != nil {
		return nil, err
	}

	if !expenses.IsExpenseClean(expenses.ExpenseStatusView(expense)) {
		return nil, pkg.BadRequestError("ExpenseIsSettledAndFrozen", nil)
	}

	if input.Amount != nil {
		return nil, pkg.BadRequestError("VoidAndRecreateToChangeAmount", nil)
	}

	if input.Description != nil {
		expense.Description = *input.Description
	}
	if input.Category != nil {
		expense.Category = *input.Category
	}
	if input.VendorName != nil {
		expense.VendorName = input.VendorName
	}
	if input.VendorContact != nil {
		expense.VendorContact = input.VendorContact
	}

	if err := s.repo.Update(ctx, expense); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "UpdateExpense", "action": "saving"},
		})
	}
	return s.GetExpense(ctx, input.ExpenseID)
}
```

The amount is deliberately not editable. Changing it would have to rewrite an issued invoice's total and its posted journal entry; voiding and recreating is the honest correction, and it is one click either way.

- [ ] **Step 4: Replace `DeleteExpense` with `VoidExpense`**

```go
func (s *expenseService) VoidExpense(
	ctx context.Context,
	expenseID, reason string,
	voidedBy *string,
) error {
	expense, err := s.GetExpense(ctx, expenseID)
	if err != nil {
		return err
	}
	if !expenses.IsExpenseClean(expenses.ExpenseStatusView(expense)) {
		return pkg.BadRequestError("ExpenseIsSettledAndFrozen", nil)
	}

	outerTx, hasOuterTx := lib.TransactionFromContext(ctx)
	hasOuterTx = hasOuterTx && outerTx != nil
	transaction := outerTx
	if !hasOuterTx {
		transaction = s.appCtx.DB.Begin()
	}
	transCtx := lib.WithTransaction(ctx, transaction)

	for i := range expense.Invoices {
		if expense.Invoices[i].Status == "VOID" {
			continue
		}
		if _, err := s.invoiceService.VoidInvoice(transCtx, VoidInvoiceInput{
			InvoiceID:            expense.Invoices[i].ID.String(),
			VoidedReason:         &reason,
			VoidedByClientUserID: voidedBy,
		}); err != nil {
			if !hasOuterTx {
				transaction.Rollback()
			}
			return err
		}
	}

	now := time.Now()
	expense.VoidedAt = &now
	expense.VoidedReason = &reason
	if err := s.repo.Update(transCtx, expense); err != nil {
		if !hasOuterTx {
			transaction.Rollback()
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "VoidExpense", "action": "saving"},
		})
	}

	if !hasOuterTx {
		return transaction.Commit().Error
	}
	return nil
}
```

`VoidInvoiceInput` is `{InvoiceID string; VoidedReason *string; VoidedByClientUserID *string}` (`internal/services/invoice.go:642`) — note the pointers.

- [ ] **Step 5: Update the interface and the DI wiring**

Replace `AddExpense` with `CreateExpense` and `DeleteExpense` with `VoidExpense` in the `ExpenseService` interface, add `UpdateExpense`, and update wherever `NewExpenseService` is constructed (grep for it) to pass the invoice and payment services instead of the accounting service. Watch for a construction-order cycle: build `ExpenseService` after `InvoiceService` and `PaymentService`.

- [ ] **Step 6: Verify**

```bash
cd services/main && make lint-fix && go build ./... && go test ./...
```
Leave changes unstaged.

---

### Task 9: `MaintenanceRequestFinancialService`

**Files:**
- Create: `services/main/internal/repository/maintenance-request-financial.go`
- Create: `services/main/internal/services/maintenance-request-financial.go`
- Create: `services/main/internal/transformations/maintenance-request-financial.go`

**Interfaces:**
- Consumes: `ExpenseService.CreateExpense` / `VoidExpense` (Task 8), `financials.ChargeService.CreateAdHoc` / `VoidInstance`, `expenses.*` (Task 2), `financials.CategoryMaintenanceCharge` (Task 1).
- Produces, used by Task 10:
  - `CreateFinancial(ctx, CreateFinancialInput) (*models.MaintenanceRequestFinancial, error)`
  - `ListFinancials(ctx, mrID string, q lib.FilterQuery) ([]models.MaintenanceRequestFinancial, error)`
  - `CountFinancials(ctx, mrID string, q lib.FilterQuery) (int64, error)`
  - `UpdateFinancial(ctx, UpdateFinancialInput) (*models.MaintenanceRequestFinancial, error)`
  - `VoidFinancial(ctx, id, reason string) error`

- [ ] **Step 1: Write the repository**

Create `services/main/internal/repository/maintenance-request-financial.go`:

```go
package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type ListMaintenanceRequestFinancialsFilter struct {
	MaintenanceRequestID *string
	SettlementType       *string
}

type GetMaintenanceRequestFinancialQuery struct {
	ID       string
	Populate *[]string
}

type MaintenanceRequestFinancialRepository interface {
	Create(ctx context.Context, financial *models.MaintenanceRequestFinancial) error
	GetOne(
		ctx context.Context,
		query GetMaintenanceRequestFinancialQuery,
	) (*models.MaintenanceRequestFinancial, error)
	List(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListMaintenanceRequestFinancialsFilter,
	) (*[]models.MaintenanceRequestFinancial, error)
	Count(
		ctx context.Context,
		filterQuery lib.FilterQuery,
		filters ListMaintenanceRequestFinancialsFilter,
	) (int64, error)
	Update(ctx context.Context, financial *models.MaintenanceRequestFinancial) error
	Delete(ctx context.Context, id string) error
}

type maintenanceRequestFinancialRepository struct {
	DB *gorm.DB
}

func NewMaintenanceRequestFinancialRepository(db *gorm.DB) MaintenanceRequestFinancialRepository {
	return &maintenanceRequestFinancialRepository{DB: db}
}

func mrfRequestScope(requestID *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if requestID == nil {
			return db
		}
		return db.Where("maintenance_request_financials.maintenance_request_id = ?", *requestID)
	}
}

func mrfSettlementTypeScope(settlementType *string) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		if settlementType == nil {
			return db
		}
		return db.Where("maintenance_request_financials.settlement_type = ?", *settlementType)
	}
}

func (r *maintenanceRequestFinancialRepository) Create(
	ctx context.Context,
	financial *models.MaintenanceRequestFinancial,
) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Create(financial).Error
}

func (r *maintenanceRequestFinancialRepository) GetOne(
	ctx context.Context,
	query GetMaintenanceRequestFinancialQuery,
) (*models.MaintenanceRequestFinancial, error) {
	var financial models.MaintenanceRequestFinancial
	db := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Where("maintenance_request_financials.id = ?", query.ID)

	if query.Populate != nil {
		for _, field := range *query.Populate {
			db = db.Preload(field)
		}
	}

	if err := db.First(&financial).Error; err != nil {
		return nil, err
	}
	return &financial, nil
}

func (r *maintenanceRequestFinancialRepository) List(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListMaintenanceRequestFinancialsFilter,
) (*[]models.MaintenanceRequestFinancial, error) {
	var financials []models.MaintenanceRequestFinancial
	db := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Scopes(
			DateRangeScope("maintenance_request_financials", filterQuery.DateRange),
			SearchScope("maintenance_request_financials", filterQuery.Search),
			mrfRequestScope(filters.MaintenanceRequestID),
			mrfSettlementTypeScope(filters.SettlementType),
			PaginationScope(filterQuery.Page, filterQuery.PageSize),
			OrderScope("maintenance_request_financials", filterQuery.OrderBy, filterQuery.Order),
		)

	if filterQuery.Populate != nil {
		for _, field := range *filterQuery.Populate {
			db = db.Preload(field)
		}
	}

	if err := db.Find(&financials).Error; err != nil {
		return nil, err
	}
	return &financials, nil
}

func (r *maintenanceRequestFinancialRepository) Count(
	ctx context.Context,
	filterQuery lib.FilterQuery,
	filters ListMaintenanceRequestFinancialsFilter,
) (int64, error) {
	var count int64
	err := lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Model(&models.MaintenanceRequestFinancial{}).
		Scopes(
			DateRangeScope("maintenance_request_financials", filterQuery.DateRange),
			SearchScope("maintenance_request_financials", filterQuery.Search),
			mrfRequestScope(filters.MaintenanceRequestID),
			mrfSettlementTypeScope(filters.SettlementType),
		).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (r *maintenanceRequestFinancialRepository) Update(
	ctx context.Context,
	financial *models.MaintenanceRequestFinancial,
) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).Save(financial).Error
}

func (r *maintenanceRequestFinancialRepository) Delete(ctx context.Context, id string) error {
	return lib.ResolveDB(ctx, r.DB).WithContext(ctx).
		Where("id = ?", id).
		Delete(&models.MaintenanceRequestFinancial{}).Error
}
```

Confirm `DateRangeScope` / `SearchScope` / `PaginationScope` / `OrderScope` take exactly these arguments by reading `internal/repository/expense.go`, and match them.

- [ ] **Step 2: Write the service input types**

```go
type CreateFinancialInput struct {
	MaintenanceRequestID string
	Description          string
	Amount               int64
	Currency             string
	SettlementType       string
	ClientUserID         string

	// TENANT_CHARGE
	ChargeCategory string // MAINTENANCE_CHARGE | DAMAGE_CHARGE | UTILITY | OTHER
	ChargeDueDate  *time.Time

	// VENDOR_EXPENSE
	ExpenseCategory  string
	VendorName       string
	VendorContact    *string
	DueDate          *time.Time
	AlreadyPaid      bool
	PaymentProvider  *string
	PaymentReference *string
}

type UpdateFinancialInput struct {
	FinancialID       string
	Description       *string
	NewSettlementType *string
	ClientUserID      string

	ChargeCategory  string
	ExpenseCategory string
	VendorName      string
	VendorContact   *string
}
```

- [ ] **Step 3: Implement `CreateFinancial`**

```go
func (s *mrFinancialService) CreateFinancial(
	ctx context.Context,
	input CreateFinancialInput,
) (*models.MaintenanceRequestFinancial, error) {
	if input.Amount <= 0 {
		return nil, pkg.BadRequestError("FinancialAmountMustBePositive", nil)
	}

	request, err := s.mrRepo.GetOneWithPopulate(ctx, repository.GetMaintenanceRequestQuery{
		ID: input.MaintenanceRequestID,
	})
	if err != nil {
		return nil, pkg.NotFoundError("MaintenanceRequestNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	currency := input.Currency
	if currency == "" {
		currency = "GHS"
	}

	outerTx, hasOuterTx := lib.TransactionFromContext(ctx)
	hasOuterTx = hasOuterTx && outerTx != nil
	transaction := outerTx
	if !hasOuterTx {
		transaction = s.appCtx.DB.Begin()
	}
	transCtx := lib.WithTransaction(ctx, transaction)
	rollback := func() {
		if !hasOuterTx {
			transaction.Rollback()
		}
	}

	financial := &models.MaintenanceRequestFinancial{
		MaintenanceRequestID:  request.ID.String(),
		PropertyID:            request.PropertyID,
		Description:           input.Description,
		Amount:                input.Amount,
		Currency:              currency,
		SettlementType:        input.SettlementType,
		CreatedByClientUserID: input.ClientUserID,
	}

	switch input.SettlementType {
	case expenses.SettlementRecordOnly:

	case expenses.SettlementTenantCharge:
		charge, err := s.createTenantCharge(transCtx, request, input, currency)
		if err != nil {
			rollback()
			return nil, err
		}
		id := charge.ID.String()
		financial.ChargeInstanceID = &id

	case expenses.SettlementVendorExpense:
		expense, err := s.expenseService.CreateExpense(transCtx, CreateExpenseInput{
			PropertyID:       request.PropertyID,
			ContextType:      "MAINTENANCE",
			Category:         input.ExpenseCategory,
			VendorName:       input.VendorName,
			VendorContact:    input.VendorContact,
			Description:      input.Description,
			Amount:           input.Amount,
			Currency:         currency,
			DueDate:          input.DueDate,
			ClientUserID:     input.ClientUserID,
			AlreadyPaid:      input.AlreadyPaid,
			PaymentProvider:  input.PaymentProvider,
			PaymentReference: input.PaymentReference,
		})
		if err != nil {
			rollback()
			return nil, err
		}
		id := expense.ID.String()
		financial.ExpenseID = &id

	default:
		rollback()
		return nil, pkg.BadRequestError("UnknownSettlementType", nil)
	}

	if err := s.repo.Create(transCtx, financial); err != nil {
		rollback()
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CreateFinancial", "action": "creating line"},
		})
	}

	if !hasOuterTx {
		if err := transaction.Commit().Error; err != nil {
			return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
		}
	}

	return s.getPopulated(ctx, financial.ID.String())
}

// createTenantCharge refuses anything the request cannot support. A request
// with no lease has no tenant to charge, and that is settled here rather than
// resolved from the affected units: charging the tenant in a unit the request
// merely touches is not the same as charging the tenant who holds the lease
// the request was raised under.
func (s *mrFinancialService) createTenantCharge(
	ctx context.Context,
	request *models.MaintenanceRequest,
	input CreateFinancialInput,
	currency string,
) (*models.ChargeInstance, error) {
	if request.LeaseID == nil {
		return nil, pkg.BadRequestError("MaintenanceRequestHasNoLease", nil)
	}

	lease, err := s.leaseRepo.GetOneWithPopulate(ctx, repository.GetLeaseQuery{ID: *request.LeaseID})
	if err != nil {
		return nil, pkg.NotFoundError("LeaseNotFound", &pkg.RentLoopErrorParams{Err: err})
	}
	if lease.FinancialAccountID == nil {
		return nil, pkg.BadRequestError("LeaseHasNoFinancialAccount", nil)
	}

	dueDate := time.Now()
	if input.ChargeDueDate != nil {
		dueDate = *input.ChargeDueDate
	}

	category := input.ChargeCategory
	if category == "" {
		category = financials.CategoryMaintenanceCharge
	}

	return s.charges.CreateAdHoc(ctx, financials.CreateAdHocChargeInput{
		FinancialAccountID: *lease.FinancialAccountID,
		LeaseID:            request.LeaseID,
		Name:               input.Description,
		Category:           category,
		Amount:             input.Amount,
		Currency:           currency,
		DueDate:            dueDate,
	})
}
```

`CreateAdHoc` applies its own `assertOpen`, so a closed account refuses the write without a second guard here.

Both repository getters are named `GetOneWithPopulate`, not `GetOne`. Both read the **base connection**, not the transaction (see the note at `internal/repository/lease.go:44`). That is safe here — the request and the lease both pre-exist — but do not use them to re-read anything this transaction just wrote.

- [ ] **Step 4: Implement `UpdateFinancial` and `VoidFinancial`**

Both begin by loading the line with `ChargeInstance` and `Expense` (plus `Expense.Invoices`) preloaded, projecting it with a `financialView` helper, and refusing when `expenses.IsFinancialEditable` is false with `pkg.BadRequestError("FinancialIsSettledAndFrozen", nil)`.

First extract the settlement switch out of `CreateFinancial` so creation and conversion share one implementation rather than two that drift:

```go
// buildLink writes whichever settlement the type calls for onto the line. It
// is the single place a link is created; CreateFinancial and convert both go
// through it.
func (s *mrFinancialService) buildLink(
	ctx context.Context,
	request *models.MaintenanceRequest,
	input CreateFinancialInput,
	currency string,
	financial *models.MaintenanceRequestFinancial,
) error {
	switch input.SettlementType {
	case expenses.SettlementRecordOnly:
		return nil

	case expenses.SettlementTenantCharge:
		charge, err := s.createTenantCharge(ctx, request, input, currency)
		if err != nil {
			return err
		}
		id := charge.ID.String()
		financial.ChargeInstanceID = &id
		return nil

	case expenses.SettlementVendorExpense:
		expense, err := s.expenseService.CreateExpense(ctx, CreateExpenseInput{
			PropertyID:       request.PropertyID,
			ContextType:      "MAINTENANCE",
			Category:         input.ExpenseCategory,
			VendorName:       input.VendorName,
			VendorContact:    input.VendorContact,
			Description:      input.Description,
			Amount:           input.Amount,
			Currency:         currency,
			DueDate:          input.DueDate,
			ClientUserID:     input.ClientUserID,
			AlreadyPaid:      input.AlreadyPaid,
			PaymentProvider:  input.PaymentProvider,
			PaymentReference: input.PaymentReference,
		})
		if err != nil {
			return err
		}
		id := expense.ID.String()
		financial.ExpenseID = &id
		return nil

	default:
		return pkg.BadRequestError("UnknownSettlementType", nil)
	}
}
```

Replace the inline `switch` in Step 3's `CreateFinancial` with `if err := s.buildLink(transCtx, request, input, currency, financial); err != nil { rollback(); return nil, err }`.

Then conversion:

```go
// convert voids the old link and creates the new one. It is not an update: a
// charge and an expense are obligations to different parties, and pretending
// one can become the other in place would leave the ledger holding a posting
// that no longer describes anything.
func (s *mrFinancialService) convert(
	ctx context.Context,
	request *models.MaintenanceRequest,
	financial *models.MaintenanceRequestFinancial,
	input UpdateFinancialInput,
) error {
	newType := *input.NewSettlementType
	if err := s.releaseLink(ctx, financial, "Converted to "+newType, &input.ClientUserID); err != nil {
		return err
	}

	financial.ChargeInstanceID = nil
	financial.ExpenseID = nil
	financial.SettlementType = newType

	return s.buildLink(ctx, request, CreateFinancialInput{
		MaintenanceRequestID: financial.MaintenanceRequestID,
		Description:          financial.Description,
		Amount:               financial.Amount,
		Currency:             financial.Currency,
		SettlementType:       newType,
		ClientUserID:         input.ClientUserID,
		ChargeCategory:       input.ChargeCategory,
		ExpenseCategory:      input.ExpenseCategory,
		VendorName:           input.VendorName,
		VendorContact:        input.VendorContact,
	}, financial.Currency, financial)
}

// releaseLink undoes whatever the line currently settles through.
func (s *mrFinancialService) releaseLink(
	ctx context.Context,
	financial *models.MaintenanceRequestFinancial,
	reason string,
	clientUserID *string,
) error {
	switch {
	case financial.ChargeInstanceID != nil:
		return s.charges.VoidInstance(ctx, financials.VoidChargeInput{
			ChargeInstanceID: *financial.ChargeInstanceID,
			Reason:           reason,
		})
	case financial.ExpenseID != nil:
		return s.expenseService.VoidExpense(ctx, *financial.ExpenseID, reason, clientUserID)
	default:
		return nil
	}
}
```

`UpdateFinancial` runs `convert` only when `input.NewSettlementType` is non-nil and differs from the current type; a description-only edit skips it entirely. `VoidFinancial` calls `releaseLink` with the caller's reason, then `s.repo.Delete`. Both wrap their work in the same `lib.TransactionFromContext` / `Begin` / `WithTransaction` pattern as `CreateFinancial`.

- [ ] **Step 5: Write the transformation**

Create `services/main/internal/transformations/maintenance-request-financial.go`:

```go
package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/services/expenses"
)

type OutputMaintenanceRequestFinancial struct {
	ID                    string    `json:"id"`
	MaintenanceRequestID  string    `json:"maintenance_request_id"`
	PropertyID            string    `json:"property_id"`
	Description           string    `json:"description"`
	Amount                int64     `json:"amount"`
	Currency              string    `json:"currency"`
	SettlementType        string    `json:"settlement_type"`
	Status                string    `json:"status"`
	IsEditable            bool      `json:"is_editable"`
	ChargeInstanceID      *string   `json:"charge_instance_id,omitempty"`
	ExpenseID             *string   `json:"expense_id,omitempty"`
	CreatedByClientUserID string    `json:"created_by_client_user_id"`
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

// financialView projects the line and whichever link it carries onto the pure
// derivation input. ChargeInstance and Expense (with Expense.Invoices) must be
// preloaded, or a settled line reads as outstanding.
func financialView(f *models.MaintenanceRequestFinancial) expenses.FinancialView {
	view := expenses.FinancialView{
		SettlementType: f.SettlementType,
		Amount:         f.Amount,
	}

	if f.ChargeInstance != nil {
		view.Charge = &expenses.ChargeLinkView{
			InvoicedAmount: f.ChargeInstance.InvoicedAmount,
			SettledAmount:  f.ChargeInstance.SettledAmount,
			VoidedAt:       f.ChargeInstance.VoidedAt,
		}
	}

	if f.Expense != nil {
		expenseView := expenses.ExpenseStatusView(f.Expense)
		view.Expense = &expenseView
	}

	return view
}

func DBMaintenanceRequestFinancialToRest(f *models.MaintenanceRequestFinancial) any {
	if f == nil {
		return nil
	}

	view := financialView(f)

	var expense any
	if f.Expense != nil {
		expense = DBExpenseToRest(f.Expense)
	}

	return map[string]any{
		"id":                        f.ID.String(),
		"maintenance_request_id":    f.MaintenanceRequestID,
		"property_id":               f.PropertyID,
		"description":               f.Description,
		"amount":                    f.Amount,
		"currency":                  f.Currency,
		"settlement_type":           f.SettlementType,
		"status":                    expenses.DeriveFinancialStatus(view),
		"is_editable":               expenses.IsFinancialEditable(view),
		"charge_instance_id":        f.ChargeInstanceID,
		"expense_id":                f.ExpenseID,
		"expense":                   expense,
		"created_by_client_user_id": f.CreatedByClientUserID,
		"created_at":                f.CreatedAt,
		"updated_at":                f.UpdatedAt,
	}
}
```

Every read path must preload `ChargeInstance`, `Expense` and `Expense.Invoices`. A `getPopulated` helper on the service that passes exactly those three to `repo.GetOne` is the way to keep that from being forgotten at one call site.

- [ ] **Step 6: Verify**

```bash
cd services/main && make lint-fix && go build ./... && go test ./...
```
Leave changes unstaged.

---

### Task 10: Handlers, routes and Swagger

> **Decided during execution:** `GET …/maintenance-requests/{id}/expenses`
> is removed — `/financials` returns every costed line with its nested expense,
> so it is a strict superset, and two endpoints answering "what did this
> request cost" is the dual-source-of-truth problem this redesign exists to
> remove. Its last consumer is **`apps/pm_mobile`**'s Expenses tab (the web
> caller goes with Task 14), so the route is deleted in **Task 18**, once
> mobile is off it. A pre-existing 100x display bug in that tab (pesewas
> rendered as major units) was fixed in passing.

**Files:**
- Create: `services/main/internal/handlers/maintenance-request-financial.go`
- Modify: `services/main/internal/handlers/expense.go`
- Modify: `services/main/internal/router/client-user.go`

**Interfaces:**
- Consumes: Tasks 8 and 9.
- Produces: the HTTP surface Tasks 13–16 call.

- [ ] **Step 1: Write the financial-line request bodies**

```go
type CreateFinancialBody struct {
	Description    string `json:"description"     validate:"required"`
	Amount         int64  `json:"amount"          validate:"required,gt=0"`
	Currency       string `json:"currency"        validate:"omitempty"`
	SettlementType string `json:"settlement_type" validate:"required,oneof=RECORD_ONLY TENANT_CHARGE VENDOR_EXPENSE"`

	ChargeCategory string  `json:"charge_category"  validate:"omitempty,oneof=MAINTENANCE_CHARGE DAMAGE_CHARGE UTILITY OTHER"`
	ChargeDueDate  *string `json:"charge_due_date"  validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`

	ExpenseCategory  string  `json:"expense_category"   validate:"omitempty,oneof=REPAIRS UTILITIES INSURANCE LANDSCAPING SECURITY MANAGEMENT OTHER"`
	VendorName       string  `json:"vendor_name"        validate:"omitempty"`
	VendorContact    *string `json:"vendor_contact"     validate:"omitempty"`
	DueDate          *string `json:"due_date"           validate:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	AlreadyPaid      bool    `json:"already_paid"`
	PaymentProvider  *string `json:"payment_provider"   validate:"omitempty"`
	PaymentReference *string `json:"payment_reference"  validate:"omitempty"`
}

type UpdateFinancialBody struct {
	Description       *string `json:"description,omitempty"`
	NewSettlementType *string `json:"settlement_type,omitempty" validate:"omitempty,oneof=RECORD_ONLY TENANT_CHARGE VENDOR_EXPENSE"`
	ChargeCategory    string  `json:"charge_category,omitempty"  validate:"omitempty,oneof=MAINTENANCE_CHARGE DAMAGE_CHARGE UTILITY OTHER"`
	ExpenseCategory   string  `json:"expense_category,omitempty" validate:"omitempty,oneof=REPAIRS UTILITIES INSURANCE LANDSCAPING SECURITY MANAGEMENT OTHER"`
	VendorName        string  `json:"vendor_name,omitempty"`
	VendorContact     *string `json:"vendor_contact,omitempty"`
}

type VoidFinancialBody struct {
	Reason string `json:"reason" validate:"required"`
}
```

The conditional requirements — `vendor_name` when the type is `VENDOR_EXPENSE` — are enforced in the service, not by `validate` tags, because a tag cannot express "required only when this other field has that value". The service already returns `VendorNameRequired`.

- [ ] **Step 2: Write the handlers**

Four: `CreateFinancial`, `ListFinancials`, `UpdateFinancial`, `VoidFinancial`. `CreateFinancial` is the template; the other three follow it and `ListPropertyExpenses` in `internal/handlers/expense.go` for the `{data, meta}` list shape.

```go
// CreateFinancial godoc
//
//	@Summary		Log a financial line on a maintenance request
//	@Description	Record what part of a request cost, and who settles it: nobody (RECORD_ONLY), the tenant on the request's lease (TENANT_CHARGE), or an external vendor (VENDOR_EXPENSE) (Admin)
//	@Tags			MaintenanceRequestFinancials
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			client_id				path		string																true	"Client ID"
//	@Param			property_id				path		string																true	"Property ID"
//	@Param			maintenance_request_id	path		string																true	"Maintenance Request ID"
//	@Param			body					body		CreateFinancialBody													true	"Financial line details"
//	@Success		201						{object}	object{data=transformations.OutputMaintenanceRequestFinancial}		"Created financial line"
//	@Failure		400						{object}	lib.HTTPError														"Request has no lease, or vendor name missing"
//	@Failure		401						{object}	string																"Invalid or absent authentication token"
//	@Failure		422						{object}	lib.HTTPError														"Validation error"
//	@Failure		500						{object}	string																"An unexpected error occurred"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/maintenance-requests/{maintenance_request_id}/financials [post]
func (h *MaintenanceRequestFinancialHandler) CreateFinancial(w http.ResponseWriter, r *http.Request) {
	currentUser, ok := lib.ClientUserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body CreateFinancialBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	financial, err := h.service.CreateFinancial(r.Context(), services.CreateFinancialInput{
		MaintenanceRequestID: chi.URLParam(r, "maintenance_request_id"),
		Description:          body.Description,
		Amount:               body.Amount,
		Currency:             body.Currency,
		SettlementType:       body.SettlementType,
		ClientUserID:         currentUser.ID,
		ChargeCategory:       body.ChargeCategory,
		ChargeDueDate:        parseOptionalTime(body.ChargeDueDate),
		ExpenseCategory:      body.ExpenseCategory,
		VendorName:           body.VendorName,
		VendorContact:        body.VendorContact,
		DueDate:              parseOptionalTime(body.DueDate),
		AlreadyPaid:          body.AlreadyPaid,
		PaymentProvider:      body.PaymentProvider,
		PaymentReference:     body.PaymentReference,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBMaintenanceRequestFinancialToRest(financial),
	})
}
```

`parseOptionalTime` turns a `*string` in RFC3339 into a `*time.Time`, returning nil for nil or unparseable input — the validator has already rejected a malformed value, so it cannot fail silently on real traffic. Check `internal/lib` for an existing helper before writing one.

- [ ] **Step 3: Rework the expense handlers**

- `AddExpenseBody` → `CreateExpenseBody`: `category` (`oneof=REPAIRS UTILITIES INSURANCE LANDSCAPING SECURITY MANAGEMENT OTHER`, required), `vendor_name` (required), `vendor_contact`, `description`, `amount`, `currency`, `due_date`, `already_paid`, `payment_provider`, `payment_reference`. There is **no** `context_type` field — the handler always passes `GENERAL`.
- Add `UpdateExpense` and `VoidExpense` handlers; delete `DeleteExpense`.
- `ListExpensesQuery` gains `category` and `status` filters.

- [ ] **Step 4: Wire the routes**

In `services/main/internal/router/client-user.go`, inside the maintenance-request block that currently holds `r.Route("/expenses", …)`:

```go
							r.Route("/financials", func(r chi.Router) {
								r.Get("/", handlers.MaintenanceRequestFinancialHandler.ListFinancials)
								r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
									Post("/", handlers.MaintenanceRequestFinancialHandler.CreateFinancial)
								r.Route("/{financial_id}", func(r chi.Router) {
									r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
										Patch("/", handlers.MaintenanceRequestFinancialHandler.UpdateFinancial)
									r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
										Patch("/void", handlers.MaintenanceRequestFinancialHandler.VoidFinancial)
								})
							})
```

In the property-scoped expenses block, replace the `Delete` line with:

```go
								r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
									Patch("/", handlers.ExpenseHandler.UpdateExpense)
								r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
									Patch("/void", handlers.ExpenseHandler.VoidExpense)
```

Register the new handler wherever the others are constructed.

- [ ] **Step 5: Swagger on every handler**

Each new or changed handler gets the full godoc block — `@Summary`, `@Description`, `@Tags`, `@Accept`, `@Produce`, `@Security BearerAuth`, every `@Param`, `@Success` referencing the transformation output type, `@Failure` for 401/404/422/500, and `@Router`. Copy the formatting from `AddExpense` in `internal/handlers/expense.go`.

- [ ] **Step 6: Verify**

```bash
cd services/main
make lint-fix
go build ./...
make generate-docs
go test ./...
```
Expected: docs regenerate with the new paths present. Confirm with `grep -c 'financials' docs/swagger.json`. Leave changes unstaged.

---

### Task 11: Tenant route for a request's own charges

**Files:**
- Modify: `services/main/internal/services/maintenance-request-financial.go`
- Modify: `services/main/internal/handlers/maintenance-request-financial.go`
- Modify: `services/main/internal/router/tenant-account.go`

**Interfaces:**
- Consumes: Task 9.
- Produces: `GET /v1/tenant/maintenance-requests/{mr_id}/financials`, consumed by Task 17.

- [ ] **Step 1: Add the tenant-scoped list**

```go
// TenantListFinancials returns only what the caller is being charged. Vendor
// expenses and record-only lines are filtered in the query rather than in the
// transformation: a tenant must not be able to learn what the landlord paid
// the plumber, and a filter that lives in the serialiser is one refactor away
// from being bypassed.
func (s *mrFinancialService) TenantListFinancials(
	ctx context.Context,
	maintenanceRequestID, tenantID string,
) ([]models.MaintenanceRequestFinancial, error)
```

It joins `charge_instances` → `financial_accounts` and requires `financial_accounts.tenant_id = ?`, alongside `settlement_type = 'TENANT_CHARGE'`. A request that is not the tenant's own returns an empty list, not a 403 — the tenant already cannot see the request itself.

- [ ] **Step 2: Add the handler and route**

Handler reads the tenant from `lib.TenantFromContext` (match the helper the other tenant handlers use). Route goes beside the existing tenant maintenance-request routes:

```go
	r.Get("/{mr_id}/financials", handlers.MaintenanceRequestFinancialHandler.TenantListFinancials)
```

- [ ] **Step 3: Verify**

```bash
cd services/main && make lint-fix && go build ./... && make generate-docs && go test ./...
```
Leave changes unstaged.

---

### Task 12: End-to-end scenarios

> **Found during execution — three real bugs the unit tests could not reach:**
>
> 1. **No Maintenance Expense account existed in Fincore**, so
>    `FINCORE_ACCOUNT_MAINTENANCE_EXPENSE` was unset and every expense journal
>    entry 422'd. The old `postExpenseJournalEntry` debited the same empty
>    account but only *logged* the failure, so **no expense had ever reached
>    the ledger** — 0 of 200 journal entries referenced an `EXP-` code. The
>    account now exists (code 5002) and the var is set locally and in Fly.
> 2. **GORM resurrected cleared associations.** Conversion nils
>    `ChargeInstanceID`, but reads preload `ChargeInstance`, and a plain
>    `Save()` upserts the association and re-derives the foreign key from it.
>    The CHECK constraint caught it; both repositories now
>    `Omit(clause.Associations)` on update.
> 3. **`uuid_generate_v4()` is unavailable on a restored dump** (Supabase puts
>    uuid-ossp in `extensions`; the DSN sets no search_path). The backfill uses
>    `gen_random_uuid()`; AutoMigrate still needs
>    `ALTER DATABASE … SET search_path TO public, extensions` on any restore.

Seven cases in the repo's existing lettered style. These are what actually prove the DB-backed behaviour, since there is no mocking layer.

**Files:**
- Create: `services/main/scripts/e2e/cases/n1-record-only-line.sh` … `n7-no-lease-no-tenant-charge.sh`
- Modify: `services/main/scripts/e2e/fixtures.sh` (helpers), `run-all.sh` (registration, if it enumerates)

**Interfaces:**
- Consumes: every route from Tasks 10 and 11.
- Produces: nothing later depends on.

- [ ] **Step 1: Add fixtures**

Read `scripts/e2e/fixtures.sh` and `lib.sh` first, then add helpers matching their existing style: `create_mr_financial`, `list_mr_financials`, `financial_field`, `create_general_expense`, `expense_field`, `void_expense`. Reuse `assert_status`, `assert_eq` and `case_begin` / `case_end` exactly as `e1-adhoc-utility.sh` does.

- [ ] **Step 2: Write `n1-record-only-line.sh`**

```bash
#!/usr/bin/env bash
# N1 — a record-only line. The landlord writes down what a job cost without
# claiming anybody owes it, and nothing reaches the ledger.
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1
source ./lib.sh
source ./fixtures.sh

case_begin "N1" "N" "Record-only financial line"

baseline_account n1
approve_application >/dev/null
assert_status 200 "approved"

before="$(account_field "$ACCOUNT_ID" total_charged)"
mr_id="$(create_maintenance_request "Leaking sink")"

resp="$(create_mr_financial "$mr_id" "Callout" 5000 RECORD_ONLY)"
assert_status 201 "record-only line created"
assert_eq "$(jq -r '.data.settlement_type' <<<"$resp")" "RECORD_ONLY" "settlement type kept"
assert_eq "$(jq -r '.data.status' <<<"$resp")" "RECORDED" "status is RECORDED"
assert_eq "$(jq -r '.data.charge_instance_id' <<<"$resp")" "null" "no charge created"
assert_eq "$(jq -r '.data.expense_id' <<<"$resp")" "null" "no expense created"
assert_eq "$(account_field "$ACCOUNT_ID" total_charged)" "$before" \
	"the tenant owes exactly what they owed before"
assert_invariants "$ACCOUNT_ID" "after record-only line"

case_end
```

- [ ] **Step 3: Write the remaining six**

| Case | Asserts |
|---|---|
| `n2-tenant-charge-line.sh` | A `TENANT_CHARGE` line creates an ad-hoc charge on the lease's account; `total_charged` rises by the amount; composing an invoice carries `MAINTENANCE_CHARGE` on the line; paying it settles both charge and line; `assert_invariants` holds throughout. |
| `n3-vendor-expense-line.sh` | A `VENDOR_EXPENSE` line creates an expense whose status is `OUTSTANDING` with an `ISSUED` invoice; the tenant's `total_charged` does not move; recording payment flips the expense to `SETTLED`. |
| `n4-convert-while-clean.sh` | Converting `RECORD_ONLY` → `TENANT_CHARGE` succeeds and creates the charge; converting again after the charge is invoiced returns 400 and leaves the original link intact. |
| `n5-void-expense.sh` | Voiding a `VENDOR_EXPENSE` line voids its invoice and marks the expense `VOIDED`; voiding a paid one returns 400. |
| `n6-general-expense.sh` | A `GENERAL` expense created with `already_paid: true` lands `SETTLED` in one call, with one invoice `PAID`; created without the flag it lands `OUTSTANDING`. |
| `n7-no-lease-no-tenant-charge.sh` | A request created without a lease refuses `TENANT_CHARGE` with 400 `MaintenanceRequestHasNoLease`, and still accepts `RECORD_ONLY` and `VENDOR_EXPENSE`. |

- [ ] **Step 4: Run the whole suite**

```bash
cd services/main/scripts/e2e && ./run-all.sh
```
Expected: 63 scenarios pass — the existing 56 plus these 7. A failure in an existing case means a regression, not a flaky test; fix the cause rather than the assertion. Leave changes unstaged.

---

### Task 13: PM portal — types and API layer

Three of the current hooks call routes that no longer exist. This task makes the client match the server before any component is touched.

**Files:**
- Modify: `apps/property-manager/types/expense.d.ts`
- Create: `apps/property-manager/types/maintenance-request-financial.d.ts`
- Modify: `apps/property-manager/app/api/expenses/index.ts`
- Create: `apps/property-manager/app/api/maintenance-request-financials/index.ts`
- Modify: `apps/property-manager/app/lib/constants.ts`

**Interfaces:**
- Consumes: Tasks 10 and 11.
- Produces, used by Tasks 14–16: `useGetPropertyExpenses`, `useGetExpense`, `useCreateExpense`, `useUpdateExpense`, `useVoidExpense`, `useGetExpensesAcrossProperties`, `useGetMRFinancials`, `useCreateMRFinancial`, `useUpdateMRFinancial`, `useVoidMRFinancial`.

- [ ] **Step 1: Update the types**

Replace `apps/property-manager/types/expense.d.ts`:

```ts
type ExpenseStatus =
	| 'OUTSTANDING'
	| 'PARTIALLY_SETTLED'
	| 'SETTLED'
	| 'VOIDED'

type ExpenseCategory =
	| 'REPAIRS'
	| 'UTILITIES'
	| 'INSURANCE'
	| 'LANDSCAPING'
	| 'SECURITY'
	| 'MANAGEMENT'
	| 'OTHER'

interface Expense {
	id: string
	code: string
	context_type: 'MAINTENANCE' | 'GENERAL'
	property_id: string
	category: ExpenseCategory
	vendor_name: Nullable<string>
	vendor_contact: Nullable<string>
	description: string
	amount: number // pesewas
	currency: string
	status: ExpenseStatus
	is_editable: boolean
	invoice_id: Nullable<string>
	invoices?: Invoice[]
	voided_at: Nullable<string>
	voided_reason: Nullable<string>
	created_by_client_user_id: string
	created_at: string
	updated_at: string
}

interface FetchExpenseFilter {
	context_type?: 'MAINTENANCE' | 'GENERAL'
	category?: ExpenseCategory
	status?: ExpenseStatus
}
```

Create `apps/property-manager/types/maintenance-request-financial.d.ts`:

```ts
type SettlementType = 'RECORD_ONLY' | 'TENANT_CHARGE' | 'VENDOR_EXPENSE'

type FinancialStatus =
	| 'RECORDED'
	| 'OUTSTANDING'
	| 'INVOICED'
	| 'PARTIALLY_SETTLED'
	| 'SETTLED'
	| 'VOIDED'

type TenantChargeCategory =
	| 'MAINTENANCE_CHARGE'
	| 'DAMAGE_CHARGE'
	| 'UTILITY'
	| 'OTHER'

interface MaintenanceRequestFinancial {
	id: string
	maintenance_request_id: string
	property_id: string
	description: string
	amount: number // pesewas
	currency: string
	settlement_type: SettlementType
	status: FinancialStatus
	is_editable: boolean
	charge_instance_id: Nullable<string>
	expense_id: Nullable<string>
	expense: Nullable<Expense>
	created_by_client_user_id: string
	created_at: string
	updated_at: string
}

interface FetchMRFinancialFilter {
	settlement_type?: SettlementType
}
```

- [ ] **Step 2: Rewrite the expenses API**

In `apps/property-manager/app/api/expenses/index.ts`:

**Delete** `getLeaseExpenses` / `useGetLeaseExpenses`, `generateExpenseInvoice` / `useGenerateExpenseInvoice`, and `deleteExpense` / `useDeleteExpense`. All three call routes the backend does not have.

**Keep** `getPropertyExpenses` / `useGetPropertyExpenses` and `getMRExpenses` / `useGetMRExpenses` as they are — both routes survive.

**Replace** `CreateExpenseInput` and add the rest:

```ts
export interface CreateExpenseInput {
	client_id: string
	property_id: string
	category: ExpenseCategory
	vendor_name: string
	vendor_contact?: string
	description: string
	amount: number
	currency?: string
	due_date?: string
	already_paid: boolean
	payment_provider?: string
	payment_reference?: string
}

export interface UpdateExpenseInput {
	client_id: string
	property_id: string
	expense_id: string
	description?: string
	category?: ExpenseCategory
	vendor_name?: string
	vendor_contact?: string
}

export interface VoidExpenseInput {
	client_id: string
	property_id: string
	expense_id: string
	reason: string
}
```

`createExpense` POSTs to `/v1/admin/clients/${client_id}/properties/${property_id}/expenses`; `updateExpense` PATCHes `…/expenses/${expense_id}`; `voidExpense` PATCHes `…/expenses/${expense_id}/void` with `{ reason }`. Each follows the existing `fetchClient` + `error instanceof Response` shape already in the file. Add `useGetExpense(clientId, propertyId, expenseId)` hitting `…/expenses/${expense_id}`.

Callers pass their own query params. Do not put default pagination or filters inside any hook.

- [ ] **Step 3: Write the financials API**

Create `apps/property-manager/app/api/maintenance-request-financials/index.ts` with `useGetMRFinancials(clientId, propertyId, requestId, query)`, `useCreateMRFinancial`, `useUpdateMRFinancial`, `useVoidMRFinancial`, against `…/maintenance-requests/${request_id}/financials`. Mirror the file structure of `app/api/expenses/index.ts` exactly — same error handling, same `getQueryParams` use, same export style.

```ts
export interface CreateMRFinancialInput {
	client_id: string
	property_id: string
	request_id: string
	description: string
	amount: number
	currency?: string
	settlement_type: SettlementType
	charge_category?: TenantChargeCategory
	charge_due_date?: string
	expense_category?: ExpenseCategory
	vendor_name?: string
	vendor_contact?: string
	due_date?: string
	already_paid?: boolean
	payment_provider?: string
	payment_reference?: string
}
```

- [ ] **Step 4: Add query keys**

In `apps/property-manager/app/lib/constants.ts`, add `MR_FINANCIALS: 'mr-financials'` to `QUERY_KEYS` beside `EXPENSES`.

- [ ] **Step 5: Verify**

```bash
cd apps/property-manager && yarn types:check && yarn lint
```
Expected: the type check now fails **inside the components** that used the deleted hooks — that is the point, and Tasks 14–16 fix each. It must not fail inside `app/api/` or `types/`. Leave changes unstaged.

---

### Task 14: PM portal — the Financials tab

**Files:**
- Create: `apps/property-manager/app/modules/properties/property/activities/maintenance-requests/request/financials-tab.tsx`
- Delete: `apps/property-manager/app/modules/properties/property/activities/maintenance-requests/request/expenses-tab.tsx`
- Modify: `apps/property-manager/app/modules/properties/property/activities/maintenance-requests/request/index.tsx`

**Interfaces:**
- Consumes: Task 13's hooks.
- Produces: `<FinancialsTab requestId propertyId leaseId />`.

- [ ] **Step 1: Write the form schema**

The old `payerRowSchema` and the whole `PayerForm` auto-balancing component are deleted, not adapted. A settlement is one target now.

```tsx
const financialSchema = z
	.object({
		description: z.string().min(1, 'Description is required'),
		amount: z.string().min(1, 'Amount is required'),
		settlement_type: z.enum([
			'RECORD_ONLY',
			'TENANT_CHARGE',
			'VENDOR_EXPENSE',
		]),
		charge_category: z
			.enum(['MAINTENANCE_CHARGE', 'DAMAGE_CHARGE', 'UTILITY', 'OTHER'])
			.optional(),
		expense_category: z
			.enum([
				'REPAIRS',
				'UTILITIES',
				'INSURANCE',
				'LANDSCAPING',
				'SECURITY',
				'MANAGEMENT',
				'OTHER',
			])
			.optional(),
		vendor_name: z.string().optional(),
		vendor_contact: z.string().optional(),
		already_paid: z.boolean(),
	})
	.refine(
		(v) => v.settlement_type !== 'VENDOR_EXPENSE' || !!v.vendor_name?.trim(),
		{ path: ['vendor_name'], message: 'Vendor name is required' },
	)
```

- [ ] **Step 2: Gate the tenant option on the lease**

```tsx
{leaseId ? (
	<SelectItem value="TENANT_CHARGE">Tenant in this unit</SelectItem>
) : null}
```

Absent, not disabled. There is nothing the PM can do on this screen to enable it, and a disabled control that never becomes enabled is a worse answer than no control.

- [ ] **Step 3: Render the table with a total**

Columns: description, amount (`formatAmount`), settlement type badge, status badge, actions. A footer row sums `amount` across non-voided lines. Row actions (`Convert`, `Void`) render only when `financial.is_editable` — the server computes that flag precisely so the UI can stop offering an edit the API will refuse.

Status badge colours must use tokens, not literals — e.g. `bg-muted text-muted-foreground` for `RECORDED`, `bg-destructive/10 text-destructive` for `VOIDED`, `bg-primary/10 text-primary` for `SETTLED`.

- [ ] **Step 4: Swap the tab in**

In `index.tsx`: change the import to `FinancialsTab`, `<TabsTrigger value="expenses">Expenses</TabsTrigger>` to `<TabsTrigger value="financials">Financials</TabsTrigger>`, and the matching `TabsContent`:

```tsx
						<TabsContent value="financials" className="mt-4">
							<FinancialsTab
								requestId={request.id}
								propertyId={propertyId}
								leaseId={request.lease_id}
							/>
						</TabsContent>
```

Then delete `expenses-tab.tsx`.

- [ ] **Step 5: Verify in both themes**

```bash
cd apps/property-manager && yarn types:check && yarn lint && yarn dev
```
Open a maintenance request with a lease and one without. Confirm: the tenant option appears only on the first; a `RECORD_ONLY` line shows `RECORDED` and no link; a `VENDOR_EXPENSE` line creates an expense and links to it; the total row sums correctly. Toggle dark mode and confirm every badge and border is still legible. Leave changes unstaged.

---

### Task 15: PM portal — the expense management page

> **Added during execution — the Cube schema.** The plan had the
> owed-to-vendors tile summing the rows on screen, but the page is paginated,
> so that would state a wrong number about money. The tiles come from **Cube**
> (`services/cube/model/cubes/Expenses.js`), not the expenses API, so the
> figure belongs there.
>
> A `LEFT JOIN LATERAL` picks the one live bill per expense — a plain join
> would fan an expense that was invoiced, voided and reissued into several
> rows and double-count it. The `status` dimension mirrors
> `expenses.DeriveExpenseStatus` in Go, including the rule that an
> invoice-less legacy row reads SETTLED; the two must be kept in step, because
> a dashboard disagreeing with the screen it summarises is worse than either
> being wrong alone.
>
> Voided expenses are now excluded from `totalAmount`, `count` and
> `maintenanceAmount`. That is a behaviour change to existing measures, and a
> correction: a withdrawn bill was never spend. Verify with
> `cd services/cube && yarn test && yarn check:schema`, and note the schema
> deploys through its own workflow, not with the API.


**Files:**
- Modify: `apps/property-manager/app/modules/properties/property/expenses/index.tsx`
- Modify: `apps/property-manager/app/modules/properties/property/expenses/controller.tsx`
- Modify: `apps/property-manager/app/modules/properties/property/expenses/components/cards.tsx`
- Create: `apps/property-manager/app/modules/properties/property/expenses/components/create-expense-dialog.tsx`
- Create: `apps/property-manager/app/modules/properties/property/expenses/components/expense-detail-sheet.tsx`

**Interfaces:**
- Consumes: Task 13's hooks.
- Produces: nothing later depends on.

- [ ] **Step 1: Read the three existing files end to end**

They are 369 lines total. Match their structure, their use of `useClient()`, and the table component they already use rather than introducing a new one.

- [ ] **Step 2: Build the create dialog**

Fields: category (select), vendor name (required), vendor contact, description, amount, due date, and an **Already paid** switch. When the switch is on, reveal optional payment provider and reference.

Copy under the switch, verbatim: *"Records the payment at the same time, so this expense lands settled."* Without it, a landlord entering last month's landscaping has no way to know the toggle exists to save them a second step.

- [ ] **Step 3: Add the owed-to-vendors summary**

In `cards.tsx`, add a tile summing `amount` over rows whose `status` is `OUTSTANDING` or `PARTIALLY_SETTLED`. Label it "Owed to vendors". This figure is the reason the payable redesign exists; it should be the most prominent number on the page.

- [ ] **Step 4: Extend the table**

Columns: code, description, vendor, context (`GENERAL`, or the request code when `context_type` is `MAINTENANCE`), category, amount, status. Filters for status and category, both passed explicitly into `useGetPropertyExpenses` by this component — never defaulted inside the hook.

A row with `vendor_name === null` renders `<span className="text-muted-foreground">No vendor recorded</span>`. Those are migrated rows; invoicing is already done for them, so this is informational, not a blocker.

- [ ] **Step 5: Build the detail sheet**

Shows the expense, its linked invoice (code, status, due date) with a link through to the invoice page, and a **Void** action with a required reason. The void button is disabled when `is_editable` is false, with a tooltip reading *"Paid expenses can't be voided."*

- [ ] **Step 6: Verify in both themes**

```bash
cd apps/property-manager && yarn types:check && yarn lint && yarn dev
```
Create a general expense both with and without the already-paid toggle and confirm the status differs. Confirm the summary tile matches the sum of outstanding rows. Check dark mode. Leave changes unstaged.

---

### Task 16: PM portal — remove the lease expenses tab and fix the label maps

**Files:**
- Delete: `apps/property-manager/app/modules/properties/property/occupancy/leases/lease/expenses-tab.tsx`
- Modify: the lease detail page that renders it
- Modify: `apps/property-manager/app/lib/invoice.ts`
- Modify: `apps/property-manager/app/lib/constants.ts`
- Check: `apps/property-manager/app/modules/insights/overview/kpi-row.tsx`, `trends.tsx`

**Interfaces:**
- Consumes: Task 13.
- Produces: a clean `yarn types:check`.

- [ ] **Step 1: Unwire and delete the lease tab**

`grep -rn "LeaseExpensesTab" app` to find the lease detail page importing it. Remove the import, the `TabsTrigger` and the `TabsContent`, then delete the file. Maintenance money a tenant owes now appears as a charge in that lease's financials, which is where it belongs.

- [ ] **Step 2: Add the category labels**

In `app/lib/invoice.ts`, add `MAINTENANCE_CHARGE: 'Maintenance charge'` to the line-item category label map and `EXPENSE: 'Expense'` to the invoice context label map. Grep for any other map keyed on those enums (`grep -rn "DAMAGE_CHARGE" app`) and add the new key to each — a missing key renders a raw `SCREAMING_SNAKE` string to the user.

- [ ] **Step 3: Check the insights module**

`kpi-row.tsx` and `trends.tsx` both define a local `ExpenseRow`. Read both: if they query Cube rather than the expenses API, they are unaffected and need no change. If either reads `context_maintenance_request_id` or a `LEASE` context type, update it to the new shape.

- [ ] **Step 4: Verify**

```bash
cd apps/property-manager && yarn types:check && yarn lint && yarn build
```
Expected: **zero** type errors across the app. This is the gate that proves the frontend and backend agree again. Leave changes unstaged.

---

### Task 17: Tenant app — charges on a request

Separable: the backend and PM portal are complete and shippable without this.

**Files:**
- Create: `apps/go/lib/src/repository/models/maintenance_request_financial_model.dart`
- Modify: `apps/go/lib/src/api/maintenance.dart`
- Create: `apps/go/lib/src/repository/providers/maintenance_request_financials_provider.dart`
- Modify: `apps/go/lib/src/modules/main/maintenance_details/root.dart`

**Interfaces:**
- Consumes: Task 11's tenant route.
- Produces: nothing later depends on.

- [ ] **Step 1: Add the model**

A `freezed`/`json_serializable` model matching the tenant response — `id`, `description`, `amount`, `currency`, `status`, `charge_instance_id`. Follow `maintenance_request_model.dart` exactly for annotations and the `.g.dart` part directive.

- [ ] **Step 2: Add the API call and provider**

`GET /v1/tenant/maintenance-requests/{id}/financials`, wrapped in a Riverpod provider following `maintenance_request_provider.dart`.

- [ ] **Step 3: Render the section**

In `maintenance_details/root.dart`, add a **Charges to you** section below the existing detail. While loading, show a **shimmer skeleton**, not a spinner — every list and detail screen in this app uses skeletons. Add the section's data to the screen's existing pull-to-refresh.

Read the `AsyncValue` with `.valueOrNull`, never a bare `.value` outside a `hasValue` guard — `.value` throws on `AsyncError`.

Render nothing at all when the list is empty. Most requests cost the tenant nothing, and an empty "Charges to you" heading reads as a bill that failed to load.

- [ ] **Step 4: Regenerate and verify**

```bash
cd apps/go
dart run build_runner build --delete-conflicting-outputs
flutter analyze
```

`build_runner` dirties unrelated `.g.dart` files and `project.pbxproj` in this repo. Before handing off, `git status` and revert everything you did not intend to change. Do not launch the app on the simulator — the user runs it themselves. Leave changes unstaged.

---

### Task 18: pm_mobile — a Financials tab, and retiring the expenses endpoint

The PM mobile app is the last caller of `GET …/maintenance-requests/{id}/expenses`. Since that route now returns only the expenses behind a `VENDOR_EXPENSE` line, the tab shows a partial bill while looking complete — a request split across tenant, vendor and record-only lines displays only the vendor's share. Moving it to `/financials` fixes that and lets the route go.

**Files:**
- Create: `apps/pm_mobile/lib/src/repository/models/maintenance_financial_model.dart`
- Delete: `apps/pm_mobile/lib/src/repository/models/maintenance_expense_model.dart`
- Modify: `apps/pm_mobile/lib/src/api/maintenance_request_api.dart`
- Modify: `apps/pm_mobile/lib/src/repository/providers/activity/maintenance_detail_provider.dart:132`
- Modify: `apps/pm_mobile/lib/src/modules/main/activity/maintenance_detail_tabs.dart:543-712`
- Modify: `apps/pm_mobile/lib/src/modules/main/activity/maintenance_detail.dart:145`
- Delete: `ListMRExpenses` in `services/main/internal/handlers/expense.go`
- Modify: `services/main/internal/router/client-user.go`, `services/main/internal/repository/expense.go`

**Interfaces:**
- Consumes: the admin `GET …/maintenance-requests/{id}/financials` route from Task 10.
- Produces: nothing later depends on.

- [ ] **Step 1: Add the model**

`MaintenanceFinancialModel` with `id`, `description`, `amount` (integer pesewas), `currency`, `settlement_type`, `status`, `is_editable`, `created_at`, and a nullable nested `expense`. Follow `maintenance_comment_model.dart` for the `@JsonSerializable(createToJson: false)` + `part` convention.

Do not repeat the mistake the old model carried: `amount` is pesewas and must be rendered through `pesewasToCedis`, never directly.

- [ ] **Step 2: Point the API method at the new sub-path**

In `maintenance_request_api.dart`, rename `getExpenses` to `getFinancials` and change `subPath: 'expenses'` to `subPath: 'financials'`. The `_getRows` helper already handles the shared `{data:{rows,meta}}` shape, so nothing else changes.

- [ ] **Step 3: Rename the provider**

`maintenanceRequestExpenses` → `maintenanceRequestFinancials` in `maintenance_detail_provider.dart`, returning `List<MaintenanceFinancialModel>`. Update the warm-up call in `maintenance_detail.dart:145`. Then regenerate:

```bash
cd apps/pm_mobile && dart run build_runner build --delete-conflicting-outputs
```

- [ ] **Step 4: Rework the tab**

`MaintenanceExpensesTab` → `MaintenanceFinancialsTab`; `_ExpenseList`/`_ExpenseRow` → `_FinancialList`/`_FinancialRow`. Each row gains a settlement-type label and a status chip; the total sums non-voided lines. Keep the existing `_TabSkeleton` loading state and `RLSectionError` retry — both already match the app's conventions. Empty state reads "No financials recorded."

Use `RLTokens` for every colour, as the surrounding rows already do.

- [ ] **Step 5: Delete the backend route**

Remove `ListMRExpenses` from `internal/handlers/expense.go`, its line from `internal/router/client-user.go`, and the now-dead `MaintenanceRequestID` field and `expenseMaintenanceRequestScope` from `internal/repository/expense.go`. Then `make generate-docs`.

- [ ] **Step 6: Verify**

```bash
cd apps/pm_mobile && flutter analyze
cd services/main && make lint-fix && go build ./... && go test ./... && make generate-docs
git status   # revert unrelated .g.dart / pbxproj churn before handing off
```

Do not launch the simulator — the user runs the app themselves.

---

## Execution order and checkpoints

Tasks 1–2 are independent and can run in parallel. Everything from 3 onward is sequential: 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12, then 13 → 14 → 15 → 16, then 17 and 18 (both independent of each other).

Natural review checkpoints: after **Task 4** (the database is reshaped and migrated), after **Task 12** (the backend is complete and proven by 63 e2e scenarios), and after **Task 16** (`yarn types:check` is clean, so client and server agree).
