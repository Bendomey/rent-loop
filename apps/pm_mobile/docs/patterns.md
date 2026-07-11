# Patterns

## Naming Conventions
- Files: `snake_case.dart`; screen root files are named `root.dart` inside their feature folder
- Classes: `PascalCase`; screens suffix with `Screen`, notifiers with `Notifier`, states with `State`
- Private widgets within a file: underscore prefix (`_RentloopManagerAppState`, `_HouseIcon`, `_HousePainter`, `_RouterNotifier`)

## Folder Conventions
- One feature per folder under `modules/main/` — flat files for add/detail/settings screens, `root.dart` for the tab's list screen
- Nested sub-features get their own subfolder (e.g. `properties/settings/`)
- `modules/auth/` — one folder per auth step (`welcome/`, `login/`, `workspace_select/`), each with its own `root.dart`

## Recurring Code Patterns (now applied — auth module proves the pattern from `apps/go/docs/patterns.md`)
Confirmed working end-to-end in `api/`, `architecture/`, `repository/`. Replicate exactly for each remaining module (properties, tenants, activity, money, announcements):
- `AbstractApi.execute()` base class (`api/root.dart`) — attaches Bearer token unless `authRequired: false`, JSON-encodes body, throws `ApiException` on `>= 400`
- One `XxxApi` class per resource, `@riverpod` factory function (`user_api.dart` → `userApiProvider`)
- Mutations: `ApiState`-based notifier (`pending` → `success`/`failed`), error translated via `translateApiErrorMessage()` (`login_notifier.dart` is the reference example)
- `@Riverpod(keepAlive: true)` for session-wide state (`CurrentUserNotifier`, `CurrentWorkspaceNotifier`, `AppStartupNotifier`); plain `@riverpod` (non-keepAlive) for one-shot mutation notifiers (`LoginNotifier`)
- Query data / skeleton loaders / pull-to-refresh: **not yet exercised** — auth has no list/detail screens. Follow `apps/go/docs/patterns.md`'s `hasValue`/`isLoading` guard (NOT `.when()`) the first time a real list-fetching screen is built in this app.

## Auth-Specific Patterns Worth Reusing
- **Workspace/tolerant-status matching:** when an API status field's exact string format is unconfirmed, match on the last dot-separated segment case-insensitively (`status.split('.').last.toLowerCase() == 'active'`) rather than a substring `contains` check — the latter has real collision risk (`"Inactive".contains("active")` is `true`). See `lib/workspace_resolution.dart`.
- **Shared session-entry helper:** when two entry points (cold-start `init()` and post-login `completeLogin()`) need the same "set user, resolve derived state, pick a status" logic, factor it into one private method (`AppStartupNotifier._enterSession()`) rather than duplicating it — avoids the two paths drifting out of sync.
- **Dropping fields not in the API response:** when a mocked screen displays a stat the real API doesn't return (e.g. `properties · units` counts on a workspace card), drop the stat rather than fetching it eagerly with extra calls — apply this precedent consistently (`workspace_select/root.dart`, `more/root.dart`'s `_WorkspaceCard`, `workspace_sheet.dart` all made the same call).
- **Loading/error state ownership:** keep a screen's local `setState`-driven fields (client-side validation) separate from the mutation notifier's `ApiState` (server-side result) — don't let a mutation notifier's `pending` touch `AppStartupNotifier`'s state mid-request, or the router's `refreshListenable` will bounce the user to `/splash`.

## Testing Conventions
- `flutter_test` is used for pure-Dart/pure-logic tests only (models, `ApiException`, `resolveWorkspace`) — no widget/integration tests exist. Test files mirror the `lib/` structure: `test/api/root_test.dart`, `test/lib/workspace_resolution_test.dart`, `test/repository/models/*_test.dart`.
- Deliberately untested: anything doing real network I/O (`UserApi`, `LoginNotifier`) or full Riverpod+network orchestration (`AppStartupNotifier`) — no mocking infrastructure is used anywhere in this codebase (matches `apps/go`, which also has zero tests). These are verified manually against staging instead.
- Deliberately untested: thin state holders with no branching logic (`CurrentUserNotifier`, `CurrentWorkspaceNotifier`, the `Storage`/`TokenManager`/`WorkspaceIdManager` platform-channel wrappers) and pure UI wiring (screen `root.dart` files) — same rationale.
- Lint via `flutter_lints` + `riverpod_lint` + `custom_lint`.

## Anti-Patterns to Avoid (per `apps/go` convention)
- Do NOT use `CircularProgressIndicator` for data-fetching screens — use shimmer skeletons
- Do NOT use `.when()` for loading guards — use the explicit `hasValue`/`isLoading` check
- Do NOT call API methods directly from screens — always go through a provider/notifier
- Do NOT hand-write Riverpod providers — use `@riverpod` code-gen (no exceptions remain — `AppStartupNotifier` was converted during the login integration)
- Do NOT use a substring `contains` check to match an API status/enum string — use exact or last-segment matching (see `isActiveClientUser`)
