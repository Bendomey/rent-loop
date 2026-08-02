---
id: RENTL-49
title: Make SplitSessionsFromRefreshTokens migration idempotent
status: To Do
assignee: []
created_date: '2026-08-01 14:57'
labels:
  - backend
  - migrations
dependencies: []
references:
  - services/main/init/migration/jobs/split-sessions-from-refresh-tokens.go
  - services/main/internal/models/refresh-token.go
  - services/main/internal/models/session.go
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found while running migrations for RENTL-48.1. This migration blocks every later migration on any database that already ran its earlier version.

The job in code carries ID 202607310001_SPLIT_SESSIONS_FROM_REFRESH_TOKENS_V2, but databases that ran the original have 202607300001_SPLIT_SESSIONS_FROM_REFRESH_TOKENS recorded — and no job in the codebase uses that older ID. gormigrate therefore treats V2 as never applied and re-runs it, where it dies on "column r.user_id does not exist" because the earlier run already dropped that column. Because gormigrate halts on the first failure, every subsequent migration is blocked behind it.

This was observed on a local database restored from a dump (rentloop_dump). Any environment whose migrations table has the 202607300001 id will fail the same way on its next deploy — staging and production should be checked.

Fix applied: a guard at the top of Migrate counts refresh_tokens.user_id in information_schema.columns and returns nil when it is absent. The absence of that column is the completion marker, since step 5 of the migration is what drops it. This also correctly no-ops on a brand-new database, where AutoMigrate builds refresh_tokens straight from models.RefreshToken, which has no UserID.

Verified locally: migrations now run to completion.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Running migrations against a database that already applied the original 202607300001 version completes without error
- [ ] #2 Running migrations against a brand-new database still produces the correct sessions and refresh_tokens shape
- [ ] #3 Running migrations against a database that has neither version applied still performs the full session backfill
- [ ] #4 Staging and production migrations tables are checked for the 202607300001 id, and the outcome is recorded on this task
<!-- AC:END -->
