---
id: DRAFT-36
title: 'Financials: This Lease / Entire Tenancy toggle'
status: Draft
assignee: []
created_date: '2026-08-18 21:37'
labels:
  - frontend
  - financials
  - feature
dependencies:
  - RENTL-56
references:
  - docs/superpowers/specs/2026-08-17-tenancy-ui-design.md
  - docs/superpowers/specs/2026-08-11-lease-renewal-financial-account-design.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Deferred out of RENTL-56 to keep that release focused on the renewal wizard and lineage views. **Not yet designed.**

A toggle on the lease Financials tab, defaulting to **This Lease**, filtering the charge list by `lease_id`. The backend is already done — spec 1 shipped the filter on `GET /v1/financial-accounts/{id}/charges` and exposes `lease_id` on every charge; nothing server-side is needed.

**The rule it must hold to: the toggle filters the list, never the totals.** `MoneyHero`'s figures stay account-wide in both positions. An account's balance is `SUM(amount - settled_amount)` across every charge, and payments allocate against charges with no lease reference at all — so a balance split by term equals neither term's truth. If a per-term subtotal is wanted it is a subheading inside the list, never a competing headline figure.

**Why the filter cannot simply be applied without the toggle** — this is what made it a deferral rather than a quick win:

- The security deposit carries the lease it was *taken under* (spec 1 keeps that as historical truth), so filtering a renewal's tab by its own `lease_id` hides the deposit the PM is holding.
- Account-level charges — credits, write-offs, cross-term adjustments — carry no `lease_id` at all. That is what NULL means, and they would disappear too.
- The account-wide totals would stop matching a filtered list, with nothing on screen to explain the gap. The toggle is what makes that legible.

Only worth building once tenancies routinely have more than one term. Today nearly all have one, where the account view is already identical to "this lease".

Copy: *This Lease* and *Entire Tenancy*. Never "financial account", never "ledger".

States a design must cover: a lease with no renewal (the toggle has nothing to reveal — absent rather than present-and-pointless); Entire Tenancy showing charges from a term the user is not viewing, which must read as belonging elsewhere; and account-level charges appearing under Entire Tenancy but not This Lease, which is correct and must not look like a bug.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A This Lease / Entire Tenancy toggle on the Financials tab, defaulting to This Lease
- [ ] #2 The toggle filters the charge list by lease_id while MoneyHero's totals stay account-wide in both positions
- [ ] #3 The toggle is absent for a lease with no renewal, rather than shown with nothing to reveal
- [ ] #4 Account-level charges with no lease_id appear under Entire Tenancy and not under This Lease, presented so it does not read as missing data
- [ ] #5 The interface never uses the words 'financial account' or 'ledger'
- [ ] #6 Verified in both dark and light mode
<!-- AC:END -->
