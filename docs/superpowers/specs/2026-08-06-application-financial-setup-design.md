# Application Financial Setup — Redesign

Date: 2026-08-06
Scope: `apps/property-manager` — the **Add financial Setup** step of the tenant
application checklist
Backend model: `docs/superpowers/specs/2026-08-05-tenant-financial-account-design.md`
Verified behaviour: `services/main/scripts/e2e/` (39 scenarios, all passing)

The existing page captures rent fee and security deposit and generates one
invoice. The FinancialAccount model replaced that with a ledger of charges,
invoices composed against them, and a billing policy. Nothing on the current
page survives.

---

# Part 1 — Data brief

Everything the UI can read, write and rely on. Amounts are **minor units**
(pesewas): GH₵ 1,000 is `100000`. `apps/property-manager/app/lib/format-amount.ts`
already converts.

## 1.1 What the application carries

From `GET …/tenant-applications/{id}`:

| Field | Set by | Notes |
|---|---|---|
| `rent_fee` | Financial setup | **Null on a new application.** The unit's rent is a prefill the UI offers, never inherited by the API |
| `rent_fee_currency` | Inherited from unit | `GHS` |
| `payment_frequency` | Inherited from unit | `MONTHLY` \| `QUARTERLY` \| `BIANNUALLY` \| `ANNUALLY` \| `WEEKLY` \| `DAILY` |
| `desired_move_in_date` | **Move-in setup** | RFC3339 |
| `stay_duration` | **Move-in setup** | Integer |
| `stay_duration_frequency` | **Move-in setup** | Same enum as above |
| `security_deposit_fee` | *No longer set by this page* | Left null; deposits become ad-hoc charges |
| `initial_deposit_fee` | *No longer set by this page* | Superseded by billing policy |
| `financial_account` | Derived | Null until `charges:prepare`; the discriminator for page mode |

`financial_account` is a summary, not the ledger:

```jsonc
{
  "id": "…", "code": "FA-2608-A1B2C3", "currency": "GHS",
  "total_charged": 1200000,      // live charges only, voided excluded
  "total_settled": 0,
  "outstanding_amount": 1200000,
  "available_credit": 0,         // always 0 now — overpayment is refused
  "charge_count": 12,
  "invoice_count": 0
}
```

## 1.2 Charges

`GET …/financial-accounts/{account_id}` returns `{account, charges[], total_charged,
total_settled, outstanding_amount, available_credit}`. `GET …/charges` returns
the array alone. Both accept `?include_voided=true`.

```jsonc
{
  "id": "…",
  "name": "Rent – September 2026",
  "category": "RENT",
  "amount": 100000,              // SIGNED: negative is a refund
  "currency": "GHS",
  "due_date": "2026-09-08T00:00:00Z",
  "period_start": "2026-09-01T00:00:00Z",   // rent only
  "period_end": "2026-09-30T00:00:00Z",     // rent only
  "invoiced_amount": 0,          // claimed by a live invoice line
  "settled_amount": 0,           // covered by payments
  "outstanding_amount": 100000,  // amount − settled
  "status": "OUTSTANDING",
  "voided_at": null, "voided_reason": null
}
```

**Categories:** `RENT`, `SECURITY_DEPOSIT`, `AGENCY_FEE`, `VAT`, `UTILITY`,
`DAMAGE_CHARGE`, `EARLY_TERMINATION_FEE`, `OTHER`.

**Status is derived, never stored** — from the two amounts plus `voided_at`:

| Status | Means | Landlord reading |
|---|---|---|
| `OUTSTANDING` | nothing claimed | Not yet billed |
| `PARTIALLY_INVOICED` | part claimed | Partly billed |
| `INVOICED` | fully claimed, unpaid | Billed, awaiting payment |
| `PARTIALLY_SETTLED` | part paid | Part paid |
| `SETTLED` | fully paid | Paid |
| `VOID` | removed | Removed (only via `include_voided`) |

## 1.3 Endpoints

All property-scoped under `/api/v1/admin/clients/{client_id}/properties/{property_id}`.

| Action | Call |
|---|---|
| Set terms | `PATCH /tenant-applications/{id}` `{rent_fee}` |
| Build the ledger | `POST /tenant-applications/{id}/charges:prepare` |
| Read ledger | `GET /financial-accounts/{account_id}[?include_voided=true]` |
| Add a charge | `POST /financial-accounts/{account_id}/charges` |
| Remove a charge | `PATCH /financial-accounts/{account_id}/charges/{charge_id}/void` `{reason}` |
| Set collection plan | `PATCH /financial-accounts/{account_id}/billing-policy` |
| Create an invoice | `POST /financial-accounts/{account_id}/invoices:compose` |
| Record payment | `POST /invoices/{invoice_id}/pay` |
| Read an invoice | `GET /invoices/{invoice_id}?populate=LineItems` |

Request bodies:

```jsonc
// POST /charges
{ "name": "Agency fee", "category": "AGENCY_FEE", "amount": 50000,
  "currency": "GHS", "due_date": "2026-09-01T00:00:00Z" }

// PATCH /billing-policy — cadence is one of four exact values.
// There is no WHOLE_TERM.
//
//   "Whole term up front"   -> { cadence: "MANUAL" }  + see below
//   "Every 3 months"        -> { cadence: "EVERY_N_PERIODS", interval: 3 }
//   "Every month"           -> { cadence: "EVERY_PERIOD" }
//   "I'll invoice manually" -> { cadence: "MANUAL" }
//
// EVERY_N_PERIODS with interval 1 behaves identically to EVERY_PERIOD, but the
// interval is then load-bearing: drop it and `take` falls through to ALL
// remaining charges, silently turning "every month" into "whole term".
//
// "Whole term up front" is a collection action, not a schedule. It stores
// MANUAL — nothing is issued automatically because the landlord is taking the
// money now — and the UI selects every outstanding charge in section 4 and
// scrolls there. UPFRONT is deliberately unused: it would auto-issue one
// invoice, which is the opposite of collecting by hand.
//
// Consequence, accepted: if the tenant then pays only part, MANUAL leaves the
// remainder with no automation behind it until the landlord invoices by hand
// or changes the plan.
{ "cadence": "EVERY_N_PERIODS", "interval": 3, "auto_issue_days_before": 5 }

// POST /invoices:compose — EXACTLY ONE of claims or amount
{ "claims": [{ "charge_instance_id": "…", "amount": 100000 }],
  "issue": true, "due_date": "2026-09-08T00:00:00Z" }   // due_date optional
{ "amount": 250000, "issue": true }

// POST /invoices/{id}/pay — creates AND verifies in one call, returns 204
{ "payment_account_id": "…", "amount": 250000,
  "provider": "CASH", "reference": "RCP-001" }
```

`provider`: `MTN` | `VODAFONE` | `AIRTELTIGO` | `PAYSTACK` | `BANK_API` | `CASH`.
The payment account must be an `ACTIVE` `OFFLINE` account for the client —
fetch from `GET /v1/admin/clients/{client_id}/payment-accounts`.

## 1.4 Rules the UI must respect

Each is enforced server-side and covered by a scenario.

1. **`charges:prepare` needs six fields** — rent fee, currency, payment
   frequency, move-in date, stay duration, duration frequency. Currency and
   frequency are inherited from the unit at creation; move-in setup supplies
   three more; **the agreed rent is the only one left, and it starts null**
   (case I5). So completing move-in setup can never produce a ledger on its own
   — `charges:prepare` returns `400 ApplicationMissingRentDetails` until the
   landlord states a figure. *This is why financial setup depends on move-in
   setup, and why the fee field is the gate.*
2. **Prepare is one-way.** A second call returns 400 (case G6). After it,
   `financial_account` is non-null — use that as the mode switch.
2b. **A prepared account is `MANUAL` and bills nothing** until the landlord
   picks a collection plan (case I5). `DeriveRentBillingPolicy` returns MANUAL
   when there is no initial deposit, precisely so that creating charges cannot
   start invoicing on a cadence nobody chose. Section 3 therefore pre-selects
   "I'll invoice manually" — it is what is actually stored, not a guess.
3. **Editing terms re-derives the schedule, while it is clean.** Changing rent,
   move-in date or duration regenerates every rent charge. Once *any* charge is
   invoiced or settled it returns `400 ChargesAlreadyBilled` and nothing moves —
   the application is rolled back with it (case G5).
4. **Rent due date = period start + grace**, not period start. 7 days monthly,
   14 quarterly/bi-annually, 30 annually, 3 weekly, 0 daily. Show due dates, not
   period starts.
5. **A claim cannot exceed a charge's uninvoiced balance** — `400
   ClaimExceedsChargeBalance` (case G1). Partial claims are fine.
6. **Composition bills; it does not settle.** `outstanding_amount` is unchanged
   by composing (case B1). Only payment moves it.
7. **A payment cannot exceed the invoice's remaining balance** — `400
   PaymentExceedsInvoiceBalance` (case F1). Under-paying is allowed and fills
   oldest-due-first.
8. **Compose takes exactly one of `claims` or `amount`** — both or neither is
   `400 ProvideEitherClaimsOrAmount` (case G2).
9. **A charge already billed cannot be removed** — `400 ChargeAlreadyBilled`.
   Void the invoice first, which releases the claim (case E4).
10. **Voided charges are hidden by default** and excluded from every total;
    `?include_voided=true` reveals them without changing the totals (case E3).
11. **The sweep collects rent plus any one-off already due** (case I3), and
    never bills the same charge twice — whatever the UI invoices first is
    skipped by the sweep (case I4).
12. **A composed invoice may have no due date**, which is fine; it is editable
    afterwards via `PATCH /invoices/{id}` (case B3).
13. **Charges cannot be edited.** No `PATCH /charges/{id}` exists — remove and
    re-add.
14. **`available_credit` is always 0.** Overpayment is refused, so no credit can
    accumulate. Do not build UI for it.
15. **Display status is derived on the client; the lookup keys are not.**
    Invoices arrive as `DRAFT | ISSUED | PARTIALLY_PAID | PAID | VOID`, charges
    as `OUTSTANDING | PARTIALLY_INVOICED | INVOICED | PARTIALLY_SETTLED |
    SETTLED | VOID`. The two vocabularies overlap in spelling and mean
    different things, so a table keyed on the wrong set silently returns
    undefined.

    The UI does not mirror those names — it derives what the landlord should
    read, including states the server has no concept of: "Overdue" is
    `due_date < today` on an unpaid invoice, nothing more. One function per
    entity (`invoiceDisplayStatus`, `chargeDisplayStatus`) takes the API shape
    and returns `{label, tone}`.
16. **A payment settles an invoice's lines oldest-due-first**, and can settle a
    line partially. A line is not binary paid/unpaid: pay 120,000 against a
    300,000 invoice and the first line settles fully while the second takes
    20,000 of 100,000.
17. **A partially-invoiced charge is still claimable for its remainder** (case
    B5) — claim 40,000, then the other 60,000. Only a *fully* claimed charge is
    out of bounds.

## 1.5 Client-side schedule preview

Before prepare, the schedule can be computed exactly — the UI needs no API call
to show what is about to be created. Mirrors
`internal/services/financials/materialise.go`:

```
periods   = stay_duration                       (when frequencies match)
period n  = move_in_date + n × frequency        n = 0 … periods−1
due date  = period start + grace(frequency)
amount    = rent_fee, each period
label     = "Rent – <Month YYYY>"
total     = rent_fee × periods
```

---

# Part 2 — Frontend plan

## 2.1 Shape

Financial setup becomes four stacked sections, revealed progressively. Nothing
is a wizard — everything stays visible and editable once reached.

```
┌ Move-in setup incomplete ─────────────────────┐   ← gate, when blocked
│ Set the move-in date and duration first.      │
│ [ Go to move-in setup → ]                     │
└───────────────────────────────────────────────┘

1  Agreed rent            GH₵ [      ] / month    (unit charges 1,000) [Use this]
                          12 months from 1 Sep 2026 — from move-in setup

2  Schedule               12 charges · GH₵ 12,000
                          before prepare: computed preview
                          after prepare:  the live ledger
                          [ Add charge ▾ ]  Security deposit · Agency fee · VAT · Other

3  Rent collection        ( ) Whole term up front   → selects everything
                                                       below and scrolls to it
                          ( ) Every 3 months
                          ( ) Every month
                          (•) I'll invoice manually     ← what prepare stored
                          Auto-issue [5] days before each due date

4  Collect a payment      ☑ Security deposit      GH₵ 1,000
                          ☑ Rent – Sep 2026       GH₵ 1,000
                          ☐ Rent – Oct 2026       GH₵ 1,000
                          or enter amount [        ]
                          Total GH₵ 2,000   [ Record payment ]
```

Sections 2–4 are disabled until the one above is satisfied, with the reason
stated rather than a dead control.

## 2.2 Page modes

Driven by `tenantApplication.financial_account` and application status:

| Mode | When | Behaviour |
|---|---|---|
| **Blocked** | move-in setup incomplete | Gate card only, link to that step |
| **Setup** | move-in done, `financial_account` null | Rent fee empty, prefilled from the unit as a suggestion the landlord confirms or overrides; schedule is a computed preview; primary action **Create charges** |
| **Live** | `financial_account` present | Ledger from the API; terms still editable while clean; add/remove charges; policy; collect |
| **Locked** | any charge billed | Terms read-only with an explanation; collection continues |
| **Read-only** | application approved | Ledger and history visible; actions replaced by a link to the lease's Financials tab |

## 2.3 Files

Replacing `app/modules/properties/property/occupancy/applications/application/financial/`
— all seven current files go. Names mirror the design's components so the two
stay readable side by side.

| File | Design counterpart | Responsibility |
|---|---|---|
| `index.tsx` | `WebFinancial` | Mode resolution and section composition only |
| `move-in-gate.tsx` | `FGate` | The blocked state |
| `summary-bar.tsx` | `FSummaryBar` | Account code, Charged / Settled / Outstanding |
| `agreed-rent.tsx` | `FAgreedRent` | Rent field, unit prefill, save, and the rebuild warning |
| `schedule/preview.tsx` | `FSchedulePreview` | Computed schedule, suggestion chips, **Create charges** |
| `schedule/ledger.tsx` | `FLedger` | Live charges, collapsed rent run, removed-charge toggle |
| `schedule/rent-group.tsx` | `FRentGroup` | The collapsible twelve-month run |
| `schedule/add-charge-dialog.tsx` | `FAddChargeModal` | Ad-hoc charge form |
| `schedule/remove-charge-dialog.tsx` | `FRemoveChargeModal` | Void with reason; the already-billed refusal |
| `collection-plan.tsx` | `FCollectionPlan` | Cadence cards + auto-issue days |
| `collect/index.tsx` | `FCollectLive` | Tab state, payment details, submit |
| `collect/invoice-tab.tsx` | invoice list + line breakdown | Record against an existing invoice |
| `collect/compose-tab.tsx` | charge picker | Pick charges, amount shortcut |
| `collect/payments-list.tsx` | readonly branch | Post-approval history |
| `lib/schedule.ts` | `fSchedule` | Pure preview computation (§1.5) |
| `lib/cadence.ts` | — | Choice ⇄ `{cadence, interval}` (§1.3) |
| `lib/display-status.ts` | `FSTATUS` / `FINVSTATUS` | `chargeDisplayStatus` and `invoiceDisplayStatus` — API shape in, `{label, tone}` out, overdue derived |

New API layer `app/api/financial-accounts/` — `index.ts` (TanStack Query hooks)
and `server.ts` (loader fetch), following `app/api/invoices/`.

Two things the design fixtures get wrong that the implementation must not
inherit. `FCADENCE` carries `WHOLE_TERM`, which is not a cadence — that choice
stores `MANUAL` and drives a UI action instead (§1.3). And `FINVSTATUS` is
keyed on charge vocabulary, so looking an invoice up in it returns undefined
(rule 15).

## 2.4 Data flow

Route loader fetches the account summary server-side when
`financial_account` is present, seeding the query cache as `initialData` — the
pattern in `apps/property-manager/CLAUDE.md`. Every mutation invalidates both
the account query and the application query, since `financial_account` totals
live on the application.

The amount shortcut in the picker resolves **client-side** — same oldest-due-first
walk the backend uses — so the checkboxes update as the landlord types, then
the resulting claims are submitted explicitly. Predictable, and it means the
landlord sees the selection before committing rather than after.

## 2.5 Error states worth designing

Not generic toasts — each has a specific recovery:

| Error | Surface |
|---|---|
| `ChargesAlreadyBilled` | Inline on the rent field: "Rent can't change — payment already collected. Add a charge instead." |
| `ChargeAlreadyBilled` | In the remove dialog: "This is on invoice INV-… — void that invoice first." |
| `ClaimExceedsChargeBalance` | On the picker row, with the claimable remainder |
| `PaymentExceedsInvoiceBalance` | On the amount field, with the remaining balance |
| Prepare when move-in incomplete | Should be unreachable; if seen, re-show the gate |

## 2.6 Deliberately excluded

- **Credit UI.** `available_credit` is structurally 0.
- **Void/refund flows.** Negative charges are out of scope until the outbound
  disbursement rail exists (model spec §8).
- **Editing a charge.** No endpoint; remove and re-add.
- **Post-approval collection.** The lease Financials tab owns it.
- **Issuing an invoice without payment.** Composing always records the money as
  received. A landlord who wants a bill out ahead of payment puts rent on a
  cadence and lets issuance do it. Consequence, deliberately accepted: under
  MANUAL no unpaid invoice can exist, so section 4's "Against an invoice" tab
  only appears once a collection plan is chosen.
- **The `4/4` sub-step badge.** Needs redefining against these sections — the
  current count reflects the old page.

## 2.7 Answered by the design pass

The four questions left open on 2026-08-05 were resolved in
`Application Financial Setup.html`:

1. **Twelve rent charges collapse** into one expandable run, so the one-offs —
   deposit, agency fee — read as the exceptions they are.
2. **Due-date order, not category grouping.** It is the order payment fills
   them, so the ledger and the picker agree.
3. **Outstanding is a header stat**, captioned with the rule people get wrong:
   *only a payment moves this — invoicing does not*.
4. **Suggestion chips** carried it, with amounts editable inline before the
   charges are created.
