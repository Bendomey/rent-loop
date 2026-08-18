# Shared Financial Account Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make one financial account span every lease of a tenant's tenancy at a property, scope charges to the lease that produced them, and give accounts a PM-driven closure lifecycle.

**Architecture:** Account identity moves from `tenant_application_id` to `tenant_id + property_id`. `financial_accounts.lease_id` and its `uniqueIndex` are replaced by `leases.financial_account_id`, so many leases can point at one account. `ChargeDefinition` and `ChargeInstance` gain a nullable `lease_id` giving contractual context while ownership stays with the account, so balance and allocation are untouched. Accounts gain `ACTIVE → CLOSURE_ELIGIBLE → CLOSED`, where lease termination only signals eligibility and a property manager closes explicitly.

**Tech Stack:** Go 1.24, chi, GORM + pgx, gormigrate, PostgreSQL. Tests are stdlib `testing` — no assertion library.

**Spec:** `docs/superpowers/specs/2026-08-11-lease-renewal-financial-account-design.md`

## Global Constraints

- **NEVER run `git commit`.** The repository `CLAUDE.md` forbids it absolutely. This plan therefore has **no commit steps** — each task ends at a review checkpoint with changes left unstaged for the user. Do not stage, do not commit, do not create branches.
- Formatting: `make lint-fix` (gofumpt + golines, **120 character limit**). Run it before ending any task that touched Go.
- Swagger: every handler change updates its godoc annotations; `make lint-fix` regenerates `docs/`.
- Money is stored in the **smallest currency unit** (pesewas). `100000` is GHS 1,000.
- Lease status strings are fully qualified: `Lease.Status.Pending`, `Lease.Status.Active`, `Lease.Status.Terminated`, `Lease.Status.Completed`, `Lease.Status.Cancelled`.
- Account status strings: `ACTIVE`, `CLOSURE_ELIGIBLE`, `CLOSED`.
- Errors use `pkg.NotFoundError` / `pkg.BadRequestError` / `pkg.InternalServerError` with `*pkg.RentLoopErrorParams`.
- Repositories always resolve the transaction-aware handle: `lib.ResolveDB(ctx, r.DB)`.
- Run tests with `go test ./internal/...` from `services/main`.

## Deliberately not in this plan

Two rules from the spec have no task here, on purpose:

- **Rule 2, currency is immutable.** No code path in this repository can change
  an account's currency today — `UpdateBillingPolicy` does not touch it and
  nothing else writes it after creation — so a guard added now would be
  unreachable. The rule becomes enforceable at the point a renewal can supply
  new terms, which is spec 2. Add the guard there, on the renewal input.
- **Rule 5, the deposit is never re-charged.** This constrains what a renewal
  may do, and this plan ships no renewal endpoint. Spec 2 owns it.

Both are noted so a reader comparing spec to plan finds an explanation rather
than a gap.

---

### Task 1: Closure eligibility — the pure rule

The single most dangerous rule in this spec. Deposits are released at closure, so an account that becomes eligible while a tenant is still in the unit refunds a deposit to a sitting tenant. It is written first, pure, and tested before anything can call it.

**Files:**
- Create: `internal/services/financials/closure.go`
- Test: `internal/services/financials/closure_test.go`

**Interfaces:**
- Consumes: nothing — pure, no DB, no context.
- Produces: `StatusActive`, `StatusClosureEligible`, `StatusClosed` constants; `type LeaseTerm struct { ID string; Status string }`; `func IsClosureEligible(terms []LeaseTerm) bool`.

- [ ] **Step 1: Write the failing tests**

Create `internal/services/financials/closure_test.go`:

```go
package financials

import "testing"

// Every term in the chain has ended and nothing follows. This is the only
// shape that may be closed.
func TestIsClosureEligibleAllEnded(t *testing.T) {
	terms := []LeaseTerm{
		{ID: "original", Status: "Lease.Status.Completed"},
		{ID: "renewal", Status: "Lease.Status.Terminated"},
	}
	if !IsClosureEligible(terms) {
		t.Error("got not eligible, want eligible — every term has ended")
	}
}

// THE dangerous case. An active lease on the account means the tenant is
// still living there. Closing would release their deposit while they hold
// the keys.
func TestIsClosureEligibleActiveLeaseBlocks(t *testing.T) {
	terms := []LeaseTerm{
		{ID: "original", Status: "Lease.Status.Completed"},
		{ID: "renewal", Status: "Lease.Status.Active"},
	}
	if IsClosureEligible(terms) {
		t.Error("got eligible, want not eligible — a lease is still Active")
	}
}

// A renewal signed but not yet activated is a successor. The spec's second
// condition ("no Pending or Active successor") needs no separate check:
// a successor is itself a lease on this account, so it fails the ended test.
func TestIsClosureEligiblePendingSuccessorBlocks(t *testing.T) {
	terms := []LeaseTerm{
		{ID: "original", Status: "Lease.Status.Completed"},
		{ID: "renewal", Status: "Lease.Status.Pending"},
	}
	if IsClosureEligible(terms) {
		t.Error("got eligible, want not eligible — a Pending successor exists")
	}
}

// A cancelled lease never ran, but it is over. It does not hold the account open.
func TestIsClosureEligibleCancelledCounts(t *testing.T) {
	terms := []LeaseTerm{{ID: "never-started", Status: "Lease.Status.Cancelled"}}
	if !IsClosureEligible(terms) {
		t.Error("got not eligible, want eligible — a cancelled lease is ended")
	}
}

// An account with no leases at all is at application stage. It has never
// been a tenancy, so it cannot have finished being one.
func TestIsClosureEligibleNoLeasesIsNotEligible(t *testing.T) {
	if IsClosureEligible(nil) {
		t.Error("got eligible, want not eligible — an account with no leases is application-stage")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/services/financials/ -run TestIsClosureEligible -v`
Expected: FAIL — `undefined: LeaseTerm`, `undefined: IsClosureEligible`

- [ ] **Step 3: Write the implementation**

Create `internal/services/financials/closure.go`:

```go
package financials

// Financial account statuses.
//
// CLOSURE_ELIGIBLE is not "closed pending paperwork" — it is a live account
// that merely looks finished. It still bills, still accepts payment, and
// reverts to ACTIVE the moment a new lease points at it.
const (
	StatusActive          = "ACTIVE"
	StatusClosureEligible = "CLOSURE_ELIGIBLE"
	StatusClosed          = "CLOSED"
)

// LeaseTerm is the minimal view of a lease that closure reasoning needs. The
// package stays free of the models import, which is what keeps these rules
// testable without a database.
type LeaseTerm struct {
	ID     string
	Status string
}

// isEndedLeaseStatus reports whether a lease is over by any route.
func isEndedLeaseStatus(status string) bool {
	switch status {
	case "Lease.Status.Terminated", "Lease.Status.Completed", "Lease.Status.Cancelled":
		return true
	default:
		return false
	}
}

// IsClosureEligible reports whether every term on an account has ended.
//
// The spec states two conditions — every lease ended, and no Pending or
// Active successor anywhere in the chain — but the second is subsumed by the
// first. A successor lease points at this same account, so an unfinished
// successor is an unfinished term and fails here. Keeping one predicate means
// there is one place to get this wrong.
//
// An empty set is deliberately NOT eligible. An account with no leases has
// never been a tenancy; it is a prepared application.
func IsClosureEligible(terms []LeaseTerm) bool {
	if len(terms) == 0 {
		return false
	}

	for _, term := range terms {
		if !isEndedLeaseStatus(term.Status) {
			return false
		}
	}

	return true
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/services/financials/ -run TestIsClosureEligible -v`
Expected: PASS — 5 tests

- [ ] **Step 5: Format and review**

Run: `make lint-fix && go test ./internal/services/financials/`
Expected: PASS. Leave changes **unstaged**. Stop here for review.

---

### Task 2: Closure gates — what a PM must resolve before closing

**Files:**
- Modify: `internal/services/financials/closure.go`
- Test: `internal/services/financials/closure_test.go`

**Interfaces:**
- Consumes: `LeaseTerm`, `IsClosureEligible` from Task 1.
- Produces: `type ClosureGate struct { Name string; Passed bool; Blocking bool; Reason string }`; `type ClosureGateInput struct { Terms []LeaseTerm; OutstandingAmount int64; DepositHeldAmount int64; DepositResolved bool; HasMoveOutEvidence bool }`; `func EvaluateClosureGates(in ClosureGateInput) []ClosureGate`; `func CanClose(gates []ClosureGate) bool`. Gate names are the constants `GateLeasesEnded`, `GateOutstandingBalance`, `GateDeposit`, `GateMoveOutEvidence`.

- [ ] **Step 1: Write the failing tests**

Append to `internal/services/financials/closure_test.go`:

```go
// The clean case: tenancy over, nothing owed, deposit dealt with, inspection
// on file.
func TestEvaluateClosureGatesAllPass(t *testing.T) {
	gates := EvaluateClosureGates(ClosureGateInput{
		Terms:              []LeaseTerm{{ID: "l1", Status: "Lease.Status.Completed"}},
		OutstandingAmount:  0,
		DepositHeldAmount:  500_000,
		DepositResolved:    true,
		HasMoveOutEvidence: true,
	})
	if !CanClose(gates) {
		t.Errorf("got cannot close, want can close: %+v", gates)
	}
}

// Money is still owed. Closing here would write off a debt silently.
func TestEvaluateClosureGatesOutstandingBlocks(t *testing.T) {
	gates := EvaluateClosureGates(ClosureGateInput{
		Terms:              []LeaseTerm{{ID: "l1", Status: "Lease.Status.Completed"}},
		OutstandingAmount:  120_000,
		DepositResolved:    true,
		HasMoveOutEvidence: true,
	})
	if CanClose(gates) {
		t.Error("got can close, want blocked — 120,000 is still outstanding")
	}
	if !gateIsBlocking(t, gates, GateOutstandingBalance) {
		t.Error("the outstanding balance gate must be blocking")
	}
}

// A deposit is held and the PM has not said what happens to it. Closing would
// leave the tenant's money in limbo.
func TestEvaluateClosureGatesUnresolvedDepositBlocks(t *testing.T) {
	gates := EvaluateClosureGates(ClosureGateInput{
		Terms:              []LeaseTerm{{ID: "l1", Status: "Lease.Status.Completed"}},
		DepositHeldAmount:  500_000,
		DepositResolved:    false,
		HasMoveOutEvidence: true,
	})
	if CanClose(gates) {
		t.Error("got can close, want blocked — a held deposit is unresolved")
	}
}

// No deposit was ever held, so there is nothing to resolve and the gate passes
// without the PM doing anything.
func TestEvaluateClosureGatesNoDepositPassesUnresolved(t *testing.T) {
	gates := EvaluateClosureGates(ClosureGateInput{
		Terms:              []LeaseTerm{{ID: "l1", Status: "Lease.Status.Completed"}},
		DepositHeldAmount:  0,
		DepositResolved:    false,
		HasMoveOutEvidence: true,
	})
	if !CanClose(gates) {
		t.Errorf("got cannot close, want can close — no deposit was held: %+v", gates)
	}
}

// Move-out evidence is advisory on purpose. A lease that simply runs to
// Completed never produces a termination record or a check-out checklist, so
// blocking on it would strand every clean tenancy.
func TestEvaluateClosureGatesMissingMoveOutWarnsOnly(t *testing.T) {
	gates := EvaluateClosureGates(ClosureGateInput{
		Terms:              []LeaseTerm{{ID: "l1", Status: "Lease.Status.Completed"}},
		DepositResolved:    true,
		HasMoveOutEvidence: false,
	})
	if !CanClose(gates) {
		t.Error("got blocked, want can close — missing move-out evidence only warns")
	}
	if gateIsBlocking(t, gates, GateMoveOutEvidence) {
		t.Error("the move-out gate must not be blocking")
	}
	if gatePassed(t, gates, GateMoveOutEvidence) {
		t.Error("the move-out gate should report as failed so the PM sees the warning")
	}
}

// An active lease blocks closure through the gates too, not only through
// IsClosureEligible.
func TestEvaluateClosureGatesActiveLeaseBlocks(t *testing.T) {
	gates := EvaluateClosureGates(ClosureGateInput{
		Terms:              []LeaseTerm{{ID: "l1", Status: "Lease.Status.Active"}},
		DepositResolved:    true,
		HasMoveOutEvidence: true,
	})
	if CanClose(gates) {
		t.Error("got can close, want blocked — a lease is still Active")
	}
}

func gateIsBlocking(t *testing.T, gates []ClosureGate, name string) bool {
	t.Helper()
	for _, g := range gates {
		if g.Name == name {
			return g.Blocking && !g.Passed
		}
	}
	t.Fatalf("gate %q not present in %+v", name, gates)
	return false
}

func gatePassed(t *testing.T, gates []ClosureGate, name string) bool {
	t.Helper()
	for _, g := range gates {
		if g.Name == name {
			return g.Passed
		}
	}
	t.Fatalf("gate %q not present in %+v", name, gates)
	return false
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/services/financials/ -run TestEvaluateClosureGates -v`
Expected: FAIL — `undefined: EvaluateClosureGates`

- [ ] **Step 3: Write the implementation**

Append to `internal/services/financials/closure.go`:

```go
// Closure gate names. These travel to the UI, which renders one row per gate.
const (
	GateLeasesEnded        = "LEASES_ENDED"
	GateOutstandingBalance = "OUTSTANDING_BALANCE"
	GateDeposit            = "DEPOSIT"
	GateMoveOutEvidence    = "MOVE_OUT_EVIDENCE"
)

// ClosureGate is one condition shown to the property manager before closing.
// A gate that has not passed and is not blocking is a warning: the PM may
// close anyway.
type ClosureGate struct {
	Name     string `json:"name"`
	Passed   bool   `json:"passed"`
	Blocking bool   `json:"blocking"`
	Reason   string `json:"reason"`
}

// ClosureGateInput is everything the gates need, gathered by the caller so
// this stays pure.
type ClosureGateInput struct {
	Terms              []LeaseTerm
	OutstandingAmount  int64
	DepositHeldAmount  int64
	DepositResolved    bool
	HasMoveOutEvidence bool
}

// EvaluateClosureGates returns every gate in a stable order, passed or not.
// It never filters: the PM is shown the ones that passed as well, because a
// checklist with items missing is not a checklist.
func EvaluateClosureGates(in ClosureGateInput) []ClosureGate {
	ended := IsClosureEligible(in.Terms)
	depositOK := in.DepositHeldAmount == 0 || in.DepositResolved

	return []ClosureGate{
		{
			Name:     GateLeasesEnded,
			Passed:   ended,
			Blocking: true,
			Reason:   "Every lease on this account must have ended",
		},
		{
			Name:     GateOutstandingBalance,
			Passed:   in.OutstandingAmount == 0,
			Blocking: true,
			Reason:   "Outstanding balance must be settled, offset against the deposit, or written off",
		},
		{
			Name:     GateDeposit,
			Passed:   depositOK,
			Blocking: true,
			Reason:   "A held deposit must be released, offset, or forfeited with a reason",
		},
		{
			Name:     GateMoveOutEvidence,
			Passed:   in.HasMoveOutEvidence,
			Blocking: false,
			Reason:   "No check-out checklist or completed termination is on file",
		},
	}
}

// CanClose reports whether every blocking gate has passed. Advisory gates are
// ignored by design.
func CanClose(gates []ClosureGate) bool {
	for _, gate := range gates {
		if gate.Blocking && !gate.Passed {
			return false
		}
	}

	return true
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/services/financials/ -run "TestIsClosureEligible|TestEvaluateClosureGates" -v`
Expected: PASS — 11 tests

- [ ] **Step 5: Format and review**

Run: `make lint-fix && go test ./internal/services/financials/`
Expected: PASS. Leave changes **unstaged**. Stop here for review.

---

### Task 3: Models — the schema in Go

Struct changes only. No migration yet (Task 9), no behaviour yet. This task must leave the build green and every existing test passing, which is the check that the renames were followed through everywhere.

**Files:**
- Modify: `internal/models/financial-account.go`
- Modify: `internal/models/charge-definition.go`
- Modify: `internal/models/charge-instance.go`
- Modify: `internal/models/lease.go:79-85`
- Create: `internal/models/financial-account-closure.go`
- Modify: `init/migration/main.go:16-59` (register the new model in `updateMigration`)

**Interfaces:**
- Consumes: nothing.
- Produces: `models.FinancialAccount.OriginTenantApplicationID string`, `.ClosureEligibleAt *time.Time` (`.LeaseID` survives until Task 4b); `models.ChargeDefinition.LeaseID *string`; `models.ChargeInstance.LeaseID *string`; `models.Lease.FinancialAccountID *string`; `models.AccountFinancials` (renamed from `TenantApplicationFinancials`); `models.FinancialAccountClosure`.

- [ ] **Step 1: Change `FinancialAccount`**

In `internal/models/financial-account.go`, replace the `TenantApplicationID` and `LeaseID` fields and update the type doc comment. The existing comment claims application-stage is `LeaseID IS NULL`, which stops being true:

```go
// FinancialAccount is the continuing financial relationship between one tenant
// and one property. Leases are contractual terms inside it: a renewal adds a
// term, it does not start a new money relationship.
//
// Identity is TenantID + PropertyID. A new lease for that pair reuses the open
// account; only a genuinely CLOSED account causes a new one, which is the
// tenant who left and came back.
//
// TenantID is nullable because an account is created against an application,
// before any tenant record exists. Application-stage is exactly
// TenantID IS NULL — it is no longer LeaseID IS NULL, because leases now point
// at accounts rather than the reverse.
type FinancialAccount struct {
	BaseModelSoftDelete
	Code string `gorm:"not null;uniqueIndex;"` // FA-YYMM-XXXXXX

	// Provenance only. The application this relationship began with; it does
	// not identify the account and is not unique.
	OriginTenantApplicationID string `gorm:"not null;index;"`
	TenantApplication         TenantApplication `gorm:"foreignKey:OriginTenantApplicationID"`

	// DEPRECATED, removed in Task 4b. Three sites still read this to answer
	// "which lease is this invoice's payer?", and that question needs the
	// charge-level lease_id to answer properly. Keeping the field until then
	// is what lets every task in between end on a green build.
	LeaseID *string `gorm:"uniqueIndex;"`
	Lease   *Lease

	// Denormalised for querying and reporting, and since the shared-account
	// change these two also carry identity.
	ClientID   *string
	Client     *Client
	PropertyID *string
	Property   *Property
	TenantID   *string // null until approval creates the Tenant
	Tenant     *Tenant

	Currency string `gorm:"not null;default:'GHS'"`

	// Rent collection policy — what the queue reads.
	// EVERY_PERIOD | EVERY_N_PERIODS | UPFRONT | MANUAL
	RentBillingCadence  string `gorm:"not null;default:'EVERY_PERIOD'"`
	RentBillingInterval int64  `gorm:"not null;default:1"`
	AutoIssueDaysBefore int64  `gorm:"not null;default:5"` // issuance LEAD time, not the payment grace

	// ACTIVE | CLOSURE_ELIGIBLE | CLOSED.
	//
	// CLOSURE_ELIGIBLE means every term has ended and nothing follows. It is
	// still a live account: it bills, it accepts payment, and a new lease
	// reverts it to ACTIVE. Only a PM moves it to CLOSED.
	Status            string `gorm:"not null;default:'ACTIVE';index;"`
	ClosureEligibleAt *time.Time
	ClosedAt          *time.Time

	ChargeDefinitions []ChargeDefinition
	ChargeInstances   []ChargeInstance
}
```

Then rename the computed summary type at the bottom of the same file — `TenantApplicationFinancials` only made sense when accounts were reached through applications:

```go
// AccountFinancials is a computed summary attached to a lease or application
// in memory. It lives here rather than in the services layer so the model can
// carry it without an import cycle.
type AccountFinancials struct {
	Account           *FinancialAccount
	TotalCharged      int64
	TotalSettled      int64
	OutstandingAmount int64
	AvailableCredit   int64
	ChargeCount       int64
	InvoiceCount      int64
	// RentTermsLocked mirrors the service guard: true once a rent charge has
	// been invoiced or settled, at which point move-in date and unit changes
	// are refused.
	RentTermsLocked bool
}
```

- [ ] **Step 2: Find every reference to the renamed symbols**

Run:
```bash
grep -rn "TenantApplicationFinancials\|\.TenantApplicationID\|account\.LeaseID\|LeaseID:" internal/ init/ | grep -v "_test.go"
```
Expected: hits in `internal/services/financials/account.go`, `internal/repository/financial-account.go`, `internal/services/lease.go`, `internal/services/tenant-application.go`, `internal/transformations/`, `internal/handlers/financial-account.go`. Note them — Tasks 4 through 8 change each. For **this** task, rename only what is needed to compile: `TenantApplicationFinancials` → `AccountFinancials`, and `account.TenantApplicationID` → `account.OriginTenantApplicationID`. `account.LeaseID` readers are left alone — Task 4b replaces them.

The raw column string in `internal/repository/financial-account.go:69` must change with the model, or the query targets a column the rename moved:

```go
		db = db.Where("financial_accounts.origin_tenant_application_id = ?", *query.TenantApplicationID)
```

- [ ] **Step 3: Add `LeaseID` to both charge models**

In `internal/models/charge-definition.go`, add below the `FinancialAccount` field:

```go
	// Contractual context. Null means the definition belongs to the
	// relationship rather than to any one contract.
	LeaseID *string `gorm:"type:uuid;index;"`
	Lease   *Lease
```

In `internal/models/charge-instance.go`, add below the `FinancialAccount` field:

```go
	// Contractual context — which lease term this obligation arose under.
	// Ownership stays with the account: balance, invoicing and allocation
	// never read this column. It exists so charges can be GROUPED by term,
	// never so the balance can be SPLIT by term.
	//
	// Null is meaningful: an account credit, a write-off or a cross-term
	// adjustment has no contractual home. The security deposit is NOT null —
	// it points at the lease it was taken under, which is historical truth,
	// while "deposit currently held" is computed account-wide.
	LeaseID *string `gorm:"type:uuid;index;"`
	Lease   *Lease
```

- [ ] **Step 4: Add the FK to `Lease`**

In `internal/models/lease.go`, replace the block at lines 78-85:

```go
	// for lease renewals and extensions
	ParentLeaseId *string `gorm:"index;"`
	ParentLease   *Lease

	// The continuing financial relationship this term belongs to. Many leases
	// share one account; a renewal inherits its parent's.
	FinancialAccountID *string `gorm:"type:uuid;index;"`
	FinancialAccount   *FinancialAccount

	// Financials is a computed view attached in memory by the service — not a
	// relation.
	Financials *AccountFinancials `gorm:"-"`
```

- [ ] **Step 5: Create the closure event model**

Create `internal/models/financial-account-closure.go`:

```go
package models

import "time"

// FinancialAccountClosure is the audit record of a property manager closing an
// account. Closure is an event, not a status flip: the deposit is released at
// this moment, so there must be a row saying who decided, when, on what
// balance, and what happened to the tenant's money.
//
// Reopening is recorded on this same row rather than by deleting it, so an
// accidental closure leaves a trail instead of silently rewriting history.
type FinancialAccountClosure struct {
	BaseModelSoftDelete

	FinancialAccountID string `gorm:"type:uuid;not null;index;"`
	FinancialAccount   FinancialAccount

	Reason     string    `gorm:"not null;"`
	ClosedAt   time.Time `gorm:"not null;"`
	ClosedByID string    `gorm:"type:uuid;not null;"`
	ClosedBy   ClientUser `gorm:"foreignKey:ClosedByID"`

	// The account's state at the moment of closure, frozen. Recomputing these
	// later would give different answers once refunds have posted.
	OutstandingAtClosure int64 `gorm:"not null;default:0"`
	DepositHeldAmount    int64 `gorm:"not null;default:0"`

	// The reversing SECURITY_DEPOSIT instance, when the deposit was released
	// or offset. Null when the deposit was forfeited or none was held.
	DepositRefundChargeInstanceID *string `gorm:"type:uuid;"`
	DepositForfeitedAmount        int64   `gorm:"not null;default:0"`

	ReopenedAt   *time.Time
	ReopenedByID *string     `gorm:"type:uuid;"`
	ReopenedBy   *ClientUser `gorm:"foreignKey:ReopenedByID"`
	ReopenReason *string
}
```

- [ ] **Step 6: Register the model for AutoMigrate**

In `init/migration/main.go`, add to the `db.AutoMigrate(...)` list immediately after `&models.FinancialAccount{},`:

```go
		&models.FinancialAccountClosure{},
```

- [ ] **Step 7: Build and run the whole suite**

Run: `go build ./... && go test ./internal/...`
Expected: PASS. If the build fails, it is a missed rename from Step 2 — fix it rather than reintroducing the old field name.

- [ ] **Step 8: Format and review**

Run: `make lint-fix && go build ./...`
Expected: clean. Leave changes **unstaged**. Stop here for review.

---

### Task 4: Repository layer — filters and the closure store

**Files:**
- Modify: `internal/repository/charge.go:1-40` (filters), `:105-128` (`ListInstances`), and `ListDefinitions`
- Modify: `internal/repository/financial-account.go`
- Create: `internal/repository/financial-account-closure.go`
- Test: `internal/repository/charge_test.go` (create), `internal/repository/financial-account_test.go` (create)

**Interfaces:**
- Consumes: models from Task 3.
- Produces: `financials.ChargeView.LeaseID *string` (added at `internal/services/financials/types.go:46-53`, populated wherever `ListViews` builds views); `repository.ListChargeInstancesFilter.LeaseID *string`; `repository.ListChargeDefinitionsFilter.LeaseID *string`; `repository.GetFinancialAccountQuery{ TenantID, PropertyID *string; Statuses *[]string }` (`LeaseID` retained until Task 5); `repository.ChargeRepository.ReassignAccount(ctx, fromAccountID, toAccountID string) error`; `repository.FinancialAccountClosureRepository` with `Create`, `GetByAccount`, `Update`.

Repository tests in this codebase use a **dry-run GORM handle** that renders SQL without a database connection — see `internal/repository/client-user_test.go`. Follow that pattern; do not require a live Postgres.

- [ ] **Step 1: Write the failing tests**

Create `internal/repository/charge_test.go`:

```go
package repository

import (
	"strings"
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// chargeDryRunDB renders SQL without opening a connection, so filter tests
// assert on the exact statement the database would receive.
func chargeDryRunDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(
		postgres.New(postgres.Config{DSN: "postgres://rentloop@127.0.0.1:5432/rentloop?sslmode=disable"}),
		&gorm.Config{DryRun: true, DisableAutomaticPing: true},
	)
	if err != nil {
		t.Fatalf("opening dry-run db: %v", err)
	}

	return db
}

func listInstancesSQL(t *testing.T, filters ListChargeInstancesFilter) string {
	t.Helper()

	var instances []models.ChargeInstance
	db := chargeDryRunDB(t).Model(&models.ChargeInstance{})
	db = applyChargeInstanceFilters(db, filters)

	return db.Find(&instances).Statement.SQL.String()
}

// The lease filter is what the UI's "This Lease" view runs on.
func TestListInstancesFiltersByLease(t *testing.T) {
	leaseID := "11111111-1111-1111-1111-111111111111"
	sql := listInstancesSQL(t, ListChargeInstancesFilter{LeaseID: &leaseID})

	if !strings.Contains(sql, "charge_instances.lease_id = ") {
		t.Errorf("expected a lease_id predicate, got: %s", sql)
	}
}

// Without the filter the query must stay account-wide — this is the "Entire
// Tenancy" view, and it is also what balance and allocation rely on.
func TestListInstancesWithoutLeaseIsAccountWide(t *testing.T) {
	accountID := "22222222-2222-2222-2222-222222222222"
	sql := listInstancesSQL(t, ListChargeInstancesFilter{FinancialAccountID: &accountID})

	if strings.Contains(sql, "lease_id") {
		t.Errorf("expected no lease predicate when none was asked for, got: %s", sql)
	}
	if !strings.Contains(sql, "charge_instances.financial_account_id = ") {
		t.Errorf("expected an account predicate, got: %s", sql)
	}
}

// Voided charges stay excluded by default even when a lease is named.
func TestListInstancesLeaseFilterStillExcludesVoided(t *testing.T) {
	leaseID := "11111111-1111-1111-1111-111111111111"
	sql := listInstancesSQL(t, ListChargeInstancesFilter{LeaseID: &leaseID})

	if !strings.Contains(sql, "voided_at IS NULL") {
		t.Errorf("expected voided charges to remain excluded, got: %s", sql)
	}
}
```

Create `internal/repository/financial-account_test.go`:

```go
package repository

import (
	"strings"
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func accountDryRunDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(
		postgres.New(postgres.Config{DSN: "postgres://rentloop@127.0.0.1:5432/rentloop?sslmode=disable"}),
		&gorm.Config{DryRun: true, DisableAutomaticPing: true},
	)
	if err != nil {
		t.Fatalf("opening dry-run db: %v", err)
	}

	return db
}

func getAccountSQL(t *testing.T, query GetFinancialAccountQuery) string {
	t.Helper()

	var account models.FinancialAccount
	db := accountDryRunDB(t).Model(&models.FinancialAccount{})
	db = applyFinancialAccountQuery(db, query)

	return db.First(&account).Statement.SQL.String()
}

// Account identity is tenant + property. This is the lookup that decides
// whether a new lease joins an existing relationship or starts one.
func TestGetFinancialAccountByTenantAndProperty(t *testing.T) {
	tenantID := "33333333-3333-3333-3333-333333333333"
	propertyID := "44444444-4444-4444-4444-444444444444"

	sql := getAccountSQL(t, GetFinancialAccountQuery{TenantID: &tenantID, PropertyID: &propertyID})

	if !strings.Contains(sql, "financial_accounts.tenant_id = ") {
		t.Errorf("expected a tenant predicate, got: %s", sql)
	}
	if !strings.Contains(sql, "financial_accounts.property_id = ") {
		t.Errorf("expected a property predicate, got: %s", sql)
	}
}

// Resolution must consider CLOSURE_ELIGIBLE accounts as reusable: a lease that
// expired while a renewal was being negotiated leaves the account eligible,
// and the renewal has to revive it rather than open a second one.
func TestGetFinancialAccountFiltersByStatusSet(t *testing.T) {
	statuses := []string{"ACTIVE", "CLOSURE_ELIGIBLE"}
	sql := getAccountSQL(t, GetFinancialAccountQuery{Statuses: &statuses})

	if !strings.Contains(sql, "financial_accounts.status IN ") {
		t.Errorf("expected a status IN predicate, got: %s", sql)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/repository/ -run "TestListInstances|TestGetFinancialAccount" -v`
Expected: FAIL — `undefined: applyChargeInstanceFilters`, `undefined: applyFinancialAccountQuery`, unknown fields `LeaseID`, `TenantID`, `Statuses`.

- [ ] **Step 3: Add the charge filters**

In `internal/repository/charge.go`, add `LeaseID *string` to both `ListChargeInstancesFilter` and `ListChargeDefinitionsFilter`. Then extract the instance predicates into a shared helper so the test can render them, and rewrite `ListInstances` to use it:

```go
// applyChargeInstanceFilters is extracted so both ListInstances and its tests
// render the same predicates.
func applyChargeInstanceFilters(db *gorm.DB, filters ListChargeInstancesFilter) *gorm.DB {
	if filters.FinancialAccountID != nil {
		db = db.Where("charge_instances.financial_account_id = ?", *filters.FinancialAccountID)
	}
	if filters.LeaseID != nil {
		db = db.Where("charge_instances.lease_id = ?", *filters.LeaseID)
	}
	if filters.Category != nil {
		db = db.Where("charge_instances.category = ?", *filters.Category)
	}
	if !filters.IncludeVoided {
		db = db.Where("charge_instances.voided_at IS NULL")
	}

	return db
}

func (r *chargeRepository) ListInstances(
	ctx context.Context,
	filters ListChargeInstancesFilter,
) (*[]models.ChargeInstance, error) {
	var instances []models.ChargeInstance

	db := applyChargeInstanceFilters(lib.ResolveDB(ctx, r.DB).Model(&models.ChargeInstance{}), filters)

	if err := db.Order("charge_instances.due_date ASC").Find(&instances).Error; err != nil {
		return nil, err
	}

	return &instances, nil
}
```

Apply the same `LeaseID` predicate inside `ListDefinitions`, matching its existing style.

- [ ] **Step 4: Add `ReassignAccount` to the charge repository**

Add to the `ChargeRepository` interface and implement it. This is what the application-stage merge in Task 7 uses:

```go
	// ReassignAccount moves every definition and instance from one account to
	// another. Used only by the application-stage merge, where an approval
	// finds the tenant already has an open account at that property. No amount
	// changes — only which account owns the rows — so the total balance across
	// both accounts is identical before and after.
	ReassignAccount(ctx context.Context, fromAccountID, toAccountID string) error
```

```go
func (r *chargeRepository) ReassignAccount(ctx context.Context, fromAccountID, toAccountID string) error {
	db := lib.ResolveDB(ctx, r.DB)

	if err := db.Model(&models.ChargeDefinition{}).
		Where("financial_account_id = ?", fromAccountID).
		Update("financial_account_id", toAccountID).Error; err != nil {
		return err
	}

	return db.Model(&models.ChargeInstance{}).
		Where("financial_account_id = ?", fromAccountID).
		Update("financial_account_id", toAccountID).Error
}
```

- [ ] **Step 5: Rework the account query**

In `internal/repository/financial-account.go`, replace `GetFinancialAccountQuery` and extract the predicate helper:

```go
type GetFinancialAccountQuery struct {
	ID                        *string
	OriginTenantApplicationID *string
	TenantID                  *string
	PropertyID                *string
	// Statuses restricts the lookup to a set — resolution passes
	// {ACTIVE, CLOSURE_ELIGIBLE}, since an eligible account is still reusable.
	Statuses *[]string
	Populate *[]string

	// LeaseID is retained ONLY so this task leaves a green build. Its column
	// disappears in Task 9 and its last caller in Task 5, which deletes both
	// this field and the predicate below.
	LeaseID *string
}

// applyFinancialAccountQuery is extracted so GetOne and its tests render the
// same predicates.
func applyFinancialAccountQuery(db *gorm.DB, query GetFinancialAccountQuery) *gorm.DB {
	if query.Populate != nil {
		for _, populate := range *query.Populate {
			db = db.Preload(populate)
		}
	}
	if query.ID != nil {
		db = db.Where("financial_accounts.id = ?", *query.ID)
	}
	if query.OriginTenantApplicationID != nil {
		db = db.Where("financial_accounts.origin_tenant_application_id = ?", *query.OriginTenantApplicationID)
	}
	if query.TenantID != nil {
		db = db.Where("financial_accounts.tenant_id = ?", *query.TenantID)
	}
	if query.PropertyID != nil {
		db = db.Where("financial_accounts.property_id = ?", *query.PropertyID)
	}
	if query.Statuses != nil {
		db = db.Where("financial_accounts.status IN ?", *query.Statuses)
	}
	if query.LeaseID != nil {
		// Removed in Task 5. See the field comment.
		db = db.Where("financial_accounts.lease_id = ?", *query.LeaseID)
	}

	return db
}
```

Rewrite `GetOne` to call it. Then widen `ListActiveForBilling`, because an account whose leases have all ended may still carry unbilled arrears and must not fall out of the sweep:

```go
	err := lib.ResolveDB(ctx, r.DB).
		Model(&models.FinancialAccount{}).
		Where("financial_accounts.status IN ?", []string{"ACTIVE", "CLOSURE_ELIGIBLE"}).
		Where("financial_accounts.rent_billing_cadence != ?", "MANUAL").
		Find(&accounts).Error
```

- [ ] **Step 6: Create the closure repository**

Create `internal/repository/financial-account-closure.go`:

```go
package repository

import (
	"context"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type FinancialAccountClosureRepository interface {
	Create(ctx context.Context, closure *models.FinancialAccountClosure) error
	Update(ctx context.Context, closure *models.FinancialAccountClosure) error
	// GetByAccount returns the most recent closure row for an account, or a
	// gorm.ErrRecordNotFound if it has never been closed.
	GetByAccount(ctx context.Context, financialAccountID string) (*models.FinancialAccountClosure, error)
}

type financialAccountClosureRepository struct {
	DB *gorm.DB
}

func NewFinancialAccountClosureRepository(db *gorm.DB) FinancialAccountClosureRepository {
	return &financialAccountClosureRepository{DB: db}
}

func (r *financialAccountClosureRepository) Create(
	ctx context.Context,
	closure *models.FinancialAccountClosure,
) error {
	return lib.ResolveDB(ctx, r.DB).Create(closure).Error
}

func (r *financialAccountClosureRepository) Update(
	ctx context.Context,
	closure *models.FinancialAccountClosure,
) error {
	return lib.ResolveDB(ctx, r.DB).Save(closure).Error
}

func (r *financialAccountClosureRepository) GetByAccount(
	ctx context.Context,
	financialAccountID string,
) (*models.FinancialAccountClosure, error) {
	var closure models.FinancialAccountClosure

	err := lib.ResolveDB(ctx, r.DB).
		Where("financial_account_id = ?", financialAccountID).
		Order("closed_at DESC").
		First(&closure).Error
	if err != nil {
		return nil, err
	}

	return &closure, nil
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `go test ./internal/repository/ -v`
Expected: PASS, including the pre-existing repository tests.

- [ ] **Step 8: Build, format, review**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Expected: PASS, green build. `GetByLease` still compiles against the retained `LeaseID` field; Task 5 removes both together. Leave changes **unstaged**. Stop here for review.

---

### Task 4b: Payer lease derivation, and removing `FinancialAccount.LeaseID`

Inserted during execution. Task 3 deletes the account's single-lease pointer, but three sites read it to answer "which lease is this invoice's payer?" — a question that has no account-level answer once an account spans several leases. `PayerLeaseID` appears on invoices tenants see, so it gets derived properly rather than guessed.

The rule: take the payer lease from the charges being invoiced. When they all belong to one lease, that lease. When they are all account-level (a deposit, a credit) or disagree, fall back to the account's current lease — its Active one, or the most recent by move-in date.

**Files:**
- Modify: `internal/services/financials/types.go:46-53` (`ChargeView.LeaseID`)
- Modify: `internal/services/financials/charge.go` (`ListViews` populates it)
- Create: `internal/services/financials/payer.go`
- Test: `internal/services/financials/payer_test.go`
- Modify: `internal/models/financial-account.go` (delete `LeaseID`)
- Modify: `internal/handlers/financial-account.go:387`, `internal/services/invoice.go:1461`, `internal/services/payment.go:271`
- Modify: `internal/transformations/financial-account.go:116`
- Modify: `internal/repository/lease.go` (a current-lease lookup)

**Interfaces:**
- Consumes: `ChargeView` (existing), `ListChargeInstancesFilter.LeaseID` (Task 4).
- Produces: `func DerivePayerLease(views []ChargeView) *string`; `LeaseRepository.GetCurrentForAccount(ctx, financialAccountID string) (*models.Lease, error)`.

- [ ] **Step 1: Write the failing tests**

Create `internal/services/financials/payer_test.go`:

```go
package financials

import "testing"

func leaseRef(id string) *string { return &id }

// Every charge on the invoice belongs to one term. That term is the payer.
func TestDerivePayerLeaseSingleLease(t *testing.T) {
	views := []ChargeView{
		{ID: "jan", LeaseID: leaseRef("lease-1")},
		{ID: "feb", LeaseID: leaseRef("lease-1")},
	}

	got := DerivePayerLease(views)
	if got == nil || *got != "lease-1" {
		t.Errorf("got %v, want lease-1", got)
	}
}

// A deposit and an account credit have no contractual home. There is nothing
// to derive, so the caller falls back to the account's current lease.
func TestDerivePayerLeaseAllAccountLevel(t *testing.T) {
	views := []ChargeView{{ID: "deposit"}, {ID: "credit"}}

	if got := DerivePayerLease(views); got != nil {
		t.Errorf("got %v, want nil — nothing here belongs to a lease", got)
	}
}

// Arrears from an ended term invoiced alongside the new term's rent. Neither
// lease is "the" payer, so the caller decides.
func TestDerivePayerLeaseMixedLeasesIsAmbiguous(t *testing.T) {
	views := []ChargeView{
		{ID: "dec", LeaseID: leaseRef("lease-1")},
		{ID: "jan", LeaseID: leaseRef("lease-2")},
	}

	if got := DerivePayerLease(views); got != nil {
		t.Errorf("got %v, want nil — the charges disagree", got)
	}
}

// One scoped charge plus account-level ones still has an unambiguous answer:
// the deposit does not contradict the rent.
func TestDerivePayerLeaseScopedPlusAccountLevel(t *testing.T) {
	views := []ChargeView{
		{ID: "deposit"},
		{ID: "jan", LeaseID: leaseRef("lease-1")},
	}

	got := DerivePayerLease(views)
	if got == nil || *got != "lease-1" {
		t.Errorf("got %v, want lease-1", got)
	}
}

// Nothing to invoice, nothing to attribute.
func TestDerivePayerLeaseEmpty(t *testing.T) {
	if got := DerivePayerLease(nil); got != nil {
		t.Errorf("got %v, want nil", got)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/services/financials/ -run TestDerivePayerLease -v`
Expected: FAIL — `undefined: DerivePayerLease`, and `ChargeView` has no field `LeaseID`.

- [ ] **Step 3: Add `LeaseID` to `ChargeView`**

In `internal/services/financials/types.go`, add to the struct:

```go
	// Contractual context, copied from the instance. Nil means the charge
	// belongs to the relationship rather than to any one term.
	LeaseID *string
```

Populate it wherever `ListViews` maps instances to views in `charge.go`.

- [ ] **Step 4: Write the derivation**

Create `internal/services/financials/payer.go`:

```go
package financials

// DerivePayerLease returns the lease an invoice should be attributed to, or
// nil when the charges cannot say.
//
// Nil is not a failure — it means "ask the account", and the caller falls back
// to the current lease. Two shapes produce it: charges that are all
// account-level (a deposit, a credit), and charges that disagree, which is
// arrears from an ended term invoiced alongside the new term's rent. Guessing
// between two real leases would put the wrong term on a document the tenant
// reads.
func DerivePayerLease(views []ChargeView) *string {
	var found *string

	for _, view := range views {
		if view.LeaseID == nil {
			continue
		}

		if found == nil {
			found = view.LeaseID
			continue
		}

		if *found != *view.LeaseID {
			return nil
		}
	}

	return found
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/services/financials/ -run TestDerivePayerLease -v`
Expected: PASS — 5 tests

- [ ] **Step 6: Add the current-lease fallback**

In `internal/repository/lease.go`, add to `LeaseRepository`:

```go
	// GetCurrentForAccount returns the account's Active lease, or its most
	// recent by move-in date when none is active. The fallback for invoice
	// attribution when the charges themselves cannot say.
	GetCurrentForAccount(ctx context.Context, financialAccountID string) (*models.Lease, error)
```

```go
func (r *leaseRepository) GetCurrentForAccount(
	ctx context.Context,
	financialAccountID string,
) (*models.Lease, error) {
	var lease models.Lease

	err := lib.ResolveDB(ctx, r.DB).
		Model(&models.Lease{}).
		Where("financial_account_id = ?", financialAccountID).
		Order("CASE WHEN status = 'Lease.Status.Active' THEN 0 ELSE 1 END, move_in_date DESC").
		First(&lease).Error
	if err != nil {
		return nil, err
	}

	return &lease, nil
}
```

Match the surrounding file's receiver name and helper conventions rather than copying the above verbatim.

- [ ] **Step 7: Replace the three consumers**

Each site currently reads `summary.Account.LeaseID` or `account.LeaseID`. Each becomes: derive from the charges, and when that is nil, fall back to the current lease.

`internal/handlers/financial-account.go:387` and `internal/services/invoice.go:1461` both have a `summary` in scope, so both become:

```go
	payerLeaseID := financials.DerivePayerLease(summary.Charges)
	if payerLeaseID == nil {
		if current, curErr := s.leaseRepo.GetCurrentForAccount(ctx, accountID); curErr == nil && current != nil {
			id := current.ID.String()
			payerLeaseID = &id
		}
	}
```

then pass `payerLeaseID` as `PayerLeaseID`. In the handler the equivalent lives behind whichever service it already holds — do not add a repository directly to a handler; handlers in this codebase never touch repositories.

`internal/services/payment.go:271` picks the lease to name in a notification and has no charge context, so it uses the current-lease lookup alone:

```go
			if current, curErr := s.leaseRepo.GetCurrentForAccount(ctx, *invoice.FinancialAccountID); curErr == nil {
				id := current.ID.String()
				notifyLeaseID = &id
			}
```

- [ ] **Step 8: Delete the field**

Remove `LeaseID` and `Lease` from `models.FinancialAccount`, and the `LeaseID` line from `internal/transformations/financial-account.go:116` along with its field on the output struct.

- [ ] **Step 9: Run everything**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Expected: PASS. Leave changes **unstaged**. Stop here for review.

---

### Task 5: Account resolution and the lease → account rewiring

Replaces "find the account whose `lease_id` is this lease" with "read the lease's `financial_account_id`", and adds the resolution rule that decides whether a new lease joins an existing relationship.

**Files:**
- Modify: `internal/services/financials/account.go` (interface, `PrepareCharges`, `LinkLease`, remove `GetByLease`)
- Modify: `internal/repository/financial-account.go` (delete `LeaseID` from the query)
- Modify: `internal/services/lease.go:293`, `:361`
- Modify: `internal/handlers/financial-account.go:496`
- Test: `internal/services/financials/resolution_test.go` (create)

**Interfaces:**
- Consumes: `StatusActive`, `StatusClosureEligible` (Task 1); `GetFinancialAccountQuery{TenantID, PropertyID, Statuses}` (Task 4).
- Produces: `financials.ReusableAccountStatuses() []string`; `FinancialAccountService.ResolveForTenancy(ctx context.Context, tenantID, propertyID string) (*models.FinancialAccount, error)`; `FinancialAccountService.Revive(ctx context.Context, accountID string) error`. `GetByLease` is **deleted** — callers read `lease.FinancialAccountID` and call `GetByID`.

- [ ] **Step 1: Write the failing test**

Create `internal/services/financials/resolution_test.go`:

```go
package financials

import "testing"

// An eligible account is reusable. A lease that expired while its renewal was
// still being negotiated leaves the account CLOSURE_ELIGIBLE, and the renewal
// must revive that relationship rather than start a second one — otherwise the
// tenant's deposit and history are stranded on the old account.
func TestReusableAccountStatusesIncludesEligible(t *testing.T) {
	got := ReusableAccountStatuses()

	var hasActive, hasEligible, hasClosed bool
	for _, s := range got {
		switch s {
		case StatusActive:
			hasActive = true
		case StatusClosureEligible:
			hasEligible = true
		case StatusClosed:
			hasClosed = true
		}
	}

	if !hasActive {
		t.Error("ACTIVE must be reusable")
	}
	if !hasEligible {
		t.Error("CLOSURE_ELIGIBLE must be reusable — a late renewal has to revive it")
	}
	if hasClosed {
		t.Error("CLOSED must NOT be reusable — a returning tenant starts a new relationship")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/services/financials/ -run TestReusableAccountStatuses -v`
Expected: FAIL — `undefined: ReusableAccountStatuses`

- [ ] **Step 3: Add the reusable-status rule**

Append to `internal/services/financials/closure.go`:

```go
// ReusableAccountStatuses is the set a tenancy lookup will join rather than
// bypass. CLOSED is deliberately absent: a tenant who left and came back
// years later starts a new financial relationship.
func ReusableAccountStatuses() []string {
	return []string{StatusActive, StatusClosureEligible}
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/services/financials/ -run TestReusableAccountStatuses -v`
Expected: PASS

- [ ] **Step 5: Add `ResolveForTenancy` and `Revive`, delete `GetByLease`**

In `internal/services/financials/account.go`, remove `GetByLease` from the `FinancialAccountService` interface and its implementation, and add:

```go
	// ResolveForTenancy finds the open account for a tenant at a property, or
	// nil when there is none. Nil is not an error — it means this is a new
	// financial relationship and the caller should create one.
	ResolveForTenancy(ctx context.Context, tenantID, propertyID string) (*models.FinancialAccount, error)
	// Revive returns a CLOSURE_ELIGIBLE account to ACTIVE. Called when a new
	// lease lands on an account that looked finished.
	Revive(ctx context.Context, accountID string) error
```

```go
func (s *financialAccountService) ResolveForTenancy(
	ctx context.Context,
	tenantID, propertyID string,
) (*models.FinancialAccount, error) {
	statuses := ReusableAccountStatuses()

	account, err := s.repo.GetOne(ctx, repository.GetFinancialAccountQuery{
		TenantID:   &tenantID,
		PropertyID: &propertyID,
		Statuses:   &statuses,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}

		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "ResolveForTenancy", "action": "resolving account"},
		})
	}

	return account, nil
}

// Revive undoes eligibility. It does not touch ClosedAt, because an account
// that reached CLOSED is not reusable and never arrives here.
func (s *financialAccountService) Revive(ctx context.Context, accountID string) error {
	account, err := s.repo.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &accountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	if account.Status != StatusClosureEligible {
		return nil
	}

	account.Status = StatusActive
	account.ClosureEligibleAt = nil

	if updateErr := s.repo.Update(ctx, account); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Revive", "action": "reviving account"},
		})
	}

	return nil
}
```

Add `"errors"` and `"gorm.io/gorm"` to the imports.

Update `PrepareCharges` to set the renamed field — change `TenantApplicationID: input.TenantApplicationID,` to `OriginTenantApplicationID: input.TenantApplicationID,`.

Update `LinkLease` so it no longer writes `account.LeaseID` (the column is going away); it now only stamps the tenant, and the lease side of the link is written by the lease itself:

```go
// LinkLease completes the application -> lease transition. It stamps the
// tenant onto the account, which is what turns an application-stage account
// (TenantID IS NULL) into a live tenancy. The other half of the link —
// leases.financial_account_id — is written by the caller on the lease row,
// because many leases now point at one account.
func (s *financialAccountService) LinkLease(ctx context.Context, accountID, tenantID string) error {
	account, err := s.repo.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &accountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	account.TenantID = &tenantID

	if updateErr := s.repo.Update(ctx, account); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "LinkLease", "action": "linking tenant"},
		})
	}

	return nil
}
```

Update the interface signature to `LinkLease(ctx context.Context, accountID, tenantID string) error`.

- [ ] **Step 6: Delete the dead query field**

In `internal/repository/financial-account.go`, delete the `LeaseID *string` field from `GetFinancialAccountQuery` and its predicate in `applyFinancialAccountQuery`.

- [ ] **Step 7: Rewire the three `GetByLease` call sites**

`internal/services/lease.go:293` — inside the rent-rederive guard, replace the account lookup:

```go
		if lease.FinancialAccountID != nil && lease.PaymentFrequency != nil {
			account, accErr := s.financials.Accounts.GetByID(ctx, *lease.FinancialAccountID)
			if accErr == nil && account != nil {
```

`internal/services/lease.go:361` — in `attachFinancials`:

```go
func (s *leaseService) attachFinancials(ctx context.Context, lease *models.Lease) {
	if lease == nil || lease.FinancialAccountID == nil {
		return
	}

	accountID := *lease.FinancialAccountID
	summary, summaryErr := s.financials.Accounts.Summary(ctx, accountID)
	if summaryErr != nil {
		return
	}
```

Keep the rest of that function as it is, and change the type it assigns to `*models.AccountFinancials`.

`internal/handlers/financial-account.go:496` — this handler resolves an account from a lease id in the path. It must now load the lease first. Replace the `GetByLease` call with a lease lookup followed by `GetByID`, returning the same not-found error shape as before when `lease.FinancialAccountID` is nil:

```go
	lease, leaseErr := h.leaseService.GetByIDWithPopulate(r.Context(), repository.GetLeaseQuery{ID: &leaseID})
	if leaseErr != nil {
		pkg.WriteErrorResponse(w, leaseErr)
		return
	}
	if lease.FinancialAccountID == nil {
		pkg.WriteErrorResponse(w, pkg.NotFoundError("FinancialAccountNotFound", nil))
		return
	}

	account, accErr := h.financials.Accounts.GetByID(r.Context(), *lease.FinancialAccountID)
```

The lease getter is `GetByIDWithPopulate(ctx, repository.GetLeaseQuery)` at `internal/services/lease.go:324` — there is no plain `GetLease`. Confirm `GetLeaseQuery`'s field name for the id with `grep -n "type GetLeaseQuery" -A 8 internal/repository/lease.go` and match it. If `FinancialAccountHandler` does not already hold a lease service, add it to the struct and to `NewFinancialAccountHandler` at `internal/handlers/financial-account.go:24`, then update the construction site in `cmd/rentloop-engine/main.go`.

- [ ] **Step 8: Build and run everything**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Expected: PASS. Leave changes **unstaged**. Stop here for review.

---

### Task 6: Close and reopen

**Files:**
- Create: `internal/services/financials/account_closure.go`
- Modify: `internal/services/financials/account.go` (facade wiring in `New`)
- Modify: `cmd/rentloop-engine/main.go` (construct the closure repository)
- Test: `internal/services/financials/closure_test.go` (append)

**Interfaces:**
- Consumes: `EvaluateClosureGates`, `CanClose`, `ClosureGateInput`, `LeaseTerm` (Tasks 1-2); `FinancialAccountClosureRepository` (Task 4); `ChargeService.CreateAdHoc(ctx, CreateAdHocChargeInput)` — the existing reversal path, `charge.go:68-76` and `:274-297`; `ReversesChargeInstanceID` is capped there at the original's `SettledAmount`.
- Produces: `financials.ClosureService` with `Eligibility(ctx, accountID) (*ClosureEligibility, error)`, `Close(ctx, CloseAccountInput) error`, `Reopen(ctx, ReopenAccountInput) error`, `RecomputeEligibility(ctx, accountID) error`; `type ClosureEligibility struct { Gates []ClosureGate; CanClose bool; DepositHeldAmount int64; OutstandingAmount int64 }`; `type DepositResolution string` with `DepositRelease`, `DepositOffset`, `DepositForfeit`.

- [ ] **Step 1: Write the failing test**

Append to `internal/services/financials/closure_test.go`:

```go
// The deposit currently held is the net of every SECURITY_DEPOSIT charge on
// the account: the original taken under lease #1, less any reversal already
// posted. It is computed account-wide precisely so a deposit taken under an
// earlier term is still visible when the tenancy ends under a later one.
func TestDepositHeldNetsReversals(t *testing.T) {
	views := []ChargeView{
		{ID: "deposit", Category: CategorySecurityDeposit, Amount: 500_000, SettledAmount: 500_000},
		{ID: "rent-jan", Category: CategoryRent, Amount: 100_000, SettledAmount: 100_000},
		{ID: "partial-refund", Category: CategorySecurityDeposit, Amount: -200_000},
	}

	if got := DepositHeld(views); got != 300_000 {
		t.Errorf("got %d, want 300000 — 500,000 taken less a 200,000 reversal", got)
	}
}

// No deposit was ever taken, so nothing is held and the closure gate has
// nothing to ask the PM about.
func TestDepositHeldNoDeposit(t *testing.T) {
	views := []ChargeView{{ID: "rent-jan", Category: CategoryRent, Amount: 100_000}}

	if got := DepositHeld(views); got != 0 {
		t.Errorf("got %d, want 0", got)
	}
}

// A deposit fully refunded leaves nothing held, so closure is not blocked on
// resolving it a second time.
func TestDepositHeldFullyRefunded(t *testing.T) {
	views := []ChargeView{
		{ID: "deposit", Category: CategorySecurityDeposit, Amount: 500_000, SettledAmount: 500_000},
		{ID: "refund", Category: CategorySecurityDeposit, Amount: -500_000},
	}

	if got := DepositHeld(views); got != 0 {
		t.Errorf("got %d, want 0", got)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/services/financials/ -run TestDepositHeld -v`
Expected: FAIL — `undefined: DepositHeld`

- [ ] **Step 3: Add the pure deposit calculation**

Append to `internal/services/financials/closure.go`:

```go
// DepositHeld nets every SECURITY_DEPOSIT charge on the account.
//
// Sign carries direction throughout this package, so a negative
// SECURITY_DEPOSIT charge is a refund and simply subtracts. It is computed
// account-wide, never per lease: a deposit taken under the first term of a
// tenancy must still be visible when the last term ends.
func DepositHeld(views []ChargeView) int64 {
	var held int64

	for _, view := range views {
		if view.Category == CategorySecurityDeposit {
			held += view.Amount
		}
	}

	return held
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/services/financials/ -run TestDepositHeld -v`
Expected: PASS — 3 tests

- [ ] **Step 5: Write the closure service**

Create `internal/services/financials/account_closure.go`:

```go
package financials

import (
	"context"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
)

// DepositResolution is what the PM decided happens to money still held.
type DepositResolution string

const (
	// DepositRelease refunds the full held amount to the tenant.
	DepositRelease DepositResolution = "RELEASE"
	// DepositOffset applies the deposit against what the tenant still owes.
	DepositOffset DepositResolution = "OFFSET"
	// DepositForfeit keeps the deposit. Requires a reason.
	DepositForfeit DepositResolution = "FORFEIT"
)

// ClosureEligibility is the read model behind the PM's closure panel.
type ClosureEligibility struct {
	Gates             []ClosureGate `json:"gates"`
	CanClose          bool          `json:"can_close"`
	DepositHeldAmount int64         `json:"deposit_held_amount"`
	OutstandingAmount int64         `json:"outstanding_amount"`
}

type CloseAccountInput struct {
	FinancialAccountID string
	ClosedByID         string
	Reason             string
	DepositResolution  DepositResolution
	// Set when the deposit is forfeited; recorded on the closure row.
	DepositForfeitReason *string
}

type ReopenAccountInput struct {
	FinancialAccountID string
	ReopenedByID       string
	Reason             string
}

// LeaseTermReader hands the closure service the account's lease terms without
// this package importing the lease service, which would be a cycle.
type LeaseTermReader interface {
	ListTermsForAccount(ctx context.Context, financialAccountID string) ([]LeaseTerm, error)
	HasMoveOutEvidence(ctx context.Context, financialAccountID string) (bool, error)
}

type ClosureService interface {
	Eligibility(ctx context.Context, accountID string) (*ClosureEligibility, error)
	RecomputeEligibility(ctx context.Context, accountID string) error
	Close(ctx context.Context, input CloseAccountInput) error
	Reopen(ctx context.Context, input ReopenAccountInput) error
}

type closureService struct {
	accounts  repository.FinancialAccountRepository
	closures  repository.FinancialAccountClosureRepository
	charges   ChargeService
	leaseInfo LeaseTermReader
}

func NewClosureService(
	accounts repository.FinancialAccountRepository,
	closures repository.FinancialAccountClosureRepository,
	charges ChargeService,
	leaseInfo LeaseTermReader,
) ClosureService {
	return &closureService{accounts: accounts, closures: closures, charges: charges, leaseInfo: leaseInfo}
}

func (s *closureService) gateInput(ctx context.Context, accountID string) (ClosureGateInput, []ChargeView, error) {
	views, viewErr := s.charges.ListViews(ctx, accountID)
	if viewErr != nil {
		return ClosureGateInput{}, nil, viewErr
	}

	terms, termErr := s.leaseInfo.ListTermsForAccount(ctx, accountID)
	if termErr != nil {
		return ClosureGateInput{}, nil, termErr
	}

	moveOut, moveOutErr := s.leaseInfo.HasMoveOutEvidence(ctx, accountID)
	if moveOutErr != nil {
		return ClosureGateInput{}, nil, moveOutErr
	}

	return ClosureGateInput{
		Terms:              terms,
		OutstandingAmount:  AccountBalance(views),
		DepositHeldAmount:  DepositHeld(views),
		HasMoveOutEvidence: moveOut,
	}, views, nil
}

func (s *closureService) Eligibility(ctx context.Context, accountID string) (*ClosureEligibility, error) {
	in, _, err := s.gateInput(ctx, accountID)
	if err != nil {
		return nil, err
	}

	// The panel shows the gates as they stand before the PM chooses what
	// happens to the deposit, so DepositResolved is false here by definition.
	gates := EvaluateClosureGates(in)

	return &ClosureEligibility{
		Gates:             gates,
		CanClose:          CanClose(gates),
		DepositHeldAmount: in.DepositHeldAmount,
		OutstandingAmount: in.OutstandingAmount,
	}, nil
}

// RecomputeEligibility moves an account between ACTIVE and CLOSURE_ELIGIBLE.
// It NEVER closes an account and never touches a CLOSED one: closing releases
// a deposit, and that decision belongs to a person.
func (s *closureService) RecomputeEligibility(ctx context.Context, accountID string) error {
	account, err := s.accounts.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &accountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	if account.Status == StatusClosed {
		return nil
	}

	terms, termErr := s.leaseInfo.ListTermsForAccount(ctx, accountID)
	if termErr != nil {
		return termErr
	}

	eligible := IsClosureEligible(terms)

	switch {
	case eligible && account.Status != StatusClosureEligible:
		now := time.Now()
		account.Status = StatusClosureEligible
		account.ClosureEligibleAt = &now
	case !eligible && account.Status == StatusClosureEligible:
		account.Status = StatusActive
		account.ClosureEligibleAt = nil
	default:
		return nil
	}

	if updateErr := s.accounts.Update(ctx, account); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "RecomputeEligibility", "action": "updating status"},
		})
	}

	return nil
}

func (s *closureService) Close(ctx context.Context, input CloseAccountInput) error {
	account, err := s.accounts.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &input.FinancialAccountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	if account.Status == StatusClosed {
		return pkg.BadRequestError("FinancialAccountAlreadyClosed", nil)
	}

	if input.Reason == "" {
		return pkg.BadRequestError("ClosureReasonRequired", nil)
	}

	gateInput, views, gateErr := s.gateInput(ctx, input.FinancialAccountID)
	if gateErr != nil {
		return gateErr
	}

	// The PM has now told us what happens to the deposit, which is what the
	// eligibility read model could not know.
	gateInput.DepositResolved = true

	if input.DepositResolution == DepositForfeit && input.DepositForfeitReason == nil {
		return pkg.BadRequestError("DepositForfeitReasonRequired", nil)
	}

	gates := EvaluateClosureGates(gateInput)
	if !CanClose(gates) {
		return pkg.BadRequestError("FinancialAccountNotClosable", nil)
	}

	closure := &models.FinancialAccountClosure{
		FinancialAccountID:   input.FinancialAccountID,
		Reason:               input.Reason,
		ClosedAt:             time.Now(),
		ClosedByID:           input.ClosedByID,
		OutstandingAtClosure: gateInput.OutstandingAmount,
		DepositHeldAmount:    gateInput.DepositHeldAmount,
	}

	if gateInput.DepositHeldAmount > 0 {
		switch input.DepositResolution {
		case DepositForfeit:
			closure.DepositForfeitedAmount = gateInput.DepositHeldAmount
		case DepositRelease, DepositOffset:
			refundID, refundErr := s.refundDeposit(
				ctx, input.FinancialAccountID, account.Currency, views, gateInput.DepositHeldAmount,
			)
			if refundErr != nil {
				return refundErr
			}
			closure.DepositRefundChargeInstanceID = refundID
		default:
			return pkg.BadRequestError("InvalidDepositResolution", nil)
		}
	}

	if createErr := s.closures.Create(ctx, closure); createErr != nil {
		return pkg.InternalServerError(createErr.Error(), &pkg.RentLoopErrorParams{
			Err:      createErr,
			Metadata: map[string]string{"function": "Close", "action": "recording closure"},
		})
	}

	now := time.Now()
	account.Status = StatusClosed
	account.ClosedAt = &now

	if updateErr := s.accounts.Update(ctx, account); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Close", "action": "closing account"},
		})
	}

	return nil
}

// refundDeposit posts the reversing SECURITY_DEPOSIT instance. There is no
// refund-specific category by design: sign carries direction, so a negative
// deposit charge IS the refund and routes through the same journal case.
func (s *closureService) refundDeposit(
	ctx context.Context,
	accountID, currency string,
	views []ChargeView,
	amount int64,
) (*string, error) {
	var originalID string
	for _, view := range views {
		if view.Category == CategorySecurityDeposit && view.Amount > 0 {
			originalID = view.ID
			break
		}
	}

	if originalID == "" {
		return nil, pkg.BadRequestError("NoSecurityDepositToRefund", nil)
	}

	instance, err := s.charges.CreateAdHoc(ctx, CreateAdHocChargeInput{
		FinancialAccountID:       accountID,
		Name:                     "Security deposit release",
		Category:                 CategorySecurityDeposit,
		Amount:                   -amount,
		Currency:                 currency,
		DueDate:                  time.Now(),
		ReversesChargeInstanceID: &originalID,
	})
	if err != nil {
		return nil, err
	}

	id := instance.ID.String()

	return &id, nil
}

func (s *closureService) Reopen(ctx context.Context, input ReopenAccountInput) error {
	account, err := s.accounts.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &input.FinancialAccountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	if account.Status != StatusClosed {
		return pkg.BadRequestError("FinancialAccountNotClosed", nil)
	}

	if input.Reason == "" {
		return pkg.BadRequestError("ReopenReasonRequired", nil)
	}

	closure, closureErr := s.closures.GetByAccount(ctx, input.FinancialAccountID)
	if closureErr != nil {
		return pkg.NotFoundError("FinancialAccountClosureNotFound", &pkg.RentLoopErrorParams{Err: closureErr})
	}

	now := time.Now()
	closure.ReopenedAt = &now
	closure.ReopenedByID = &input.ReopenedByID
	closure.ReopenReason = &input.Reason

	if updateErr := s.closures.Update(ctx, closure); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Reopen", "action": "recording reopen"},
		})
	}

	account.Status = StatusActive
	account.ClosedAt = nil
	account.ClosureEligibleAt = nil

	if accountErr := s.accounts.Update(ctx, account); accountErr != nil {
		return pkg.InternalServerError(accountErr.Error(), &pkg.RentLoopErrorParams{
			Err:      accountErr,
			Metadata: map[string]string{"function": "Reopen", "action": "reopening account"},
		})
	}

	return nil
}
```

`CreateAdHocChargeInput` is declared at `internal/services/financials/charge.go:68-76` with exactly the fields used above. `AccountBalance` is at `balance.go:21`.

- [ ] **Step 6: Wire the service into the facade**

In `internal/services/financials/account.go`, add `Closure ClosureService` to the `Financials` struct. `New` cannot build it — the closure service needs a `LeaseTermReader`, which lives in the lease service and would be an import cycle — so follow the existing `SetIssuance` precedent:

```go
// SetClosure completes the facade once the lease service exists. Closure needs
// to read lease terms, and the lease service already depends on this package,
// so the dependency is injected after construction exactly as issuance is.
func (f *Financials) SetClosure(svc ClosureService) {
	f.Closure = svc
}
```

- [ ] **Step 7: Implement `LeaseTermReader` on the lease service**

In `internal/services/lease.go`, add the two methods. `ListTermsForAccount` reads every lease pointing at the account; `HasMoveOutEvidence` is true when any of those leases has a completed `LeaseTermination` or a `CHECK_OUT` checklist. Use the existing lease repository's list filter — add a `FinancialAccountID` filter to it if one is not already present, following the filters already there.

- [ ] **Step 8: Construct and inject in main**

In `cmd/rentloop-engine/main.go`, build `repository.NewFinancialAccountClosureRepository(db)`, then after the lease service is constructed call `financialsFacade.SetClosure(financials.NewClosureService(accountRepo, closureRepo, financialsFacade.Charges, leaseService))`.

- [ ] **Step 9: Run everything**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Expected: PASS. Leave changes **unstaged**. Stop here for review.

---

### Task 7: Approval — link the lease, merge a duplicate account, recompute eligibility

Three changes to the write paths, all in existing services.

**Files:**
- Modify: `internal/services/tenant-application.go:1310-1326` (`ApproveTenantApplication`)
- Modify: `internal/services/lease.go` (status transition methods, `attachFinancials` already done in Task 5)
- Test: `internal/services/financials/merge_test.go` (create)

**Interfaces:**
- Consumes: `ResolveForTenancy`, `Revive`, `LinkLease` (Task 5); `ChargeRepository.ReassignAccount` (Task 4); `ClosureService.RecomputeEligibility` (Task 6).
- Produces: `financials.ShouldMergeAccounts(stubID string, existing *models.FinancialAccount) bool`.

- [ ] **Step 1: Write the failing test**

Create `internal/services/financials/merge_test.go`:

```go
package financials

import (
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

// The ordinary approval: no prior relationship at this property, so the
// application-stage account simply becomes the tenancy's account.
func TestShouldMergeAccountsNoExistingAccount(t *testing.T) {
	if ShouldMergeAccounts("stub-id", nil) {
		t.Error("got merge, want no merge — there is no account to merge into")
	}
}

// A PM moved an existing tenant to another unit in the same property by
// raising a NEW application rather than a renewal. Left alone this yields two
// open accounts for one (tenant, property) and the verification invariant
// fails. The stub's charges move into the established account.
func TestShouldMergeAccountsExistingDifferentAccount(t *testing.T) {
	existing := &models.FinancialAccount{}
	existing.ID = mustUUID(t, "55555555-5555-5555-5555-555555555555")

	if !ShouldMergeAccounts("stub-id", existing) {
		t.Error("got no merge, want merge — the tenant already holds an open account here")
	}
}

// Resolution found the very account being approved. Merging it into itself
// would move every charge onto the account it already sits on.
func TestShouldMergeAccountsSameAccountIsNoop(t *testing.T) {
	existing := &models.FinancialAccount{}
	existing.ID = mustUUID(t, "55555555-5555-5555-5555-555555555555")

	if ShouldMergeAccounts("55555555-5555-5555-5555-555555555555", existing) {
		t.Error("got merge, want no merge — resolution returned the stub itself")
	}
}
```

Add the helper at the bottom of the same file:

```go
func mustUUID(t *testing.T, s string) uuid.UUID {
	t.Helper()

	id, err := uuid.FromString(s)
	if err != nil {
		t.Fatalf("parsing uuid %q: %v", s, err)
	}

	return id
}
```

with `"github.com/gofrs/uuid"` imported.

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/services/financials/ -run TestShouldMergeAccounts -v`
Expected: FAIL — `undefined: ShouldMergeAccounts`

- [ ] **Step 3: Write the predicate**

Append to `internal/services/financials/account_closure.go`:

```go
// ShouldMergeAccounts reports whether an approval has found a second open
// account for the same tenancy.
//
// This happens when a PM moves an existing tenant to another unit in the same
// property by raising a new application instead of a renewal: the application
// created a stub account, and the tenant already had one. Two open accounts
// for one (tenant, property) breaks the model's central invariant, so the
// stub's charges are re-pointed and the stub is closed MERGED.
func ShouldMergeAccounts(stubID string, existing *models.FinancialAccount) bool {
	if existing == nil {
		return false
	}

	return existing.ID.String() != stubID
}
```

Add `"github.com/Bendomey/rent-loop/services/main/internal/models"` to that file's imports if it is not already there.

- [ ] **Step 4: Run the test to verify it passes**

Run: `go test ./internal/services/financials/ -run TestShouldMergeAccounts -v`
Expected: PASS — 3 tests

- [ ] **Step 5: Rework the approval transition**

In `internal/services/tenant-application.go`, replace the `LinkLease` block at lines 1310-1326. Everything here runs inside the existing transaction, so a failure at any point rolls the whole approval back:

```go
	// The application -> lease financial transition.
	//
	// An application approved before charges were prepared simply has no
	// account yet; that is not an error.
	if stub, accErr := s.financials.Accounts.GetByApplication(
		transCtx, input.TenantApplicationID,
	); accErr == nil && stub != nil {
		accountID := stub.ID.String()

		// Does this tenant already have an open relationship at this property?
		// If so the stub is a duplicate: its charges move across and it closes.
		existing, resolveErr := s.financials.Accounts.ResolveForTenancy(
			transCtx, tenant.ID.String(), unit.PropertyID,
		)
		if resolveErr != nil {
			transaction.Rollback()
			return nil, resolveErr
		}

		if financials.ShouldMergeAccounts(accountID, existing) {
			if mergeErr := s.financials.Accounts.Merge(transCtx, accountID, existing.ID.String()); mergeErr != nil {
				transaction.Rollback()
				return nil, mergeErr
			}

			accountID = existing.ID.String()

			// A late approval can land on an account that already looked
			// finished. Reviving it is what stops a second account opening.
			if reviveErr := s.financials.Accounts.Revive(transCtx, accountID); reviveErr != nil {
				transaction.Rollback()
				return nil, reviveErr
			}
		}

		if linkErr := s.financials.Accounts.LinkLease(transCtx, accountID, tenant.ID.String()); linkErr != nil {
			transaction.Rollback()
			return nil, linkErr
		}

		// The other half of the link. Many leases point at one account, so
		// this FK lives on the lease.
		if leaseLinkErr := s.leaseService.SetFinancialAccount(
			transCtx, lease.ID.String(), accountID,
		); leaseLinkErr != nil {
			transaction.Rollback()
			return nil, leaseLinkErr
		}
	}
```

- [ ] **Step 6: Add `Merge` to the account service**

In `internal/services/financials/account.go`, add to the interface and implement:

```go
	// Merge moves every charge from a duplicate stub account onto the
	// established one and closes the stub. No amount changes — only ownership
	// — so the total balance across both accounts is identical before and
	// after. Must run inside a transaction.
	Merge(ctx context.Context, stubAccountID, targetAccountID string) error
```

```go
func (s *financialAccountService) Merge(ctx context.Context, stubAccountID, targetAccountID string) error {
	if err := s.charges.ReassignAccount(ctx, stubAccountID, targetAccountID); err != nil {
		return err
	}

	stub, err := s.repo.GetOne(ctx, repository.GetFinancialAccountQuery{ID: &stubAccountID})
	if err != nil {
		return pkg.NotFoundError("FinancialAccountNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	now := time.Now()
	stub.Status = StatusClosed
	stub.ClosedAt = &now

	if updateErr := s.repo.Update(ctx, stub); updateErr != nil {
		return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
			Err:      updateErr,
			Metadata: map[string]string{"function": "Merge", "action": "closing merged stub"},
		})
	}

	return nil
}
```

Add a matching `ReassignAccount` pass-through to `ChargeService` in `internal/services/financials/charge.go` that calls `s.repo.ReassignAccount`.

- [ ] **Step 7: Add `SetFinancialAccount` to the lease service**

In `internal/services/lease.go`, add a method that loads the lease, sets `FinancialAccountID`, and saves. Follow the shape of the update methods already in that file.

- [ ] **Step 8: Recompute eligibility on every lease status transition**

The transitions are, exactly:

| Method | File |
|---|---|
| `ActivateLease` | `internal/services/lease.go:428` |
| `CancelLease` | `internal/services/lease.go:539` |
| `CompleteLease` | `internal/services/lease.go:708` |
| `ActivateDueLeases` / `CompleteDueLeases` | `internal/services/lease.go:624`, `:660` — these call the two above; hook the singular methods, not the sweeps, or eligibility is recomputed twice |
| `Complete` (termination) | `internal/services/lease-termination.go:231` — this is what moves a lease to Terminated, and it lives in a different service |

At the end of each of `ActivateLease`, `CancelLease`, `CompleteLease` and `leaseTerminationService.Complete`, once the status write has succeeded and the lease has a `FinancialAccountID`, call:

```go
	if lease.FinancialAccountID != nil {
		if eligErr := s.financials.Closure.RecomputeEligibility(ctx, *lease.FinancialAccountID); eligErr != nil {
			// Eligibility is advisory — a failure here must not fail the
			// status change the user asked for. The daily sweep will correct it.
			log.WithError(eligErr).Error("[LeaseService] recomputing closure eligibility")
		}
	}
```

Activation matters as much as termination: activating a renewal on an account that had gone `CLOSURE_ELIGIBLE` must pull it back to `ACTIVE`.

- [ ] **Step 9: Run everything**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Expected: PASS. Leave changes **unstaged**. Stop here for review.

---

### Task 8: HTTP surface — the lease filter, close, reopen, eligibility

**Files:**
- Modify: `internal/handlers/financial-account.go` (`ListCharges` at :141, `GetAccount` at :106, plus two new handlers)
- Modify: `internal/router/client-user.go:384-391`
- Modify: `internal/transformations/` (account response — locate with `grep -rn "FinancialAccount" internal/transformations/`)

**Interfaces:**
- Consumes: `ClosureService` (Task 6); `ListChargeInstancesFilter.LeaseID` (Task 4).
- Produces: `GET /v1/financial-accounts/{account_id}/charges?lease_id=`; `POST /v1/financial-accounts/{account_id}/close`; `POST /v1/financial-accounts/{account_id}/reopen`; a `closure_eligibility` object on the account response.

- [ ] **Step 1: Add the lease filter to `ListCharges`**

In `internal/handlers/financial-account.go:141`, read the optional query parameter and pass it through. Follow the existing parameter handling in that file:

```go
	var leaseID *string
	if raw := r.URL.Query().Get("lease_id"); raw != "" {
		leaseID = &raw
	}
```

Pass it into the charge listing call. Update the godoc block above the handler with:

```go
// @Param lease_id query string false "Filter charges to one lease term. Omit for the whole tenancy."
```

- [ ] **Step 2: Embed eligibility on the account response**

In `GetAccount` (`:106`), call `h.financials.Closure.Eligibility(r.Context(), accountID)` and attach the result to the response DTO as `closure_eligibility`. Add the field to the transformation struct with a snake_case JSON tag — every JSON tag in this codebase is snake_case, and `ClosureGate` already carries its own tags from Task 2.

- [ ] **Step 3: Write the close handler**

Add to `internal/handlers/financial-account.go`:

```go
// CloseAccount closes a financial account.
//
// @Summary      Close a financial account
// @Description  Closes a tenancy's financial account. Blocking gates (leases ended, outstanding balance, deposit) must all pass; the deposit resolution says what happens to money still held. Releasing or offsetting posts a reversing SECURITY_DEPOSIT charge.
// @Tags         FinancialAccounts
// @Accept       json
// @Produce      json
// @Param        account_id  path      string                  true  "Financial account ID"
// @Param        body        body      CloseAccountRequest     true  "Closure decision"
// @Success      200         {object}  pkg.SuccessResponse
// @Failure      400         {object}  pkg.ErrorResponse
// @Failure      404         {object}  pkg.ErrorResponse
// @Security     BearerAuth
// @Router       /v1/financial-accounts/{account_id}/close [post]
func (h *FinancialAccountHandler) CloseAccount(w http.ResponseWriter, r *http.Request) {
```

with the request struct:

```go
type CloseAccountRequest struct {
	Reason               string  `json:"reason" validate:"required"`
	DepositResolution    string  `json:"deposit_resolution" validate:"omitempty,oneof=RELEASE OFFSET FORFEIT"`
	DepositForfeitReason *string `json:"deposit_forfeit_reason"`
}
```

The handler decodes, validates, reads the acting client user from context (follow the pattern already used by `UpdateBillingPolicy` at `:277`), calls `h.financials.Closure.Close`, and writes the standard success response.

- [ ] **Step 4: Write the reopen handler**

Same shape, with:

```go
type ReopenAccountRequest struct {
	Reason string `json:"reason" validate:"required"`
}
```

and `@Router /v1/financial-accounts/{account_id}/reopen [post]`.

- [ ] **Step 5: Register the routes**

In `internal/router/client-user.go`, inside the existing `r.Route("/financial-accounts/{account_id}", ...)` block at line 384, add the two POSTs behind the same ADMIN-or-OWNER role middleware the sibling write routes already use:

```go
							r.With(middlewares.ValidateRoleClientUserMiddleware("ADMIN", "OWNER")).
								Post("/close", handlers.FinancialAccountHandler.CloseAccount)
							r.With(middlewares.ValidateRoleClientUserMiddleware("ADMIN", "OWNER")).
								Post("/reopen", handlers.FinancialAccountHandler.ReopenAccount)
```

Copy the exact middleware invocation from the neighbouring `Post("/charges", ...)` line rather than the sketch above — match what is actually there.

- [ ] **Step 6: Regenerate docs and run**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Expected: PASS, and `docs/swagger.json` shows the two new paths and the `lease_id` parameter.

- [ ] **Step 7: Review**

Leave changes **unstaged**. Stop here for review.

---

### Task 9: Migration Job 1 — structure

Non-destructive. Adds every new column and table, renames one column, and leaves `financial_accounts.lease_id` in place so Job 2 has a source to read from.

**Files:**
- Create: `init/migration/jobs/add-shared-financial-account-links.go`
- Modify: `init/migration/main.go` (append to the job list)

**Interfaces:**
- Consumes: nothing.
- Produces: migration ID `202608180001_ADD_SHARED_FINANCIAL_ACCOUNT_LINKS`.

- [ ] **Step 1: Establish the existing column types**

The FK columns matter here. Some tables in this schema use `UUID` FKs (see `add-tenant-application-property-id.go`) while GORM-created `string` fields land as `text`. Job 2 joins across them, and `text = uuid` is a hard error in Postgres.

Run against a scratch database restored from a dump:

```bash
psql "$SCRATCH_DATABASE_URL" -c "\d financial_accounts" -c "\d charge_instances" -c "\d leases"
```

Record whether `financial_accounts.lease_id`, `charge_instances.financial_account_id` and `leases.id` are `uuid` or `text`. Job 2's SQL below uses explicit `CAST(... AS uuid)`, which is a no-op when the column is already `uuid` and a real conversion when it is `text` — so it is correct either way, but confirm the values are well-formed UUIDs before relying on it.

- [ ] **Step 2: Write the migration**

Create `init/migration/jobs/add-shared-financial-account-links.go`:

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddSharedFinancialAccountLinks makes one financial account able to span many
// leases.
//
// Structure only: financial_accounts.lease_id and its unique index survive
// this job so BackfillSharedFinancialAccounts has a source to read, and so a
// rollback costs nothing. DropFinancialAccountLeaseID removes them later,
// behind an explicit opt-in.
func AddSharedFinancialAccountLinks() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608180001_ADD_SHARED_FINANCIAL_ACCOUNT_LINKS",
		Migrate: func(db *gorm.DB) error {
			statements := []string{
				`ALTER TABLE leases ADD COLUMN IF NOT EXISTS financial_account_id UUID REFERENCES financial_accounts(id)`,
				`CREATE INDEX IF NOT EXISTS idx_leases_financial_account_id ON leases(financial_account_id)`,

				`ALTER TABLE charge_definitions ADD COLUMN IF NOT EXISTS lease_id UUID REFERENCES leases(id)`,
				`CREATE INDEX IF NOT EXISTS idx_charge_definitions_lease_id ON charge_definitions(lease_id)`,

				`ALTER TABLE charge_instances ADD COLUMN IF NOT EXISTS lease_id UUID REFERENCES leases(id)`,
				`CREATE INDEX IF NOT EXISTS idx_charge_instances_lease_id ON charge_instances(lease_id)`,

				`ALTER TABLE financial_accounts ADD COLUMN IF NOT EXISTS closure_eligible_at TIMESTAMPTZ`,

				// RENAME COLUMN is not idempotent, so it is guarded. Running
				// this job twice must not fail.
				`DO $$
				 BEGIN
					IF EXISTS (
						SELECT 1 FROM information_schema.columns
						WHERE table_name = 'financial_accounts'
						  AND column_name = 'tenant_application_id'
					) AND NOT EXISTS (
						SELECT 1 FROM information_schema.columns
						WHERE table_name = 'financial_accounts'
						  AND column_name = 'origin_tenant_application_id'
					) THEN
						ALTER TABLE financial_accounts
							RENAME COLUMN tenant_application_id TO origin_tenant_application_id;
					END IF;
				 END $$`,

				`CREATE TABLE IF NOT EXISTS financial_account_closures (
					id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
					created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
					deleted_at TIMESTAMPTZ,
					financial_account_id UUID NOT NULL REFERENCES financial_accounts(id),
					reason TEXT NOT NULL,
					closed_at TIMESTAMPTZ NOT NULL,
					closed_by_id UUID NOT NULL,
					outstanding_at_closure BIGINT NOT NULL DEFAULT 0,
					deposit_held_amount BIGINT NOT NULL DEFAULT 0,
					deposit_refund_charge_instance_id UUID,
					deposit_forfeited_amount BIGINT NOT NULL DEFAULT 0,
					reopened_at TIMESTAMPTZ,
					reopened_by_id UUID,
					reopen_reason TEXT
				)`,
				`CREATE INDEX IF NOT EXISTS idx_financial_account_closures_account
					ON financial_account_closures(financial_account_id)`,
				`CREATE INDEX IF NOT EXISTS idx_financial_account_closures_deleted_at
					ON financial_account_closures(deleted_at)`,
			}

			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			statements := []string{
				`DROP TABLE IF EXISTS financial_account_closures`,
				`DO $$
				 BEGIN
					IF EXISTS (
						SELECT 1 FROM information_schema.columns
						WHERE table_name = 'financial_accounts'
						  AND column_name = 'origin_tenant_application_id'
					) THEN
						ALTER TABLE financial_accounts
							RENAME COLUMN origin_tenant_application_id TO tenant_application_id;
					END IF;
				 END $$`,
				`ALTER TABLE financial_accounts DROP COLUMN IF EXISTS closure_eligible_at`,
				`ALTER TABLE charge_instances DROP COLUMN IF EXISTS lease_id`,
				`ALTER TABLE charge_definitions DROP COLUMN IF EXISTS lease_id`,
				`ALTER TABLE leases DROP COLUMN IF EXISTS financial_account_id`,
			}

			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}

			return nil
		},
	}
}
```

- [ ] **Step 3: Register it**

In `init/migration/main.go`, append to the end of the `[]*gormigrate.Migration{...}` list:

```go
		jobs.AddSharedFinancialAccountLinks(),
```

- [ ] **Step 4: Run it against a scratch database**

```bash
createdb rentloop_shared_account_rehearsal
pg_restore -d rentloop_shared_account_rehearsal --no-owner --no-privileges <prod dump>
DB_NAME=rentloop_shared_account_rehearsal make update-db
```

Expected: the job logs as applied. Then confirm:

```bash
psql "$SCRATCH_DATABASE_URL" -c "\d leases" -c "\d charge_instances" -c "\d financial_account_closures"
```

Expected: `leases.financial_account_id`, `charge_instances.lease_id` and the closures table all exist; `financial_accounts.origin_tenant_application_id` has replaced `tenant_application_id`.

- [ ] **Step 5: Run it twice**

Run `make update-db` again. Expected: no error — gormigrate skips the applied ID, and the guarded rename would be a no-op regardless.

- [ ] **Step 6: Review**

Run: `make lint-fix && go build ./...`. Leave changes **unstaged**. Stop here for review.

---

### Task 10: Migration Job 2 — backfill

Non-destructive. Every statement is idempotent, because this will be run against a rehearsal database more than once.

**Files:**
- Create: `init/migration/jobs/backfill-shared-financial-accounts.go`
- Modify: `init/migration/main.go`

**Interfaces:**
- Consumes: the columns from Job 1.
- Produces: migration ID `202608180002_BACKFILL_SHARED_FINANCIAL_ACCOUNTS`.

- [ ] **Step 1: Capture the before-balance**

Before writing any code, record the number this migration must not change:

```bash
psql "$SCRATCH_DATABASE_URL" -c "
SELECT COALESCE(SUM(amount - settled_amount), 0) AS total_outstanding
FROM charge_instances
WHERE deleted_at IS NULL AND voided_at IS NULL;"
```

Write the figure down. Step 6 asserts it is unchanged.

- [ ] **Step 2: Write the migration**

Create `init/migration/jobs/backfill-shared-financial-accounts.go`:

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// BackfillSharedFinancialAccounts populates the new links from the old ones.
//
// The lease scoping keys off period_start, never created_at. After the v2
// backfill every charge instance carries created_at = 2026-08-11 while real
// periods span 2018 to 2030, so row-creation time is a migration artifact and
// would attach charges to whichever term happened to be current on the day the
// backfill ran.
//
// Instances with no period, or whose period falls outside every term, keep a
// NULL lease_id. That is correct rather than a gap: a deposit taken before any
// term began belongs to the relationship, not to a contract.
//
// No amount is written anywhere in this job. Total outstanding is identical
// before and after.
func BackfillSharedFinancialAccounts() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608180002_BACKFILL_SHARED_FINANCIAL_ACCOUNTS",
		Migrate: func(db *gorm.DB) error {
			statements := []string{
				// 1. Leases point at accounts. Today's mapping is a clean 1:1
				//    through the column Job 3 will drop.
				`UPDATE leases l
				 SET financial_account_id = fa.id
				 FROM financial_accounts fa
				 WHERE CAST(fa.lease_id AS uuid) = l.id
				   AND fa.deleted_at IS NULL
				   AND l.financial_account_id IS NULL`,

				// 2. Charge instances gain contractual context, matched by the
				//    period they cover against the term that contains it.
				`UPDATE charge_instances ci
				 SET lease_id = l.id
				 FROM leases l
				 WHERE l.financial_account_id = ci.financial_account_id
				   AND l.deleted_at IS NULL
				   AND ci.lease_id IS NULL
				   AND ci.period_start IS NOT NULL
				   AND ci.period_start >= l.move_in_date
				   AND (l.move_out_date IS NULL OR ci.period_start < l.move_out_date)`,

				// 3. Definitions, by the same rule on their start date.
				`UPDATE charge_definitions cd
				 SET lease_id = l.id
				 FROM leases l
				 WHERE l.financial_account_id = cd.financial_account_id
				   AND l.deleted_at IS NULL
				   AND cd.lease_id IS NULL
				   AND cd.start_date IS NOT NULL
				   AND cd.start_date >= l.move_in_date
				   AND (l.move_out_date IS NULL OR cd.start_date < l.move_out_date)`,

				// 4. Identity columns must be populated on every account —
				//    they now decide whether a new lease joins this
				//    relationship. Property comes via the originating
				//    application's unit; tenant via the linked lease.
				`UPDATE financial_accounts fa
				 SET tenant_id = l.tenant_id
				 FROM leases l
				 WHERE l.financial_account_id = fa.id
				   AND l.deleted_at IS NULL
				   AND fa.tenant_id IS NULL`,

				`UPDATE financial_accounts fa
				 SET property_id = u.property_id
				 FROM leases l
				 JOIN units u ON u.id = l.unit_id
				 WHERE l.financial_account_id = fa.id
				   AND l.deleted_at IS NULL
				   AND fa.property_id IS NULL`,
			}

			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			statements := []string{
				`UPDATE charge_definitions SET lease_id = NULL`,
				`UPDATE charge_instances SET lease_id = NULL`,
				`UPDATE leases SET financial_account_id = NULL`,
			}

			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}

			return nil
		},
	}
}
```

The rollback deliberately leaves `tenant_id` and `property_id` populated: they were nullable reporting columns before this change and filling them is not something to undo.

- [ ] **Step 3: Register and run it**

Append `jobs.BackfillSharedFinancialAccounts(),` to the list in `init/migration/main.go`, then `DB_NAME=rentloop_shared_account_rehearsal make update-db`.

- [ ] **Step 4: Check accounts with no identity**

```bash
psql "$SCRATCH_DATABASE_URL" -c "
SELECT id, code, status, tenant_id, property_id
FROM financial_accounts
WHERE deleted_at IS NULL AND (tenant_id IS NULL OR property_id IS NULL);"
```

Expected: only application-stage accounts (no lease points at them). Any account **with** a lease and a NULL identity column is a migration failure — investigate before continuing rather than patching the row by hand.

- [ ] **Step 5: Check the lease scoping landed**

```bash
psql "$SCRATCH_DATABASE_URL" -c "
SELECT
  COUNT(*) FILTER (WHERE lease_id IS NOT NULL) AS scoped,
  COUNT(*) FILTER (WHERE lease_id IS NULL AND period_start IS NOT NULL) AS unscoped_with_period,
  COUNT(*) FILTER (WHERE period_start IS NULL) AS no_period
FROM charge_instances
WHERE deleted_at IS NULL;"
```

`no_period` rows are expected — deposits and one-offs. A large `unscoped_with_period` count means the period-to-term match is failing; inspect a sample before proceeding.

- [ ] **Step 6: Assert the balance did not move**

Re-run the query from Step 1. Expected: **byte-identical** to the figure recorded there. If it differs, roll back and stop — this job writes no amounts, so any change is a bug.

- [ ] **Step 7: Repair lease `2608NHQ8DS`**

This lease is the one production renewal, created by hand before the feature existed. It has no account; its money — a year of rent paid in advance, 660,000 pesewas — sits in legacy `leases.meta` under `initial_deposit_fee`.

First read the facts off the dump:

```bash
psql "$SCRATCH_DATABASE_URL" -c "
SELECT l.id, l.code, l.parent_lease_id, l.rent_fee, l.payment_frequency,
       l.move_in_date, l.move_out_date, l.meta,
       parent.code AS parent_code, fa.id AS parent_account_id
FROM leases l
LEFT JOIN leases parent ON parent.id = l.parent_lease_id
LEFT JOIN financial_accounts fa ON fa.id = parent.financial_account_id
WHERE l.code = '2608NHQ8DS';"
```

Record `rent_fee` — the number of prepaid periods is `660000 / rent_fee`, and everything below depends on it.

Then, in the same job, append statements that:

1. set `leases.financial_account_id` on `2608NHQ8DS` to the parent's account id;
2. insert one `charge_instances` row per period of the term (`move_in_date` → `move_out_date` at `payment_frequency`), each with `financial_account_id` = that account, `lease_id` = `2608NHQ8DS`, `category = 'RENT'`, `amount = rent_fee`, and `period_start` / `due_date` stepping by the frequency;
3. insert one `payments` row for 660,000 with `rail = 'OFFLINE'` and a reference marking it migrated, against an invoice composed for the settled periods — follow whatever shape `verify-financial-invariants.sql` asserts for the payment → invoice → allocation chain;
4. insert `payment_allocations` covering the first `660000 / rent_fee` instances in due-date order, and set each covered instance's `settled_amount` to its `amount`.

Write these as explicit `INSERT ... WHERE NOT EXISTS` statements keyed on the lease code so re-running is safe. **Do not** write `settled_amount` without the matching allocation rows: settlement is derived from allocations everywhere else, and a settled charge with nothing behind it is exactly the desync the ledger's design avoids.

- [ ] **Step 8: Verify the repair**

```bash
psql "$SCRATCH_DATABASE_URL" -c "
SELECT ci.name, ci.amount, ci.settled_amount, ci.period_start
FROM charge_instances ci
JOIN leases l ON l.id = ci.lease_id
WHERE l.code = '2608NHQ8DS'
ORDER BY ci.period_start;"
```

Expected: one row per period of the term; the first `660000 / rent_fee` fully settled, the remainder settled 0. Re-run Step 1's balance query and confirm it increased by exactly the unsettled remainder of this lease's term and nothing else.

- [ ] **Step 9: Review**

Leave changes **unstaged**. Stop here for review.

---

### Task 11: Migration Job 3 — drop the old column, behind an opt-in

Destructive and irreversible for data. Follows the `FINANCIAL_MIGRATION_ALLOW_DROP` precedent from the v2 rollout: the job is **not registered at all** unless the environment variable is set, so it is not recorded as applied and will still run later when you do set it.

**Files:**
- Create: `init/migration/jobs/drop-financial-account-lease-id.go`
- Modify: `init/migration/main.go` (conditional registration)

**Interfaces:**
- Consumes: Job 2 having populated `leases.financial_account_id`.
- Produces: migration ID `202608180003_DROP_FINANCIAL_ACCOUNT_LEASE_ID`.

- [ ] **Step 1: Write the migration**

Create `init/migration/jobs/drop-financial-account-lease-id.go`:

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// DropFinancialAccountLeaseID removes the column that made one-account-per-
// lease structural.
//
// DESTRUCTIVE. The unique index on financial_accounts.lease_id is the thing
// preventing a renewal from sharing its parent's account, so it cannot stay —
// but once dropped, the application -> lease mapping it held exists only in
// leases.financial_account_id. Run BackfillSharedFinancialAccounts first and
// verify it, because the Rollback below restores structure only. The data is
// gone.
func DropFinancialAccountLeaseID() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608180003_DROP_FINANCIAL_ACCOUNT_LEASE_ID",
		Migrate: func(db *gorm.DB) error {
			// Refuse to drop while any account still has a lease_id that did
			// not make it onto the lease. Losing that mapping silently is the
			// one outcome this job must never produce.
			var orphans int64
			countErr := db.Raw(`
				SELECT COUNT(*)
				FROM financial_accounts fa
				WHERE fa.deleted_at IS NULL
				  AND fa.lease_id IS NOT NULL
				  AND NOT EXISTS (
					SELECT 1 FROM leases l
					WHERE l.id = CAST(fa.lease_id AS uuid)
					  AND l.financial_account_id = fa.id
				  )
			`).Scan(&orphans).Error
			if countErr != nil {
				return countErr
			}

			if orphans > 0 {
				return gorm.ErrInvalidData
			}

			statements := []string{
				`DROP INDEX IF EXISTS idx_financial_accounts_lease_id`,
				`ALTER TABLE financial_accounts DROP COLUMN IF EXISTS lease_id`,
			}

			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			// Structure only. The mapping is not restored — it lives on the
			// leases table now.
			return db.Exec(`ALTER TABLE financial_accounts ADD COLUMN IF NOT EXISTS lease_id UUID`).Error
		},
	}
}
```

Confirm the real index name before writing the `DROP INDEX` line:

```bash
psql "$SCRATCH_DATABASE_URL" -c "\d financial_accounts" | grep -i lease_id
```

GORM names unique indexes from the struct tag, so it may be `idx_financial_accounts_lease_id` or a generated variant. Use what is actually there.

- [ ] **Step 2: Register it conditionally**

In `init/migration/main.go`, follow the existing opt-in pattern. Build the job slice, then append only when the environment allows:

```go
	migrations := []*gormigrate.Migration{
		// ... existing jobs ...
		jobs.AddSharedFinancialAccountLinks(),
		jobs.BackfillSharedFinancialAccounts(),
	}

	if os.Getenv("SHARED_ACCOUNT_MIGRATION_ALLOW_DROP") == "true" {
		log.Info("[Migration] SHARED_ACCOUNT_MIGRATION_ALLOW_DROP is set — financial_accounts.lease_id will be DROPPED")
		migrations = append(migrations, jobs.DropFinancialAccountLeaseID())
	} else {
		log.Info("[Migration] skipping DropFinancialAccountLeaseID (set SHARED_ACCOUNT_MIGRATION_ALLOW_DROP=true to run it)")
	}

	m = gormigrate.New(db, gormigrate.DefaultOptions, migrations)
```

Add `"os"` to the imports.

- [ ] **Step 3: Verify the default is safe**

Run: `DB_NAME=rentloop_shared_account_rehearsal make update-db`
Expected: the skip line is logged and `financial_accounts.lease_id` still exists.

- [ ] **Step 4: Verify the guard bites**

On the rehearsal database, deliberately break one mapping and confirm the job refuses:

```bash
psql "$SCRATCH_DATABASE_URL" -c "UPDATE leases SET financial_account_id = NULL WHERE id = (SELECT id FROM leases WHERE financial_account_id IS NOT NULL LIMIT 1);"
SHARED_ACCOUNT_MIGRATION_ALLOW_DROP=true DB_NAME=rentloop_shared_account_rehearsal make update-db
```

Expected: the migration errors and the column survives. Then repair the row by re-running Job 2's first statement and confirm the drop succeeds.

- [ ] **Step 5: Review**

Run: `make lint-fix && go build ./...`. Leave changes **unstaged**. Stop here for review.

---

### Task 12: Verification SQL

**Files:**
- Create: `services/main/scripts/verify-shared-account-invariants.sql`

**Interfaces:**
- Consumes: the post-migration schema.
- Produces: a script that prints one row per invariant with a PASS/FAIL verdict, alongside the existing `verify-financial-invariants.sql`.

- [ ] **Step 1: Read the existing script's conventions**

Run: `sed -n '1,40p' services/main/scripts/verify-financial-invariants.sql`

Match its output shape — the new script must be readable next to it.

- [ ] **Step 2: Write the script**

Create `services/main/scripts/verify-shared-account-invariants.sql`:

```sql
-- Invariants for the shared financial account model.
--
-- Run against a rehearsal database after AddSharedFinancialAccountLinks and
-- BackfillSharedFinancialAccounts, and again after DropFinancialAccountLeaseID.
-- Every row must report PASS.

\echo '== 1. Every non-cancelled lease has an account =='
SELECT
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS verdict,
    COUNT(*) AS leases_without_account
FROM leases
WHERE deleted_at IS NULL
  AND status != 'Lease.Status.Cancelled'
  AND financial_account_id IS NULL;

\echo '== 2. Every scoped charge points at a lease on its OWN account =='
SELECT
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS verdict,
    COUNT(*) AS mismatched_instances
FROM charge_instances ci
JOIN leases l ON l.id = ci.lease_id
WHERE ci.deleted_at IS NULL
  AND ci.lease_id IS NOT NULL
  AND l.financial_account_id IS DISTINCT FROM ci.financial_account_id;

\echo '== 3. An instance agrees with its definition on the lease =='
SELECT
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS verdict,
    COUNT(*) AS disagreements
FROM charge_instances ci
JOIN charge_definitions cd ON cd.id = ci.charge_definition_id
WHERE ci.deleted_at IS NULL
  AND ci.lease_id IS NOT NULL
  AND cd.lease_id IS NOT NULL
  AND ci.lease_id != cd.lease_id;

\echo '== 4. One open account per (tenant, property) =='
SELECT
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS verdict,
    COUNT(*) AS duplicate_pairs
FROM (
    SELECT tenant_id, property_id
    FROM financial_accounts
    WHERE deleted_at IS NULL
      AND status IN ('ACTIVE', 'CLOSURE_ELIGIBLE')
      AND tenant_id IS NOT NULL
      AND property_id IS NOT NULL
    GROUP BY tenant_id, property_id
    HAVING COUNT(*) > 1
) duplicates;

\echo '== 5. No account with a lease is missing its identity columns =='
SELECT
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS verdict,
    COUNT(*) AS accounts_missing_identity
FROM financial_accounts fa
WHERE fa.deleted_at IS NULL
  AND (fa.tenant_id IS NULL OR fa.property_id IS NULL)
  AND EXISTS (SELECT 1 FROM leases l WHERE l.financial_account_id = fa.id AND l.deleted_at IS NULL);

\echo '== 6. No CLOSURE_ELIGIBLE account has a live lease =='
\echo '   (the deposit-refunded-to-a-sitting-tenant invariant)'
SELECT
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS verdict,
    COUNT(*) AS eligible_with_live_lease
FROM financial_accounts fa
JOIN leases l ON l.financial_account_id = fa.id
WHERE fa.deleted_at IS NULL
  AND l.deleted_at IS NULL
  AND fa.status IN ('CLOSURE_ELIGIBLE', 'CLOSED')
  AND l.status IN ('Lease.Status.Pending', 'Lease.Status.Active');

\echo '== 7. Total outstanding — compare against the pre-migration figure =='
SELECT COALESCE(SUM(amount - settled_amount), 0) AS total_outstanding
FROM charge_instances
WHERE deleted_at IS NULL AND voided_at IS NULL;
```

- [ ] **Step 3: Run it**

Run: `psql "$SCRATCH_DATABASE_URL" -f services/main/scripts/verify-shared-account-invariants.sql`
Expected: PASS on checks 1-6, and check 7 matching the figure recorded in Task 10 Step 1 plus only the unsettled remainder of lease `2608NHQ8DS`.

- [ ] **Step 4: Review**

Leave changes **unstaged**. Stop here for review.

---

### Task 13: End-to-end scenarios

Groups `a` through `i` are taken; this is group `j`. Follow the shape of `scripts/e2e/cases/h1-deposit-refund.sh`, which already exercises a reversing deposit charge.

**Files:**
- Create: `services/main/scripts/e2e/cases/j1-shared-account-two-leases.sh`
- Create: `services/main/scripts/e2e/cases/j2-closure-blocked-by-balance.sh`
- Create: `services/main/scripts/e2e/cases/j3-closure-releases-deposit.sh`
- Modify: `services/main/scripts/e2e/fixtures.sh` (helpers for the new endpoints)

**Interfaces:**
- Consumes: everything above.
- Produces: three cases in `run-all.sh`'s sweep.

- [ ] **Step 1: Read the patterns**

Run:
```bash
cat services/main/scripts/e2e/cases/h1-deposit-refund.sh
sed -n '150,210p' services/main/scripts/e2e/fixtures.sh
```

Note `case_begin`, `assert_eq`, `assert_invariants`, and how helpers post to the API through `papi`.

- [ ] **Step 2: Add fixtures**

Append to `services/main/scripts/e2e/fixtures.sh`:

```bash
# close_account ACCOUNT_ID REASON [DEPOSIT_RESOLUTION] — closes an account.
close_account() {
	papi POST "/financial-accounts/$1/close" \
		"$(jq -nc --arg r "$2" --arg d "${3:-RELEASE}" \
			'{reason:$r, deposit_resolution:$d}')"
}

# reopen_account ACCOUNT_ID REASON
reopen_account() {
	papi POST "/financial-accounts/$1/reopen" \
		"$(jq -nc --arg r "$2" '{reason:$r}')"
}

# charges_for_lease ACCOUNT_ID LEASE_ID — the "This Lease" view.
charges_for_lease() {
	papi GET "/financial-accounts/$1/charges?lease_id=$2" ""
}
```

- [ ] **Step 3: Write `j1-shared-account-two-leases.sh`**

Asserts the core of the model. Build an account through the normal approval flow, then create a second lease on the same account (until the renewal endpoint exists in spec 2, do this by calling `SetFinancialAccount`'s effect through a direct lease creation with the same account). Then assert:

- the account's total charged equals lease one's charges **plus** lease two's — one balance, not two
- `charges_for_lease ACCOUNT LEASE_ONE` returns only lease one's charges
- `charges_for_lease ACCOUNT LEASE_TWO` returns only lease two's
- the two filtered sets sum to the unfiltered set
- `assert_invariants "$ACCOUNT_ID" "after second lease"` passes

- [ ] **Step 4: Write `j2-closure-blocked-by-balance.sh`**

End every lease on the account while leaving one rent charge unpaid. Assert:

- the account reaches `CLOSURE_ELIGIBLE`
- the account response's `closure_eligibility.can_close` is `false`
- the `OUTSTANDING_BALANCE` gate reports `passed: false, blocking: true`
- `close_account` returns a 400 and the account is still not `CLOSED`

- [ ] **Step 5: Write `j3-closure-releases-deposit.sh`**

Same setup but fully paid, with a security deposit held. Assert:

- `closure_eligibility.deposit_held_amount` equals the deposit taken
- `close_account "$ACCOUNT_ID" "tenancy ended" RELEASE` succeeds
- a negative `SECURITY_DEPOSIT` charge instance now exists for the held amount
- `DepositHeld` nets to zero — re-read the account and assert `deposit_held_amount` is 0
- the account status is `CLOSED`
- `assert_invariants` still passes

- [ ] **Step 6: Run the whole suite**

Run: `cd services/main/scripts/e2e && ./run-all.sh`
Expected: every case passes, groups `a` through `j`. Existing cases passing unchanged is the real check here — it is what proves the `lease_id` column did not disturb balance, invoicing or allocation.

- [ ] **Step 7: Final review**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Expected: PASS. Leave all changes **unstaged** for the user to commit.

---

## Rollout

Migrations do not run on deploy — there is no `release_command` in either Fly config, so each job is run manually against the target database. Order:

1. Rehearse the full sequence against a restored prod dump (Tasks 9-12).
2. Run `make update-db` in production — Jobs 1 and 2 only; Job 3 stays unregistered.
3. Run `verify-shared-account-invariants.sql`. All six checks PASS, and total outstanding matches the pre-migration figure.
4. Deploy the application.
5. Only once the deployed app is confirmed healthy: `SHARED_ACCOUNT_MIGRATION_ALLOW_DROP=true make update-db` for Job 3.
6. Re-run the verification script.

Step 4 must come after step 2, not before: the renamed `origin_tenant_application_id` column means the new binary cannot talk to the old schema.
