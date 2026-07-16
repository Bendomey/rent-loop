# Architecture

## Project Type
Flutter / Dart 3.8.1+ mobile app (property-manager / landlord-facing client for RentLoop rental platform). Companion to the React property-manager portal (`apps/property-manager`). Targets iOS and Android. **Auth is real** (login, cold-start token validation, workspace selection, logout, against `https://api.rentloopapp.com`) as of the 2026-07-11 login integration — see `docs/decisions.md` and `docs/superpowers/specs/2026-07-10-login-integration-design.md`. **The properties list is also real** (paginated, 10/page, infinite scroll, search + status filter) as of the 2026-07-16 properties list integration — see `docs/superpowers/specs/2026-07-16-properties-list-integration-design.md`. Every other module/screen (properties detail/add/settings, tenants, activity, money, announcements) is still UI-only against mock/static data, pending its own integration pass.

## Directory Map
```
apps/pm_mobile/
├── lib/
│   ├── main.dart                   # Entry point: SystemChrome, runApp(ProviderScope(...))
│   └── src/
│       ├── app.dart                # RentloopManagerApp widget, MaterialApp.router
│       ├── constants.dart          # kApiBaseUrl, PM-portal deep-link builders (UTM-tagged)
│       ├── api/                    # One class per resource, all extend AbstractApi
│       │   └── root.dart           # AbstractApi base class + ApiException
│       ├── architecture/           # Global keepAlive providers (secure storage, token, user, workspace, startup)
│       ├── lib/                    # Utility helpers (storage primitives, error messages, workspace resolution)
│       ├── modules/
│       │   ├── auth/               # welcome, login, workspace_select
│       │   └── main/               # home, properties, tenants, activity, money, announcements, more
│       ├── navigation/             # routes.dart (GoRouter), splash.dart
│       ├── repository/
│       │   ├── api_state.dart      # ApiState base + ApiStatus enum
│       │   ├── models/             # @JsonSerializable DTOs (UserModel, ClientUserModel, ClientModel)
│       │   └── notifiers/          # Mutation state (auth/login_notifier.dart)
│       └── shared/                 # theme.dart, tokens.dart, widgets.dart, dialogs.dart, toast.dart, coming_soon.dart
```

## Module Overview
| Module/Package | Purpose |
|---|---|
| `api/` | HTTP layer — `AbstractApi` base class (`root.dart`) + `UserApi` (`user_api.dart`: `login()`, `getMe()`) |
| `architecture/` | Global in-memory state + storage: `AppStartupNotifier` (real cold-start/login/logout orchestration), `CurrentUserNotifier`, `CurrentWorkspaceNotifier`, `TokenManager`, `WorkspaceIdManager`, `SecureStorage` providers |
| `lib/` | Utility helpers — `Storage`/`SecureStorage`/`TokenManager`/`WorkspaceIdManager` plain classes, `api_error_messages.dart` (`translateApiErrorMessage`), `workspace_resolution.dart` (`isActiveClientUser`, `resolveWorkspace`) |
| `modules/auth/` | `welcome/`, `login/` (real `LoginNotifier` wiring), `workspace_select/` (real `client_users` data) — pre-shell auth flow |
| `modules/main/home/` | Landlord dashboard/home tab — top header (workspace name, manager avatar) is real; revenue/occupancy/stats sections still mocked |
| `modules/main/properties/` | Property **list is real** (paginated, 10/page, search + status filter) — detail, add, per-property settings (general/members/documents) still mocked |
| `modules/main/tenants/` | Tenant list + detail — mocked |
| `modules/main/activity/` | Maintenance requests, bookings, applications (list/add/detail) — mocked |
| `modules/main/money/` | Invoices, record payment — mocked |
| `modules/main/announcements/` | Announcements list + add — mocked |
| `modules/main/more/` | Profile card + workspace card are real (`currentUserNotifierProvider`/`currentWorkspaceNotifierProvider`); members, payment accounts, documents, agreement, billing, settings still mocked |
| `modules/main/workspace_sheet.dart` | In-shell workspace switcher (opened from Home/More) — real, reads `client_users`, persists selection via `CurrentWorkspaceNotifier.select()` |
| `navigation/` | GoRouter config (`routes.dart`) + `splash.dart` (kicks off `AppStartupNotifier.init()`) |
| `repository/models/` | `@JsonSerializable` DTOs for API responses: `UserModel`, `ClientUserModel`, `ClientModel` |
| `repository/notifiers/` | Mutation notifiers: `auth/login_notifier.dart` (`LoginNotifier`) |
| `shared/` | Material3 theme, design tokens (`RLTokens`), reusable dialogs/toast/widgets, "coming soon" placeholder |

## Data Flow
**Auth (real):**
1. `SplashScreen` calls `appStartupNotifierProvider.notifier.init()` on first frame
2. `AppStartupNotifier.init()` checks connectivity → reads JWT via `TokenManager` → if present, calls `GET /api/v1/admin/users/me`; an `ApiException` (dead/expired token) drops to `unauthenticated` silently, any other failure sets `error`
3. `LoginScreen` submits via `LoginNotifier.submit()` → `UserApi.login()` (`POST /api/v1/admin/users/login`) → saves JWT → calls `AppStartupNotifier.completeLogin(user)`
4. Both cold-start and post-login funnel through `AppStartupNotifier._enterSession()`: sets `CurrentUserNotifier`, then runs `resolveWorkspace()` — auto-selects if exactly one active `client_user` membership, or if a previously-persisted workspace id (via `WorkspaceIdManager`) still matches an active membership; otherwise status → `workspaceSelect` and `WorkspaceSelectScreen` shows the full membership list (inactive ones disabled)
5. Selecting a workspace calls `AppStartupNotifier.selectWorkspace()` → `CurrentWorkspaceNotifier.select()` (persists + sets state) → status `ready` → `GoRouter` (via `refreshListenable`) redirects into the main `StatefulShellRoute` (5 tabs: home, properties, activity, money, more)
6. Logout clears JWT, workspace id, and both notifiers, back to `unauthenticated`

**Every other module** (properties, tenants, activity, money, announcements, and most of `more/`) still renders local mock data — no API calls in those trees yet. The pattern is proven and ready to replicate: `AbstractApi.execute()` → resource `XxxApi` class → Riverpod query provider / `ApiState` mutation notifier → screen (see `docs/patterns.md`), one module at a time.

## External Dependencies
| Name | Purpose |
|---|---|
| `flutter_riverpod` / `riverpod_annotation` | State management (code-gen style — all providers, including `AppStartupNotifier`, now use `@riverpod`/`@Riverpod(keepAlive: true)`) |
| `go_router` | Declarative navigation with shell routes and auth-status-driven redirects |
| `flutter_secure_storage` | JWT + selected-workspace-id storage, via `TokenManager`/`WorkspaceIdManager` |
| `http` | HTTP client — `AbstractApi.execute()` (GET/POST/PATCH/DELETE, Bearer auth, `ApiException` on ≥400) |
| `json_annotation` | Required by generated `@JsonSerializable` code (added alongside the first real models) |
| `shimmer` | Skeleton loader animations (present, not yet used — no data-fetching *screens* with lists exist yet; auth flow doesn't need list skeletons) |
| `connectivity_plus` | Network check on `AppStartupNotifier.init()` cold start |
| `haptic_feedback` | Tactile feedback on interactions |
| `modal_bottom_sheet` | Bottom sheets |
| `intl` | Formatting (dates/numbers) |
| `validatorless` | Form field validators |
| `url_launcher` | Opening external links (e.g. PM portal deep links from `constants.dart`) |
| `share_plus` | Native share sheet |
| `freezed` + `json_serializable` + `build_runner` + `riverpod_generator` | DTO/provider code generation — now in active use (`UserModel`, `ClientUserModel`, `ClientModel`, and every `@riverpod` provider) |
