---
id: RENTL-28
title: Push Notification Deep Linking — Navigate to Lease-Scoped Screens on Tap
status: Done
assignee: []
created_date: '2026-03-12 08:02'
updated_date: '2026-03-17 11:22'
labels:
  - flutter
  - backend
  - notifications
  - navigation
dependencies:
  - RENTL-24
priority: medium
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Goal

When a user taps a push notification, the app should automatically switch to the correct lease context and navigate to the relevant screen. For example, tapping an announcement notification should switch to the lease the announcement belongs to (if the user has multiple leases) and navigate to `/more/announcements`.

---

## Background

Currently push notifications are sent with no data payload — the app has no way to know which screen to open or which lease the notification belongs to. This feature adds that wiring end-to-end.

---

## FCM Data Payload Schema

The backend must include these fields in the `data` map on every push notification:

| Field | Type | Description |
|---|---|---|
| `notification_type` | `string` | e.g. `"announcement"`, `"maintenance"`, `"payment"`, `"lease_activated"` |
| `lease_id` | `string` | Tenant's active lease ID for the relevant property |
| `announcement_id` | `string` | (announcement only) ID of the announcement |
| `request_id` | `string` | (maintenance only) ID of the maintenance request |

---

## Backend Changes

### 1. New repository query
**File:** `services/main/internal/repository/lease.go`

Add `FindActiveLeaseByTenantAccountAndProperty(ctx, tenantAccountID, propertyID string) (*models.Lease, error)`

Queries for an active lease whose unit belongs to the given property.

### 2. Announcement service publish
**File:** `services/main/internal/services/announcement.go` (when announcement module is built — RENTL-24)

When iterating target tenant accounts for notification:
```go
lease, _ := leaseRepo.FindActiveLeaseByTenantAccountAndProperty(ctx, tenantAccount.ID, announcement.PropertyID)
leaseID := ""
if lease != nil {
    leaseID = lease.ID
}
data := map[string]string{
    "notification_type": "announcement",
    "announcement_id":   announcement.ID,
    "lease_id":          leaseID,
}
go notificationSvc.SendToTenantAccount(ctx, tenantAccount.ID, title, body, data)
```

Apply the same pattern to all other notification-sending sites (lease activation, invoice reminders, etc.) as they are built.

---

## Flutter Changes

### 1. New keepAlive provider — `PendingNotificationNotifier`
**File:** `apps/go/lib/src/architecture/pending_notification/pending_notification_notifier.dart`

Stores a `RemoteMessage?` for cold-start handling (app was terminated when notification arrived).

```dart
@Riverpod(keepAlive: true)
class PendingNotificationNotifier extends _$PendingNotificationNotifier {
  @override
  RemoteMessage? build() => null;
  void set(RemoteMessage message) => state = message;
  void clear() => state = null;
}
```

Run `make build_runner` to regenerate `.g.dart`.

### 2. New shared helper — `notification_navigator.dart`
**File:** `apps/go/lib/src/shared/notification_navigator.dart`

Single function called on every notification tap:

```dart
Future<void> handleNotificationTap(
  Map<String, dynamic> data,
  WidgetRef ref,
) async {
  final notificationType = data['notification_type'] as String?;
  final leaseId = data['lease_id'] as String?;

  // Switch lease if needed
  if (leaseId != null && leaseId.isNotEmpty) {
    final currentLease = ref.read(currentLeaseNotifierProvider);
    if (currentLease?.id != leaseId) {
      final leases = ref.read(leasesProvider).valueOrNull ?? [];
      final target = leases.firstWhereOrNull((l) => l.id == leaseId);
      if (target != null) {
        await ref.read(currentLeaseNotifierProvider.notifier).setLease(target);
      }
    }
  }

  // Navigate
  switch (notificationType) {
    case 'announcement':
      navigatorKey.currentContext?.goNamed('Announcements');
      break;
    // future: maintenance, payment, lease_activated
  }
}
```

### 3. Wire FCM listeners in `AppNavigator`
**File:** `apps/go/lib/src/navigation/root.dart`

In `initState`, add `_initFCMListeners()`:
- `FirebaseMessaging.onMessageOpenedApp` → call `handleNotificationTap` immediately (app was backgrounded, auth/leases are loaded)
- `FirebaseMessaging.instance.getInitialMessage()` → store in `pendingNotificationNotifierProvider` via `addPostFrameCallback` (cold start — defer until app state is ready)
- `FirebaseMessaging.onMessage` → optional in-app banner (can defer to later)

### 4. Process cold-start notification in `HomeScreen`
**File:** `apps/go/lib/src/modules/main/home/root.dart`

In `initState`, add a `WidgetsBinding.instance.addPostFrameCallback` that checks `pendingNotificationNotifierProvider`, clears it, then calls `handleNotificationTap`. This runs after the splash screen has finished auth and `leasesProvider` has populated `currentLeaseNotifierProvider`.

---

## Route Mapping (Extension Points)

| `notification_type` | Additional data fields | Target route |
|---|---|---|
| `announcement` | `announcement_id` | `/more/announcements` |
| `maintenance` | `request_id` | `/maintenance/:id` |
| `payment` | `invoice_id` | `/payments` |
| `lease_activated` | — | `/more/lease-details` |

---

## Files Summary

| File | Change |
|---|---|
| `apps/go/lib/src/architecture/pending_notification/pending_notification_notifier.dart` | Create |
| `apps/go/lib/src/architecture/pending_notification/pending_notification_notifier.g.dart` | Generated |
| `apps/go/lib/src/shared/notification_navigator.dart` | Create |
| `apps/go/lib/src/navigation/root.dart` | Modify — add `_initFCMListeners()` |
| `apps/go/lib/src/modules/main/home/root.dart` | Modify — process cold-start pending notification |
| `apps/go/lib/src/architecture/architecture.dart` | Modify — export new provider |
| `services/main/internal/repository/lease.go` | Modify — add `FindActiveLeaseByTenantAccountAndProperty` |
| `services/main/internal/services/announcement.go` | Modify (when RENTL-24 is built) |

---

## Design Notes

- `AppNavigator` is a `ConsumerStatefulWidget` so `ref` is directly available — no `ProviderContainer` hacks needed for FCM listeners.
- Cold start deferred via `pendingNotificationNotifierProvider` because `getInitialMessage` fires before the router has navigated past `/splash` and before `leasesProvider` has run.
- `handleNotificationTap` is the single extension point for all future notification types — just add a new `case` to the switch.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tapping an announcement notification while the app is backgrounded navigates to /more/announcements under the correct lease
- [ ] #2 Tapping an announcement notification from a cold start (app terminated) navigates to /more/announcements under the correct lease after auth completes
- [ ] #3 If the notification's lease_id differs from the current active lease, the app switches to that lease before navigating
- [ ] #4 If the notification's lease_id is not found in the user's leases list, the app still navigates to the correct screen without crashing
- [ ] #5 Backend includes notification_type and lease_id in the FCM data payload for announcement notifications
- [ ] #6 The notification_type switch in handleNotificationTap is the single extension point — adding a new route requires only a new case
<!-- AC:END -->
