# Lease Renewal on the Financial Account Model — Design

**Status:** Designed, deferred. Implement after the financials v2 release is in production.
**Date:** 2026-08-11
**Related:** `docs/runbooks/financial-account-backfill.md`

---

## Core idea

A **financial account is a continuing ledger between one tenant and one
property**. Leases are *terms* inside it. A renewal does not create a new money
relationship — it extends the existing one with a new term. Every decision below
follows from that sentence.

---

## Schema

Add to `leases`:

```go
FinancialAccountID *string `gorm:"index;"`
```

Drop the `uniqueIndex` on `financial_accounts.lease_id`. That column becomes the
*originating* lease, or is removed once the new FK is backfilled.

`financial_accounts.tenant_application_id` stays unique and NOT NULL — the
originating application. The renewal lease reuses its parent's
`tenant_application_id` (`leases.tenant_application_id` is NOT NULL and a
renewal has no application of its own), which makes application→lease 1:many.

### Why not a polymorphic join table

A join table of `(financial_account_id, type, lease_id?, tenant_application_id?)`
was considered and rejected. It needs two nullable FKs, a `type` discriminator
and a CHECK constraint to prevent both-null / both-set, and the `type` is fully
derivable from which FK is populated. `FinancialAccount` already documents this
reasoning for its own shape:

> There is deliberately no OwnerType discriminator: every lease has an
> application behind it, so "application-stage" is exactly LeaseID IS NULL.

If multiple applications per account are ever needed, the symmetric move is a
second plain FK (`tenant_applications.financial_account_id`), not a polymorphic
table. Two ordinary FKs on the children beat one polymorphic table on indexing,
query shape and constraint simplicity.

**Revisit this only if** product direction requires one account to span several
applications with per-link metadata — that is the one case where the polymorphic
shape starts paying for itself.

---

## Rules

### 1. Rent policy stays on the account

`RentBillingCadence`, `RentBillingInterval` and `Currency` are collection
policy, not lease terms. A renewal inherits them.

- Changing cadence at renewal means updating the **account**, and it affects
  future charge generation only — never retroactively.
- **Currency may not change.** A ledger in two currencies does not reconcile;
  that case requires a genuinely new account.
- `RentFee` is per-lease and free to change — it already lives on `leases`.

### 2. The deposit is not re-charged

The existing `SECURITY_DEPOSIT` charge stays on the account, untouched. Renewal
only *appends* the new term's rent charges and never modifies existing ones.
This is the main practical benefit of keeping the account open, and it comes for
free from the append-only rule.

### 3. Account closure follows the chain, not the lease

Today an account closes when its lease ends. With renewals it must stay `ACTIVE`
while any child lease exists, and close only when the last term in the chain
ends with no renewal following.

**This is the rule most likely to cause damage.** Deposit refund happens at
closure, so getting it wrong refunds a deposit to a tenant who still lives
there. It needs an explicit test.

---

## Visibility

Both leases show the **full account** — same balance, same history. Charges are
visually grouped by which lease term their `period_start` falls in: a
subheading, not a filter.

### Why not scope per lease

An account's balance is `SUM(amount - settled_amount)` across all charges, and
payments allocate against charges with no lease reference at all. Splitting the
view by lease means lease A shows one figure, lease B another, and neither
equals the account's real balance. A deposit taken under the first term and a
credit carried into the second have no correct home.

A PM who wants "what is this renewal alone worth" gets a grouped subtotal in the
UI — not a split ledger.

### Why not scope by `created_at`

Rejected on evidence. After the v2 backfill, all 1,050 charge instances carry
`created_at = 2026-08-11` (the backfill date) while their real periods span
2018-03-02 → 2030-10-18. Row-creation time is a migration artifact.

It also fails for new data: a charge for "December 2026 Rent" entered on 20 July
would attach to whichever lease was current in July, not the term containing
December. If scoping is ever needed, the correct key is `period_start` /
`due_date` against the lease's `move_in_date` → `move_out_date`.

---

## API

```
POST /v1/leases/{lease_id}/renew
```

**Body:** new term (`move_in_date`, `stay_duration`, `stay_duration_frequency`),
optional `rent_fee`, optional documents.

**Steps:** create the child lease → set `parent_lease_id` → point
`financial_account_id` at the parent's account → derive rent charges for the new
term onto that account → re-occupy the unit and add a `unit_date_blocks` LEASE
row for the new term.

**Guards** (proven by the manual script, `scripts/renew-lease-gifty-gosu.sql`):

- parent lease must be Active or Completed
- parent must not already have a renewal
- unit must have capacity (`occupying >= max_occupants_allowed` → Occupied,
  `> 0` → PartiallyOccupied, mirroring `ApproveTenantApplication`)

### Prerequisite bug fix

`CreateLease` declares `ParentLeaseId` in `CreateLeaseInput` but never assigns
it to the `models.Lease` literal (`internal/services/lease.go`), so the link is
silently dropped. Renewal cannot work until that is fixed. `UpdateLease` does
apply it, but only while the lease is `Pending` and no HTTP body exposes it.

---

## Sequencing

Implement **after** the financials v2 release reaches production.

The financials rollout already has a five-step production ordering with an
irreversible final step (`DropLegacyFinancialColumns`). Folding a second schema
change into it means re-running the dump rehearsal and re-verifying all ten
gates against a moving target. Renewal is not blocked by anything in that
release and builds cleanly on top once the account model is live.

---

## Prior art

One renewal already exists in production, created manually before this feature
existed: lease `2608NHQ8DS` (Gifty Gosu, AdomBi Villa Apartment 2, Room 4),
2026-08-01 → 2027-08-01, `parent_lease_id` → `260732XOK3`. It has **no**
financial account link — `financial_accounts.lease_id` still points at the
parent. Backfilling that row is part of this work.
