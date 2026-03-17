---
id: RENTL-25
title: Property Manager Portal — Announcements UI
status: Done
assignee: []
created_date: '2026-03-11 19:05'
updated_date: '2026-03-17 11:22'
labels:
  - frontend
  - announcements
  - property-manager
dependencies:
  - RENTL-24
references:
  - app/api/announcements/index.ts
  - app/modules/properties/property/activities/announcements/index.tsx
  - app/modules/announcements/index.tsx
  - app/routes/_auth.properties.$propertyId.activities.announcements.tsx
  - app/routes/_auth._dashboard.announcements._index.tsx
  - app/components/blocks/announcements/
  - app/lib/constants.ts
  - app/api/properties/index.ts
priority: medium
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

The backend (RENTL-24) exposes full CRUD + publish/schedule for announcements. The portal already has a placeholder route at `/properties/$propertyId/activities/announcements` (renders `<div>Property Activities Announcements</div>` with `isComingSoon: true`). This task replaces that placeholder with a real UI and adds a global announcements management page.

---

## New Files

### API layer — `app/api/announcements/index.ts`

Follow the pattern in `app/api/properties/index.ts`:

```typescript
// Query keys: ANNOUNCEMENTS = 'announcements'

useGetAnnouncements(query)                      // GET /v1/admin/announcements
useGetPropertyAnnouncements(propertyId, query)  // GET /v1/properties/{id}/announcements
useGetAnnouncement(id)                          // GET /v1/admin/announcements/{id}
useCreateAnnouncement()                         // POST /v1/admin/announcements
useUpdateAnnouncement()                         // PATCH /v1/admin/announcements/{id}
useDeleteAnnouncement()                         // DELETE /v1/admin/announcements/{id}
usePublishAnnouncement()                        // POST /v1/admin/announcements/{id}/publish
useScheduleAnnouncement()                       // POST /v1/admin/announcements/{id}/schedule
```

Types:
```typescript
interface CreateAnnouncementInput {
  title: string
  content: string
  type: 'MAINTENANCE' | 'COMMUNITY' | 'POLICY_CHANGE' | 'EMERGENCY'
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT'
  property_id?: string
  property_block_id?: string
  target_unit_ids?: string[]
  scheduled_at?: string   // ISO 8601
  expires_at?: string     // ISO 8601
}
```

---

### Property-scoped announcements module

**File:** `app/modules/properties/property/activities/announcements/index.tsx`

Layout:
- Header: "Announcements" title + "New Announcement" button (opens create modal)
- `DataTable` with columns: Title, Type chip, Priority badge, Status badge, Published At, Actions (publish / schedule / delete)
- Status badge colors: DRAFT (muted), SCHEDULED (blue), PUBLISHED (green), EXPIRED (gray)
- Empty state: "No announcements yet — create one to notify tenants"
- Calls `useGetPropertyAnnouncements(propertyId)` — propertyId from `useProperty()` context

### Global announcements module

**File:** `app/modules/announcements/index.tsx`

Same `DataTable` pattern with an additional "Property" column. No property pre-filter. Calls `useGetAnnouncements()`.

### Create/Edit form component

**File:** `app/components/blocks/announcements/announcement-form.tsx`

React Hook Form + Zod:
- Title (Input, required)
- Content (Textarea, required)
- Type (Select: MAINTENANCE / COMMUNITY / POLICY_CHANGE / EMERGENCY)
- Priority (Select: NORMAL / IMPORTANT / URGENT)
- Expires At (optional date picker)
- Targeting section (only on property-scoped form): Block (optional Select), Unit IDs (optional multi-select from property's units)

Creates DRAFT on submit. Separate publish/schedule actions on the list row.

### Schedule modal

**File:** `app/components/blocks/announcements/schedule-announcement-modal.tsx`

Date + time picker for `scheduled_at`. Calls `useScheduleAnnouncement()`.

---

## Route Files

| Route file | Purpose |
|---|---|
| `app/routes/_auth.properties.$propertyId.activities.announcements.tsx` | Update — wire to new module, remove isComingSoon |
| `app/routes/_auth._dashboard.announcements._index.tsx` | **New** — global list |

---

## Other Changes

- `app/lib/constants.ts` — add `QUERY_KEYS.ANNOUNCEMENTS`
- Property sidebar nav file — remove `isComingSoon: true` from announcements entry
- Dashboard sidebar nav — add "Announcements" link

---

## Dark Mode

All new components use Shadcn UI primitives (`bg-background`, `text-foreground`, `border`). Status and priority badges use the `Badge` component with appropriate `variant` props. Use `dark:` Tailwind variants only where custom colors are unavoidable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Announcements sidebar link no longer shows 'Coming Soon' badge
- [ ] #2 Property-scoped announcements page loads and displays DataTable with real data
- [ ] #3 Create Announcement form validates and creates a DRAFT on submit
- [ ] #4 Status badge correctly renders DRAFT / SCHEDULED / PUBLISHED / EXPIRED with distinct colors
- [ ] #5 Publish action on a DRAFT row calls the publish endpoint and refreshes the table
- [ ] #6 Schedule modal sets scheduled_at and transitions row to SCHEDULED status
- [ ] #7 Delete action removes a DRAFT announcement (confirms before deleting)
- [ ] #8 Global /announcements page lists all cross-property announcements with a Property column
- [ ] #9 All UI renders correctly in both dark and light mode
- [ ] #10 yarn types:check passes with no TypeScript errors
- [ ] #11 yarn lint passes
<!-- AC:END -->
