---
id: RENTL-52
title: >-
  Production deploy path is broken: missing fly.production.toml, no prod branch,
  deploy skipped on code-only changes
status: To Do
assignee: []
created_date: '2026-08-17 20:58'
updated_date: '2026-08-17 21:57'
labels:
  - infrastructure
  - ci
  - bug
dependencies: []
references:
  - .github/workflows/api-deploy-production.yml
  - .github/workflows/api-deploy-staging.yml
  - services/main/Makefile
  - docs/runbooks/financial-account-backfill.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Three separate defects found while planning the financial-account production rollout. Each fails quietly rather than loudly.

**1. `fly.production.toml` does not exist.** Not on `main`, not on any branch, and not gitignored. Both `services/main/Makefile` (`deploy-production`) and `.github/workflows/api-deploy-production.yml` reference it, so the production deploy fails at the flyctl step.

**2. There is no `prod` branch.** `api-deploy-production.yml` triggers on `push: branches: [prod]`, so the production workflow has never been able to fire.

**3. Production skips its own deploy on code-only changes.** Both deploy workflows gate a `sync-db` job on the `services/main/init/**` paths filter. Staging's deploy job guards against that with `if: ${{ always() && (needs.changes.result == 'success') }}`, so it still deploys when `sync-db` is skipped. Production's deploy is a bare `needs: sync-db` with no `always()`, and in GitHub Actions a skipped dependency skips the dependent job. So any push that does not touch `services/main/init/**` deploys nothing to production, silently.

Defect 3 is the dangerous one during the financial rollout: the `next_billing_date` fix touches only `internal/models/lease.go` and `internal/services/lease-termination.go`. Shipped to production on its own it would not deploy — while job 3 `DropLegacyFinancialColumns` had already dropped the column, breaking every lease write (approval, activation, termination).

Also correct `docs/runbooks/financial-account-backfill.md`, which states "**Migrations do not run on deploy.** There is no `release_command`...". That is stale: both deploy workflows run `make update-db` in a `sync-db` job that the deploy job depends on, so jobs 1 and 2 do run automatically, ordered before the code. Only job 3 is withheld, because neither workflow sets `FINANCIAL_MIGRATION_ALLOW_DROP`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 fly.production.toml exists and is committed, and make deploy-production succeeds
- [ ] #2 The production deploy workflow can actually trigger (prod branch exists, or the trigger is changed to whatever the real production ref is)
- [ ] #3 A push touching only Go code outside services/main/init/ still deploys to production
- [ ] #4 docs/runbooks/financial-account-backfill.md no longer claims migrations do not run on deploy, and states that CI runs jobs 1+2 while job 3 stays manual
- [ ] #5 Staging has its own database, distinct from production, OR the naming is corrected so nobody believes a staging safety net exists when it does not
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-17: The staging-vs-production question is ANSWERED — they are the same database. Confirmed by the user, and corroborated by `.envrc`, where the Supabase pooler block (aws-1-eu-west-1.pooler.supabase.com, dbname `postgres`) is labelled "# Staging Creds" yet is the database the `rentloop_prod.sql` dump came from and the one all three migration jobs are now recorded against.

This means `STAGING_DB_*` in CI points at production. Consequences worth acting on:

- There is no staging safety net. "Merge to main, let CI migrate staging first" migrates PRODUCTION. Any future backfill lands on live data with no rehearsal step in between.
- `fly.staging.toml` (app `rentloop-api-staging`) is therefore the production app, which is why no production fly config exists.
- Defects 1 and 2 in this task are consistent with that: the production workflow and `fly.production.toml` were never needed because the staging pipeline IS the production pipeline.

The highest-value fix here is probably to stand up a genuinely separate staging database rather than to repair the unused production workflow.
<!-- SECTION:NOTES:END -->
