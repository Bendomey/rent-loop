---
id: RENTL-29
title: Delete FCM Token on Logout
status: To Do
assignee: []
created_date: '2026-03-12 08:04'
labels:
  - flutter
  - backend
  - notifications
  - security
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Goal

When a user logs out, delete their device's FCM token from the server so they stop receiving push notifications for that account on that device.

## Problem

Currently logout only clears the local JWT and in-memory state — the FCM token remains registered on the server. This means:
- On shared/family devices, a logged-out user can still receive another user's notifications
- If user A logs out and user B logs in on the same device, user A's token is still associated with user A's account → user A receives notifications on user B's device

## Solution

Delete only the current device's token on logout (not all tokens for the account — the user may be logged in on multiple devices simultaneously).

---

## Backend Changes

### New endpoint
`DELETE /api/v1/tenant-accounts/fcm-token` (tenant JWT required)

**Request body:**
```json
{ "token": "fcm-device-token" }
```

**Handler:** `internal/handlers/notification.go` — add `DeleteFcmToken` method

**Service:** `internal/services/notification.go` — add `DeleteToken(ctx, tenantAccountID, token string) error`
- Verify the token belongs to the authenticated tenant account before deleting (prevent deleting other accounts' tokens)

**Repository:** `internal/repository/fcm-token.go` — `Delete(ctx, token)` already exists; add a scoped variant or reuse with ownership check

**Route registration:** add the DELETE route in the tenant account router

---

## Flutter Changes

### 1. Add `deleteFcmToken` to `NotificationApi`
**File:** `apps/go/lib/src/api/notification.dart`

```dart
Future<void> deleteFcmToken({required String token}) async {
  await execute(
    method: 'DELETE',
    path: '/api/v1/tenant-accounts/fcm-token',
    body: {'token': token},
  );
}
```

### 2. Call on logout
**File:** `apps/go/lib/src/modules/main/more/logout_button_widget.dart`

In the `logout()` function, before clearing local state:

```dart
Future<void> logout() async {
  await Haptics.vibrate(HapticsType.medium);

  // Fire-and-forget — don't block logout on network failure
  try {
    final fcmToken = await FirebaseMessaging.instance.getToken();
    if (fcmToken != null) {
      await ref.read(notificationApiProvider).deleteFcmToken(token: fcmToken);
    }
  } catch (_) {}

  await ref.read(tokenManagerProvider).remove();
  await ref.read(leaseIdManagerProvider).remove();
  ref.read(currentUserNotifierProvider.notifier).clear();
  ref.read(currentLeaseNotifierProvider.notifier).clear();

  if (context.mounted) {
    await Haptics.vibrate(HapticsType.success);
    context.go('/auth');
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('You logged out successfully!')),
    );
  }
}
```

---

## Files Summary

| File | Change |
|---|---|
| `services/main/internal/handlers/notification.go` | Add `DeleteFcmToken` handler |
| `services/main/internal/services/notification.go` | Add `DeleteToken` to interface + impl |
| `services/main/internal/router/` | Register `DELETE /v1/tenant-accounts/fcm-token` |
| `apps/go/lib/src/api/notification.dart` | Add `deleteFcmToken` method |
| `apps/go/lib/src/modules/main/more/logout_button_widget.dart` | Call delete before clearing local state |

---

## Design Notes

- **Fire-and-forget on Flutter side**: wrap in `try/catch` and don't block logout on network failure. The backend already auto-deletes tokens when FCM returns 404/422 (invalid token), so stale tokens are eventually cleaned up even if the delete call fails.
- **Ownership check on backend**: verify the token belongs to the authenticated tenant account before deleting — prevents a malicious request from deleting another account's token.
- **Scope**: delete only the current device's token, not all tokens for the account (user may be on multiple devices).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 After logout, the device's FCM token is removed from the server
- [ ] #2 The user no longer receives push notifications on the device after logging out
- [ ] #3 Logout is not blocked if the FCM token delete API call fails (fire-and-forget)
- [ ] #4 The backend verifies the token belongs to the authenticated tenant account before deleting
- [ ] #5 Re-login re-registers the FCM token via the existing registerFcmToken flow
- [ ] #6 On a shared device, logging out as user A and in as user B does not deliver user A notifications to user B's session
<!-- AC:END -->
