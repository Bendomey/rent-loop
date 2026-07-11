# Changelog

## 2026-07-11 — Login integration + real-data wiring for workspace/profile surfaces
- Implemented real login, cold-start token validation, workspace selection, and logout against `https://api.rentloopapp.com`, replacing the fully-mocked `AppStartupNotifier` (11-task plan; design spec + plan under `docs/superpowers/`)
- New: `api/root.dart` (`AbstractApi`, `ApiException`), `api/user_api.dart` (`UserApi.login()`/`getMe()`); `repository/api_state.dart`, `repository/models/{user,client_user,client}_model.dart`, `repository/notifiers/auth/login_notifier.dart`; `architecture/{secure_storage,token_manager,workspace_id_manager,current_user,current_workspace,app_startup}/`; `lib/{storage,secure_storage,token_manager,workspace_id_manager,workspace_resolution,api_error_messages}.dart`
- Deleted the old hand-written mock `architecture/app_startup.dart`; replaced with `@riverpod` code-gen `AppStartupNotifier` at `architecture/app_startup/app_startup_notifier.dart` (provider renamed `appStartupProvider` → `appStartupNotifierProvider`)
- Modified for real-data wiring: `modules/auth/login/root.dart`, `modules/auth/workspace_select/root.dart`, `modules/main/workspace_sheet.dart`, `modules/main/more/root.dart` (profile + workspace cards), `modules/main/home/root.dart` (top header only), `navigation/{splash,routes}.dart`
- Added `json_annotation` dependency (`pubspec.yaml`)
- Added tests: `test/api/root_test.dart`, `test/lib/workspace_resolution_test.dart`, `test/repository/models/*_test.dart` (17 tests total, all passing)
- Fixed during review: `isActiveClientUser` originally used a substring `contains('active')` check that misclassified `"Inactive"` as active; changed to a last-dot-segment exact match
- Still mocked: `properties/`, `tenants/`, `activity/`, `money/`, `announcements/`, and most of `more/` (members, payment accounts, documents, agreement, billing, settings) — pending their own integration passes
- Modules affected: `api/`, `architecture/`, `lib/`, `repository/`, `modules/auth/`, `modules/main/home/`, `modules/main/more/`, `modules/main/workspace_sheet.dart`, `navigation/`

## 2026-07-10 — Initial index
- First scan of codebase
- Generated architecture.md, implementation.md, patterns.md, decisions.md
- Notable finding: app is UI-only (mock data throughout), no `api/`/`repository/` layer yet — API integration work is about to begin, starting with `modules/auth/login`
