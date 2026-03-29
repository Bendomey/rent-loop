---
id: RENTL-29
title: Add isRead field to tenant announcement API response
status: To Do
assignee: []
created_date: '2026-03-13 11:00'
updated_date: '2026-03-27 09:43'
labels:
  - backend
  - flutter
  - announcements
dependencies:
  - RENTL-26
references:
  - services/main/
  - apps/go/lib/src/api/announcement_api.dart
  - apps/go/lib/src/repository/models/announcement_model.dart
priority: medium
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

The tenant announcement API (`GET /api/v1/announcements`) currently returns a list of announcements without any indication of whether the authenticated tenant has already read each one. The Flutter app calls `markAsRead` (`POST /api/v1/announcements/{id}/read`) when an announcement is opened, but on subsequent list fetches there is no way to distinguish read from unread items.

## Goal

Add an `is_read` boolean field to the tenant announcement list/detail response so the mobile app can filter out (or de-emphasise) already-read announcements without making a separate read-status request.

---

## Backend Changes — `services/main/`

1. **Track read status per tenant** — ensure a `tenant_announcement_reads` table (or equivalent) exists with at minimum `(tenant_id, announcement_id, read_at)`. The existing `markAsRead` endpoint should already write here; confirm or add the migration.

2. **Extend announcement response DTO** — add `is_read bool` to the announcement response struct/serialiser used by the tenant API routes.

3. **Populate `is_read`** — when building the announcement list/detail for a tenant, LEFT JOIN (or equivalent) the reads table and set `is_read = true` if a matching row exists for the requesting tenant.

4. **Update Swagger docs** — regenerate or manually annotate the response schema so `is_read` appears in the Swagger UI at `/swagger/index.html`.

---

## Flutter Changes — `apps/go/`

### `announcement_model.dart`
Add the new field:
```dart
@freezed
class AnnouncementModel with _$AnnouncementModel {
  factory AnnouncementModel({
    // ... existing fields ...
    @Default(false) bool isRead,   // maps from JSON key "is_read"
  }) = _AnnouncementModel;
  factory AnnouncementModel.fromJson(Map<String, dynamic> json) =>
      _$AnnouncementModelFromJson(json);
}
```
Use `@JsonKey(name: 'is_read')` if the code-gen does not snake_case automatically.

### `announcement_api.dart` / providers
No API call changes required — the field is returned automatically by the updated endpoint.

### UI usage (optional, driven by RENTL-26 acceptance criteria)
- In `AnnouncementsScreen`, skip (or visually distinguish) items where `isRead == true` per product decision.
- Suggested default: show unread items at the top; grey-out or badge-remove read items.

---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `GET /api/v1/announcements` response includes `is_read: true/false` for each announcement based on the authenticated tenant's read history
- [ ] #2 `GET /api/v1/announcements/{id}` detail response also includes `is_read`
- [ ] #3 After calling `POST /api/v1/announcements/{id}/read`, subsequent list/detail fetches return `is_read: true` for that announcement
- [ ] #4 `AnnouncementModel` in Flutter includes `isRead` field and deserialises correctly from `is_read`
- [ ] #5 Swagger docs reflect the new field
- [ ] #6 Existing backend tests pass; add a test covering `is_read` toggling if test coverage exists for announcements
<!-- AC:END -->
