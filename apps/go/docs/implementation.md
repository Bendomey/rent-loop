# Implementation

## Entry Points
- `lib/main.dart` — Firebase init, Sentry init, FCM background handler, system UI overlay, `runApp(ProviderScope(child: MyApp()))`
- `lib/src/app.dart` — `MyApp` widget; builds `MaterialApp.router` with GoRouter and theme
- `lib/src/navigation/routes.dart` — `buildRoutes()`: defines all GoRoute/StatefulShellRoute entries, auth redirect logic

## Per-Module Breakdown

### architecture/
- **Entry point:** `lib/src/architecture/architecture.dart` (barrel export)
- **Key notifiers:**
  - `AppStartupNotifier` — orchestrates cold-start: connectivity → JWT → `/me` fetch → leases fetch → sets `ready`/`unauthenticated`/`error`. Also handles `completeLogin()` (post-OTP) and `logout()` (clears all state + FCM token)
  - `CurrentUserNotifier` — holds `TenantAccountModel?`; `setUser()` / `clear()`
  - `CurrentLeaseNotifier` — holds `LeaseModel?`; `setLease()` persists ID to storage; `loadFromLeases()` resolves stored ID or defaults to first
  - `TokenManager` — `get()` / `set()` / `remove()` JWT via `FlutterSecureStorage`
  - `LeaseIdManager` — same pattern for `'rentloop.current_lease_id'`

### api/
- **Entry point:** `lib/src/api/root.dart` — `AbstractApi` base class
- **Key classes:** `AuthApi`, `LeaseApi`, `MaintenanceApi`, `InvoiceApi`, `TenantAccountApi`, `AnnouncementApi`, `ChecklistApi`, `NotificationApi`, `R2UploadApi`, `UnitApi`, `TenantApplicationApi`
- **`execute()` method:** attaches Bearer token if `authRequired`, encodes body as JSON, throws `ApiException` on non-2xx
- **`ApiException`:** parses `json['errors']['message']` from response body

### repository/notifiers/
Mutation notifiers follow a fixed shape:
1. `class XxxState extends ApiState` (no extra fields needed usually)
2. `@riverpod class XxxNotifier extends _$XxxNotifier` with `build()` returning initial state
3. Action method: `state = pending` → call API → `state = success` or `state = failed(translateApiErrorMessage(...))`
- `send_otp_notifier`, `verify_otp_notifier` — auth flow
- `create_maintenance_request_notifier` — also fires analytics + refreshes list + badge
- `maintenance_requests_notifier` — paginated list (has `loadFirstPage()`)
- `acknowledge_checklist_notifier`, `create_offline_payment_notifier`, `register_fcm_token_notifier`

### repository/providers/
Query providers: `@riverpod Future<T>` (or `List<T>`) functions, one per resource.
- `leasesProvider` — `keepAlive: true`; calls `loadFromLeases()` after fetch
- `invoicesProvider`, `announcementsProvider`, `checklistsProvider`, `unitProvider`, `paymentAccountsProvider`, `maintenanceRequestProvider`, `tenantApplicationProvider`, `maintenanceBadgeProvider`

### modules/auth/
- `WelcomeScreen` → `LoginScreen` (phone input) → `VerifyScreen` (OTP + calls `appStartupNotifier.completeLogin()`)
- Navigation via `context.go('/auth/login')` / `context.go('/')` after success

### modules/main/home/
- `HomeScreen` — `ConsumerWidget`; watches `leasesProvider`, `currentUserNotifierProvider`, `currentLeaseNotifierProvider`; passes down to `_HomeContent`
- Sub-cards: `UpcomingPaymentCard`, `LeaseOverviewCard`, `UnitInfoCard`, `PaymentSummaryCard`, `MaintenanceStatsCard`, `AnnouncementsCard`, `ChecklistReviewCard`, `QuickActionsCard`
- `HomeSkeleton` — shimmer layout mirroring `_HomeContent`; used on first load only
- `LeaseSelectorBar` / `LeaseSwitcherModal` — for tenants with multiple leases

### navigation/
- `routes.dart` — `buildRoutes(ref, refreshListenable)`: GoRouter with `AppStartupNotifier`-driven redirect; `StatefulShellRoute.indexedStack` for 4 tabs
- `splash.dart` — `NavigationLoader`; calls `AppStartupNotifier.init()` on first build
- `notification_handler.dart` — `notificationMessageToPath()`: maps FCM `data.type` to route path; `pendingNotificationMessage` global for cold-start tap handling

## Configuration
| Variable | Source | Purpose |
|---|---|---|
| `ENVIRONMENT` | `constants.dart` compile-time const | Switches staging/prod URLs |
| `API_BASE_URL` | `constants.dart` | REST base URL |
| `SENTRY_DSN` | `String.fromEnvironment` | Error tracking DSN |
| `APPSFLYER_DEV_KEY` / `APPSFLYER_APP_ID_IOS` | `String.fromEnvironment` | Attribution SDK keys |
| `rentloop.current_lease_id` | `FlutterSecureStorage` | Persisted active lease ID |
| JWT token | `FlutterSecureStorage` | Auth token |

## Non-obvious Logic
- GoRouter's `refreshListenable` is wired to `appStartupNotifierProvider` — any status change triggers a route re-evaluation without imperative navigation calls
- `leasesProvider` is `keepAlive: true` so tab switches don't re-fetch; pull-to-refresh calls `ref.refresh(leasesProvider.future)`
- `_handleNotificationTap` in `main.dart` (foreground tap) and the cold-start handler in `routes.dart` both switch the active lease before navigating, so the target screen always has the right lease in context
- `AppStartupNotifier.logout()` fire-and-forgets the FCM token delete — the await is inside a try/catch so a network failure never blocks logout
