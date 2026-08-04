# Lease Detail Screen Redesign (pm_mobile)

Date: 2026-07-24

## Problem

The mobile `LeaseDetailScreen` (`apps/pm_mobile/lib/src/modules/main/leases/detail.dart`)
predates the "Lease Detail" mock imported from the Claude Design project
(`rentloop` project, `Lease Detail.html` → `rl-mgr-lease.jsx`'s `ScreenLease`).
The mock introduces a photo-led hero card with an inline term-progress bar, a
segmented tab control, a denser two-column terms grid, and a persistent
bottom action bar — all using tokens (`MG.*`) that already exist verbatim in
this app as `RLTokens`/`RLBar`/`RLSegmented`/etc. This is a layout/composition
redesign using existing building blocks, not a new visual system.

## Decision

Redesign `LeaseDetailScreen` to match the mock's mobile layout, reusing real
data already fetched by `leaseDetailProvider`/`leaseChecklistsProvider`.
Anything the mock shows that the backend doesn't support yet (Renew,
Terminate) stays disabled — no backend/API work in this task. Documents and
Expenses tab bodies are unchanged (Documents already has a richer signing
flow than the mock's static list; Expenses has no backing data yet).

## Sections

### 1. Hero card (replaces the top of `_LeaseSidebarCard`)

New `_LeaseHeroCard` widget, `RLCard`-based:
- Photo strip: `lease.unit?.images?.first` via `Image.network`, same
  fallback-to-placeholder-tile pattern already used for unit thumbnails in
  `properties/detail.dart` (~L952-966). No image → tinted placeholder tile,
  not a blank space.
- Status pill (`RLPill`, existing `propertyStatusLabel`/`statusTone`)
  floated top-right over the photo (`Stack` + `Positioned`).
- Below the photo: lease code row (icon + `lease.code`), then the existing
  tappable tenant row (`RLAvatar` + name → `/more/tenants/:id`) and tappable
  unit row (→ `/properties/:propertyId/units/:id`) — carried over from
  `_LeaseSidebarCard` as-is.
- Rent block: `RLMoney(pesewasToCedis(lease.rentFee))` + frequency label,
  same data as today, laid out like the mock (money left, frequency label
  bottom-right of the same row) instead of stacked.
- New term-progress block, divider-separated: Move-in date / Move-out date
  on one row, `RLBar` underneath, then "Month X of Y" + "N days left" labels.
  Values come from a new helper (see §2). Bar/day-count color switches to
  `RLTokens.warning` when `daysLeft <= 14` (reuses the threshold already
  implicit in `shouldShowLeaseEndingAlert`'s period-based window; this is a
  simpler flat 14-day check purely for the progress bar's color, not a new
  alert condition).
- Created On / Updated On rows and the "View Application" link stay,
  unchanged, below another divider.
- Terminate/Start-Lease buttons are removed from this card — see §5.

### 2. Term-progress helper

Add to `apps/pm_mobile/lib/src/lib/lease_status.dart`:

```dart
class LeaseTermProgress {
  const LeaseTermProgress({
    required this.percent,     // 0–100, clamped
    required this.daysLeft,    // may be negative if past end date
    required this.monthOf,     // 1-based current month
    required this.monthsTotal, // best-effort total month count
  });
  final double percent;
  final int daysLeft;
  final int monthOf;
  final int monthsTotal;
}

LeaseTermProgress leaseTermProgress(LeaseModel lease) { ... }
```

- Uses `leaseEndDate(lease)` (existing) for the end date.
- Start date: `lease.moveInDate` parsed, or `lease.createdAt` if null.
- `percent`: elapsed / total duration in days, clamped `[0, 100]`.
- `monthsTotal`: from `lease.stayDuration`/`stayDurationFrequency` when the
  frequency is month-based; otherwise derive whole months between start/end
  dates, minimum 1.
- `monthOf`: whole months elapsed since start, clamped to `[1, monthsTotal]`.
- `daysLeft`: `leaseEndDate(lease).difference(DateTime.now()).inDays`.
- No new alert/banner logic — `_LeaseAlerts` is untouched.

### 3. Tabs

Swap `RLFilterChips` for `RLSegmented` (already built, currently unused by
this screen) so the 4 tabs (`Lease`, `Tenant`, `Docs`, `Expenses` — shortened
from today's `Lease Details`/`Tenant Profile`/`Documents`/`Expenses` to match
the mock's compact labels) render as an equal-width filled-track control.
`_tab` state and `_buildTabContent` switch logic unchanged, just the key
strings/labels and the widget swap.

### 4. Lease Details tab — two-column terms grid

New `_TermsGrid` widget replacing the single-column `_InfoCard`/`_FieldRow`
list for the "Lease Terms" and "Financial Terms" cards only: renders rows of
up to two label/value pairs side by side (`Row` of `Expanded` cells), each
cell reusing the existing label styling (mono, uppercase, muted) over the
value styling (sans, semibold, ink). Same field set and ordering as today:
- Lease Terms: [Payment Frequency, Duration], [Move-in Date, Move-out Date],
  [Property Inspection, Utility Transfers], [Activated At, Created On] (plus
  the existing conditional Cancelled/Terminated/Completed rows, which fall
  back to single-cell rows when there's no natural pair).
- Financial Terms: [Rent Fee, Initial Deposit], [Payment Frequency, Security
  Deposit], with the Invoice link kept as its own full-width link row below
  (matches the mock's separate `LinkRow` treatment), not folded into the grid.
The Invoice link row and Inspection Reports section (`_InspectionReportsSection`,
`_ChecklistList`, `_ChecklistRow`) are unchanged.

### 5. Tenant tab

Add a `Call` / `Message` button row (`RLBtn(kind: light)` pair, full-width
split) above the existing "Contact" card, wired via `url_launcher`:
- Call → `tel:${tenant.phone}`
- Message → `sms:${tenant.phone}`
Both no-op (button hidden or disabled) when `tenant == null` or
`tenant.phone` is empty, matching the existing null-tenant handling in
`_buildTenantProfile`. No new dependency — `url_launcher` is already used in
this file (`_openUrl`) and in `documents_tab.dart`.

Rest of the tab (Personal Information / Identification / Employment /
Emergency Contact cards) is unchanged.

### 6. Documents / Expenses tabs

No changes. `buildDocumentsTab()` keeps its full signing flow;
`_ComingSoonTab(title: 'Expenses')` stays as-is.

### 7. Sticky bottom action bar

For an **Active** lease only: a new persistent footer (`Container` pinned via
`Stack`/`Positioned` at the `Scaffold` body level, or a `bottomNavigationBar`-
style slot — implementation detail for the plan step), styled like the mock's
(`elevBar` shadow, top hairline, `12px 20px` padding):
- `RLBtn(label: 'Renew', kind: RLBtnKind.light)` — new, disabled
  (`onPressed: null`), no backend support yet.
- `RLBtn(label: 'Terminate Lease', kind: RLBtnKind.danger)` — moved from
  inline in `_LeaseSidebarCard`, same disabled state as today.

For a **Pending** lease: no sticky bar. Keep today's inline "Start Lease"
button placement inside the hero card (mirrors the mock, which also has no
sticky bar for a lease that hasn't started).

For any other status: no sticky bar (matches today, where neither button
shows).

`_LeaseAlerts` (Lease Starting Soon / Lease Ending Soon banners) is
unchanged, including its own disabled "Renew Lease" alert action row — no
new duplication logic needed there.

## Out of scope

- No Go backend changes — no terminate/renew endpoints added.
- No new Expenses data/API wiring — tab stays a placeholder.
- No changes to the Documents tab's signing flow.
- No web (`apps/property-manager`) changes — mock's web board (`WebLease`)
  is not part of this task.
- No in-app messaging — "Message" is a plain `sms:` deep link, not a new
  chat/announcement feature.
