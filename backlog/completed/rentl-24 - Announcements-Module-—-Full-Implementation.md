---
id: RENTL-24
title: Announcements Module — Full Implementation
status: Done
assignee: []
created_date: '2026-03-11 18:50'
updated_date: '2026-03-12 12:57'
labels:
  - backend
  - announcements
  - notifications
  - cron
dependencies: []
references:
  - internal/models/announcement.go
  - internal/repository/announcement.go
  - internal/repository/tenant-account.go
  - internal/services/announcement.go
  - internal/handlers/announcement.go
  - internal/router/client-user.go
  - internal/router/tenant.go
  - internal/jobs/
  - init/migration/jobs/
  - internal/transformations/announcement.go
priority: medium
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

Property managers need to broadcast communications to tenants — maintenance notices, policy changes, community updates, emergency alerts. The `Announcement` model exists in the codebase but is commented out of migrations with no routes, service, or repository. This task activates and extends it into a full module.

**Features:**
- **Targeting** — all tenants, property-wide, block-wide, or specific units
- **Scheduling** — publish immediately or schedule for a future date/time
- **Expiry** — automatically expire past a set date
- **Priority-based channel routing** — NORMAL (push), IMPORTANT (push + email), URGENT/EMERGENCY (push + email + SMS)
- **Read tracking** — tenants mark announcements as read; PMs can see who has seen it

---

## Enhanced Model

**File:** `internal/models/announcement.go` — replace the stub:

```go
type Announcement struct {
    BaseModelSoftDelete
    Title    string
    Content  string
    Type     string  // MAINTENANCE | COMMUNITY | POLICY_CHANGE | EMERGENCY
    Priority string  // NORMAL | IMPORTANT | URGENT

    // Status lifecycle: DRAFT → (SCHEDULED | PUBLISHED) → EXPIRED
    Status      string
    ScheduledAt *time.Time
    PublishedAt *time.Time
    ExpiresAt   *time.Time

    // Targeting (all nil = all tenants of this client's properties)
    PropertyID      *string
    Property        *Property
    PropertyBlockID *string
    PropertyBlock   *PropertyBlock
    TargetUnitIDs   pq.StringArray  // specific unit IDs

    ClientID    string  // denormalized for easy PM filtering
    Client      Client
    CreatedById string
    CreatedBy   ClientUser
}

type AnnouncementRead struct {
    ID              string `gorm:"primaryKey;default:uuid_generate_v4()"`
    AnnouncementID  string
    Announcement    *Announcement
    TenantAccountID string
    TenantAccount   *TenantAccount
    ReadAt          time.Time
}
```

---

## Migration

**New file:** `init/migration/jobs/activate-announcements.go`

Migration ID: `ACTIVATE_ANNOUNCEMENTS`

Adds to `announcements` table: `type`, `priority`, `status`, `scheduled_at`, `published_at`, `expires_at`, `property_id`, `property_block_id`, `target_unit_ids`, `client_id` columns.

Creates `announcement_reads` table.

Also uncomment `&models.Announcement{}` in `init/migration/main.go` AutoMigrate and add `&models.AnnouncementRead{}`.

---

## Repository

**New file:** `internal/repository/announcement.go`

```go
type AnnouncementRepository interface {
    Create(ctx context.Context, a *models.Announcement) error
    GetOneWithPopulate(ctx context.Context, query GetAnnouncementQuery) (*models.Announcement, error)
    List(ctx context.Context, filter ListAnnouncementsFilter) (*[]models.Announcement, error)
    Count(ctx context.Context, filter ListAnnouncementsFilter) (int64, error)
    Update(ctx context.Context, a *models.Announcement) error
    Delete(ctx context.Context, id string) error
    ListScheduledDue(ctx context.Context) (*[]models.Announcement, error)  // SCHEDULED, scheduled_at <= now
    ListExpiredDue(ctx context.Context) (*[]models.Announcement, error)    // PUBLISHED, expires_at < now
    CreateRead(ctx context.Context, read *models.AnnouncementRead) error
    HasRead(ctx context.Context, announcementID, tenantAccountID string) (bool, error)
}
```

**Filter struct:**
```go
type ListAnnouncementsFilter struct {
    lib.FilterQuery
    ClientID   *string
    PropertyID *string
    Status     *string
    Type       *string
}
```

**New methods on `TenantAccountRepository`** (`internal/repository/tenant-account.go`):
```go
GetByPropertyID(ctx, propertyID string) (*[]models.TenantAccount, error)
GetByBlockID(ctx, blockID string) (*[]models.TenantAccount, error)
GetByUnitIDs(ctx, unitIDs []string) (*[]models.TenantAccount, error)
```
All join through `leases → units`, filtering `leases.status IN ('Pending', 'Active')`.

---

## Service

**New file:** `internal/services/announcement.go`

```go
type AnnouncementService interface {
    CreateAnnouncement(ctx context.Context, input CreateAnnouncementInput) (*models.Announcement, error)
    GetAnnouncement(ctx context.Context, id string) (*models.Announcement, error)
    ListAnnouncements(ctx context.Context, filter repository.ListAnnouncementsFilter) (*[]models.Announcement, error)
    CountAnnouncements(ctx context.Context, filter repository.ListAnnouncementsFilter) (int64, error)
    UpdateAnnouncement(ctx context.Context, input UpdateAnnouncementInput) (*models.Announcement, error)
    DeleteAnnouncement(ctx context.Context, id string) error
    PublishAnnouncement(ctx context.Context, id string) error
    ScheduleAnnouncement(ctx context.Context, input ScheduleAnnouncementInput) error
    MarkAsRead(ctx context.Context, announcementID, tenantAccountID string) error
}
```

**`PublishAnnouncement` logic:**
1. Set `Status = PUBLISHED`, `PublishedAt = now`, save
2. Resolve target tenant accounts:
   - `TargetUnitIDs` set → `tenantAccountRepo.GetByUnitIDs`
   - `PropertyBlockID` set → `tenantAccountRepo.GetByBlockID`
   - `PropertyID` set → `tenantAccountRepo.GetByPropertyID`
   - All nil → query all active leases for this client's properties
3. Fan out per tenant (fire-and-forget goroutines):
   - All priorities → `notificationService.SendToTenantAccount(ctx, id, title, body, data)`
   - `IMPORTANT` / `URGENT` → also `pkg.SendEmail`
   - `URGENT` / `EMERGENCY` → also `GatekeeperAPI.SendSMS`

Dependencies: `repo AnnouncementRepository`, `tenantAccountRepo repository.TenantAccountRepository`, `notificationService NotificationService`, `appCtx pkg.AppContext`.

---

## Handler

**New file:** `internal/handlers/announcement.go`

**PM endpoints:**
- `CreateAnnouncement` — POST, body: title, content, type, priority, property_id, property_block_id, target_unit_ids, scheduled_at, expires_at
- `ListAnnouncements` — GET with filter params
- `GetAnnouncementById` — GET
- `UpdateAnnouncement` — PATCH (only DRAFT allowed)
- `DeleteAnnouncement` — DELETE (only DRAFT allowed)
- `PublishAnnouncement` — POST `/{id}/publish`
- `ScheduleAnnouncement` — POST `/{id}/schedule` with `{ "scheduled_at": "..." }`

**Tenant endpoints:**
- `ListTenantAnnouncements` — GET, scoped to tenant's active lease property
- `GetTenantAnnouncement` — GET
- `MarkAnnouncementRead` — POST `/{id}/read`

---

## Router

**File:** `internal/router/client-user.go` — protected group:
```
POST   /v1/admin/announcements
GET    /v1/admin/announcements
GET    /v1/admin/announcements/{announcement_id}
PATCH  /v1/admin/announcements/{announcement_id}
DELETE /v1/admin/announcements/{announcement_id}
POST   /v1/admin/announcements/{announcement_id}/publish
POST   /v1/admin/announcements/{announcement_id}/schedule
```

**File:** `internal/router/tenant.go` — tenant-protected group:
```
GET  /v1/announcements
GET  /v1/announcements/{announcement_id}
POST /v1/announcements/{announcement_id}/read
```

---

## Cron Jobs

**New job** in `internal/jobs/announcements.go`:

```go
type AnnouncementJob struct {
    announcementRepo    repository.AnnouncementRepository
    announcementService services.AnnouncementService
}

func (j *AnnouncementJob) Run() {
    // 1. Publish scheduled announcements
    scheduled := j.announcementRepo.ListScheduledDue(ctx)
    for _, a := range scheduled { j.announcementService.PublishAnnouncement(ctx, a.ID.String()) }

    // 2. Expire published announcements past ExpiresAt
    expired := j.announcementRepo.ListExpiredDue(ctx)
    for _, a := range expired { /* set Status = EXPIRED, save */ }
}
```

Register in `RegisterJobs()` alongside `RentInvoiceJob` — same `"0 * * * *"` hourly schedule.

---

## Critical Files

| File | Change |
|---|---|
| `internal/models/announcement.go` | Replace stub with full model + `AnnouncementRead` |
| `init/migration/jobs/activate-announcements.go` | **New** — migration |
| `init/migration/main.go` | Uncomment AutoMigrate entries + register migration |
| `internal/repository/announcement.go` | **New** |
| `internal/repository/tenant-account.go` | Add `GetByPropertyID`, `GetByBlockID`, `GetByUnitIDs` |
| `internal/repository/main.go` | Register `AnnouncementRepository` |
| `internal/services/announcement.go` | **New** |
| `internal/services/main.go` | Register `AnnouncementService` |
| `internal/handlers/announcement.go` | **New** |
| `internal/handlers/main.go` | Register `AnnouncementHandler` |
| `internal/transformations/announcement.go` | **New** |
| `internal/router/client-user.go` | Add PM announcement routes |
| `internal/router/tenant.go` | Add tenant announcement routes |
| `internal/jobs/announcements.go` | **New** — scheduling + expiry cron job |
| `internal/jobs/invoice_generation.go` | Register `AnnouncementJob` in `RegisterJobs()` |
| `internal/lib/` (email constants) | Add announcement notification templates |
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 make update-db creates `announcements` and `announcement_reads` tables with all new columns
- [ ] #2 POST /v1/admin/announcements creates a DRAFT announcement
- [ ] #3 POST /v1/admin/announcements/{id}/publish sets status=PUBLISHED and sends push notifications to targeted tenants
- [ ] #4 IMPORTANT priority announcement also sends email on publish
- [ ] #5 URGENT/EMERGENCY also sends SMS on publish
- [ ] #6 Property-scoped announcement only notifies tenants with active leases in that property
- [ ] #7 Block-scoped announcement only notifies tenants in that block
- [ ] #8 Unit-targeted announcement only notifies tenants in those specific units
- [ ] #9 Tenant GET /v1/announcements returns announcements for their active lease property
- [ ] #10 POST /v1/announcements/{id}/read creates AnnouncementRead record (idempotent)
- [ ] #11 Scheduled announcement auto-publishes when cron runs after scheduled_at
- [ ] #12 PUBLISHED announcement with past expires_at transitions to EXPIRED on next cron run
- [ ] #13 Updating or deleting a PUBLISHED announcement returns an error
- [ ] #14 make lint passes
- [ ] #15 POST /v1/properties/{property_id}/announcements creates a DRAFT announcement pre-scoped to that property
- [ ] #16 GET /v1/properties/{property_id}/announcements returns only announcements for that property
- [ ] #17 Publishing via /v1/properties/{property_id}/announcements/{id}/publish only notifies tenants in that property
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Property-Nested Routes

Announcements are also accessible under `/v1/properties/{property_id}/announcements`, following the same nested-resource pattern as `/v1/properties/{id}/blocks` and `/v1/properties/{id}/units`.

These routes automatically scope the announcement to the given property — the `property_id` URL param is injected into the handler input, so the same handler methods work for both global and property-scoped endpoints.

Additional routes to register in `internal/router/client-user.go` under the existing `/v1/properties/{property_id}` route group:
```
POST   /v1/properties/{property_id}/announcements
GET    /v1/properties/{property_id}/announcements
GET    /v1/properties/{property_id}/announcements/{announcement_id}
PATCH  /v1/properties/{property_id}/announcements/{announcement_id}
DELETE /v1/properties/{property_id}/announcements/{announcement_id}
POST   /v1/properties/{property_id}/announcements/{announcement_id}/publish
POST   /v1/properties/{property_id}/announcements/{announcement_id}/schedule
```

The handler reads `chi.URLParam(r, "property_id")` when present and passes it as `PropertyID` in the service input. The list endpoint auto-filters by `PropertyID` when called via this route.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## What was done

Full Announcements module implementation across all layers:

**Model** (`internal/models/announcement.go`)
- `Announcement` with title, content, type, priority, status, scheduling fields, targeting fields (`PropertyID`, `PropertyBlockID`, `TargetUnitIDs pq.StringArray`), and `ClientID`/`CreatedByID`
- `AnnouncementRead` (idempotent read tracking per tenant account)

**Migration** — added both models to `updateMigration` AutoMigrate list

**Repository** (`internal/repository/announcement.go`)
- Full CRUD + `ListScheduledDue`, `ListExpiredDue`, `CreateRead`, `HasRead`
- `TenantAnnouncementFilter` with OR-based PostgreSQL scope using `@>` array containment and `cardinality()` to match directly targeted, block-targeted, property-targeted, and broadcast announcements

**Repository** (`internal/repository/tenant-account.go`)
- Added `GetByPropertyID`, `GetByBlockID`, `GetByUnitIDs`, `GetByClientID` for fan-out notification targeting

**Service** (`internal/services/announcement.go`)
- `Create`, `GetByIDWithPopulate`, `List`, `Count`, `Update`, `Delete`, `Publish`, `Schedule`, `MarkAsRead`, `PublishDueScheduled`, `ExpireDuePublished`
- `Publish` triggers async `fanOutNotifications` goroutine resolving target tenant accounts and sending push/email/SMS per priority channel (NORMAL=push, IMPORTANT=push+email, URGENT=push+email+SMS)

**Handlers** (`internal/handlers/announcement.go`)
- PM handlers: Create, Update, Delete, GetByID, List, Publish, Schedule
- Tenant handlers: `GET /v1/leases/{lease_id}/announcements`, `GET /v1/announcements/{announcement_id}`, `POST /v1/announcements/{announcement_id}/read`
- `resolveLeaseUnitContext` verifies lease ownership and fetches full unit targeting context (unit_id, block_id, property_id, client_id) in one query

**Router**
- Client user: global `/v1/admin/announcements` + property-scoped `/v1/properties/{property_id}/announcements`
- Tenant: lease-scoped list + individual get + mark read

**Cron job** (`internal/jobs/announcements.go`)
- `AnnouncementJob.Run()` — runs hourly, publishes due SCHEDULED announcements and expires due PUBLISHED announcements

**Email templates** (`internal/lib/email-templates.go`)
- `ANNOUNCEMENT_EMAIL_SUBJECT/BODY` and `ANNOUNCEMENT_SMS_BODY`

**Asynqmon web UI** (`internal/router/main.go`)
- Mounted at `/asynqmon` (non-production), registered outside the API middleware group to avoid CleanPath redirect loop
<!-- SECTION:FINAL_SUMMARY:END -->
