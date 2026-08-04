# Architectural Decisions

> ADR entries explain WHY — not what was built, but why it was built that way.

---

## Riverpod code-gen style (not manual providers)
**Date:** pre-2026-06-06
**Why:** `@riverpod` annotations + `riverpod_generator` eliminate boilerplate and enforce consistent provider shape. `riverpod_lint` catches misuse at analysis time.
**Tradeoffs:** Requires `make build_runner` after every provider/model change; generated files must be kept in sync.
**Alternatives considered:** Manual Riverpod providers (more verbose, error-prone); BLoC (heavier, more ceremony).

---

## Plain `http` package (not Dio)
**Date:** pre-2026-06-06
**Why:** Keeps the HTTP layer simple — `AbstractApi.execute()` covers all use cases (auth headers, JSON encoding, error throwing). No interceptor/retry complexity needed.
**Tradeoffs:** No built-in interceptors, retry logic, or cancel tokens. Must add manually if needed.
**Alternatives considered:** Dio (more features but heavier and unnecessary for current scope).

---

## GoRouter with `AppStartupNotifier` as `refreshListenable`
**Date:** pre-2026-06-06
**Why:** Decouples auth state from navigation — any status change on `AppStartupNotifier` automatically re-evaluates route redirects. No imperative `context.go()` needed at the app level.
**Tradeoffs:** All redirect logic lives in one `redirect` callback; must keep it in sync with `AppStartupStatus` values.
**Alternatives considered:** Imperative navigation from notifiers (harder to reason about, breaks with deep links).

---

## Skeleton loaders via `if (!dataAsync.hasValue && isLoading)` guard (not `.when()`)
**Date:** pre-2026-06-06
**Why:** `.when()` re-shows the loading widget on every `ref.refresh()` (pull-to-refresh), causing a jarring blank flash. The explicit guard only shows the skeleton on the very first load.
**Tradeoffs:** Slightly more verbose than `.when()`.
**Alternatives considered:** `.when()` with `skipLoadingOnRefresh: true` (less obvious to future devs).

---

## StatefulShellRoute with IndexedStack for 4 tabs
**Date:** pre-2026-06-06
**Why:** Preserves scroll position and widget state across tab switches without re-fetching data. Combined with `keepAlive: true` providers, tab navigation is instant.
**Tradeoffs:** Higher memory usage (all 4 tab subtrees live in memory).
**Alternatives considered:** Regular GoRoute tab switching (loses widget state on tab change).
