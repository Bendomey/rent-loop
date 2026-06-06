# Patterns

## Naming Conventions
- Files: `snake_case.dart`; screen root files are always named `root.dart` inside their feature folder
- Classes: `PascalCase`; screens suffix with `Screen`, notifiers with `Notifier`, states with `State`, models with `Model`
- Providers (generated): `camelCase` — e.g., `leasesProvider`, `sendOtpNotifierProvider`
- Generated files: `filename.g.dart` (json_serializable/riverpod), `filename.freezed.dart`
- Private widgets within a file: underscore prefix (`_HomeContent`, `_MyScreenSkeleton`)

## Folder Conventions
- One feature per folder under `modules/main/` — flat files for cards/sub-widgets, `root.dart` for the screen
- API classes: one file per resource under `api/`
- Notifiers: `repository/notifiers/<resource>/<action>_notifier/<action>_notifier.dart`
- Providers: `repository/providers/<resource>_provider.dart`
- Models: `repository/models/<resource>_model.dart`
- Global architecture providers: `architecture/<concern>/<concern>.dart`

## Recurring Code Patterns

### Skeleton loading (REQUIRED on all data screens)
Use `if (!dataAsync.hasValue && dataAsync.isLoading)` — NOT `.when()` — so skeletons only show on first load, not on pull-to-refresh:
```dart
if (!dataAsync.hasValue && dataAsync.isLoading) return const _MyScreenSkeleton();
if (dataAsync.hasError && !dataAsync.hasValue) return ErrorWidget(...);
final data = dataAsync.value!;
return RefreshIndicator(
  onRefresh: () => ref.refresh(myProvider.future),
  child: ListView(...),
);
```
Skeleton must mirror the actual layout using `Shimmer.fromColors(baseColor: Colors.grey.shade200, highlightColor: Colors.grey.shade50, child: ...)`.

### Pull-to-refresh (REQUIRED on all list/detail screens)
Wrap `ListView` with `RefreshIndicator(onRefresh: () => ref.refresh(myProvider.future), child: ...)`.

### Mutation notifier shape
```dart
class XxxState extends ApiState { XxxState({super.status, super.errorMessage}); }

@riverpod
class XxxNotifier extends _$XxxNotifier {
  @override
  XxxState build() => XxxState();

  Future<void> doAction(...) async {
    state = XxxState(status: ApiStatus.pending);
    try {
      await ref.read(xxxApiProvider).doThing(...);
      state = XxxState(status: ApiStatus.success);
    } on ApiException catch (e) {
      state = XxxState(status: ApiStatus.failed, errorMessage: translateApiErrorMessage(errorMessage: e.message));
    } catch (_) {
      state = XxxState(status: ApiStatus.failed, errorMessage: translateApiErrorMessage());
    }
  }
}
```

### Query provider shape
```dart
@riverpod
Future<List<XxxModel>> xxxList(XxxListRef ref) async {
  return ref.read(xxxApiProvider).getList();
}
```

### API class shape
```dart
class XxxApi extends AbstractApi {
  XxxApi({required super.tokenManager});
  Future<XxxModel> getXxx(String id) async {
    final resp = await execute(method: 'GET', path: '/api/v1/xxx/$id');
    return XxxModel.fromJson(jsonDecode(resp.body));
  }
}

@riverpod
XxxApi xxxApi(XxxApiRef ref) => XxxApi(tokenManager: ref.watch(tokenManagerProvider));
```

### Model shape
Use `@JsonSerializable` with `@JsonKey(name: 'snake_case')` for API fields:
```dart
@JsonSerializable()
class XxxModel {
  final String id;
  @JsonKey(name: 'some_field')
  final String someField;
  XxxModel({required this.id, required this.someField});
  factory XxxModel.fromJson(Map<String, dynamic> json) => _$XxxModelFromJson(json);
  Map<String, dynamic> toJson() => _$XxxModelToJson(this);
}
```
Run `make build_runner` after any model change.

### Haptic feedback
Call `HapticFeedback.mediumImpact()` (or `lightImpact`) on button taps and form submissions — consistent across the app.

### Error translation
Always pass `ApiException.message` to `translateApiErrorMessage(errorMessage: e.message)`. For non-API catches use `translateApiErrorMessage()` (returns default string).

## Testing Conventions
- No test harness configured. Lint via `flutter_lints` + `riverpod_lint` + `custom_lint`.
- Run `flutter analyze` or check `custom_lint.log` for lint output.

## Anti-Patterns to Avoid
- Do NOT use `CircularProgressIndicator` for data-fetching screens — use shimmer skeletons
- Do NOT use `.when()` for loading guards — it triggers skeleton on every refresh, not just first load
- Do NOT call API methods directly from screens — always go through a provider/notifier
- Do NOT use `keepAlive: true` on mutation notifiers (only query providers that serve the whole session need it)
