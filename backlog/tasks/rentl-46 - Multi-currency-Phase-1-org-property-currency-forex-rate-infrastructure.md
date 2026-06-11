---
id: RENTL-46
title: 'Multi-currency Phase 1: org/property currency + forex rate infrastructure'
status: To Do
assignee: []
created_date: '2026-06-11 12:31'
labels:
  - backend
  - frontend
  - multi-currency
dependencies: []
references:
  - services/main/internal/models/client.go
  - services/main/internal/models/property.go
  - services/main/internal/clients/gatekeeper/client.go
  - services/main/internal/queue/lease_invoicing.go
  - services/main/internal/queue/worker.go
  - services/main/init/migration/main.go
  - apps/property-manager/app/lib/format-amount.ts
  - apps/property-manager/app/modules/settings/general/index.tsx
  - apps/property-manager/app/routes/_auth._dashboard.properties.new.tsx
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Foundation phase for multi-currency support so property managers operating across Canada, the US, the UK, Ghana, and other markets can run properties in their operational currency and have a portfolio reporting currency.

## Context
Currency today exists only as a free-form per-record string (`Invoice.currency`, `Payment.currency`, `Unit.rent_fee_currency`, `Lease.rent_fee_currency`), all defaulting to `'GHS'`. There is no currency at the org (`Client`) or `Property` level, and no exchange-rate data. This phase introduces:
- Org **reporting currency** on `Client` (how the portfolio is viewed).
- Property **transaction currency** on `Property` (operational source of truth), inherited by units/leases/invoices.
- An `exchange_rates` table populated by a daily OpenExchangeRates sync job (consumed later by Cube.js in Phase 2).

Conventions: JSON snake_case; handlers call services (never repositories); update Swagger godoc on handler changes; new UI supports dark + light mode; leave working tree unstaged (no auto-commit).

## Supported currencies (V1)
GHS, USD, CAD, EUR, GBP, NGN, KES, ZAR, XOF, XAF (matches the existing frontend `CURRENCY_CONFIG` in `apps/property-manager/app/lib/format-amount.ts`). Default org currency = `'GHS'`.

## Backend (`services/main`)
- **ExchangeRate model + migration**: `internal/models/exchange_rate.go` (embed `BaseModelSoftDelete`; `BaseCurrency`, `QuoteCurrency`, `Rate float64`, `EffectiveDate`; unique index on `(base_currency, quote_currency, effective_date)`). Base currency is `USD` (OXR free tier is USD-base only), one row per supported quote currency per day; never overwrite history. Add `&models.ExchangeRate{}` to `init/migration/main.go` AutoMigrate + a versioned job in `init/migration/jobs/`.
- **OpenExchangeRates client**: `internal/clients/openexchangerates/client.go` (copy `internal/clients/gatekeeper/client.go`; `app_id` query param). Register on the `Clients` struct in `internal/clients/main.go`. Add `IOpenExchangeRatesAPI{BaseURL, AppID}` config in `internal/config/config.go` + `.envrc.example` + env table in `services/main/CLAUDE.md`.
- **ExchangeRate repo + service**: `internal/repository/exchange_rate.go` (`BulkUpsert`, idempotent on the unique index) + `internal/services/exchange_rate.go` (`SyncDailyRates`). Wire into `internal/repository/main.go` and `internal/services/main.go`.
- **Daily forex sync job**: `internal/queue/forex_sync.go` (`TypeForexSync`, follow `internal/queue/lease_invoicing.go`). Register handler in `internal/queue/worker.go` and schedule `scheduler.Register("0 2 * * *", asynq.NewTask(TypeForexSync, nil), asynq.MaxRetry(2))` — runs daily at **02:00 UTC**.
- **Client currency**: add `Currency string` (default `'GHS'`) to `internal/models/client.go` + migration. Set it in `ApproveClientApplication` (`internal/services/client-application.go`). Add `Currency *string` to the client update request/service, validated.
- **Property currency**: add `Currency string` (default `'GHS'`) to `internal/models/property.go` + migration. In `internal/services/property.go` `CreateProperty`, default from the owning `Client.Currency` when omitted; add `Currency *string` to the update path. Update `internal/handlers/property.go` Swagger godoc.
- **Inheritance**: where new units/leases/invoices are created (`services/{unit,lease,invoice}.go`), default an empty currency from the parent `Property.Currency` instead of hardcoded `'GHS'`.
- **Validation helper**: `internal/lib/currency.go` with the supported list + `IsSupportedCurrency`, reused by validators.

## Frontend (`apps/property-manager`)
- Add `currency` to `app/types/client.d.ts` and `app/types/property.d.ts`.
- Add currency to `UpdateClientInput` (`app/api/clients/index.ts`), `CreatePropertyInput`/`UpdatePropertyInput` (`app/api/properties/index.ts`).
- Shared currency list `app/lib/currencies.ts` (derived from `format-amount.ts` keys), reused by all selectors. `formatAmount` already supports these.
- Org reporting-currency `<Select>` in `app/modules/settings/general/index.tsx` with confirmation AlertDialog ("only affects analytics and reports; existing records unchanged").
- Property currency `<Select>` in `app/modules/properties/property/settings/general/index.tsx` with confirmation AlertDialog ("future records use X; existing records unchanged").
- `app/routes/_auth._dashboard.properties.new.tsx`: default property currency from active `Client.currency`; auto-created unit uses property currency instead of hardcoded `'GHS'` (line ~108).
- Unit currency selectors in `app/modules/properties/property/assets/units/{new,edit}/index.tsx`: expand the GHS-only select to the shared list, default from `useProperty()` currency.

## Verification
- `make setup-db`/`make update-db` applies migrations; `exchange_rates`, `clients.currency`, `properties.currency` exist. `make lint` + `make generate-docs`.
- Run the forex job once with a real `OPENEXCHANGERATES_APP_ID`; confirm one row per supported quote currency for today.
- Frontend: `yarn types:check` + `yarn lint`. Set org currency (confirm modal), create property (defaults from org), override property currency (confirm modal), create unit (defaults from property; selector lists all supported currencies). Verify dark + light.

Full plan: `~/.claude/plans/rentloop-multi-currency-implementation-curious-fiddle.md`
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 exchange_rates table exists with a unique (base_currency, quote_currency, effective_date) index and stores USD-base daily rates without overwriting history
- [ ] #2 A daily asynq job runs at 02:00 UTC and upserts one rate row per supported quote currency from OpenExchangeRates
- [ ] #3 Client has an editable reporting currency (default GHS); changing it in org settings shows a confirmation and does not modify any existing financial records
- [ ] #4 Property has a transaction currency that defaults from its Client on creation and is editable in property settings with a confirmation; changing it affects only future records
- [ ] #5 New units/leases/invoices inherit an empty currency from their parent Property instead of hardcoded GHS
- [ ] #6 Unit create/edit currency selectors list all supported currencies and default to the property currency
- [ ] #7 Currency inputs are validated against the supported list (GHS, USD, CAD, EUR, GBP, NGN, KES, ZAR, XOF, XAF) on the backend
- [ ] #8 Swagger godoc updated for changed handlers; frontend passes yarn types:check and yarn lint; new UI works in dark and light mode
<!-- AC:END -->
