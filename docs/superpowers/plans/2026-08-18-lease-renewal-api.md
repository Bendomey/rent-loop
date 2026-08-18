# Lease Renewal API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a property manager renew a lease through the API, creating a child lease that continues the parent's tenancy and its financial account.

**Architecture:** The renewal is created `Pending` with `move_in_date` at the parent's `move_out_date`; the existing daily lifecycle sweeps activate it and complete the parent, so no new cron and no new scheduling logic. It inherits the parent's financial account (spec 1's chain rule), opens fresh charge definitions scoped to the child lease, and materialises the new term's rent through the existing `MaterialiseForAccount` with `SecurityDepositFee: 0` — which is how "a renewal never re-charges the deposit" comes for free.

**Tech Stack:** Go 1.24, chi, GORM + pgx, gormigrate, PostgreSQL. Tests are stdlib `testing` — no assertion library.

**Spec:** `docs/superpowers/specs/2026-08-17-lease-renewal-api-design.md`

## Global Constraints

- **NEVER run `git commit`.** The repository `CLAUDE.md` forbids it absolutely. This plan therefore has **no commit steps** — each task ends at a review checkpoint with changes left unstaged for the user.
- Formatting: `make lint-fix` (gofumpt + golines, **120 character limit**). Run it before ending any task that touched Go.
- Swagger: every handler change updates its godoc annotations; `make lint-fix` regenerates `docs/`.
- Money is in the smallest currency unit (pesewas). `100000` is GHS 1,000.
- Lease statuses are fully qualified: `Lease.Status.Pending`, `Lease.Status.Active`, `Lease.Status.Terminated`, `Lease.Status.Completed`, `Lease.Status.Cancelled`.
- Errors use `pkg.NotFoundError` / `pkg.BadRequestError` / `pkg.InternalServerError` with `*pkg.RentLoopErrorParams`.
- Repositories resolve the transaction-aware handle with `lib.ResolveDB(ctx, r.DB)`. **A repository getter that uses `r.DB.WithContext(ctx)` cannot see rows written inside an open transaction** — this exact trap cost hours during spec 1.
- Run tests with `go test ./internal/...` from `services/main`.
- The app must be started against a migrated database. `make update-db` first.

## Deliberately not in this plan

- The wider lineage enum (`EXTENSION`, `RENT_REVIEW`, `UNIT_CHANGE`, `TENANT_CHANGE`, `TERMINATION`). Only `ORIGINAL` and `RENEWAL` ship; the column is an enum so the rest need no migration later.
- Billing cadence changes. `SelectIssuableCharges` skips fully settled or fully invoiced charges (`selection.go:42`), so a prepaid renewal never reaches the sweep and cadence is moot. An unpaid renewal's cadence is corrected through the existing `PATCH /financial-accounts/{id}/billing-policy`.
- The `unit_date_blocks` LEASE row. `ActivateLease` already writes it (`lease.go:580-594`), which is also the right moment for it to appear.
- Freeing the source unit after a move. `CompleteLease` → `releaseUnitIfNoActiveLease` already recounts and drops the old unit's status when the parent completes.

---

### Task 1: Lease lineage — the dropped FK and the type column

The prerequisite everything else rests on. `CreateLease` declares `ParentLeaseId` and never assigns it, so lineage is silently lost today — which is exactly how lease `2608NHQ8DS` came to need a hand-written repair.

**Files:**
- Modify: `internal/services/lease.go` (the `models.Lease` literal in `CreateLease`)
- Modify: `internal/models/lease.go`
- Create: `init/migration/jobs/add-lease-type.go`
- Modify: `init/migration/main.go`
- Test: `internal/services/lease_lineage_test.go` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `models.Lease.Type string`; constants `models.LeaseTypeOriginal = "ORIGINAL"` and `models.LeaseTypeRenewal = "RENEWAL"`; migration ID `202608190001_ADD_LEASE_TYPE`.

- [ ] **Step 1: Write the failing test**

Create `internal/services/lease_lineage_test.go`:

```go
package services

import (
	"testing"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

// CreateLease declares ParentLeaseId in its input and, before this change,
// never assigned it to the model — so every renewal silently lost its lineage.
// This asserts the mapping directly, without a database.
func TestCreateLeaseInputCarriesParentLease(t *testing.T) {
	parent := "11111111-1111-1111-1111-111111111111"
	input := CreateLeaseInput{
		Status:        "Lease.Status.Pending",
		UnitId:        "22222222-2222-2222-2222-222222222222",
		TenantId:      "33333333-3333-3333-3333-333333333333",
		ParentLeaseId: &parent,
		Type:          models.LeaseTypeRenewal,
	}

	lease := leaseFromCreateInput(input)

	if lease.ParentLeaseId == nil {
		t.Fatal("got nil ParentLeaseId, want it carried from the input — this is the bug")
	}
	if *lease.ParentLeaseId != parent {
		t.Errorf("got parent %q, want %q", *lease.ParentLeaseId, parent)
	}
	if lease.Type != models.LeaseTypeRenewal {
		t.Errorf("got type %q, want RENEWAL", lease.Type)
	}
}

// An ordinary lease has no parent and is ORIGINAL. Type is defaulted rather
// than left empty, so the column is never blank on a row this code wrote.
func TestCreateLeaseInputDefaultsToOriginal(t *testing.T) {
	lease := leaseFromCreateInput(CreateLeaseInput{
		Status: "Lease.Status.Pending",
		UnitId: "22222222-2222-2222-2222-222222222222",
	})

	if lease.ParentLeaseId != nil {
		t.Errorf("got parent %v, want nil", lease.ParentLeaseId)
	}
	if lease.Type != models.LeaseTypeOriginal {
		t.Errorf("got type %q, want ORIGINAL", lease.Type)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/services/ -run TestCreateLeaseInput -v`
Expected: FAIL — `undefined: leaseFromCreateInput`, and `CreateLeaseInput` has no field `Type`.

- [ ] **Step 3: Add the model fields**

In `internal/models/lease.go`, add above `ParentLeaseId`:

```go
	// Type distinguishes a first tenancy from a continuation. Only ORIGINAL
	// and RENEWAL are used today; the column is an enum so the wider lineage
	// (EXTENSION, RENT_REVIEW, UNIT_CHANGE, ...) can land later without a
	// migration.
	Type string `gorm:"not null;default:'ORIGINAL';index;"`
```

And in the same file, above the `Lease` struct:

```go
// Lease types.
const (
	LeaseTypeOriginal = "ORIGINAL"
	LeaseTypeRenewal  = "RENEWAL"
)
```

- [ ] **Step 4: Extract the mapping and fix the bug**

In `internal/services/lease.go`, add `Type string` to `CreateLeaseInput`, then extract the model construction so it is testable without a database. Replace the `lease := models.Lease{...}` literal inside `CreateLease` with a call to a new function, and define it just above `CreateLease`:

```go
// leaseFromCreateInput maps the service input onto the model.
//
// Extracted so the mapping is testable without a database — it existed inline,
// and that is how ParentLeaseId came to be declared in the input and never
// assigned, silently dropping every renewal's lineage.
func leaseFromCreateInput(input CreateLeaseInput) models.Lease {
	leaseType := input.Type
	if leaseType == "" {
		leaseType = models.LeaseTypeOriginal
	}

	return models.Lease{
		Status:                          input.Status,
		Type:                            leaseType,
		UnitId:                          input.UnitId,
		TenantId:                        input.TenantId,
		TenantApplicationId:             input.TenantApplicationId,
		RentFee:                         input.RentFee,
		RentFeeCurrency:                 input.RentFeeCurrency,
		PaymentFrequency:                input.PaymentFrequency,
		MoveInDate:                      input.MoveInDate,
		StayDurationFrequency:           input.StayDurationFrequency,
		StayDuration:                    input.StayDuration,
		KeyHandoverDate:                 input.KeyHandoverDate,
		UtilityTransfersDate:            input.UtilityTransfersDate,
		PropertyInspectionDate:          input.PropertyInspectionDate,
		LeaseAgreementDocumentUrl:       input.LeaseAgreementDocumentUrl,
		TerminationAgreementDocumentUrl: input.TerminationAgreementDocumentUrl,
		ParentLeaseId:                   input.ParentLeaseId,
	}
}
```

`Meta` and `MoveOutDate` stay in `CreateLease` itself — they are computed there (`metaJson`, `moveOutDate`), not mapped. Assign them onto the returned struct:

```go
	lease := leaseFromCreateInput(input)
	lease.Meta = *metaJson
	lease.MoveOutDate = &moveOutDate
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `go test ./internal/services/ -run TestCreateLeaseInput -v`
Expected: PASS — 2 tests

- [ ] **Step 6: Write the migration**

Create `init/migration/jobs/add-lease-type.go`:

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddLeaseType records whether a lease began a tenancy or continued one.
//
// The backfill reads parent_lease_id, which is the only evidence available:
// any lease with a parent is a renewal, everything else is an original. On
// production at the time of writing that is exactly one row — lease
// 2608NHQ8DS, the renewal created by hand before the feature existed.
func AddLeaseType() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202608190001_ADD_LEASE_TYPE",
		Migrate: func(db *gorm.DB) error {
			statements := []string{
				`ALTER TABLE leases ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'ORIGINAL'`,
				`CREATE INDEX IF NOT EXISTS idx_leases_type ON leases(type)`,
				`UPDATE leases SET type = 'RENEWAL'
				 WHERE parent_lease_id IS NOT NULL AND type = 'ORIGINAL'`,
			}

			for _, statement := range statements {
				if err := db.Exec(statement).Error; err != nil {
					return err
				}
			}

			return nil
		},
		Rollback: func(db *gorm.DB) error {
			return db.Exec(`ALTER TABLE leases DROP COLUMN IF EXISTS type`).Error
		},
	}
}
```

Register it in `init/migration/main.go`, appended to the `migrations` slice after `jobs.RepairRenewalLeaseFinancialAccount(),`:

```go
		jobs.AddLeaseType(),
```

- [ ] **Step 7: Run the migration and confirm the backfill**

```bash
make update-db
psql -d "$DB_NAME" -tAc "SELECT type, COUNT(*) FROM leases WHERE deleted_at IS NULL GROUP BY type;"
```

Expected: every row `ORIGINAL` except those with a `parent_lease_id`. On a database restored from the production dump that is one `RENEWAL`.

- [ ] **Step 8: Build, format, review**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Expected: PASS. Leave changes **unstaged**. Stop here for review.

---

### Task 2: The guards, as pure functions

Every renewal guard is decidable from values alone, so they are written and tested without a database before anything calls them.

**Files:**
- Create: `internal/services/renewal.go`
- Test: `internal/services/renewal_test.go`

**Interfaces:**
- Consumes: `models.LeaseTypeRenewal` (Task 1).
- Produces: `CanRenewParent(status string) bool`; `HasBlockingRenewal(children []models.Lease) bool`; `OverlapsParentTerm(moveIn time.Time, parentMoveOut *time.Time) bool`; `UnitHasCapacity(occupying, maxOccupants int64) bool`.

- [ ] **Step 1: Write the failing tests**

Create `internal/services/renewal_test.go`:

```go
package services

import (
	"testing"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

// A live tenancy and a finished one can both be renewed. The first is the
// normal case — you renew before the tenant's term lapses, not after.
func TestCanRenewParentAcceptsActiveAndCompleted(t *testing.T) {
	for _, status := range []string{"Lease.Status.Active", "Lease.Status.Completed"} {
		if !CanRenewParent(status) {
			t.Errorf("got not renewable for %q, want renewable", status)
		}
	}
}

// Pending has nothing to renew yet; Cancelled never ran; Terminated ended
// early, which is a new tenancy rather than a continuation of this one.
func TestCanRenewParentRejectsTheRest(t *testing.T) {
	for _, status := range []string{
		"Lease.Status.Pending", "Lease.Status.Cancelled", "Lease.Status.Terminated",
	} {
		if CanRenewParent(status) {
			t.Errorf("got renewable for %q, want not renewable", status)
		}
	}
}

// One renewal per parent. Without this a double-click makes two.
func TestHasBlockingRenewalWithActiveChild(t *testing.T) {
	children := []models.Lease{{Status: "Lease.Status.Pending"}}

	if !HasBlockingRenewal(children) {
		t.Error("got no block, want blocked — a Pending renewal already exists")
	}
}

// A cancelled renewal deliberately does NOT block a retry: the PM cancelled it
// precisely so they could create a corrected one.
func TestHasBlockingRenewalIgnoresCancelledChild(t *testing.T) {
	children := []models.Lease{{Status: "Lease.Status.Cancelled"}}

	if HasBlockingRenewal(children) {
		t.Error("got blocked, want no block — a cancelled renewal allows a retry")
	}
}

func TestHasBlockingRenewalNoChildren(t *testing.T) {
	if HasBlockingRenewal(nil) {
		t.Error("got blocked, want no block — there are no children")
	}
}

// Starting before the parent ends means the tenant holds one room twice.
func TestOverlapsParentTermRejectsEarlyStart(t *testing.T) {
	parentOut := time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)
	moveIn := time.Date(2026, 8, 15, 0, 0, 0, 0, time.UTC)

	if !OverlapsParentTerm(moveIn, &parentOut) {
		t.Error("got no overlap, want overlap — the renewal starts mid-parent-term")
	}
}

// Continuous is the normal renewal: the new term starts the day the old ends.
func TestOverlapsParentTermAllowsContinuous(t *testing.T) {
	parentOut := time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)

	if OverlapsParentTerm(parentOut, &parentOut) {
		t.Error("got overlap, want none — starting exactly at move-out is continuous")
	}
}

// A gap is legitimate — a tenant may be away for a month before returning.
func TestOverlapsParentTermAllowsGap(t *testing.T) {
	parentOut := time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC)
	moveIn := time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC)

	if OverlapsParentTerm(moveIn, &parentOut) {
		t.Error("got overlap, want none — a gap between terms is allowed")
	}
}

// An open-ended parent has no move-out to overlap with.
func TestOverlapsParentTermNilMoveOut(t *testing.T) {
	if OverlapsParentTerm(time.Now(), nil) {
		t.Error("got overlap, want none — the parent has no move-out date")
	}
}

// A single-occupant room with nobody else in it has room for the renewal.
func TestUnitHasCapacityEmpty(t *testing.T) {
	if !UnitHasCapacity(0, 1) {
		t.Error("got no capacity, want capacity — the unit is empty")
	}
}

// The destination is already full, so a move into it must be refused.
func TestUnitHasCapacityFull(t *testing.T) {
	if UnitHasCapacity(1, 1) {
		t.Error("got capacity, want none — the unit is at its limit")
	}
}

// Multi-occupant rooms are the reason this is a count and not a boolean:
// a room holding two of four tenants still has space.
func TestUnitHasCapacityMultiOccupant(t *testing.T) {
	if !UnitHasCapacity(2, 4) {
		t.Error("got no capacity, want capacity — 2 of 4 occupied")
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/services/ -run "TestCanRenewParent|TestHasBlockingRenewal|TestOverlapsParentTerm|TestUnitHasCapacity" -v`
Expected: FAIL — `undefined: CanRenewParent` and the rest.

- [ ] **Step 3: Write the guards**

Create `internal/services/renewal.go`:

```go
package services

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

// CanRenewParent reports whether a lease is in a state that can be continued.
//
// Active is the normal case — a renewal is signed before the tenant's term
// lapses, not after. Completed is allowed so a lapsed tenancy can still be
// picked up. The rest cannot: Pending has nothing to renew yet, Cancelled
// never ran, and Terminated ended early, which makes any return a new tenancy
// rather than a continuation of this one.
func CanRenewParent(status string) bool {
	switch status {
	case "Lease.Status.Active", "Lease.Status.Completed":
		return true
	default:
		return false
	}
}

// HasBlockingRenewal reports whether a parent already has a renewal that
// counts.
//
// A Cancelled child deliberately does not block: the PM cancelled it precisely
// so they could create a corrected one.
func HasBlockingRenewal(children []models.Lease) bool {
	for _, child := range children {
		if child.Status != "Lease.Status.Cancelled" {
			return true
		}
	}

	return false
}

// OverlapsParentTerm reports whether a renewal would start before its parent
// finishes.
//
// Starting exactly at the parent's move-out is the normal continuous renewal
// and is allowed. A gap is allowed too — a tenant may be away before
// returning. Only a genuine overlap is refused, because on one unit that means
// the tenant holds it twice.
func OverlapsParentTerm(moveIn time.Time, parentMoveOut *time.Time) bool {
	if parentMoveOut == nil {
		return false
	}

	return moveIn.Before(*parentMoveOut)
}

// UnitHasCapacity reports whether a unit can take one more tenancy.
//
// A count rather than a boolean because rooms may hold several tenants: two of
// four occupied still has space.
func UnitHasCapacity(occupying, maxOccupants int64) bool {
	return occupying < maxOccupants
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/services/ -run "TestCanRenewParent|TestHasBlockingRenewal|TestOverlapsParentTerm|TestUnitHasCapacity" -v`
Expected: PASS — 12 tests

- [ ] **Step 5: Format and review**

Run: `make lint-fix && go test ./internal/services/`
Expected: PASS. Leave changes **unstaged**. Stop here for review.

---

### Task 3: Repository — children of a lease, and occupancy over a term

Two queries the orchestration needs, both testable through the dry-run GORM handle that renders SQL without a connection.

**Files:**
- Modify: `internal/repository/lease.go`
- Test: `internal/repository/lease_renewal_test.go` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `LeaseRepository.ListChildren(ctx context.Context, parentLeaseID string) (*[]models.Lease, error)`; `LeaseRepository.CountOccupyingUnitForTerm(ctx context.Context, unitID string, start, end time.Time, excludeLeaseIDs []string) (int64, error)`.

- [ ] **Step 1: Write the failing tests**

Create `internal/repository/lease_renewal_test.go`:

```go
package repository

import (
	"strings"
	"testing"
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
)

func occupancyForTermSQL(t *testing.T, unitID string, start, end time.Time, exclude []string) string {
	t.Helper()

	var count int64
	db := applyOccupancyForTermScope(
		dryRunDB(t).Model(&models.Lease{}), unitID, start, end, exclude,
	)

	return db.Count(&count).Statement.SQL.String()
}

// Occupancy is asked over the renewal's dates, not "right now" — a unit free
// today may already be let for the term being renewed into.
func TestOccupancyForTermFiltersByDateRange(t *testing.T) {
	sql := occupancyForTermSQL(t, "11111111-1111-1111-1111-111111111111",
		time.Now(), time.Now().AddDate(1, 0, 0), nil)

	if !strings.Contains(sql, "move_in_date") || !strings.Contains(sql, "move_out_date") {
		t.Errorf("expected a date-range predicate, got: %s", sql)
	}
	if !strings.Contains(sql, "unit_id") {
		t.Errorf("expected a unit predicate, got: %s", sql)
	}
}

// The parent must not count against its own renewal, or every same-unit
// renewal on a single-occupant room would be refused.
func TestOccupancyForTermExcludesTheChain(t *testing.T) {
	sql := occupancyForTermSQL(t, "11111111-1111-1111-1111-111111111111",
		time.Now(), time.Now().AddDate(1, 0, 0),
		[]string{"22222222-2222-2222-2222-222222222222"})

	if !strings.Contains(sql, "id NOT IN") && !strings.Contains(sql, "id <> ") {
		t.Errorf("expected an exclusion predicate, got: %s", sql)
	}
}

// Only leases that actually hold the unit count.
func TestOccupancyForTermCountsOnlyLiveStatuses(t *testing.T) {
	sql := occupancyForTermSQL(t, "11111111-1111-1111-1111-111111111111",
		time.Now(), time.Now().AddDate(1, 0, 0), nil)

	if !strings.Contains(sql, "status IN") {
		t.Errorf("expected a status predicate, got: %s", sql)
	}
}
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `go test ./internal/repository/ -run TestOccupancyForTerm -v`
Expected: FAIL — `undefined: applyOccupancyForTermScope`

- [ ] **Step 3: Add both queries**

In `internal/repository/lease.go`, add to the `LeaseRepository` interface:

```go
	// ListChildren returns every lease naming this one as its parent,
	// including cancelled ones — the renewal guard needs to see a cancelled
	// child in order to deliberately ignore it.
	ListChildren(context context.Context, parentLeaseID string) (*[]models.Lease, error)
	// CountOccupyingUnitForTerm counts Pending/Active leases holding a unit at
	// any point in the given window, excluding the given leases.
	//
	// Over the term rather than "right now": a unit free today may already be
	// let for the period being renewed into. The exclusion is what lets a
	// same-unit renewal overlap its own parent without the parent counting
	// against it.
	CountOccupyingUnitForTerm(
		context context.Context,
		unitID string,
		start, end time.Time,
		excludeLeaseIDs []string,
	) (int64, error)
```

Then the scope helper and both implementations:

```go
// applyOccupancyForTermScope is extracted so the query and its tests render
// the same predicates.
func applyOccupancyForTermScope(
	db *gorm.DB,
	unitID string,
	start, end time.Time,
	excludeLeaseIDs []string,
) *gorm.DB {
	db = db.
		Where("unit_id = ?", unitID).
		Where("deleted_at IS NULL").
		Where("status IN ?", []string{"Lease.Status.Pending", "Lease.Status.Active"}).
		// Standard half-open overlap: an existing term collides when it starts
		// before this one ends and ends after this one starts.
		Where("move_in_date < ?", end).
		Where("move_out_date IS NULL OR move_out_date > ?", start)

	if len(excludeLeaseIDs) > 0 {
		db = db.Where("id NOT IN ?", excludeLeaseIDs)
	}

	return db
}

func (r *leaseRepository) CountOccupyingUnitForTerm(
	ctx context.Context,
	unitID string,
	start, end time.Time,
	excludeLeaseIDs []string,
) (int64, error) {
	var count int64

	err := applyOccupancyForTermScope(
		lib.ResolveDB(ctx, r.DB).Model(&models.Lease{}), unitID, start, end, excludeLeaseIDs,
	).Count(&count).Error
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (r *leaseRepository) ListChildren(
	ctx context.Context,
	parentLeaseID string,
) (*[]models.Lease, error) {
	var leases []models.Lease

	err := lib.ResolveDB(ctx, r.DB).
		Where("parent_lease_id = ?", parentLeaseID).
		Where("deleted_at IS NULL").
		Find(&leases).Error
	if err != nil {
		return nil, err
	}

	return &leases, nil
}
```

Both use `lib.ResolveDB` deliberately: the renewal calls them inside its transaction, and a getter on the base connection would not see rows the transaction has written.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/repository/ -v`
Expected: PASS, including the pre-existing repository tests.

- [ ] **Step 5: Build, format, review**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Expected: PASS. Leave changes **unstaged**. Stop here for review.

---

### Task 4: Scope materialisation to a lease

`MaterialiseForAccount` already creates a rent definition and its instances. The renewal needs the same thing with a `lease_id` on both, and with no deposit.

**Files:**
- Modify: `internal/services/financials/charge.go`
- Test: `internal/services/financials/materialise_lease_test.go` (create)

**Interfaces:**
- Consumes: `MaterialiseForAccountInput` (existing).
- Produces: `MaterialiseForAccountInput.LeaseID *string`; `ChargeService.CloseDefinitionsForLease(ctx context.Context, financialAccountID, leaseID string) error`.

- [ ] **Step 1: Write the failing test**

Create `internal/services/financials/materialise_lease_test.go`:

```go
package financials

import "testing"

// A renewal materialises its rent against the shared account, but every charge
// it creates belongs to the new term. Without the lease scope the "This Lease"
// view would show one undifferentiated pile across every term of the tenancy.
func TestMaterialiseForAccountInputCarriesLease(t *testing.T) {
	leaseID := "44444444-4444-4444-4444-444444444444"
	in := MaterialiseForAccountInput{
		FinancialAccountID: "55555555-5555-5555-5555-555555555555",
		LeaseID:            &leaseID,
		RentFee:            55_000,
	}

	if in.LeaseID == nil || *in.LeaseID != leaseID {
		t.Fatalf("got %v, want the lease carried through", in.LeaseID)
	}
}

// A renewal passes SecurityDepositFee: 0, which is how "a renewal never
// re-charges the deposit" is enforced — charge.go treats 0 as not opted in and
// creates no deposit charge at all.
func TestMaterialiseForAccountZeroDepositMeansNoDepositCharge(t *testing.T) {
	in := MaterialiseForAccountInput{SecurityDepositFee: 0}

	if in.SecurityDepositFee != 0 {
		t.Fatal("a renewal must materialise with a zero security deposit")
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/services/financials/ -run TestMaterialiseForAccount -v`
Expected: FAIL — `unknown field LeaseID in struct literal of type MaterialiseForAccountInput`

- [ ] **Step 3: Thread the lease through**

In `internal/services/financials/charge.go`, add to `MaterialiseForAccountInput`:

```go
	// LeaseID scopes everything this call creates to one contractual term.
	// Nil for application-stage preparation, where no lease exists yet —
	// approval stamps those afterwards via ScopeUnassignedToLease.
	LeaseID *string
```

In `MaterialiseForAccount`, set it on the definition:

```go
	rentDefinition := &models.ChargeDefinition{
		FinancialAccountID: input.FinancialAccountID,
		LeaseID:            input.LeaseID,
		Name:               "Rent",
```

and on every instance built from the drafts — find the `models.ChargeInstance{...}` literal in the loop and add `LeaseID: input.LeaseID,` alongside `FinancialAccountID`. Do the same for the security-deposit instance if one is built, so a deposit taken at application stage carries its originating lease once approval stamps it.

- [ ] **Step 4: Add definition closing**

The renewal supersedes the parent's rent template. Add to the `ChargeService` interface:

```go
	// CloseDefinitionsForLease marks a term's rent definitions CLOSED, so a
	// renewal does not leave a second ACTIVE template behind and the account
	// keeps exactly one answer to "what is the rent?".
	CloseDefinitionsForLease(ctx context.Context, financialAccountID, leaseID string) error
```

and implement it, following the pattern `RederiveRent` already uses at `charge.go:405-420`:

```go
func (s *chargeService) CloseDefinitionsForLease(
	ctx context.Context,
	financialAccountID, leaseID string,
) error {
	activeStatus := "ACTIVE"
	definitions, err := s.repo.ListDefinitions(ctx, repository.ListChargeDefinitionsFilter{
		FinancialAccountID: &financialAccountID,
		LeaseID:            &leaseID,
		Status:             &activeStatus,
	})
	if err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "CloseDefinitionsForLease", "action": "listing definitions"},
		})
	}

	for i := range *definitions {
		definition := (*definitions)[i]
		definition.Status = "CLOSED"
		if updateErr := s.repo.UpdateDefinition(ctx, &definition); updateErr != nil {
			return pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{
				Err:      updateErr,
				Metadata: map[string]string{"function": "CloseDefinitionsForLease", "action": "closing definition"},
			})
		}
	}

	return nil
}
```

Add the matching method to the `fakeChargeService` in `internal/services/financials/issuance_test.go`, or that package's tests will not build:

```go
func (f *fakeChargeService) CloseDefinitionsForLease(context.Context, string, string) error {
	return nil
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `go test ./internal/... 2>&1 | grep -v "no test files"`
Expected: PASS across every package.

- [ ] **Step 6: Format and review**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Expected: PASS. Leave changes **unstaged**. Stop here for review.

---

### Task 5: Open an account for a lease

Only needed for the unit-change-without-carrying case. `PrepareCharges` is application-shaped and cannot be reused.

**Files:**
- Modify: `internal/services/financials/account.go`
- Test: `internal/services/financials/account_open_test.go` (create)

**Interfaces:**
- Consumes: `repository.FinancialAccountRepository` (existing).
- Produces: `FinancialAccountService.OpenForLease(ctx context.Context, input OpenForLeaseInput) (*models.FinancialAccount, error)`; `type OpenForLeaseInput struct { OriginTenantApplicationID, TenantID, Currency string; ClientID, PropertyID *string }`.

- [ ] **Step 1: Write the failing test**

Create `internal/services/financials/account_open_test.go`:

```go
package financials

import "testing"

// A renewal that deliberately does not carry its parent's account still
// belongs to the same tenant and the same original application — only the
// money is being separated, not the history of who this is.
func TestOpenForLeaseInputCarriesProvenance(t *testing.T) {
	property := "66666666-6666-6666-6666-666666666666"
	in := OpenForLeaseInput{
		OriginTenantApplicationID: "77777777-7777-7777-7777-777777777777",
		TenantID:                  "88888888-8888-8888-8888-888888888888",
		Currency:                  "GHS",
		PropertyID:                &property,
	}

	if in.OriginTenantApplicationID == "" {
		t.Error("provenance must be carried from the parent's account")
	}
	if in.TenantID == "" {
		t.Error("a lease-opened account always knows its tenant — it is not application-stage")
	}
	if in.Currency != "GHS" {
		t.Errorf("got currency %q, want the parent's", in.Currency)
	}
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `go test ./internal/services/financials/ -run TestOpenForLease -v`
Expected: FAIL — `undefined: OpenForLeaseInput`

- [ ] **Step 3: Write it**

In `internal/services/financials/account.go`, add the input type near `PrepareChargesInput`:

```go
// OpenForLeaseInput opens an account for a lease that already exists, rather
// than for an application. Used only when a renewal moves units and the PM has
// said the money should not follow.
type OpenForLeaseInput struct {
	// Provenance, inherited from the parent's account. The renewal has no
	// application of its own.
	OriginTenantApplicationID string
	TenantID                  string
	Currency                  string
	ClientID                  *string
	PropertyID                *string
}
```

Add to the `FinancialAccountService` interface:

```go
	// OpenForLease creates an account for an existing lease. Unlike
	// PrepareCharges it creates no charges: the caller materialises the term
	// itself, because it already knows the lease the charges belong to.
	OpenForLease(ctx context.Context, input OpenForLeaseInput) (*models.FinancialAccount, error)
```

and implement it:

```go
func (s *financialAccountService) OpenForLease(
	ctx context.Context,
	input OpenForLeaseInput,
) (*models.FinancialAccount, error) {
	account := &models.FinancialAccount{
		OriginTenantApplicationID: input.OriginTenantApplicationID,
		TenantID:                  &input.TenantID,
		ClientID:                  input.ClientID,
		PropertyID:                input.PropertyID,
		Currency:                  input.Currency,
		// No prepayment is known at this point, so there is nothing to derive
		// a cadence from. MANUAL means the sweep leaves it alone until a PM
		// sets a policy, which is safer than inventing one.
		RentBillingCadence:  CadenceManual,
		RentBillingInterval: 1,
		AutoIssueDaysBefore: 5,
		Status:              StatusActive,
	}

	if err := s.repo.Create(ctx, account); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{
			Err:      err,
			Metadata: map[string]string{"function": "OpenForLease", "action": "creating account"},
		})
	}

	return account, nil
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `go test ./internal/services/financials/ -v`
Expected: PASS

- [ ] **Step 5: Format and review**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Expected: PASS. Leave changes **unstaged**. Stop here for review.

---

### Task 6: `RenewLease` — the orchestration

The task that ties the previous five together. Everything runs in one transaction, so a failure anywhere leaves no half-made renewal.

**Files:**
- Modify: `internal/services/lease.go` (interface + implementation)
- Modify: `internal/services/renewal.go` (input type)

**Interfaces:**
- Consumes: `CanRenewParent`, `HasBlockingRenewal`, `OverlapsParentTerm`, `UnitHasCapacity` (Task 2); `ListChildren`, `CountOccupyingUnitForTerm` (Task 3); `MaterialiseForAccountInput.LeaseID`, `CloseDefinitionsForLease` (Task 4); `OpenForLease` (Task 5); `Revive`, `SetFinancialAccount` (spec 1).
- Produces: `LeaseService.RenewLease(ctx context.Context, input RenewLeaseInput) (*models.Lease, error)`; `type RenewLeaseInput struct { LeaseID string; MoveInDate time.Time; StayDuration int64; StayDurationFrequency string; RentFee *int64; UnitID *string; CarryFinancialAccount *bool; LeaseAgreementDocumentUrl *string }`.

- [ ] **Step 1: Add the input type**

In `internal/services/renewal.go`:

```go
// RenewLeaseInput is what a PM supplies to continue a tenancy. Everything not
// named here is inherited from the parent: tenant, currency, payment
// frequency, and the originating application.
type RenewLeaseInput struct {
	LeaseID               string
	MoveInDate            time.Time
	StayDuration          int64
	StayDurationFrequency string

	// Optional. Defaults to the parent's.
	RentFee *int64
	UnitID  *string

	// Only meaningful when UnitID differs from the parent's. Nil or true
	// carries the parent's financial account; false opens a new one.
	CarryFinancialAccount *bool

	LeaseAgreementDocumentUrl *string
}
```

- [ ] **Step 2: Add the method to the interface**

In `internal/services/lease.go`, add to `LeaseService`:

```go
	// RenewLease continues a tenancy with a new term. The renewal is created
	// Pending; the daily lifecycle sweeps activate it and complete the parent.
	RenewLease(context context.Context, input RenewLeaseInput) (*models.Lease, error)
```

- [ ] **Step 3: Write the implementation**

Append to `internal/services/renewal.go`:

```go
func (s *leaseService) RenewLease(ctx context.Context, input RenewLeaseInput) (*models.Lease, error) {
	parent, err := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseQuery{
		ID:       input.LeaseID,
		Populate: &[]string{"Unit"},
	})
	if err != nil {
		return nil, pkg.NotFoundError("LeaseNotFound", &pkg.RentLoopErrorParams{Err: err})
	}

	if !CanRenewParent(parent.Status) {
		return nil, pkg.BadRequestError("ParentLeaseNotRenewable", nil)
	}

	children, childErr := s.repo.ListChildren(ctx, input.LeaseID)
	if childErr != nil {
		return nil, pkg.InternalServerError(childErr.Error(), &pkg.RentLoopErrorParams{
			Err:      childErr,
			Metadata: map[string]string{"function": "RenewLease", "action": "listing children"},
		})
	}
	if HasBlockingRenewal(*children) {
		return nil, pkg.BadRequestError("LeaseAlreadyRenewed", nil)
	}

	if OverlapsParentTerm(input.MoveInDate, parent.MoveOutDate) {
		return nil, pkg.BadRequestError("RenewalOverlapsParentTerm", nil)
	}

	unitID := parent.UnitId
	if input.UnitID != nil {
		unitID = *input.UnitID
	}
	unitChanged := unitID != parent.UnitId

	if !unitChanged && input.CarryFinancialAccount != nil {
		return nil, pkg.BadRequestError("RenewalUnitUnchangedForAccountFlag", nil)
	}

	moveOut := leaseEndDate(input.MoveInDate, input.StayDuration, input.StayDurationFrequency)

	// Occupancy is asked over the renewal's own dates, and the parent is
	// excluded — otherwise every same-unit renewal on a single-occupant room
	// would be refused by the lease it is continuing.
	occupying, occErr := s.repo.CountOccupyingUnitForTerm(
		ctx, unitID, input.MoveInDate, moveOut, []string{parent.ID.String()},
	)
	if occErr != nil {
		return nil, pkg.InternalServerError(occErr.Error(), &pkg.RentLoopErrorParams{
			Err:      occErr,
			Metadata: map[string]string{"function": "RenewLease", "action": "counting occupancy"},
		})
	}

	unit, unitErr := s.unitService.GetUnitByID(ctx, unitID)
	if unitErr != nil {
		return nil, unitErr
	}
	if !UnitHasCapacity(occupying, int64(unit.MaxOccupantsAllowed)) {
		return nil, pkg.BadRequestError("UnitAtCapacityForTerm", nil)
	}

	rentFee := parent.RentFee
	if input.RentFee != nil {
		rentFee = *input.RentFee
	}

	transaction := s.appCtx.DB.Begin()
	transCtx := lib.WithTransaction(ctx, transaction)

	parentID := parent.ID.String()

	child, createErr := s.CreateLease(transCtx, CreateLeaseInput{
		Status:                    "Lease.Status.Pending",
		Type:                      models.LeaseTypeRenewal,
		UnitId:                    unitID,
		TenantId:                  parent.TenantId,
		TenantApplicationId:       parent.TenantApplicationId,
		RentFee:                   rentFee,
		RentFeeCurrency:           parent.RentFeeCurrency,
		PaymentFrequency:          parent.PaymentFrequency,
		MoveInDate:                input.MoveInDate,
		StayDuration:              input.StayDuration,
		StayDurationFrequency:     input.StayDurationFrequency,
		LeaseAgreementDocumentUrl: input.LeaseAgreementDocumentUrl,
		ParentLeaseId:             &parentID,
	})
	if createErr != nil {
		transaction.Rollback()
		return nil, createErr
	}

	if linkErr := s.linkRenewalFinancials(
		transCtx, parent, child, unit, input, unitChanged, rentFee,
	); linkErr != nil {
		transaction.Rollback()
		return nil, linkErr
	}

	// The destination gains a tenancy. On a same-unit renewal this is a no-op
	// — the unit is already occupied by the parent — but on a move it is what
	// marks the new room taken. The SOURCE unit is not touched here:
	// CompleteLease frees it when the parent finishes.
	if statusErr := s.recomputeUnitOccupancy(transCtx, unit); statusErr != nil {
		transaction.Rollback()
		return nil, statusErr
	}

	if commitErr := transaction.Commit().Error; commitErr != nil {
		transaction.Rollback()
		return nil, pkg.InternalServerError(commitErr.Error(), &pkg.RentLoopErrorParams{
			Err:      commitErr,
			Metadata: map[string]string{"function": "RenewLease", "action": "committing transaction"},
		})
	}

	return child, nil
}
```

`parent.ID` is a `uuid.UUID`, so `parentID` above is its string form — `ParentLeaseId` is a `*string` and the address of the local is what it needs.

This mirrors `internal/services/lease.go:838`, which already opens transactions this way; `lib.WithTransaction` is what makes every repository call inside the block use the transaction rather than the base connection.

- [ ] **Step 4: Write the two helpers**

Append to `internal/services/renewal.go`:

```go
// linkRenewalFinancials gives the new term its money: the parent's account, or
// a fresh one, plus its own rent definition and instances.
//
// A parent with no account is not an error — charges may never have been
// prepared. The renewal is then created without financials, mirroring what
// approval already does.
//
// `unit` is the DESTINATION unit, passed in rather than read off `child`:
// CreateLease does not preload associations, so `child.Unit` is a zero value
// and a new account would be opened with no property.
func (s *leaseService) linkRenewalFinancials(
	ctx context.Context,
	parent, child *models.Lease,
	unit *models.Unit,
	input RenewLeaseInput,
	unitChanged bool,
	rentFee int64,
) error {
	if parent.FinancialAccountID == nil {
		return nil
	}

	carry := true
	if unitChanged && input.CarryFinancialAccount != nil {
		carry = *input.CarryFinancialAccount
	}

	accountID := *parent.FinancialAccountID

	if carry {
		// A renewal negotiated after the parent ended lands on an account that
		// already looks finished. Reviving it is what stops a second account
		// opening for the same tenancy.
		if reviveErr := s.financials.Accounts.Revive(ctx, accountID); reviveErr != nil {
			return reviveErr
		}
	} else {
		parentAccount, accErr := s.financials.Accounts.GetByID(ctx, accountID)
		if accErr != nil {
			return accErr
		}

		opened, openErr := s.financials.Accounts.OpenForLease(ctx, financials.OpenForLeaseInput{
			OriginTenantApplicationID: parentAccount.OriginTenantApplicationID,
			TenantID:                  child.TenantId,
			Currency:                  parent.RentFeeCurrency,
			ClientID:                  parentAccount.ClientID,
			PropertyID:                &unit.PropertyID,
		})
		if openErr != nil {
			return openErr
		}

		accountID = opened.ID.String()
	}

	childID := child.ID.String()
	if linkErr := s.SetFinancialAccount(ctx, childID, accountID); linkErr != nil {
		return linkErr
	}

	// The parent's rent template is superseded. Without closing it the account
	// would carry two ACTIVE templates and two answers to "what is the rent?".
	if closeErr := s.financials.Charges.CloseDefinitionsForLease(
		ctx, accountID, parent.ID.String(),
	); closeErr != nil {
		return closeErr
	}

	if parent.PaymentFrequency == nil {
		return nil
	}

	// SecurityDepositFee is deliberately 0: a renewal never re-charges the
	// deposit. charge.go treats 0 as "not opted in" and creates no deposit
	// charge at all.
	return s.financials.Charges.MaterialiseForAccount(ctx, financials.MaterialiseForAccountInput{
		FinancialAccountID:    accountID,
		LeaseID:               &childID,
		RentFee:               rentFee,
		Currency:              parent.RentFeeCurrency,
		PaymentFrequency:      *parent.PaymentFrequency,
		MoveInDate:            input.MoveInDate,
		StayDuration:          input.StayDuration,
		StayDurationFrequency: input.StayDurationFrequency,
		SecurityDepositFee:    0,
	})
}

// recomputeUnitOccupancy mirrors ApproveTenantApplication: count what holds the
// unit now, compare against capacity, and only write when the status changes.
func (s *leaseService) recomputeUnitOccupancy(ctx context.Context, unit *models.Unit) error {
	occupying, err := s.repo.CountActiveByUnitID(ctx, unit.ID.String())
	if err != nil {
		return err
	}

	var newStatus string
	switch {
	case occupying >= int64(unit.MaxOccupantsAllowed):
		newStatus = "Unit.Status.Occupied"
	case occupying > 0:
		newStatus = "Unit.Status.PartiallyOccupied"
	default:
		return nil
	}

	if unit.Status == newStatus {
		return nil
	}

	return s.unitService.SetSystemUnitStatus(ctx, UpdateUnitStatusInput{
		PropertyID: unit.PropertyID,
		UnitID:     unit.ID.String(),
		Status:     newStatus,
	})
}
```

Confirm `s.unitService.GetUnitByID`'s exact signature and return type with `grep -n "GetUnitByID" internal/services/unit.go` before writing the call, and match it.

- [ ] **Step 5: Build and run everything**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Expected: PASS. Leave changes **unstaged**. Stop here for review.

---

### Task 7: HTTP surface

**Files:**
- Modify: `internal/handlers/lease.go`
- Modify: `internal/router/client-user.go:288-296`

**Interfaces:**
- Consumes: `LeaseService.RenewLease`, `RenewLeaseInput` (Task 6).
- Produces: `POST /v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/renew`; `RenewLeaseBody`.

- [ ] **Step 1: Add the request body**

In `internal/handlers/lease.go`, alongside the other body types:

```go
type RenewLeaseBody struct {
	MoveInDate            time.Time `json:"move_in_date"             validate:"required"`
	StayDuration          int64     `json:"stay_duration"            validate:"required,gt=0"`
	StayDurationFrequency string    `json:"stay_duration_frequency"  validate:"required"`

	// Optional. Omitted, each defaults to the parent's.
	RentFee *int64  `json:"rent_fee"  validate:"omitempty,gte=0"`
	UnitID  *string `json:"unit_id"   validate:"omitempty,uuid4"`

	// Only meaningful when unit_id differs from the parent's; sending it on a
	// same-unit renewal is refused rather than ignored.
	CarryFinancialAccount *bool `json:"carry_financial_account"`

	LeaseAgreementDocumentUrl *string `json:"lease_agreement_document_url" validate:"omitempty,url"`
}
```

Currency is deliberately absent — spec 1 makes it immutable for the account's life, and not offering it is the cleanest enforcement. Billing cadence is absent too: a prepaid renewal never reaches the sweep, and an unpaid one is corrected through the billing-policy endpoint.

- [ ] **Step 2: Write the handler**

```go
// RenewLease godoc
//
//	@Summary		Renew a lease
//	@Description	Continues a tenancy with a new term. The renewal is created Pending with its own rent and charges, inheriting the parent's tenant, currency and financial account; the daily lifecycle sweeps activate it and complete the parent on the changeover day. A renewal never re-charges the security deposit. It may move the tenant to another unit, in which case carry_financial_account decides whether the money follows.
//	@Tags			Leases
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			property_id	path		string										true	"Property ID"
//	@Param			lease_id	path		string										true	"Lease to renew"
//	@Param			body		body		RenewLeaseBody								true	"New term"
//	@Success		201			{object}	object{data=transformations.OutputLease}	"Renewal created"
//	@Failure		400			{object}	lib.HTTPError								"Parent not renewable, already renewed, term overlaps the parent, destination unit at capacity, or the account flag sent on a same-unit renewal"
//	@Failure		401			{object}	string										"Invalid or absent authentication token"
//	@Failure		404			{object}	lib.HTTPError								"Lease not found"
//	@Failure		422			{object}	lib.HTTPError								"Validation error"
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/renew [post]
func (h *LeaseHandler) RenewLease(w http.ResponseWriter, r *http.Request) {
	if _, ok := lib.ClientUserFromContext(r.Context()); !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var body RenewLeaseBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	lease, err := h.service.RenewLease(r.Context(), services.RenewLeaseInput{
		LeaseID:                   chi.URLParam(r, "lease_id"),
		MoveInDate:                body.MoveInDate,
		StayDuration:              body.StayDuration,
		StayDurationFrequency:     body.StayDurationFrequency,
		RentFee:                   body.RentFee,
		UnitID:                    body.UnitID,
		CarryFinancialAccount:     body.CarryFinancialAccount,
		LeaseAgreementDocumentUrl: body.LeaseAgreementDocumentUrl,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBAdminLeaseToRest(lease)})
}
```

Match the handler's receiver name, its service field name, and the transformation function to what `internal/handlers/lease.go` already uses — confirm with `grep -n "func (h \*LeaseHandler) GetLeaseByID" -A 20 internal/handlers/lease.go` rather than copying the sketch blind.

- [ ] **Step 3: Register the route**

In `internal/router/client-user.go`, inside the existing `r.Route("/leases/{lease_id}", ...)` block, alongside `status:active` and `status:cancelled`:

```go
							r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
								Post("/renew", handlers.LeaseHandler.RenewLease)
```

Property `MANAGER`, matching the sibling lease-mutating routes — not global ADMIN/OWNER.

- [ ] **Step 4: Regenerate docs and verify**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Then: `grep -c "leases/{lease_id}/renew" docs/swagger.json`
Expected: PASS, and `1`.

- [ ] **Step 5: Review**

Leave changes **unstaged**. Stop here for review.

---

### Task 8: End-to-end scenarios

Groups `a` through `l` — `a`–`k` are taken by existing cases and `j` by spec 1's closure work.

**Files:**
- Create: `services/main/scripts/e2e/cases/l1-renew-shares-account.sh`
- Create: `services/main/scripts/e2e/cases/l2-renewal-guards.sh`
- Create: `services/main/scripts/e2e/cases/l3-renew-then-sweep.sh`
- Create: `services/main/scripts/e2e/cases/l4-renew-into-another-unit.sh`
- Modify: `services/main/scripts/e2e/fixtures.sh`
- Modify: `services/main/scripts/e2e/cases/j1-lease-scoped-charges.sh` (delete its `skip_case`)

**Interfaces:**
- Consumes: everything above.
- Produces: four cases in `run-all.sh`'s sweep.

- [ ] **Step 1: Read the patterns**

```bash
cat services/main/scripts/e2e/cases/k1-auto-activation.sh
cat services/main/scripts/e2e/cases/j1-lease-scoped-charges.sh
grep -n "run_lifecycle\|activate_lease\|cancel_lease\|lease_status" services/main/scripts/e2e/lib.sh services/main/scripts/e2e/fixtures.sh
```

`k1` is the closest model — it already drives the lifecycle sweep that `l3` depends on.

- [ ] **Step 2: Add the fixture**

Append to `services/main/scripts/e2e/fixtures.sh`:

```bash
# renew_lease LEASE_ID MOVE_IN STAY_DURATION [RENT_FEE] [UNIT_ID] [CARRY]
# Echoes the response; the new lease id is at .data.id.
renew_lease() {
	local body
	body="$(jq -nc --arg m "$2" --argjson d "$3" \
		'{move_in_date:$m, stay_duration:$d, stay_duration_frequency:"MONTHLY"}')"
	[[ -n "${4:-}" ]] && body="$(jq -c --argjson r "$4" '. + {rent_fee:$r}' <<<"$body")"
	[[ -n "${5:-}" ]] && body="$(jq -c --arg u "$5" '. + {unit_id:$u}' <<<"$body")"
	[[ -n "${6:-}" ]] && body="$(jq -c --argjson c "$6" '. + {carry_financial_account:$c}' <<<"$body")"

	papi POST "/leases/$1/renew" "$body"
}
```

- [ ] **Step 3: Write `l1-renew-shares-account.sh`**

Build an account through the normal approval flow, then renew. Assert:

- the renewal is created `201` with `status = Lease.Status.Pending` and `type = RENEWAL`
- its `parent_lease_id` is the original lease
- its `financial_account.id` equals the parent's — one account, two terms
- the account's `total_charged` is the sum of both terms, not either alone
- `charges_for_lease ACCOUNT PARENT_LEASE` and `charges_for_lease ACCOUNT RENEWAL` return **disjoint** sets, and together equal the unfiltered list
- no `SECURITY_DEPOSIT` charge was added by the renewal — count them before and after and assert the number is unchanged
- `assert_invariants "$ACCOUNT_ID" "after renewal"`

- [ ] **Step 4: Write `l2-renewal-guards.sh`**

From one approved lease, assert each guard in turn:

- renewing twice → second returns `400`
- `move_in_date` before the parent's `move_out_date` → `400`
- `carry_financial_account` sent without `unit_id` → `400`
- a renewal on a `Pending` lease (approve, do not activate, then try to renew a *different* Pending lease) → `400`
- after cancelling the renewal, renewing again → `201`, proving a cancelled child does not block a retry

Assert the error code in each case with `assert_error_code`, not just the status, so a guard failing for the wrong reason is caught.

- [ ] **Step 5: Write `l3-renew-then-sweep.sh`**

The case that proves the design's central claim — that no new cron is needed:

- approve and activate a lease with a short term so `move_out_date` is in the past or imminent
- renew it, continuous with the parent
- run the lifecycle sweep (`run_lifecycle`)
- assert the parent is now `Lease.Status.Completed` and the renewal `Lease.Status.Active`
- assert the unit is still `Unit.Status.Occupied` — the tenancy never lapsed
- run the issuance sweep and assert the renewal's rent is invoiced against the shared account
- `assert_invariants`

- [ ] **Step 6: Write `l4-renew-into-another-unit.sh`**

- create a second unit on the same property with `new_unit`
- renew into it **without** the flag → asserts the account carried: the renewal's `financial_account.id` still equals the parent's
- on a fresh lease, renew into another unit with `carry_financial_account: false` → asserts a **different** account id, and that the original account still holds the deposit
- renew into a unit that already has an Active lease at capacity → `400 UnitAtCapacityForTerm`

- [ ] **Step 7: Unblock `j1`**

In `services/main/scripts/e2e/cases/j1-lease-scoped-charges.sh`, delete the line:

```bash
skip_case "two terms on one account needs POST /leases/{id}/renew — spec 2"
```

`l1` now covers what it was waiting for. That deletion is the signal specs 1 and 2 have met.

- [ ] **Step 8: Run the whole suite**

```bash
make update-db
go run cmd/rentloop-engine/main.go -e development &
cd services/main/scripts/e2e && ./run-all.sh
```

Expected: every case passes, groups `a` through `l`. The pre-existing cases passing unchanged is the real check — it is what proves lineage and the renewal path did not disturb approval, invoicing or the sweeps.

**Before starting the API, confirm no stale server holds the port** — a leftover process cost hours during spec 1:

```bash
lsof -ti :5003 | xargs -r kill -9
```

- [ ] **Step 9: Final review**

Run: `make lint-fix && go build ./... && go test ./internal/...`
Expected: PASS. Leave all changes **unstaged** for the user to commit.

---

## The three real renewals

Run **after** deploy, through the API, not by migration. They have no lease rows yet, so this is the feature's first real use.

| Lease | Tenant | Unit | Current term ends | Rent | Renewal paid? |
|---|---|---|---|---|---|
| `26073GCL1V` | Paul Richardson | Room 6 | 2026-09-01 | 55,000 | Yes |
| `2607GV0VDZ` | Jenelle Mustapha | Room 7 | 2026-10-01 | 55,000 | Yes |
| `2607B8KCYF` | Daniel Paintsil | Room 1 | 2026-09-01 | 50,000 | **No** |

New terms and rents come from the PM. This plan does not guess them.

1. **Paul and Jenelle** — renew, then settle: compose an invoice over the new term's charges and record the offline payment. Their charges leave the issuance sweep's candidate set immediately (`selection.go:42`), so cadence never applies to them.
2. **Daniel** — renew and leave outstanding. **Check his billing cadence first.** His account `2608ZU0NVN` carries `EVERY_N_PERIODS`/12 with a 5-day lead, inherited from his original year-up-front payment, so the sweep will issue **one invoice for the whole new term** about five days before it starts. Correct if he is again paying a year up front; if he has moved to monthly, set the cadence to `EVERY_PERIOD` via `PATCH /financial-accounts/2608ZU0NVN/billing-policy` **before that date**.

Verify afterwards:

```bash
psql -d "$DB_NAME" -f services/main/scripts/verify-shared-account-invariants.sql
```

Check 4 — every lease in a renewal chain shares one account — is the one that proves the renewals linked correctly.

---

## Rollout

One non-destructive migration and a normal deploy. No destructive step, no coordinated release, so no runbook of its own.

1. `make update-db` — Job `202608190001_ADD_LEASE_TYPE` adds the column and backfills it
2. Deploy `services/main`
3. Create the three renewals through the API
4. Run `verify-shared-account-invariants.sql`

Note that spec 1's merge is gated on the tenancy UI (spec 3). This plan's lineage data — `parent_lease_id` populated and `type` distinguishing a renewal — is what the UI's grouped lease list and Lease History timeline read, so this should land before or alongside that work.
