---
id: RENTL-47
title: >-
  Multi-currency Phase 2: historical-FX analytics conversion + dashboard
  currency switcher
status: To Do
assignee: []
created_date: '2026-06-11 12:32'
labels:
  - backend
  - frontend
  - cube
  - multi-currency
dependencies:
  - RENTL-46
references:
  - services/main/internal/handlers/analytics.go
  - services/cube/cube.js
  - services/cube/model/cubes/Invoices.js
  - services/cube/model/cubes/Expenses.js
  - apps/property-manager/app/api/analytics/index.ts
  - apps/property-manager/app/modules/dashboard/cards.tsx
  - apps/property-manager/app/modules/dashboard/index.tsx
  - >-
    apps/property-manager/app/modules/properties/property/financials/invoices/components/cards.tsx
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Second multi-currency phase: convert mixed-currency portfolio analytics into a chosen reporting currency using historical daily FX rates, and let users view their org dashboard in any currency.

## Depends on RENTL-46
Requires the `exchange_rates` table (USD-base daily rates), `Client.currency`, and `Property.currency` delivered in Phase 1.

## Context
Dashboard money figures (revenue, outstanding, collected) are NOT computed in the Go API — `internal/handlers/analytics.go` only mints a Cube.js JWT, and the frontend (`app/api/analytics/index.ts` → `cubeLoad`) queries the **Cube.js service in this repo at `services/cube`** directly. Cube reads the app Postgres. The current money measures (`Invoices.paidAmount`, `Invoices.outstandingAmount` in `services/cube/model/cubes/Invoices.js`) are plain `SUM(total_amount)` with **no currency awareness** — they would sum mixed currencies incorrectly. This phase adds converted measures driven by a target reporting currency threaded through the analytics JWT.

Conventions: JSON snake_case; handlers call services (never repositories); update Swagger godoc; dark + light mode; no auto-commit. Per the no-hook-defaults rule, callers own the target-currency param (don't default it inside hooks).

## Backend (`services/main`)
- `internal/handlers/analytics.go` `GetToken`: accept an optional `?currency=` query param (validate via `internal/lib/currency.go`). Resolve reporting currency = provided value (the "View As" case) else the authenticated `Client.Currency` (load via the client service, not the repo). Add it to the JWT `u` claim as `reportingCurrency`. Update Swagger godoc.

## Cube.js (`services/cube`)
- `cube.js`: `checkAuth` already unwraps `u` into `securityContext`. Update `contextToAppId` to include the reporting currency, e.g. `RENTLOOP_${clientId}_${reportingCurrency ?? 'GHS'}`, so each (client, currency) compiles its own schema (bounded by the supported-currency count).
- `model/cubes/Invoices.js`: add currency-converted measures alongside the existing pesewa ones (e.g. `paidAmountConverted`, `outstandingAmountConverted`, `totalAmountConverted`). Each multiplies `total_amount` by the historical USD cross-rate to `COMPILE_CONTEXT.securityContext.reportingCurrency`: `total_amount * (usd_to_target at record date) / (usd_to_recordCurrency at record date)`, looking up `exchange_rates` with `effective_date <= record date ORDER BY effective_date DESC LIMIT 1`. Use `paid_at` for paid measures, `issued_at` for outstanding. When target == record currency the ratio is 1. Keep the original measures intact.
- `model/cubes/Expenses.js`: mirror the converted-measure pattern if expenses feed any dashboard card.

## Frontend (`apps/property-manager`)
- `app/api/analytics/index.ts`: `useGetAnalyticsToken(clientId, currency)` forwards `?currency=` and includes `currency` in the queryKey so switching currency refetches a scoped token. Caller supplies `currency`.
- `app/modules/dashboard/cards.tsx` (org): switch to converted Cube measures and pass the active reporting currency to `formatAmount(...)` (currently no currency arg → GHS). Reporting currency from the "View As" state, default `Client.currency` via `useClient()`.
- `app/modules/properties/property/financials/invoices/components/cards.tsx` (property): use converted measures, request the token with `currency = Property.currency`, pass `Property.currency` to `formatAmount(...)` via `useProperty()`.
- `app/modules/dashboard/index.tsx`: add a top-right "View As" `<Select>` (session-only state, does not persist to `Client`), default `Client.currency`; selection flows to `useGetAnalyticsToken` and `formatAmount`. Optional tooltip "Converted using historical FX rates" on converted cards.
- Invoice/list tables already pass per-row `currency` to `formatAmount` — leave unchanged (original currency preserved as a legal record).

## Verification
- Backend: `GetToken?currency=USD` mints a JWT with `u.reportingCurrency = USD`; without it, defaults to the client's currency. `make generate-docs`.
- Cube: query `Invoices.paidAmountConverted` for a client with mixed-currency invoices; totals match expected cross-rate conversion at historical dates; target == record currency yields identity.
- Frontend: org dashboard shows figures in org currency; "View As" re-queries and re-labels cards in the chosen currency (session-only, no settings change); property dashboard shows property currency. `yarn types:check` + `yarn lint`; verify dark + light.

Full plan: `~/.claude/plans/rentloop-multi-currency-implementation-curious-fiddle.md`
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GetToken accepts an optional currency query param, validates it, and embeds the resolved reporting currency (default = Client.currency) in the analytics JWT
- [ ] #2 Cube.js exposes currency-converted invoice measures that convert each record to the JWT reporting currency using historical USD cross-rates at the record's date, leaving original pesewa measures intact
- [ ] #3 A client with mixed-currency invoices gets a correct single-currency total; converting to a record's own currency yields the identity value
- [ ] #4 Org dashboard money cards display in the org reporting currency and use the converted measures
- [ ] #5 Property dashboard money cards display in the property currency
- [ ] #6 The org dashboard has a session-only 'View As' currency switcher that re-queries Cube and re-labels cards without modifying any saved setting
- [ ] #7 Invoice/list tables continue to show each record's original currency unchanged
- [ ] #8 Swagger godoc updated; frontend passes yarn types:check and yarn lint; new UI works in dark and light mode
<!-- AC:END -->
