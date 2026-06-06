# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

RentLoop Flutter mobile app — the tenant-facing mobile client for the rent management platform. Dart 3.8.1+, Flutter SDK.

## Codebase Index

This project has a living `docs/` folder with architecture, implementation, patterns, decisions, and changelog files.

### Session Start
- Read `docs/architecture.md` and `docs/implementation.md` before doing any work.
- These files contain the project map — do not re-scan the codebase from scratch.

### After Every Feature or Bugfix
1. Run `git diff HEAD~1 --name-only` to identify changed files.
2. Re-scan only the changed files and their direct neighbors.
3. Update the relevant doc files with targeted edits:
   - New module/package → update `docs/architecture.md`, `docs/implementation.md`
   - New class/function/endpoint → update `docs/implementation.md`
   - Renamed files/folders → update `docs/architecture.md`, `docs/patterns.md`
   - New dependency → update `docs/architecture.md`
   - New naming/code pattern → update `docs/patterns.md`
4. If an architectural decision was made → append an ADR entry to `docs/decisions.md`
5. Append a dated changelog entry to `docs/changelog.md`

## Commands

```bash
make install       # flutter pub get
make format        # dart format .
make build_runner  # dart run build_runner watch (watches for codegen changes)
make build_apk     # flutter build apk
make build_bundle  # flutter build appbundle (release, obfuscated)
make release       # flutter build
```

**Running tests:** No test harness configured. Linting uses `flutter_lints` via `analysis_options.yaml`.

**After changing any `@riverpod`-annotated provider or `@freezed`/`@JsonSerializable` model, run `make build_runner` to regenerate `.g.dart` files.**

## Architecture

### State Management — Riverpod (code-gen style)

Providers use `@riverpod` annotations with generated `.g.dart` part files. The global providers live in `lib/src/architecture/`:

- `tokenManagerProvider` — JWT token read/write (backed by secure storage)
- `secureStorageProvider` — `FlutterSecureStorage` wrapper
- `currentUserNotifierProvider` — authenticated `TenantAccountModel?` (keepAlive, in-memory)
- `currentLeaseNotifierProvider` — currently selected `LeaseModel?` (keepAlive, ID persisted to secure storage)
- `leaseIdManagerProvider` — reads/writes `'rentloop.current_lease_id'` to secure storage
- `appStartupNotifierProvider` — orchestrates cold-start; drives GoRouter redirect via `refreshListenable`

Most screen state is local (`ConsumerStatefulWidget` + `setState`). There is no global BLoC or Redux layer.

### Using `currentUserNotifierProvider` and `currentLeaseNotifierProvider`

```dart
final currentUser = ref.watch(currentUserNotifierProvider); // TenantAccountModel?
final activeLease = ref.watch(currentLeaseNotifierProvider); // LeaseModel?

// Switching the active lease (persists across restarts):
await ref.read(currentLeaseNotifierProvider.notifier).setLease(lease);
```

**Clearing on logout** — always go through `AppStartupNotifier.logout()`, which handles FCM token deletion, secure storage cleanup, and state clearing in one call.

### Navigation — GoRouter

Routes defined in `lib/src/navigation/routes.dart`. Initial route: `/splash`.

Main shell uses `StatefulShellRoute.indexedStack` for 4 bottom tabs: Home, Payments, Maintenance, More.

Auth flow: `/splash` → checks token → `/auth` (welcome) → `/auth/login` → `/auth/login/verify/:phone` → `/` (home).

GoRouter's `refreshListenable` is wired to `appStartupNotifierProvider` — status changes trigger re-evaluation of the `redirect` callback without imperative navigation.

### Module Structure

Features are organized under `lib/src/modules/`:

```
modules/
├── auth/       # Welcome, login (phone), OTP verify
└── main/       # Home, payments, maintenance, more (tab screens)
```

Screens extend `ConsumerStatefulWidget` or `ConsumerWidget`. Navigation uses `context.go()` / `context.push()`.

### Key Packages

| Purpose | Package |
|---|---|
| State | `flutter_riverpod`, `riverpod_annotation`, `riverpod_generator` |
| Navigation | `go_router` |
| Secure storage | `flutter_secure_storage` |
| Code generation | `json_serializable`, `freezed`, `build_runner` |
| Error tracking | `sentry_flutter` |
| Validation | `validatorless` |
| Modals | `modal_bottom_sheet` |

### Theme

Material Design 3. Primary color: `Color.fromARGB(255, 230, 2, 63)` (red). Font: Inter (variable). Defined in `lib/src/shared/theme.dart`.

Haptic feedback (`haptic_feedback` package) is used throughout on button taps and form submissions.

### Loading States — Skeleton Loaders (REQUIRED)

**ALWAYS use shimmer skeleton loaders instead of `CircularProgressIndicator` for data-fetching screens.**

- Import `package:shimmer/shimmer.dart`
- Use `Shimmer.fromColors(baseColor: Colors.grey.shade200, highlightColor: Colors.grey.shade50, child: ...)` as the wrapper
- The skeleton should mirror the actual layout: same sections, same rough dimensions
- Use the conditional pattern (not `.when()`) so skeletons only show on initial load, not on pull-to-refresh:

```dart
if (!dataAsync.hasValue && dataAsync.isLoading) {
  return const _MyScreenSkeleton();
}
if (dataAsync.hasError && !dataAsync.hasValue) {
  return /* error widget */;
}
final data = dataAsync.value!;
return RefreshIndicator(
  onRefresh: () => ref.refresh(myProvider.future),
  child: /* actual content */,
);
```

- **All list/detail screens must also have pull-to-refresh** using `RefreshIndicator` wrapping the `ListView`, with `onRefresh: () => ref.refresh(myProvider.future)`
- See `home_skeleton.dart` and `unit_details/root.dart` for reference implementations

---

## API Integration Pattern

The app uses **REST** (not GraphQL). Base URL and environment config live in `lib/src/constants.dart`.

### Layered Structure

Follow a 3-layer pattern: **Api class → Notifier (mutation) or Provider (query) → Screen**.

```
lib/src/
├── api/                    # One class per resource (AuthApi, LeaseApi, etc.)
│   └── root.dart           # AbstractApi base class
├── repository/
│   ├── api_state.dart      # ApiState / ApiStatus enum (idle/pending/success/failed)
│   ├── models/             # @JsonSerializable DTOs
│   ├── notifiers/          # Mutation state: extend ApiState, use @riverpod class
│   └── providers/          # Query state: @riverpod Future<T> functions
```

### AbstractApi Base Class (`lib/src/api/root.dart`)

All API classes extend `AbstractApi`, which holds a `TokenManager`. Its `execute()` method attaches `Authorization: Bearer <token>` and throws `ApiException` on non-2xx. Parse the user-facing message via `ApiException.message` (reads `json['errors']['message']`).

### Api Class (per resource)

```dart
class AuthApi extends AbstractApi {
  AuthApi({required super.tokenManager});

  Future<http.Response> sendOtp(String phone) => execute(
    method: 'POST',
    path: '/api/v1/tenant-accounts/auth/codes',
    body: {'phone': phone},
    authRequired: false,
  );
}

@riverpod
AuthApi authApi(AuthApiRef ref) => AuthApi(tokenManager: ref.watch(tokenManagerProvider));
```

### Mutation Notifier (actions that change state)

```dart
class SendOtpState extends ApiState {
  SendOtpState({super.status, super.errorMessage});
}

@riverpod
class SendOtpNotifier extends _$SendOtpNotifier {
  @override
  SendOtpState build() => SendOtpState();

  Future<void> sendOtp(String phone) async {
    state = SendOtpState(status: ApiStatus.pending);
    try {
      await ref.read(authApiProvider).sendOtp(phone);
      state = SendOtpState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = SendOtpState(status: ApiStatus.failed, errorMessage: translateApiErrorMessage(errorMessage: e.message));
    } catch (_) {
      state = SendOtpState(status: ApiStatus.failed, errorMessage: translateApiErrorMessage());
    }
  }
}
```

**UI consumption:**
```dart
final state = ref.watch(sendOtpNotifierProvider);
if (state.status.isLoading()) // show spinner
if (state.status.isFailed())  // show state.errorMessage
```

### Query Provider (data fetching)

```dart
@riverpod
Future<List<LeaseModel>> leases(LeasesRef ref) async {
  final list = await ref.read(leaseApiProvider).getLeases();
  await ref.read(currentLeaseNotifierProvider.notifier).loadFromLeases(list);
  return list;
}
```

**UI consumption** — use the `hasValue`/`isLoading` guard (not `.when()`) — see Skeleton Loaders section.

### Models — `@JsonSerializable`

```dart
@JsonSerializable()
class LeaseModel {
  final String id;
  @JsonKey(name: 'rent_fee')
  final int rentFee;

  LeaseModel({required this.id, required this.rentFee});
  factory LeaseModel.fromJson(Map<String, dynamic> json) => _$LeaseModelFromJson(json);
  Map<String, dynamic> toJson() => _$LeaseModelToJson(this);
}
```

Run `make build_runner` after adding/changing models.

### Error Handling

API errors are translated to user-facing strings in `lib/src/lib/api_error_messages.dart`. Always pass `e.message` from `ApiException` — default fallback is `'Something happened. Try again.'`

---

## REST API Reference

Full docs: **https://api.rentloopapp.com/swagger/index.html**

Auth: `Authorization: Bearer <jwt>` header on all protected routes.

Use `WebFetch` on the Swagger URL to look up endpoints, request/response shapes, and required fields before writing new API calls.

> Admin-only routes (property manager portal) are under `/api/v1/admin/`. Do not call these from the mobile app.
