---
id: RENTL-30
title: Refactor ClientApplications API
status: Done
assignee: []
created_date: '2026-03-16 09:15'
updated_date: '2026-03-16 13:04'
labels: []
dependencies: []
ordinal: 3000
---

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## What was done

### `internal/repository/client-application.go`
- Replaced all `filterQuery` references with `filters` in `List` and `Count` methods
- Added `lib.ResolveDB` to `Create` and `UpdateClientApplication` methods
- Renamed exported private scope helpers to camelCase (`statusFilterScope` → `clientApplicationStatusFilterScope`, etc.) to avoid package-level redeclaration conflicts with `client-user.go`

### `internal/repository/client-user.go`
- Added `lib.ResolveDB` to `Create` method — fixes FK violation when inserting `client_user` inside a transaction that hasn't committed the parent `client` yet

### `internal/repository/client.go`
- Implemented `Create` method using `lib.ResolveDB`

### `internal/services/client.go`
- Implemented `ClientService` with `GetClient` (NotFoundError + InternalServerError handling) and `CreateClient`

### `internal/services/client-application.go`
- `GetClientApplication`: now wraps errors as `NotFoundError` / `InternalServerError`
- `RejectClientApplication` / `ApproveClientApplication`: replaced `strings.ReplaceAll` chains with `strings.NewReplacer`
- `ApproveClientApplication`: replaced manual `transaction.Rollback()` calls with a single `defer transaction.Rollback()`; delegated client creation to `ClientService.CreateClient(transCtx)` and client user creation to `ClientUserService.InsertClientUser(transCtx)` — both use `transCtx` so they participate in the same transaction
- Converted constructor to use `ClientApplicationServiceDeps` struct
- Injected `ClientService` and `ClientUserService` dependencies

### `internal/services/main.go`
- Instantiated `ClientService` and wired it into `ClientApplicationServiceDeps`
- Added `ClientUserService` to `ClientApplicationServiceDeps`
- Added `ClientService` field to `Services` aggregate struct

### Bug fixed
- FK constraint violation on `client_users.client_id` was caused by `clientUserRepository.Create` not using `lib.ResolveDB`, making it run outside the transaction and unable to see the uncommitted `client` record.
<!-- SECTION:FINAL_SUMMARY:END -->
