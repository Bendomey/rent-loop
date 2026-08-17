---
id: RENTL-54
title: make setup-db cannot build a database from scratch
status: To Do
assignee: []
created_date: '2026-08-17 21:57'
labels:
  - backend
  - migrations
  - bug
  - dx
dependencies: []
references:
  - services/main/init/migration/jobs/add-expense-lease-property-context.go
  - services/main/init/migration/jobs/add-maintenance-request-assets.go
  - services/main/init/migration/main.go
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`make setup-db` fails on a fresh database, so a new developer cannot bootstrap local dev and the from-scratch schema is unverifiable.

```
ERROR: column mr.unit_id does not exist (SQLSTATE 42703)
  init/migration/jobs/add-expense-lease-property-context.go:30
```

`AddExpenseLeasePropertyContext` (`202604010001`) backfills with:

```sql
UPDATE expenses e SET property_id = u.property_id
FROM maintenance_requests mr
JOIN units u ON u.id = mr.unit_id
WHERE e.context_maintenance_request_id = mr.id AND e.property_id IS NULL
```

`maintenance_requests.unit_id` no longer exists on the model — `AddMaintenanceRequestAssets` (`202608010001`) moved that relationship into `maintenance_request_assets`. On an existing database the old job is already recorded, so it never re-runs and the breakage is invisible. On a fresh one, `InitSchema` AutoMigrates the *current* models (no `unit_id`), then replays every job in order, and `202604010001` runs against a column that the current schema never creates.

**Why InitSchema does not protect against this:** `ServiceAutoMigration` builds two gormigrate instances. The first is `gormigrate.New(db, opts, nil)` — a nil migration list — and only that one carries `InitSchema`. Because its list is empty, a successful InitSchema records just `SCHEMA_INIT` and does **not** mark the real job list as applied. The second instance then runs every job from the beginning, including historical backfills whose columns are long gone.

This will recur: any future job that references a column later dropped from the models breaks fresh installs the same way.

Options: guard old backfills with a `to_regclass`/`information_schema` column check before running (the pattern `AddMaintenanceRequestAssets` already uses per its own comment about unguarded `mr.unit_id`), or register the real job list on the InitSchema instance so a fresh database marks them applied and skips replay.

Found while doing the Stage 3 migration cleanup. Confirmed pre-existing: `make setup-db` fails identically on a clean HEAD with the Stage 3 changes stashed, so it is not caused by removing the financial jobs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 make setup-db produces a working database from an empty Postgres instance
- [ ] #2 The fix generalises: a historical backfill referencing a since-dropped column does not break fresh installs
- [ ] #3 make update-db against an existing database is unaffected and still idempotent
<!-- AC:END -->
