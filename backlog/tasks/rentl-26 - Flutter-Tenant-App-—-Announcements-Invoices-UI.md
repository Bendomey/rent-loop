---
id: RENTL-26
title: Flutter Tenant App — Announcements & Invoices UI
status: To Do
assignee: []
created_date: '2026-03-11 19:05'
labels:
  - flutter
  - announcements
  - invoices
  - notifications
dependencies:
  - RENTL-22
  - RENTL-24
references:
  - lib/src/repository/models/
  - lib/src/api/
  - lib/src/repository/providers/
  - lib/src/modules/main/more/announcements/root.dart
  - lib/src/modules/main/payments/root.dart
  - lib/src/modules/main/home/root.dart
  - lib/src/navigation/routes.dart
  - lib/main.dart
  - lib/src/api/root.dart
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

The Flutter app already has:
- `AnnouncementsScreen` at `/more/announcements` (exists but is a stub)
- `PaymentsScreen` at `/payments` (renders dummy data)
- `HomeScreen` references announcements (needs real data)
- FCM setup complete (background handler + token registration in `VerifyScreen`)

This task wires real API data to all three screens, adds an announcement detail view, a real invoice list, and hooks up push notification deep links.

**Run `make build_runner` after adding any new `@riverpod`, `@freezed`, or `@JsonSerializable` class.**

---

## New Models — `lib/src/repository/models/`

### `announcement_model.dart`
```dart
@freezed
class AnnouncementModel with _$AnnouncementModel {
  factory AnnouncementModel({
    required String id,
    required String title,
    required String content,
    required String type,      // MAINTENANCE | COMMUNITY | POLICY_CHANGE | EMERGENCY
    required String priority,  // NORMAL | IMPORTANT | URGENT
    required String status,
    String? propertyId,
    String? propertyBlockId,
    DateTime? publishedAt,
    DateTime? expiresAt,
    required DateTime createdAt,
  }) = _AnnouncementModel;
  factory AnnouncementModel.fromJson(Map<String, dynamic> json) =>
      _$AnnouncementModelFromJson(json);
}
```

### `invoice_model.dart`
```dart
@freezed
class InvoiceModel with _$InvoiceModel {
  factory InvoiceModel({
    required String id,
    required String code,
    required String status,    // ISSUED | PARTIALLY_PAID | PAID | VOID
    required String contextType,
    required int totalAmount,
    required int subTotal,
    required String currency,
    DateTime? dueDate,
    DateTime? paidAt,
    required DateTime createdAt,
    List<InvoiceLineItemModel>? lineItems,
  }) = _InvoiceModel;
  factory InvoiceModel.fromJson(Map<String, dynamic> json) =>
      _$InvoiceModelFromJson(json);
}

@freezed
class InvoiceLineItemModel with _$InvoiceLineItemModel {
  factory InvoiceLineItemModel({
    required String label,
    required String category,
    required int unitAmount,
    required int totalAmount,
    required int quantity,
    required String currency,
  }) = _InvoiceLineItemModel;
  factory InvoiceLineItemModel.fromJson(Map<String, dynamic> json) =>
      _$InvoiceLineItemModelFromJson(json);
}
```

---

## New API Classes — `lib/src/api/`

### `announcement_api.dart`
Extends `AbstractApi`. Methods:
- `getAnnouncements()` → `GET /api/v1/announcements`
- `getAnnouncement(String id)` → `GET /api/v1/announcements/{id}`
- `markAsRead(String id)` → `POST /api/v1/announcements/{id}/read`

### `invoice_api.dart`
Extends `AbstractApi`. Methods:
- `getInvoices({String? tenantId})` → `GET /api/v1/invoices` with `payer_tenant_id` query param

---

## New Riverpod Providers — `lib/src/repository/providers/`

### `announcements_provider.dart`
```dart
@riverpod
Future<List<AnnouncementModel>> announcements(Ref ref) async {
  final api = AnnouncementApi(ref.read(tokenManagerProvider));
  return api.getAnnouncements();
}
```

### `invoices_provider.dart`
```dart
@riverpod
Future<List<InvoiceModel>> invoices(Ref ref) async {
  final currentUser = ref.watch(currentUserNotifierProvider);
  final api = InvoiceApi(ref.read(tokenManagerProvider));
  return api.getInvoices(tenantId: currentUser?.tenantId);
}
```

---

## Screen Changes

### `AnnouncementsScreen` — `lib/src/modules/main/more/announcements/root.dart`
Replace stub with `ConsumerStatefulWidget`:
- `ref.watch(announcementsProvider)` — `AsyncValue` pattern: shimmer loading → list → error retry
- Each list item: title, priority badge (color-coded: URGENT=red, IMPORTANT=amber, NORMAL=gray), type chip, relative publishedAt ("2 hours ago")
- `onTap` → `context.push('/more/announcements/${announcement.id}')`
- Calls `markAsRead` in background when opened

### New `AnnouncementDetailScreen` — `lib/src/modules/main/more/announcement_detail/root.dart`
- Route: `/more/announcements/:id`
- Fetches single announcement, shows full title + content + type + priority + date
- Calls `markAsRead` on `initState`

### `PaymentsScreen` — `lib/src/modules/main/payments/root.dart`
Replace dummy data with `ref.watch(invoicesProvider)`:
- Outstanding section: ISSUED + PARTIALLY_PAID invoices, total outstanding balance
- Each invoice card: code, amount formatted (e.g., "GHS 1,000.00"), due date, status chip
- Paid section: PAID invoices collapsed list
- Empty state for each section

### `HomeScreen` — `lib/src/modules/main/home/root.dart`
Replace any hardcoded announcements preview:
- `ref.watch(announcementsProvider)` — first 2 items
- "View all" tap → `context.push('/more/announcements')`

---

## Push Notification Deep Linking — `lib/main.dart`

Add handlers after Firebase init:

```dart
// Foreground: show snackbar
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  ScaffoldMessenger.of(navigatorKey.currentContext!)
    .showSnackBar(SnackBar(content: Text(message.notification?.title ?? '')));
});

// Background tap: deep link
FirebaseMessaging.onMessageOpenedApp.listen((message) {
  _handleNotificationTap(message);
});

void _handleNotificationTap(RemoteMessage message) {
  final type = message.data['type'];
  final id = message.data['id'];
  switch (type) {
    case 'ANNOUNCEMENT': router.push('/more/announcements/$id'); break;
    case 'INVOICE':      router.push('/payments'); break;   // invoices list for now
    case 'LEASE':        router.push('/more/lease-details'); break;
  }
}
```

---

## GoRouter Additions — `lib/src/navigation/routes.dart`

```dart
GoRoute(
  path: '/more/announcements/:id',
  builder: (_, state) => AnnouncementDetailScreen(
    id: state.pathParameters['id']!,
  ),
),
```

---

## Critical Files

| File | Change |
|---|---|
| `lib/src/repository/models/announcement_model.dart` | **New** |
| `lib/src/repository/models/invoice_model.dart` | **New** |
| `lib/src/api/announcement_api.dart` | **New** |
| `lib/src/api/invoice_api.dart` | **New** |
| `lib/src/repository/providers/announcements_provider.dart` | **New** |
| `lib/src/repository/providers/invoices_provider.dart` | **New** |
| `lib/src/modules/main/more/announcements/root.dart` | Replace stub |
| `lib/src/modules/main/more/announcement_detail/root.dart` | **New** |
| `lib/src/modules/main/payments/root.dart` | Replace dummy data |
| `lib/src/modules/main/home/root.dart` | Wire real announcements |
| `lib/src/navigation/routes.dart` | Add detail routes |
| `lib/main.dart` | Add FCM foreground + tap deep link handlers |
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AnnouncementsScreen fetches and displays real announcements from the API (not hardcoded)
- [ ] #2 Priority badge color-coded: URGENT=red, IMPORTANT=amber, NORMAL=gray
- [ ] #3 Tapping an announcement navigates to AnnouncementDetailScreen and calls markAsRead
- [ ] #4 PaymentsScreen shows real ISSUED/PARTIALLY_PAID invoices with total outstanding balance
- [ ] #5 Paid invoices appear in a separate collapsed section
- [ ] #6 HomeScreen announcements preview shows first 2 real announcements
- [ ] #7 Tapping a push notification with type=ANNOUNCEMENT navigates to AnnouncementDetailScreen
- [ ] #8 Tapping a push notification with type=INVOICE navigates to PaymentsScreen
- [ ] #9 Shimmer loading state shown while data fetches
- [ ] #10 Error state shown with retry button on network failure
- [ ] #11 make build_runner completes with no errors after model additions
- [ ] #12 make format passes
<!-- AC:END -->
