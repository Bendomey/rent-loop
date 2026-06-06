# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

RentLoop Manager — Flutter mobile app for **property managers**. Dart 3.8.1+, Flutter SDK. This is the mobile companion to the React property manager portal (`apps/property-manager`). It calls the `/api/v1/admin/` and `/api/v1/client-user/` routes (never `/api/v1/tenant-accounts/`).

## Commands

```bash
flutter pub get              # install dependencies
dart format .                # format all Dart files
dart run build_runner watch  # watch + regenerate .g.dart files (run after any model/provider change)
flutter build apk            # build Android APK
flutter build appbundle      # build Android release bundle
flutter build ios            # build iOS
```

**After changing any `@riverpod`-annotated provider or `@JsonSerializable`/`@freezed` model, run `build_runner` to regenerate `.g.dart` files.**

---

## Architecture

This project follows the same architecture as `apps/go` (the tenant Flutter app). When in doubt, look there for reference.

### State Management — Riverpod (code-gen style)

Use `@riverpod` annotations with generated `.g.dart` part files. Never write providers by hand.

```dart
// Query provider (data fetching)
@riverpod
Future<List<PropertyModel>> properties(PropertiesRef ref) async {
  return ref.read(propertyApiProvider).getProperties();
}

// Mutation notifier (form submission / action)
@riverpod
class CreatePropertyNotifier extends _$CreatePropertyNotifier {
  @override
  CreatePropertyState build() => CreatePropertyState();
  // ...
}
```

**Global keepAlive providers** (to be added as the app grows):
- `tokenManagerProvider` — JWT read/write via `FlutterSecureStorage`
- `currentUserNotifierProvider` — authenticated manager account (keepAlive)
- `appStartupNotifierProvider` — orchestrates cold-start; drives GoRouter redirect

Most screen state is local (`ConsumerStatefulWidget` + `setState`). No BLoC or Redux.

### Navigation — GoRouter

Use `go_router`. Define all routes in `lib/src/navigation/routes.dart`.

- Wire GoRouter's `refreshListenable` to `appStartupNotifierProvider` so auth state changes trigger redirects automatically — never navigate imperatively from notifiers.
- Main shell: `StatefulShellRoute.indexedStack` for bottom tabs (preserves scroll state across tab switches).
- Auth flow: `/splash` → checks token → `/auth` → `/auth/login` → `/` (home).

```dart
GoRouter? appRouter; // global ref for notification-driven navigation

GoRouter buildRoutes(WidgetRef ref, Listenable refreshListenable) {
  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: refreshListenable,
    redirect: (context, state) {
      final startup = ref.read(appStartupNotifierProvider);
      // switch on startup.status → return redirect path or null
    },
    routes: [ ... ],
  );
}
```

### Module Structure

Organize features under `lib/src/modules/`:

```
lib/src/
├── api/                    # One class per resource, all extend AbstractApi
│   └── root.dart           # AbstractApi base class
├── architecture/           # Global keepAlive providers (token, user, startup)
├── constants.dart          # API_BASE_URL, ENVIRONMENT enum
├── lib/                    # Utility helpers (money, error messages, etc.)
├── modules/
│   ├── auth/               # login screens
│   └── main/               # feature tab screens
├── navigation/             # routes.dart, splash.dart
├── repository/
│   ├── api_state.dart      # ApiState base + ApiStatus enum
│   ├── models/             # @JsonSerializable DTOs
│   ├── notifiers/          # Mutation state
│   └── providers/          # Query state
└── shared/                 # theme.dart, screen states, skeleton widgets
```

---

## API Integration Pattern

The app uses **REST** (not GraphQL). Three layers: **Api class → Notifier/Provider → Screen**.

### AbstractApi base class

All API classes extend `AbstractApi`. It handles auth headers and throws `ApiException` on non-2xx.

```dart
abstract class AbstractApi {
  final TokenManager tokenManager;
  AbstractApi({required this.tokenManager});

  Future<http.Response> execute({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    bool authRequired = true,
  }) async {
    final uri = Uri.parse('$API_BASE_URL$path');
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (authRequired) {
      final token = await tokenManager.get();
      if (token == null) throw Exception('Unauthenticated');
      headers['Authorization'] = 'Bearer $token';
    }
    final resp = await http.post(uri, headers: headers, body: body != null ? jsonEncode(body) : null);
    if (resp.statusCode >= 400) throw ApiException(resp.statusCode, resp.body);
    return resp;
  }
}

class ApiException implements Exception {
  final int statusCode;
  final String body;
  ApiException(this.statusCode, this.body);
  String? get message { /* parse json['errors']['message'] */ }
}
```

### Api class (per resource)

```dart
class PropertyApi extends AbstractApi {
  PropertyApi({required super.tokenManager});

  Future<List<PropertyModel>> getProperties() async {
    final resp = await execute(method: 'GET', path: '/api/v1/admin/properties');
    return (jsonDecode(resp.body)['data'] as List).map((e) => PropertyModel.fromJson(e)).toList();
  }
}

@riverpod
PropertyApi propertyApi(PropertyApiRef ref) =>
    PropertyApi(tokenManager: ref.watch(tokenManagerProvider));
```

### Mutation notifier

```dart
class CreatePropertyState extends ApiState {
  CreatePropertyState({super.status, super.errorMessage});
}

@riverpod
class CreatePropertyNotifier extends _$CreatePropertyNotifier {
  @override
  CreatePropertyState build() => CreatePropertyState();

  Future<void> submit({required String name}) async {
    state = CreatePropertyState(status: ApiStatus.pending);
    try {
      await ref.read(propertyApiProvider).createProperty(name: name);
      state = CreatePropertyState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = CreatePropertyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(errorMessage: e.message),
      );
    } catch (_) {
      state = CreatePropertyState(
        status: ApiStatus.failed,
        errorMessage: translateApiErrorMessage(),
      );
    }
  }
}
```

**UI consumption:**
```dart
final state = ref.watch(createPropertyNotifierProvider);
if (state.status.isLoading()) // show loading indicator
if (state.status.isFailed())  // show state.errorMessage
if (state.status.isSuccess()) // navigate / show success
```

### Query provider

```dart
@riverpod
Future<List<PropertyModel>> properties(PropertiesRef ref) async {
  return ref.read(propertyApiProvider).getProperties();
}
```

### Models — `@JsonSerializable`

```dart
@JsonSerializable()
class PropertyModel {
  final String id;
  final String name;
  @JsonKey(name: 'created_at')
  final String? createdAt;

  PropertyModel({required this.id, required this.name, this.createdAt});

  factory PropertyModel.fromJson(Map<String, dynamic> json) =>
      _$PropertyModelFromJson(json);
  Map<String, dynamic> toJson() => _$PropertyModelToJson(this);
}
```

Always use `@JsonKey(name: 'snake_case')` to map API fields. Run `build_runner` after any model change.

### Error handling

Translate API errors via `translateApiErrorMessage(errorMessage: e.message)` (from `lib/src/lib/api_error_messages.dart`). Default fallback: `'Something happened. Try again.'`

---

## Loading States — Skeleton Loaders (REQUIRED)

**ALWAYS use shimmer skeleton loaders instead of `CircularProgressIndicator` for data-fetching screens.**

```dart
dependencies:
  shimmer: ^3.0.0
```

Use the `hasValue`/`isLoading` guard — NOT `.when()` — so skeletons only appear on first load, not on pull-to-refresh:

```dart
if (!dataAsync.hasValue && dataAsync.isLoading) {
  return const _MyScreenSkeleton();
}
if (dataAsync.hasError && !dataAsync.hasValue) {
  return ErrorWidget(...);
}
final data = dataAsync.value!;
return RefreshIndicator(
  onRefresh: () => ref.refresh(myProvider.future),
  child: ListView(...),
);
```

Skeleton widget:
```dart
class _MyScreenSkeleton extends StatelessWidget {
  const _MyScreenSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey.shade200,
      highlightColor: Colors.grey.shade50,
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        children: [
          // mirror the real layout with Container placeholders
        ],
      ),
    );
  }
}
```

**All list/detail screens must also have pull-to-refresh** via `RefreshIndicator(onRefresh: () => ref.refresh(myProvider.future), child: ListView(...))`.

---

## Theme

Material Design 3. Use `ThemeData(useMaterial3: true)`. Define in `lib/src/shared/theme.dart`. Use Inter as the font family (add to `pubspec.yaml` assets).

Haptic feedback: use `haptic_feedback` package on button taps and form submissions.

---

## Key Packages to Add

Copy from `apps/go/pubspec.yaml` as the baseline. Essential ones:

| Package | Purpose |
|---|---|
| `flutter_riverpod` + `riverpod_annotation` | State management |
| `go_router` | Navigation |
| `flutter_secure_storage` | JWT + persisted storage |
| `json_serializable` + `freezed` | DTO code generation |
| `build_runner` + `riverpod_generator` | Code generation |
| `shimmer` | Skeleton loaders |
| `modal_bottom_sheet` | Bottom sheets |
| `sentry_flutter` | Error tracking |
| `http` | HTTP client (plain — no Dio) |
| `validatorless` | Form validators |
| `haptic_feedback` | Tactile feedback |
| `connectivity_plus` | Network check on startup |
| `custom_lint` + `riverpod_lint` | Riverpod-aware linting |

---

## REST API Reference

Full docs: **https://api.rentloopapp.com/swagger/index.html**

Auth: `Authorization: Bearer <jwt>` header on all protected routes.

Use `WebFetch` on the Swagger URL to look up endpoints, request/response shapes, and required fields before writing any new API calls.

This app calls **client-user and admin routes** — not `/api/v1/tenant-accounts/`.

---

## Conventions at a Glance

- Files: `snake_case.dart`; screen root files named `root.dart` inside their feature folder
- Classes: `PascalCase`; screens → `XxxScreen`, notifiers → `XxxNotifier`, models → `XxxModel`
- Private widgets in a file: underscore prefix (`_MyContent`, `_MySkeleton`)
- Never call API methods directly from screens — always go through a provider/notifier
- Never use `CircularProgressIndicator` for data screens — use shimmer skeletons
- Never use `.when()` as the loading guard — use `hasValue`/`isLoading` check
- JSON struct tags always `snake_case` via `@JsonKey(name: '...')`
