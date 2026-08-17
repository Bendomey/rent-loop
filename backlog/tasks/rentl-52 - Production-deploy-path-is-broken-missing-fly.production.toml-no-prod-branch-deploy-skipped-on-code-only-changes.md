---
id: RENTL-52
title: >-
  Production deploy path is broken: missing fly.production.toml, no prod branch,
  deploy skipped on code-only changes
status: To Do
assignee: []
created_date: '2026-08-17 20:58'
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
<!-- AC:END -->
