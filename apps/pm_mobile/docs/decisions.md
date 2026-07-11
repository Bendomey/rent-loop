# Architectural Decisions

> ADR entries explain WHY — not what was built, but why it was built that way.

---

## UI-first build order — mock data before API integration
**Date:** not determinable from scan (predates this doc)
**Why:** The entire screen tree (auth flow + all 5 main tabs) was built and wired through GoRouter against hardcoded/mock state first, deferring real backend integration to a later pass. This let navigation, layout, and design tokens (`RLTokens`) get validated independently of API availability.
**Tradeoffs:** At the time of the original scan, zero screens were backed by real data. **Update (2026-07-11):** auth is now fully integrated (see the login integration ADR below) — `api/`, `repository/`, `TokenManager`, `CurrentUserNotifier`, `CurrentWorkspaceNotifier`, and `SecureStorage` all exist and are proven end-to-end. Properties, tenants, activity, money, and announcements remain mocked, pending their own integration passes, one module at a time following the now-established pattern.
**Alternatives considered:** Building screens API-first (module by module, matching `apps/go`'s existing pattern) — not chosen; not determinable from scan why.

---

## Extra `workspaceSelect` step in the PM app's auth flow
**Date:** not determinable from scan (predates this doc)
**Why:** Property managers/landlords can belong to multiple organizations/workspaces, unlike tenants in `apps/go` (who have leases, not workspaces, and select a *lease* post-login via `CurrentLeaseNotifier`, not a pre-shell auth step). This app inserts an `AppStartupStatus.workspaceSelect` state between login and `ready` so a workspace must be chosen before entering the main shell.
**Tradeoffs:** Adds a status value and redirect branch not present in `apps/go`'s `AppStartupStatus`.
**Alternatives considered:** Not determinable from scan.
**Update (2026-07-11):** Implemented against the confirmed live API. Workspace membership comes back embedded in the login/`/me` response itself (`user.client_users[]`, each with a `client` object) — there is no separate "list my workspaces" endpoint, so no extra request is needed to populate the picker.

---

## Login integration architecture (2026-07-11)
**Date:** 2026-07-11
**Why:** First real API integration for pm_mobile, establishing the pattern all future modules follow. Mirrors `apps/go` 1:1 (`AbstractApi` → resource `XxxApi` → provider/notifier → screen), with one new piece: `CurrentWorkspaceNotifier`/`WorkspaceIdManager` as the PM-app analogue of `apps/go`'s lease selection (client/workspace membership instead of lease). Full rationale and confirmed endpoint contracts: `docs/superpowers/specs/2026-07-10-login-integration-design.md`.
**Key sub-decisions:**
- Converted `AppStartupNotifier` from a hand-written `Notifier` to `@riverpod` code-gen (closing the gap flagged in the "UI-first build order" ADR above).
- Split login into its own `LoginNotifier` mutation (matches `apps/go`'s `verify_otp_notifier` pattern) rather than keeping the API call inside `AppStartupNotifier`, which only orchestrates state *after* a successful login (`completeLogin()`).
- `resolveWorkspace()` auto-selects a workspace (skipping the picker) when there's exactly one active membership, or when a previously-persisted workspace id still matches an active one — restoring the last choice across app restarts, mirroring `apps/go`'s `CurrentLeaseNotifier.loadFromLeases()`.
- Workspace status matching (`isActiveClientUser`) uses a last-dot-segment case-insensitive match rather than an exact match or substring `contains` — the real API's status string format (`"ClientUser.Status.Active"` per Swagger's example) looks like a stringified enum path, and a naive substring check would misclassify `"Inactive"` as active (caught in review, fixed before merge).
- Dropped the `properties · units` stat shown on mocked workspace cards — that data isn't in the API response, and fetching it would require an extra per-workspace call before the user has even picked one.
**Tradeoffs:** No token refresh (matches `apps/go` — none exists server-side); `AppStartupNotifier`'s `completeLogin()`/`selectWorkspace()`/`logout()` have no internal try/catch, so a storage failure inside them propagates to the caller (acceptable since `LoginNotifier.submit()` already wraps the whole login path in one try/catch, and the app self-heals on next cold start regardless).
**Alternatives considered:** Keeping the whole login flow inside `AppStartupNotifier` (rejected — diverges from the project's documented mutation-notifier convention); building modules other than auth in this same pass (rejected — kept to a single, reviewable slice; properties/tenants/activity/money/announcements remain mocked, pending their own integration passes).
