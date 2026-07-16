# Implementation

## Entry Points
- `lib/main.dart` — `SystemChrome` overlay style, `runApp(ProviderScope(child: RentloopManagerApp()))`
- `lib/src/app.dart` — `RentloopManagerApp`; builds `MaterialApp.router` with GoRouter (`buildRoutes(ref)`) and `buildTheme()`
- `lib/src/navigation/routes.dart` — `buildRoutes(ref)`: defines all `GoRoute`/`StatefulShellRoute` entries + auth redirect logic

## Per-Module Breakdown

### api/
- **Entry point:** `lib/src/api/root.dart` — `AbstractApi` base class
- **Key classes:** `AbstractApi` (`execute()`: GET/POST/PATCH/DELETE, attaches `Authorization: Bearer <token>` unless `authRequired: false`, throws `ApiException` on ≥400), `ApiException` (parses `json['errors']['message']`, `null`-safe on malformed bodies)
- `user_api.dart` — `UserApi extends AbstractApi`: `login({email, password})` (unauthenticated, `POST /api/v1/admin/users/login`, returns `UserLoginResult{token, user}`), `getMe()` (authenticated, `GET /api/v1/admin/users/me`, returns `UserModel`)
- `property_api.dart` — `PropertyApi extends AbstractApi`: `getProperties({clientId, page, pageSize, ids, order, orderBy, status, search})` (`GET /api/v1/admin/clients/{client_id}/properties`, returns `PropertiesPage{rows: List<PropertyModel>, meta: PaginationMetaModel}`); `status` is the full dotted enum value (e.g. `Property.Status.Active`), `search` maps to `query`+`search_fields=name`. Also `getProperty({clientId, propertyId})` (`GET /api/v1/admin/clients/{client_id}/properties/{property_id}`, returns a single `PropertyModel`)
- `unit_api.dart` — `UnitApi extends AbstractApi`: `getUnits({clientId, propertyId, page, pageSize})` (`GET /api/v1/admin/clients/{client_id}/properties/{property_id}/units`, returns `UnitsPage{rows: List<UnitModel>, meta: PaginationMetaModel}`)
- `analytics_api.dart` — `AnalyticsApi extends AbstractApi`: `getToken({clientId})` (`GET /api/v1/admin/clients/{client_id}/analytics/token`, returns a short-lived Cube JWT); `CubeApi` (plain class, not `AbstractApi` — different host/token): `load({token, query})` POSTs to `$kCubeApiUrl/cubejs-api/v1/load`, returns the raw `data` rows

### architecture/
- **Entry point:** `lib/src/architecture/app_startup/app_startup_notifier.dart` (replaced the old hand-written mock at `architecture/app_startup.dart`, now deleted)
- **Key class:** `AppStartupNotifier` — `@Riverpod(keepAlive: true)` (converted from the hand-written `Notifier`, now matching the documented `CLAUDE.md`/`apps/go` convention)
- **States:** `AppStartupStatus { loading, unauthenticated, workspaceSelect, ready, error }` — unchanged shape from the mocked version; the extra `workspaceSelect` step vs. `apps/go` remains PM-app-specific (landlords pick a workspace/organization after login, tenants don't)
- **Methods, all real:**
  - `init()` — checks connectivity → reads JWT via `TokenManager` (null → `unauthenticated`) → `GET /me`; an `ApiException` (dead/expired token) drops to `unauthenticated` silently rather than showing `error`, which is reserved for connectivity/unexpected failures
  - `completeLogin(UserModel user)` — called by `LoginNotifier` after it has already saved the JWT; runs the same session-entry logic as `init()`
  - `selectWorkspace(ClientUserModel)` — called from the workspace picker; persists + sets the workspace via `CurrentWorkspaceNotifier.select()`, then `ready`
  - `logout()` — clears JWT (`TokenManager.remove()`), workspace id (`WorkspaceIdManager.remove()`), both notifiers, back to `unauthenticated`
  - `_enterSession(UserModel user)` (private) — shared by `init()`/`completeLogin()`: sets `CurrentUserNotifier`, reads the persisted workspace id, calls `resolveWorkspace()`; auto-selects and goes `ready` if resolved, else `workspaceSelect`
- `current_user/current_user_notifier.dart` — `CurrentUserNotifier`, keepAlive, state `UserModel?`, `setUser()`/`clear()`
- `current_workspace/current_workspace_notifier.dart` — `CurrentWorkspaceNotifier`, keepAlive, state `ClientUserModel?`, `select(ClientUserModel)` (persists via `WorkspaceIdManager` then sets state) / `clear()`
- `secure_storage/`, `token_manager/`, `workspace_id_manager/` — thin `@riverpod` provider wrappers around the plain classes in `lib/`

### lib/
- `storage.dart` — abstract `Storage` interface (`read`/`delete`/`write`)
- `secure_storage.dart` — `SecureStorage extends Storage`, wraps `FlutterSecureStorage`
- `token_manager.dart` — `TokenManager`: `save()`/`get()`/`remove()` JWT under key `rentloop_manager.token`
- `workspace_id_manager.dart` — `WorkspaceIdManager`: same shape, key `rentloop_manager.current_client_id`
- `workspace_resolution.dart` — `isActiveClientUser(ClientUserModel)` (last-dot-segment case-insensitive match against `"active"`, e.g. `"ClientUser.Status.Active"` → `"active"` — deliberately not a substring `contains` check, which would misclassify `"Inactive"`), `resolveWorkspace(clientUsers, {storedClientId})` (auto-selects on exactly one active membership, or a stored id matching an active one; else `null`)
- `api_error_messages.dart` — `translateApiErrorMessage({errorMessage, defaultErrorMessage})`; currently default-case-only (no confirmed API error codes yet), mirrors `apps/go`'s pattern of adding specific cases as they're discovered
- `property_status.dart` — `propertyStatusLabel(status)` (last-dot-segment, mirrors `workspace_resolution.dart`'s convention), `propertyTypeLabel(type)` (`SINGLE`/`MULTI` → display label)
- `money.dart` — `pesewasToCedis(int pesewas)` (mirrors `apps/go`'s `MoneyLib.pesawasToCedis` convention)
- `unit_status.dart` — `unitTypeLabel(type)` (APARTMENT/HOUSE/STUDIO/OFFICE/RETAIL → display label), `shouldShowSeeAllUnits(totalUnits)` (the property detail screen's units preview caps at 5 — this is `total >= 6`)
- `property_stats_logic.dart` — `parseCubeNum(value)` (Cube returns every measure as a string), `currentMonthDateRange(now)` (ISO date-range helper for the Cube Invoices query), `computePropertyStats({unitsRows, invoiceRows, leaseRows, bookingRows, applicationRows})` (combines 5 separate Cube query results into one `PropertyStats`)

### navigation/
- `routes.dart` — `buildRoutes(ref)`: internal `_RouterNotifier` (`ChangeNotifier`) listens to `appStartupNotifierProvider` (renamed from the old `appStartupProvider`) and calls `notifyListeners()` on change, wired as GoRouter's `refreshListenable`. Redirect `switch` on `AppStartupStatus`: `loading`/`error` → `/splash`, `unauthenticated` → `/auth/welcome`, `workspaceSelect` → `/auth/workspace-select`, `ready` → `/` (main shell)
- Global `GoRouter? appRouter` — reserved for notification-driven navigation from outside the widget tree (mirrors `apps/go`'s pattern), not yet used since no push notifications are wired up
- `splash.dart` — `SplashScreen`; calls `appStartupNotifierProvider.notifier.init()` via `addPostFrameCallback`

### modules/auth/
- `welcome/root.dart` → `login/root.dart` → `workspace_select/root.dart`
- `login/root.dart` — email/password form; submits via `loginNotifierProvider.notifier.submit()`. Loading/error state comes from `loginNotifierProvider` (not local state), so the router's redirect never fires mid-request. The error banner's dismiss handler clears both a local validation error and, via `LoginNotifier.reset()`, any API-sourced failure.
- `workspace_select/root.dart` — reads `client_users` off `currentUserNotifierProvider` (already fetched at login/`/me`, no extra API call). Active memberships (`isActiveClientUser`) are tappable and call `AppStartupNotifier.selectWorkspace()`; non-active ones render dimmed/disabled with a status pill. Role pill tone: `OWNER`/`MANAGER` (case-insensitive) → danger, else neutral.

### repository/
- `api_state.dart` — `ApiStatus { idle, pending, success, failed }` (with `isLoading()`/`isSuccess()`/`isFailed()`), `ApiState { status, errorMessage }`
- `models/user_model.dart`, `client_user_model.dart`, `client_model.dart` — `@JsonSerializable` DTOs matching the confirmed live API schema (`UserModel.clientUsers` defaults to `[]` when the `client_users` key is absent, not throw)
- `notifiers/auth/login_notifier.dart` — `LoginNotifier` (`LoginState extends ApiState`): `submit({email, password})` runs `UserApi.login()` → `TokenManager.save()` → `AppStartupNotifier.completeLogin()` → success, all in one try/catch (`ApiException` → translated message, other errors → default message); `reset()` returns to a clean idle state, called only from the login screen's error-dismiss handler
- `notifiers/properties/properties_notifier.dart` — `PropertiesNotifier` (`PropertiesState{items, total, hasNextPage, currentPage, isLoadingMore, isLoading, error}`): `loadFirstPage(PropertiesQuery{search, status})` resets to page 1, `loadNextPage()` appends page N+1 (pageSize 10) — the first paginated-list notifier in this app, modeled on `apps/go`'s `MaintenanceRequestsNotifier`
- `notifiers/units/units_notifier.dart` — `UnitsNotifier` (`UnitsState{items, total, hasNextPage, currentPage, isLoadingMore, isLoading, error}`): `loadFirstPage(propertyId)` / `loadNextPage()` — same shape as `PropertiesNotifier`, minus a filter object (this screen has no search/status filter)
- `providers/properties/property_detail_provider.dart`, `property_stats_provider.dart`, `property_units_preview_provider.dart` — `@riverpod Future<T>` family providers keyed by property id: real property data, Cube-derived `PropertyStats`, and a 5-item units preview page, respectively
- `models/unit_model.dart`, `property_stats_model.dart` — `UnitModel` (`@JsonSerializable`, subset of `AdminOutputUnit`), `PropertyStats` (plain class, aggregate of 5 Cube queries, not a single API response — `occupancyPercent` getter)

### modules/main/
Five `StatefulShellRoute` tab branches — `home`, `properties`, `activity`, `money`, `more` — each with a `root.dart` plus feature-specific add/detail/settings files. `tenants/` and `announcements/` are reachable via nested routes off `more/` and the main shell respectively.

Real (wired to `currentUserNotifierProvider`/`currentWorkspaceNotifierProvider`):
- `home/root.dart` — `_TopHeader`'s workspace-name eyebrow and manager avatar. The rest of the screen (revenue card, stat grid, needs-attention, collection trend, quick actions) is still mocked.
- `more/root.dart` — `_ProfileCard` (name/email) and `_WorkspaceCard` (workspace name/role — the previously-fabricated `properties · units` stat was dropped, since that data isn't in the API response). Logout button calls `appStartupNotifierProvider.notifier.logout()`.
- `workspace_sheet.dart` — the in-shell workspace switcher (`showWorkspaceSheet(context)`, opened from Home's eyebrow and More's workspace card — note the signature dropped its old `activeId` param, since the sheet now reads the active workspace off the provider itself). Lists `client_users`; tapping an active one calls `currentWorkspaceNotifierProvider.notifier.select()`; inactive ones are dimmed/non-tappable, same convention as `workspace_select/root.dart`.
- `properties/root.dart` — the list screen is real: `propertiesNotifierProvider`-backed infinite scroll (10/page), pull-to-refresh, debounced search, status filter chips.
- `properties/detail.dart` — the detail screen is real: three independent providers (property/stats/units-preview) each with their own skeleton/error handling; swipeable hero image carousel (falls back to a type-colored placeholder tile when a property has no images); Manage grid counts are Cube-sourced (Units/Tenants/Leases/Applications always, Bookings only when the property's `modes` includes `BOOKING`); units preview caps at 5 with a "See all" action (hidden below 6 total units) that pushes `units_list.dart`. Unit rows are not tappable yet — no unit-detail screen exists.
- `properties/units_list.dart` — new paginated "all units" screen for a property, `UnitsNotifier`-backed infinite scroll (10/page), mirrors `root.dart`'s pattern minus search/filters.
- `add.dart`/`edit_sheets.dart`/`settings/` remain mocked.

Still fully mocked: `properties/add.dart`/`edit_sheets.dart`/`settings/`, `tenants/`, `activity/`, `money/`, `announcements/`, and everything else under `more/` (members, payment accounts, documents, agreement, billing, settings).

### shared/
- `theme.dart` — Material3 `ThemeData` builder
- `tokens.dart` — `RLTokens` design constants (colors, fonts, weights) used across splash/auth/screens; also `statusTone(String)` (maps a display status string to an `RLTone`) and `RLTone` enum, reused by both `workspace_select/root.dart` and `workspace_sheet.dart` for the active/inactive membership treatment
- `widgets.dart`, `dialogs.dart`, `toast.dart` — reusable UI primitives. `RLSearchBar` now optionally takes `controller`/`onChanged` to become a real editable search field (`properties/root.dart` is the first consumer) — omitting `controller` keeps the original tap-only rendering (`more/members.dart`'s usage is unaffected)
- `coming_soon.dart` — placeholder screen for unbuilt features

## Configuration
| Variable | Source | Purpose |
|---|---|---|
| `kApiBaseUrl` | `constants.dart` | REST base URL — `https://api.rentloopapp.com` (staging), now actively used by `AbstractApi.execute()` |
| `kCubeApiUrl` | `constants.dart` | Cube.js REST base (staging) — `https://rentloop-cube.fly.dev`, used by `CubeApi.load()` |
| `kPmHost` | `constants.dart` | Host for deep links into the React PM portal (`pm.rentloopapp.com`) |
| `pmUrl()` / `applyUrl()` / `forgotPasswordUrl()` | `constants.dart` | UTM-tagged deep-link builders (`utm_source=manager_app`, `utm_medium=mobile`) for links out to the web portal |
| `rentloop_manager.token` | `FlutterSecureStorage`, via `TokenManager` | Persisted JWT |
| `rentloop_manager.current_client_id` | `FlutterSecureStorage`, via `WorkspaceIdManager` | Persisted selected workspace id, restored across app restarts when it still matches an active membership |

## Non-obvious Logic
- `AppStartupStatus.workspaceSelect` is a PM-app-specific state with no `apps/go` equivalent — landlords may belong to multiple organizations/workspaces and must pick one after login, before the JWT session is considered "ready"
- The login screen intentionally avoids writing to `appStartupNotifierProvider` state during the in-flight request (loading/error live in `loginNotifierProvider` instead), to prevent the router's `redirect` callback from bouncing the user to `/splash` while the request is pending
- `resolveWorkspace()`'s auto-select rule: exactly one active membership always wins outright (ignoring any stored id); otherwise a stored id is only honored if it still points at an *active* membership — a stale id pointing at a now-deactivated membership is silently ignored, not auto-selected
- `isActiveClientUser()` matches on the last dot-segment of the raw status string, not a substring `contains` — this was a real bug caught in review (`"Inactive"` contains the substring `"active"`, so a naive `contains('active')` check would misclassify a deactivated membership as active)
- `docs/` is checked into git (not gitignored) for this app, matching the convention already established in `apps/go/docs/`
- `propertyStatusLabel()` (in `property_status.dart`) is reused as-is for unit statuses too (`Unit.Status.*` dot-splits the same way `Property.Status.*` does) — no separate `unitStatusLabel()` was written
- The property detail screen's stats card and Manage grid share one `propertyStatsProvider` fetch (5 parallel Cube queries) rather than each cell issuing its own query — Cube.js has no single multi-cube query in the REST `/load` endpoint used here, so each measure group (Units, Invoices, Leases, Bookings, TenantApplications) is still a separate `CubeApi.load()` call, just run concurrently via `Future.wait` and parsed together by `computePropertyStats()`
