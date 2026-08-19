---
id: DRAFT-35
title: 'Account closure UI: eligibility panel and deposit release'
status: Draft
assignee: []
created_date: '2026-08-18 19:12'
labels:
  - frontend
  - financials
  - feature
dependencies:
  - RENTL-51
  - RENTL-56
references:
  - docs/superpowers/specs/2026-08-11-lease-renewal-financial-account-design.md
  - services/main/internal/services/financials/account_closure.go
  - services/main/internal/services/financials/closure.go
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Spec 4 of 4. **Not yet designed — brainstorm before planning.** Split out of the tenancy UI (RENTL-56) because it releases a tenant's deposit, and mixing a creation flow with a money-releasing flow in one spec makes both harder to review.

The backend is complete and rehearsed in RENTL-51:

- `GET /v1/financial-accounts/{id}` embeds `closure_eligibility` — every gate with `passed`, `blocking` and a `reason`, plus `deposit_held_amount` and `outstanding_amount`. The panel needs no second call.
- `POST /v1/financial-accounts/{id}/close` takes a reason and a deposit resolution (`RELEASE` / `OFFSET` / `FORFEIT`, the last requiring its own reason).
- `POST /v1/financial-accounts/{id}/reopen` takes a reason and is recorded on the closure row rather than silently flipping a status.

**The rule the UI must make legible:** lease termination does not close an account — it makes it *eligible*. Closing is a person's decision, because closing releases the deposit. An account with any Pending or Active lease can never be eligible; that invariant is what stops a deposit going back to a tenant who still holds the keys.

Three gates block (all leases ended, outstanding balance resolved, deposit resolved); missing move-out evidence **warns without blocking**, because a lease that simply runs to Completed never produces a termination record or a check-out checklist.

The interface should not say "financial account" — same constraint as RENTL-56.

Open questions for the brainstorm: where closure lives (lease page, a tenancy view, or somewhere in settings); how an eligible account is surfaced to a PM who is not already looking at it; and whether reopen is exposed in the UI at all or stays an API-only recovery.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The closure panel renders the eligibility checklist from the embedded closure_eligibility payload, showing every gate with its reason
- [ ] #2 Blocking gates disable the close action and say which one failed; the move-out gate warns without blocking
- [ ] #3 Closing collects a reason and a deposit resolution (release, offset, or forfeit with its own reason) before submitting
- [ ] #4 An account with a live lease can never be closed from the UI, and the reason why is visible rather than implied
- [ ] #5 Reopening, if exposed, collects a reason and makes clear it is recorded rather than silent
- [ ] #6 The interface never uses the words 'financial account'
- [ ] #7 All new UI is verified in both dark and light mode
<!-- AC:END -->
