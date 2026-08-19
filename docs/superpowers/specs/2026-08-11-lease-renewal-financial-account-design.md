# The Shared Financial Account — Design

**Status:** Implemented and rehearsed against a production dump on 2026-08-18. Two decisions changed during that rehearsal — see *Revisions from the rehearsal*.
**Date:** 2026-08-11, substantially revised 2026-08-17.
**Related:** `docs/runbooks/archive/financial-account-backfill.md` (the v2 rollout
this builds on), `RENTL-51`.

**Follow-on specs:** this document is one of three. It owns the data model and
the migration. See *Scope* below.

---

## Core idea

A **financial account is the continuing financial relationship between one
tenant and one property.** Leases are contracts inside it. A renewal does not
create a new money relationship — it adds a new contractual term to the
existing one.

The tenant did not become a new financial relationship because they signed a
new contract.

Every decision below follows from that sentence.

```
                    TENANT
                       │
                       ▼
              FINANCIAL ACCOUNT
                       │
          ┌────────────┼─────────────┐
          │            │             │
       Lease #1     Lease #2      Payments
       original     renewal          │
          │            │        Allocations
          ▼            ▼             │
   Charge Definitions  Charge Definitions
          │            │             │
          ▼            ▼             │
   Charge Instances ◄──┴─────────────┘
          │
          ▼
       INVOICES
```

### The vocabulary this spec commits to

Getting these boundaries explicit is most of the design:

| Term | Means |
|---|---|
| **Financial account** | the continuous financial relationship |
| **Lease** | one contractual period within it |
| **Charge definition** | what should be charged |
| **Charge instance** | what is actually owed |
| **Invoice** | a request for an amount already owed |
| **Payment** | money received |
| **Allocation** | which obligations a payment discharged |

Renewal then becomes simple to state: *create a new lease, link it to the
previous one, give it new financial terms, keep the same account.*

---

## Scope

This spec owns the **data model and the migration**. It deliberately stops
short of the feature that motivated it, because the schema change is the only
part carrying migration risk and the other two depend on it.

| Spec | Owns |
|---|---|
| **1 — this document** | shared account across leases; `lease_id` on charge definitions and instances; account identity; the closure lifecycle; backfilling existing data and repairing lease `2608NHQ8DS` |
| **2 — renewal API** | `POST /v1/leases/{id}/renew`, the `CreateLease` `ParentLeaseId` bug, lease lineage and `type`, renewal guards, unit and date-block handling, creating the 3 pending renewals |
| **3 — tenancy UI** | tenancy-grouped lease list, the Lease History timeline, the This Lease / Entire Tenancy financials toggle |

**Not in any of the three:** payment plans as a first-class model, and the wider
lineage enum (`EXTENSION`, `RENT_REVIEW`, `UNIT_CHANGE`, `TENANT_CHANGE`,
`TERMINATION`). Both were discussed; both are deferred until a feature needs
them. Spec 2 introduces only `ORIGINAL` and `RENEWAL`.

### What changed from the first draft

The 2026-08-11 draft of this file proposed one account spanning many leases —
which is what survives — but paired it with two assumptions that are now
reversed or corrected:

- It kept `financial_accounts.tenant_application_id` as the account's identity.
  The application is now provenance only; accounts are shared along a renewal
  chain (Rule 1).
- It stated "today an account closes when its lease ends." **This is false.**
  Nothing in the codebase ever sets `FinancialAccount.Status = 'CLOSED'`; the
  only closure write in the financials package is `ChargeDefinition.Status` at
  `charge.go:402`. Closure is greenfield, not a behaviour being changed.

Commit `20d60227` made `tenant_application_id` a non-unique index in order to
allow one account *per lease*. That intent is reversed here. The index change
itself is harmless and stands.

---

## Revisions from the rehearsal

Rehearsed 2026-08-18 against a production dump (59 leases, 76 accounts, 1,084
charge instances, GHS 118,876 outstanding). Two decisions changed, both because
real data contradicted the design:

**Account identity is the renewal chain, not tenant + property.** Two tenants
hold several concurrent leases on different units at one property — one of them
six leases across four units, none of them renewals. Keying on tenant +
property would have merged separate deposits into one ledger. See Rule 1. The
application-stage merge this spec previously specified is gone with it: every
application gets its own account, so there is no duplicate to merge.

**`tenant_application_id` is not renamed.** `AutoMigrate` runs before the
migration job list in this repo, so it tried to add `origin_tenant_application_id`
as `NOT NULL` to a populated table and failed before any job could rename
anything. The Go field carries the new name via a `column:` tag instead.

Confirmed by the rehearsal, unchanged: the `2608NHQ8DS` figure is
**660,000 pesewas of advance rent — exactly 12 months at 55,000** — and total
outstanding is byte-identical before and after the full migration.

---

## Schema

### `FinancialAccount` — the lease pointer goes, the lifecycle arrives

```go
TenantID   *string  // denormalised. Nullable: application-stage has no tenant yet.
PropertyID *string  // denormalised

OriginTenantApplicationID string  // was TenantApplicationID. Provenance only.
LeaseID *string // DROPPED — leases point at accounts now, not the reverse.

Status            string     // ACTIVE | CLOSURE_ELIGIBLE | CLOSED
ClosureEligibleAt *time.Time
ClosedAt          *time.Time // already present
```

`TenantID` and `PropertyID` stay denormalised reporting columns — they are
**not** identity (see Rule 1). Dropping `LeaseID` removes the `uniqueIndex`
that made one-account-per-lease structural.

`tenant_application_id` keeps its column name. The Go field became
`OriginTenantApplicationID` with an explicit `column:` tag instead: this repo
runs `AutoMigrate` *before* the migration job list, so a rename job would only
ever run after AutoMigrate had already failed trying to add the new column
`NOT NULL` to a populated table. The rename was cosmetic; the demotion to
provenance is what mattered, and that is unaffected.

The model's doc comment enshrined the old rule — *"There is deliberately no
OwnerType discriminator: every lease has an application behind it, so
application-stage is exactly LeaseID IS NULL"*. Application-stage is now
`TenantID IS NULL`, and the comment says so.

### `Lease` — gains the FK

```go
FinancialAccountID *string `gorm:"index;"`
ParentLeaseId      *string // already exists
```

No lease `type` column here; lineage is spec 2. `parent_lease_id` alone
identifies a renewal for this spec's backfill.

### `ChargeDefinition` and `ChargeInstance` — gain contractual context

```go
LeaseID *string `gorm:"index;"`
```

Nullable, and the null carries meaning:

| `lease_id` | Means | Examples |
|---|---|---|
| set | charged **under** that contract | rent, service charge, VAT, damage charge, and the security deposit — set to its *originating* lease |
| NULL | belongs to the relationship, with no contractual home | account credits, write-offs, cross-term adjustments, goodwill |

The deposit keeps `lease_id` pointing at the lease it was taken under, because
that is historical truth. "Deposit currently held" is computed account-wide, so
it remains visible to the closure flow regardless of which term took it.

An instance generated from a definition inherits the definition's `lease_id`.
Ad-hoc instances (`charge_definition_id IS NULL`) set it directly.

### `FinancialAccountClosure` — new

```go
type FinancialAccountClosure struct {
    BaseModelSoftDelete

    FinancialAccountID string `gorm:"not null;index;"`
    FinancialAccount   FinancialAccount

    Reason     string    `gorm:"not null;"`
    ClosedAt   time.Time `gorm:"not null;"`
    ClosedByID string    `gorm:"not null;"`
    ClosedBy   ClientUser

    OutstandingAtClosure int64 `gorm:"not null;default:0"`
    DepositHeldAmount    int64 `gorm:"not null;default:0"`

    // The reversing SECURITY_DEPOSIT instance, when the deposit was released.
    DepositRefundChargeInstanceID *string
    DepositForfeitedAmount        int64 `gorm:"not null;default:0"`

    ReopenedAt   *time.Time
    ReopenedByID *string
    ReopenedBy   *ClientUser
    ReopenReason *string
}
```

Closure is an event with an audit trail, not a status flip. Reopening is a
controlled action recorded on the same row.

### Cleanup in scope

`Lease.Financials` is typed `*TenantApplicationFinancials` — a name that only
made sense when accounts were reached through applications. Renamed to
`*AccountFinancials`.

### Why not a polymorphic join table

A join table of `(financial_account_id, type, lease_id?, tenant_application_id?)`
was considered and rejected. It needs two nullable FKs, a `type` discriminator
and a CHECK constraint to prevent both-null / both-set, and the `type` is fully
derivable from which FK is populated. Two ordinary FKs on the children beat one
polymorphic table on indexing, query shape and constraint simplicity.

**Revisit only if** one account must span several applications with per-link
metadata — the one case where the polymorphic shape starts paying for itself.

---

## Rules

Each is stated so it can become a test.

### 1. Account resolution follows the renewal chain

A new lease joins an existing account only when it is a **renewal** — its
`parent_lease_id` points at a lease already on that account. Everything else
opens its own account.

```
new lease has parent_lease_id?
  yes → reuse the parent's account (reviving it if CLOSURE_ELIGIBLE)
  no  → create a new account
```

**Not tenant + property.** That was the original decision, and the rehearsal
disproved it: production has two tenants holding several concurrent leases on
*different units at one property* — one of them six leases across four units.
Those are separate money relationships with separate deposits, and keying on
tenant + property would have folded them into a single ledger. `TenantID` and
`PropertyID` remain on the account as denormalisation for reporting; they are
not a key.

Reuse considers an account `ACTIVE` **or** `CLOSURE_ELIGIBLE`. A lease that
expired while its renewal was still being negotiated leaves the account
eligible; the renewal **revives** it to `ACTIVE` and clears
`closure_eligible_at`. Only a genuinely `CLOSED` account is never reused.

Because every application gets its own account, there is no duplicate to merge
at approval — an earlier draft of this spec specified a merge for that case,
and chain resolution removes the need for it entirely.

### 2. Currency is immutable

A renewal inherits `Currency`. A ledger in two currencies does not reconcile.
Changing currency means closing the account and opening another.

### 3. Billing policy is account-level and forward-only

`RentBillingCadence`, `RentBillingInterval` and `AutoIssueDaysBefore` are
collection policy, not lease terms. A renewal may change them; the change
affects future materialisation only, never instances already generated.

`RentFee` is per-lease and free to change — it already lives on `leases`.

### 4. Charges append, never mutate

A renewal closes the old `ChargeDefinition` (`Status = 'CLOSED'` at the old
term's end — the column exists, and `charge.go:402` already does this for rent
reviews) and opens new definitions scoped to the new lease.

Instances already generated keep their historical amounts. Rent of GHS 2,000
under the 2026 term stays 2,000 forever; the 2027 term gets its own definition
at 2,500. There is no "amount changed from X to Y" anywhere.

### 5. The deposit is never re-charged

A renewal appends no `SECURITY_DEPOSIT` charge. The existing deposit stays on
the account, untouched — which is the main practical benefit of keeping the
account open, and it comes for free from the append-only rule.

If rent rises and the deposit should rise with it, that is an explicit new
`SECURITY_DEPOSIT` instance **for the difference only**, scoped to the new
lease, created by PM action. Never automatic. Automatic is exactly the bug
where a renewing tenant appears to owe another full deposit.

### 6. Outstanding money crosses the term boundary for free

Allocation and balance are already account-scoped and never read a lease. An
unpaid December from lease #1 and January from lease #2 sit in one queue, and
one payment clears both in due-date order.

This rule requires **no code**. It is recorded because it is the payoff.

### 7. Closure follows the relationship, not the lease

```
ACTIVE
  │  every lease in the chain has ended (Completed | Terminated | Cancelled)
  │  AND no Pending or Active successor exists anywhere in the chain
  ▼
CLOSURE_ELIGIBLE ──── a new lease arrives ────► back to ACTIVE
  │  PM reviews the closure checklist
  ▼
CLOSED  + FinancialAccountClosure event
```

**Lease termination does not close an account. It makes the account eligible
for closure.** The system can tell a PM "this looks ready to close"; it never
decides on its own that a tenant is financially finished.

This matters because a lease can be terminated administratively while the
tenant is still in the unit, termination dates change, terminations get
cancelled, and tenants remain through notice periods. An account that blindly
followed lease status would release a deposit to a sitting tenant.

Closure gates, split by how hard they bite:

| Gate | Enforcement |
|---|---|
| Every lease in the chain has ended | **Blocking** |
| Outstanding balance is zero, offset against the deposit, or explicitly written off | **Blocking** — the PM chooses which |
| Deposit released, offset, or forfeited with a reason | **Blocking** |
| Move-out evidence: a `CHECK_OUT` `LeaseChecklist` or a completed `LeaseTermination` | **Advisory warning only** |

Move-out is advisory deliberately. A lease that simply runs to `Completed`
never produces a termination record, so a blocking gate would strand every
clean tenancy.

Deposit release needs no new machinery: sign carries direction, so a negative
`SECURITY_DEPOSIT` instance *is* a refund (`financials/types.go:21-24`), and
`ChargeInstance.ReversesChargeInstanceID` caps it at the original's
`SettledAmount` — you cannot refund money never received. Offsetting a deposit
against an outstanding balance is a partial reversal.

---

## Visibility

Both leases show the **same account balance and the same payment history**.
Charges are *grouped* by lease, not *split* by it.

This is the ownership-versus-grouping distinction, and it is why
`ChargeInstance` carries all three IDs explicitly rather than being reached
through a hierarchy:

```
ChargeInstance
  financial_account_id   ← financial ownership
  lease_id               ← contractual context (nullable)
  charge_definition_id   ← what generated it (nullable)
```

That answers questions in both directions with one row shape:

| Question | Query |
|---|---|
| What does this lease owe? | `WHERE lease_id = ?` |
| What does this tenant owe across the whole tenancy? | `WHERE financial_account_id = ?` |
| What did they pay during lease #1? | allocations → instances → `lease_id` |

### Why the account balance is never split per lease

An account's balance is `SUM(amount - settled_amount)` across all charges, and
payments allocate against charges with no lease reference at all. Splitting the
*balance* by lease means lease A shows one figure, lease B another, and neither
equals the real one. A deposit taken under the first term and a credit carried
into the second have no correct home.

A PM who wants "what is this renewal alone worth" gets a grouped subtotal — a
subheading, not a separate ledger. Spec 3 renders this as a **This Lease /
Entire Tenancy** toggle, on the `lease_id` filter this spec adds.

The UI never uses the words "financial account". That is an implementation
concept; the landlord's concepts are *this lease* and *the whole tenancy*.

### Why lease scoping keys off `period_start`, not `created_at`

Rejected on evidence. After the v2 backfill, all 1,050 charge instances carry
`created_at = 2026-08-11` (the backfill date) while their real periods span
2018-03-02 → 2030-10-18. Row-creation time is a migration artifact.

It also fails for new data: a charge for "December 2026 Rent" entered on 20
July would attach to whichever lease was current in July, not to the term
containing December. The correct key is `period_start` / `due_date` against the
lease's `move_in_date` → `move_out_date`.

---

## API

`/v1/financial-accounts/{account_id}` already exists as a route group
(`internal/router/client-user.go:384`). Closure hangs off it.

| Change | Detail |
|---|---|
| `GET /v1/financial-accounts/{id}/charges` | gains a `lease_id` filter. This alone serves spec 3's This Lease / Entire Tenancy toggle with no further backend work |
| `POST /v1/financial-accounts/{id}/close` | ADMIN or OWNER. Body carries the PM's resolution — deposit release / offset / forfeit-with-reason, and how any outstanding balance is settled. Writes the `FinancialAccountClosure` row |
| `POST /v1/financial-accounts/{id}/reopen` | ADMIN or OWNER, reason required. Recorded on the same closure row |
| account response | embeds `closure_eligibility`: the gate checklist with blocking reasons, so the UI renders the closure panel without a second endpoint |
| `GET /v1/leases/{lease_id}` | financials resolve via `leases.financial_account_id`; `financials.GetByLease` is reimplemented against the new FK |

Eligibility is recomputed on lease status transitions (activate, complete,
terminate, cancel), with a daily sweep as backstop riding alongside the
existing issuance sweep.

Swagger godoc annotations are updated on every touched handler.

---

## Migration

**Four** jobs in `init/migration/jobs/`, following the pattern the v2 rollout
established: non-destructive by default, the destructive step behind an
explicit env var. The single-row repair was split out of the backfill during
implementation — a structural backfill and a hand-repair of one production row
have different risk profiles and should roll back independently.

| Job | ID | Destructive |
|---|---|---|
| `AddSharedFinancialAccountLinks` | `202608180001` | No |
| `BackfillSharedFinancialAccounts` | `202608180002` | No |
| `RepairRenewalLeaseFinancialAccount` | `202608180003` | No |
| `DropFinancialAccountLeaseID` | `202608180004` | **Yes — gated** |

Gate variable: `SHARED_ACCOUNT_MIGRATION_ALLOW_DROP=true`. Without it the job
is not registered at all, so it is not recorded as applied and still runs later
when the variable is set.

**Supabase note.** `uuid-ossp` lives in the `extensions` schema on Supabase, so
`uuid_generate_v4()` in Job 1's `CREATE TABLE` fails unless the database's
search_path includes it:

```sql
ALTER DATABASE <db> SET search_path TO public, extensions;
```

### Job 1 — `AddSharedFinancialAccountLinks` (non-destructive)

- add `leases.financial_account_id`
- add `charge_definitions.lease_id`, `charge_instances.lease_id`
- add `financial_accounts.closure_eligible_at`
- create `financial_account_closures`
- rename `financial_accounts.tenant_application_id` →
  `origin_tenant_application_id`

`financial_accounts.lease_id` is left in place so Job 2 has a source to read
and rollback stays cheap.

### Job 2 — `BackfillSharedFinancialAccounts` (non-destructive)

1. `leases.financial_account_id` ← from existing `financial_accounts.lease_id`,
   a clean 1:1 today.
2. `charge_instances.lease_id` ← matched by `period_start` against the lease's
   `move_in_date` → `move_out_date`. Instances with no period, or with no
   matching term, stay NULL — account-level, which is correct for deposits
   taken before any term began.
3. `charge_definitions.lease_id` ← the same logic via the definition's
   `start_date`.
4. Verify `tenant_id` and `property_id` are populated on every account. They
   are nullable today and now carry identity; any account missing them is a
   migration failure, not a row to skip.
Repairing lease `2608NHQ8DS` is Job 3, not part of this one.

Money already received outside the system is represented as a real `Payment`
(rail `OFFLINE`, flagged as migrated) with allocations against the charges it
settled — not as a direct write to `SettledAmount`. `SettledAmount` stays
derived from allocations, the existing invariant tests keep holding, and
"how much has this tenant paid me" answers truthfully.

### Job 3 — `RepairRenewalLeaseFinancialAccount` (non-destructive)

Points lease `2608NHQ8DS` at its **parent's** account, materialises its 12
monthly rent charges scoped to that lease, and records the pre-system money as
a real `Payment` with an invoice, line items and allocations. Rehearsal result:
12 charges of 55,000, all settled, account-wide outstanding unchanged.

A guard on every statement makes a re-run a no-op.

### Job 4 — `DropFinancialAccountLeaseID` (destructive, env-gated)

Drops `financial_accounts.lease_id` and its `uniqueIndex` — the column that
makes one-account-per-lease structural. Gated behind an explicit env var in the
manner of `FINANCIAL_MIGRATION_ALLOW_DROP`, so `make update-db` stays safe by
default and the job is not recorded as applied until it genuinely runs.

### Verification

`services/main/scripts/verify-shared-account-invariants.sql`, alongside the
existing `verify-financial-invariants.sql`:

- total account balance is **identical before and after** — the backfill must
  not move a cedi
- every non-cancelled lease has a `financial_account_id`
- every `charge_instance.lease_id` is NULL or points to a lease on that same
  account
- an instance's `lease_id` agrees with its definition's wherever both are set
- every lease in a renewal chain shares one account (the chain invariant that
  replaced the rejected tenant+property uniqueness check)
- every `CLOSED` account has a closure record
- no `CLOSURE_ELIGIBLE` or `CLOSED` account has a Pending or Active lease

A prod-dump rehearsal precedes any deploy, per the v2 precedent.

### The `2608NHQ8DS` figure — resolved

Lease `2608NHQ8DS` carries `initial_deposit_fee: 660000` in legacy
`leases.meta`. This is **a year of rent paid in advance, not a deposit**, and
two things follow.

**It is 660,000 pesewas — GHS 6,600.** Amounts are stored in the smallest
currency unit (`invoice.go:57`), so a year at GHS 6,600 is roughly GHS 550 a
month. Earlier drafts of this document and of `RENTL-51` wrote the figure as
"GHS 660,000", which was wrong by a factor of 100.

**No special case is needed.** `initial_deposit_fee` already means advance rent
throughout this system, and is entirely separate from `security_deposit_fee` —
`e2e/cases/d6-initial-deposit-remainder.sh` states it directly: *"a 1,050,000
initial deposit on 100,000 rent: ten and a half months."* The existing machinery
converts the money to whole prepaid billing periods and refuses to lose the
remainder to integer division.

So Job 2, step 5 materialises the full term's rent charges and settles the
first `660000 / monthly_rent` periods against the pre-system `Payment`. No
`SECURITY_DEPOSIT` instance is involved. The only value still to read off the
dump is that lease's monthly rent, which sets the period count.

---

## Testing

The financials package is deliberately pure — no DB, no context, no clock
beyond what is passed in — so most of this needs no database.

- **Account resolution**, table-driven: `ACTIVE` reuses; `CLOSURE_ELIGIBLE`
  revives and clears the timestamp; `CLOSED` opens a new account.
- **The dangerous test, named explicitly:** an account with any Pending or
  Active successor lease in its chain never reaches `CLOSURE_ELIGIBLE`. This is
  the deposit-refunded-to-a-tenant-who-still-lives-there case. It gets its own
  test rather than being implied by others.
- **Closure gates:** outstanding balance blocks; unresolved deposit blocks;
  missing move-out evidence warns but does not block.
- **Application-stage merge:** approving an application for a tenant who
  already holds an open account at that property re-points the stub's charges
  and closes it `MERGED`, leaving exactly one open account and an unchanged
  total balance.
- **Charge scoping:** an instance inherits its definition's `lease_id`;
  disagreement between the two is rejected.
- **Invariants** extended in `financials/invariants_test.go`: allocation totals
  are unchanged by the presence of `lease_id`.
- **Migration:** prod-dump rehearsal plus the verification SQL above, with
  balance-unchanged as the headline assertion.
- **E2E**, a new group `j` in `services/main/scripts/e2e/cases/` (groups a–i
  are taken), following the shape of `h1-deposit-refund.sh`:
  - `j1-shared-account-two-leases.sh`
  - `j2-closure-blocked-by-balance.sh`
  - `j3-closure-releases-deposit.sh`

  The **renew-then-sweep** scenario belongs to spec 2 — this spec ships no
  endpoint that creates a renewal.

---

## Prior art

One renewal already exists in production, created by hand-written SQL before
any of this existed: lease `2608NHQ8DS` (Gifty Gosu, AdomBi Villa Apartment 2
Amasaman, Room 4), 2026-08-01 → 2027-08-01, `parent_lease_id` → `260732XOK3`.

It has **no financial account**. Its money — a year of rent paid in advance,
660,000 pesewas — lives in legacy `leases.meta`, and it is invisible to the
issuance sweep. The v2 backfill did not miss it:
accounts keyed off `tenant_applications`, and a renewal reuses its parent's
application, whose single account was already bound to the parent lease.

Repairing that row is Job 2, step 5 of this spec.

Three further renewals are pending — two already paid, one unpaid. They were
held back rather than run through the legacy script, to avoid creating three
more orphans. The unpaid one is the important case: with no account, the sweep
can never bill it. **Creating those three is spec 2**, since they need the
renewal endpoint; they are not a backfill.

The original script, `services/main/scripts/renew-lease-gifty-gosu.sql`, was
deleted in commit `3c92a693` and is recoverable with:

```bash
git show 3c92a693^:services/main/scripts/renew-lease-gifty-gosu.sql
```

Reusable from it: lease copying, unit-status recomputation, `unit_date_blocks`
handling. **Do not reuse** its `leases.meta` money handling or its
`next_billing_date` reasoning — both belong to the model that was replaced.
