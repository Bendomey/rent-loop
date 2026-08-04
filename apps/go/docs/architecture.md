# Architecture

## Project Type
Flutter / Dart 3.8.1+ mobile app (tenant-facing client for RentLoop rental platform). Targets iOS and Android.

## Directory Map
```
apps/go/
├── lib/
│   ├── main.dart                   # Entry point: Firebase, Sentry, ProviderScope init
│   └── src/
│       ├── app.dart                # MyApp widget, MaterialApp.router
│       ├── constants.dart          # API_BASE_URL, ENVIRONMENT enum, env-based flags
│       ├── api/                    # One class per resource, all extend AbstractApi
│       ├── architecture/           # Global keepAlive providers (auth, lease, startup)
│       │   ├── app_startup/        # AppStartupNotifier — orchestrates cold-start init
│       │   ├── current_lease/      # CurrentLeaseNotifier — active LeaseModel?
│       │   ├── current_user/       # CurrentUserNotifier — TenantAccountModel?
│       │   ├── lease_id_manager/   # Persists active lease ID to secure storage
│       │   ├── secure_storage/     # FlutterSecureStorage wrapper provider
│       │   └── token_manager/      # JWT read/write via secure storage
│       ├── lib/                    # Utility helpers (money, analytics, error messages)
│       ├── modules/                # Feature screens
│       │   ├── auth/               # welcome, login (phone), verify (OTP)
│       │   └── main/               # home, payments, maintenance, more (4 tab branches)
│       ├── navigation/             # GoRouter config, splash, notification routing
│       ├── repository/
│       │   ├── api_state.dart      # ApiState base class + ApiStatus enum
│       │   ├── models/             # @JsonSerializable DTOs (some @freezed)
│       │   ├── notifiers/          # Mutation state — extend ApiState
│       │   └── providers/          # Query state — @riverpod Future<T> functions
│       └── shared/                 # Theme, screen states, adaptive widgets, utils
```

## Module Overview
| Module/Package | Purpose |
|---|---|
| `api/` | HTTP layer — one class per resource, all extend `AbstractApi` |
| `architecture/` | Global in-memory state: user session, active lease, JWT, startup orchestration |
| `modules/auth/` | Auth flow: welcome → phone login → OTP verify |
| `modules/main/home/` | Home tab: lease overview, payments, maintenance stats, announcements |
| `modules/main/payments/` | Invoices list + detail, offline payment sheet |
| `modules/main/maintenance/` | Maintenance requests list + detail + new request form |
| `modules/main/more/` | Profile, lease details, unit details, announcements, application details |
| `navigation/` | GoRouter routes + splash/startup logic + push notification routing |
| `repository/models/` | Freeze/JsonSerializable DTOs for API responses |
| `repository/notifiers/` | Mutation notifiers (form submissions, actions) |
| `repository/providers/` | Query providers (data fetching, lists) |
| `shared/` | Material3 theme, screen error/empty states, shimmer skeletons |

## Data Flow
1. App cold-starts → `AppStartupNotifier.init()` runs from splash screen
2. Checks connectivity → reads JWT → fetches `/tenant-accounts/me` → fetches leases
3. Sets `currentUserNotifierProvider` + `currentLeaseNotifierProvider` → router redirects to `/`
4. Screens `ref.watch()` keepAlive providers directly — no re-fetch on hot navigation
5. For data screens: `@riverpod Future<T>` provider → UI renders `AsyncValue` with skeleton on first load
6. For mutations: `ApiState` notifier → UI reads `.status` to show pending/error/success

## External Dependencies
| Name | Purpose |
|---|---|
| `flutter_riverpod` / `riverpod_annotation` | State management (code-gen style providers) |
| `go_router` | Declarative navigation with shell routes and auth redirects |
| `flutter_secure_storage` | JWT and lease ID persistence |
| `json_serializable` + `freezed` | DTO code generation |
| `build_runner` | Code generation runner |
| `shimmer` | Skeleton loader animations |
| `modal_bottom_sheet` | Bottom sheets (offline payment, lease switcher) |
| `sentry_flutter` | Error tracking |
| `firebase_messaging` | Push notifications |
| `firebase_analytics` + `appsflyer_sdk` | Analytics + attribution |
| `connectivity_plus` | Network check on startup |
| `haptic_feedback` | Tactile feedback on interactions |
| `image_picker` | Maintenance request attachments |
| `http` | HTTP client (no Dio — plain `http` package) |
| `validatorless` | Form field validators |
