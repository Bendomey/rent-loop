# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

RentLoop Flutter mobile app — the tenant-facing mobile client for the rent management platform. Dart 3.8.1+, Flutter SDK.

## Commands

```bash
make install       # flutter pub get
make format        # dart format .
make build_runner  # dart run build_runner watch (watches for codegen changes)
make build_apk     # flutter build apk
make build_bundle  # flutter build appbundle (release, obfuscated)
make release       # flutter build
```

**Running tests:** No test harness is configured. Linting uses `flutter_lints` via `analysis_options.yaml`.

**After changing any `@riverpod`-annotated provider or `@freezed`/`@JsonSerializable` model, run `make build_runner` to regenerate `.g.dart` files.**

## Architecture

### State Management — Riverpod (code-gen style)

Providers use `@riverpod` annotations with generated `.g.dart` part files. The two global providers live in `lib/src/architecture/`:

- `tokenManagerProvider` — JWT token read/write (backed by secure storage)
- `secureStorageProvider` — `FlutterSecureStorage` wrapper

Most screen state is local (`ConsumerStatefulWidget` + `setState`). There is no global BLoC or Redux layer.

### Navigation — GoRouter

Routes defined in `lib/src/navigation/routes.dart`. Initial route: `/splash`.

Main shell uses `StatefulShellRoute` with `IndexedStack` for 4 bottom tabs: Home, Payments, Maintenance, More.

Auth flow: `/splash` → checks token → `/auth` (welcome) → `/auth/login` → `/auth/login/verify/:phone` → `/` (home).

### Module Structure

Features are organized under `lib/src/modules/`:

```
modules/
├── auth/       # Welcome, login (phone), OTP verify
└── main/       # Home, payments, maintenance, more (tab screens)
```

Screens extend `ConsumerStatefulWidget`. Navigation uses `context.go()` / `context.push()`.

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

### Splash / Auth Init

`lib/src/navigation/splash.dart` handles startup:
1. Checks internet connectivity via `connectivity_plus`
2. Reads stored JWT from `tokenManagerProvider`
3. Routes to `/auth` (no token) or `/` (valid token)

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
│   ├── models/             # @freezed + @JsonSerializable DTOs
│   ├── notifiers/          # Mutation state: extend ApiState, use @riverpod class
│   └── providers/          # Query state: @riverpod Future<T> functions
```

### AbstractApi Base Class (`lib/src/api/root.dart`)

All API classes extend `AbstractApi`, which holds a configured `http.Client` and `TokenManager`. It exposes an `execute()` method that:
- Validates token presence for auth-required calls
- Attaches `Authorization: Bearer <token>` header
- Throws on non-2xx responses

### Api Class (per resource)

```dart
class AuthApi extends AbstractApi {
  AuthApi({required super.httpClient, required super.tokenManager});

  Future<http.Response> sendOtp(String phone) => execute(
    method: 'POST',
    path: '/api/v1/tenant-accounts/auth/codes',
    body: {'phone': phone},
    authRequired: false,
  );
}

@riverpod
AuthApi authApi(AuthApiRef ref) {
  return AuthApi(
    httpClient: ref.watch(httpClientProvider),
    tokenManager: ref.watch(tokenManagerProvider),
  );
}
```

### Mutation Notifier (actions that change state)

State class extends `ApiState`. Notifier sets `pending → success/failed`.

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
    } catch (e) {
      state = SendOtpState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(e),
      );
    }
  }
}
```

**UI consumption:**
```dart
final notifier = ref.watch(sendOtpNotifierProvider.notifier);
final state = ref.watch(sendOtpNotifierProvider);

if (state.status.isLoading()) // show spinner
if (state.status.isFailed())  // show state.errorMessage
```

### Query Provider (data fetching)

For read operations, use a simple `@riverpod Future<T>` function:

```dart
@riverpod
Future<LeaseModel> currentLease(CurrentLeaseRef ref) async {
  final json = await ref.read(leaseApiProvider).getCurrentLease();
  return LeaseModel.fromJson(json);
}
```

**UI consumption** — handle `AsyncValue` with `.when()`:
```dart
final lease = ref.watch(currentLeaseProvider);
lease.when(
  data: (l) => LeaseCard(lease: l),
  loading: () => const CircularProgressIndicator(),
  error: (e, _) => ErrorCard(errorMessage: e.toString(), retry: () => ref.invalidate(currentLeaseProvider)),
);
```

### Models — `@freezed` + `@JsonSerializable`

```dart
@freezed
class LeaseModel with _$LeaseModel {
  const factory LeaseModel({
    required String id,
    required String status,
  }) = _LeaseModel;

  factory LeaseModel.fromJson(Map<String, dynamic> json) =>
      _$LeaseModelFromJson(json);
}
```

Run `make build_runner` after adding/changing models.

### Error Handling

API errors are translated to user-facing strings in `lib/src/lib/api_error_messages.dart`. Pattern: `context.errorCode` switch, default to `'Something happened. Try again.'`.

---

## REST API Reference

Full docs: **https://rentloop-api-staging.fly.dev/swagger/index.html**

Auth: `Authorization: Bearer <jwt>` header on all protected routes.

### Tenant Account Routes (mobile app scope)

**Authentication (no auth required)**
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/tenant-accounts/auth/codes` | Send OTP to phone |
| POST | `/api/v1/tenant-accounts/auth/codes/verify` | Verify OTP, returns JWT |

**Tenant Applications (tracking page — mixed auth)**
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/tenant-applications/code/{code}` | Get application by tracking code |
| POST | `/api/v1/tenant-applications/code/{code}/otp:send` | Send OTP for application |
| POST | `/api/v1/tenant-applications/code/{code}/otp:verify` | Verify OTP for application |
| POST | `/api/v1/tenant-applications/code/{code}/invoice/{invoice_id}/pay` | Pay invoice |
| GET/PATCH | `/api/v1/tenant-applications/{id}` | Get/update application |
| POST | `/api/v1/tenant-applications` | Submit new application |

**Other**
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/units/{unit_id}` | Get unit details |
| GET | `/api/v1/tenants/phone/{phone}` | Look up tenant by phone |
| GET/POST | `/api/v1/signing/{token}/verify` | Signing token verify |
| POST | `/api/v1/signing/{token}/sign` | Sign document |
| POST | `/api/v1/payments/offline` | Record offline payment |

> Admin-only routes (property manager portal) are under `/api/v1/admin/`. Do not call these from the mobile app.
