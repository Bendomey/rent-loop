---
id: RENTL-14
title: Lease Checklist MVP — Move-In / Move-Out Condition Reports
status: Done
assignee: []
created_date: '2026-03-05 09:01'
updated_date: '2026-03-18 12:05'
labels:
  - backend
  - mobile
  - property-manager
  - leases
milestone: m-1
dependencies:
  - RENTL-7
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Enhance the existing lease checklist feature into a full condition tracking system for move-in/move-out. This is not just a checklist — it's evidence, accountability, and dispute resolution infrastructure between landlord and tenant.

## What This Adds

1. **Richer items** — notes + photos + expanded statuses (NEEDS_REPAIR, NOT_PRESENT)
2. **Checklist workflow** — DRAFT → SUBMITTED → ACKNOWLEDGED/DISPUTED status lifecycle with round tracking
3. **Tenant involvement** — tenants can view submitted checklists and acknowledge/dispute them
4. **CHECK_OUT auto-population** — creating a CHECK_OUT checklist pre-fills items from the CHECK_IN checklist
5. **Comparison** — endpoint to view CHECK_IN vs CHECK_OUT side-by-side
6. **Individual item CRUD** — add/edit/remove items on DRAFT/DISPUTED checklists
7. **System default templates** — seeded checklist templates by unit type (APARTMENT, HOUSE, STUDIO, OFFICE, RETAIL), auto-populate items when creating a CHECK_IN checklist
8. **Push notifications** — tenant receives push notification when PM submits a checklist for review

**Not in MVP:** custom template UI, PDF export, routine inspections, AI.

## Checklist Status Lifecycle

```
DRAFT  ──(PM submits)──►  SUBMITTED  ──(Tenant acknowledges)──►  ACKNOWLEDGED (terminal)
                               ▲      └──(Tenant disputes)────►  DISPUTED
                               │                                      │
                               └──────(PM edits + re-submits, Round++)─┘
```

- DRAFT and DISPUTED allow item edits + checklist updates + deletion
- Only SUBMITTED allows tenant acknowledge/dispute
- ACKNOWLEDGED is terminal — no further edits
- Each round is preserved: acknowledgment records store the round they belong to
- Round starts at 1, increments each time PM re-submits from DISPUTED
- Tenants only see SUBMITTED/ACKNOWLEDGED/DISPUTED checklists
- Full dispute/resolution history is queryable via ListByChecklist

## Round History / Timeline

Each dispute/acknowledge cycle is preserved as a separate acknowledgment record keyed by (checklist_id, tenant_account_id, round). Timeline per acknowledgment record:
- submitted_at — when PM submitted this round
- created_at — when tenant responded
- action — ACKNOWLEDGED or DISPUTED
- comment — tenant's dispute reason (if disputed)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 make update-db creates new columns + lease_checklist_acknowledgments + checklist_templates + checklist_template_items tables, templates seeded for all 5 unit types
- [ ] #2 Create CHECK_IN checklist with no items for an APARTMENT unit auto-populates from seeded template
- [ ] #3 Create CHECK_IN checklist with explicit items uses provided items, ignores template
- [ ] #4 Create CHECK_IN checklist with items (including notes + photos) defaults to DRAFT status, round = 1
- [ ] #5 Submit checklist sets status = SUBMITTED, submitted_at, tenant receives push notification
- [ ] #6 Tenant lists checklists — only sees SUBMITTED/ACKNOWLEDGED/DISPUTED (not DRAFT)
- [ ] #7 Tenant acknowledges — status = ACKNOWLEDGED, acknowledgment record created with round = 1
- [ ] #8 Tenant disputes with comment — status = DISPUTED, acknowledgment record created with round = 1
- [ ] #9 PM edits items on DISPUTED checklist — allowed
- [ ] #10 PM re-submits from DISPUTED — status = SUBMITTED, round = 2, submitted_at updated
- [ ] #11 Tenant acknowledges round 2 — new acknowledgment record with round = 2, checklist shows both rounds history
- [ ] #12 Attempt to edit SUBMITTED or ACKNOWLEDGED checklist returns 400 error
- [ ] #13 Create CHECK_OUT checklist auto-populates items from CHECK_IN, sets check_in_checklist_id
- [ ] #14 GET comparison endpoint returns both CHECK_IN and CHECK_OUT checklists with items
- [ ] #15 Individual item CRUD on DRAFT/DISPUTED works; fails on SUBMITTED/ACKNOWLEDGED
- [ ] #16 GET /api/v1/admin/checklist-templates returns all seeded templates with items
- [ ] #17 go build ./... and make lint-fix pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Critical Files

| File | Change |
|------|--------|
| `internal/models/lease-checklist.go` | Add Status, Round, CheckInChecklistId, SubmittedAt, Acknowledgments to checklist; Notes, Photos to item; new Acknowledgment model |
| `internal/models/checklist-template.go` | **New** — ChecklistTemplate + ChecklistTemplateItem models |
| `init/migration/jobs/enhance-lease-checklist.go` | **New** — migration for new columns + acknowledgments table |
| `init/migration/jobs/seed-checklist-templates.go` | **New** — seed default templates by unit type (gormigrate migration) |
| `init/migration/main.go` | Register migration + AutoMigrate acknowledgment, template models |
| `internal/repository/lease-checklist.go` | Add GetCheckInChecklist method |
| `internal/repository/lease-checklist-item.go` | Add GetOne, Update, Delete methods |
| `internal/repository/lease-checklist-acknowledgment.go` | **New** — Create, GetByChecklistTenantAndRound, ListByChecklist |
| `internal/repository/checklist-template.go` | **New** — GetByUnitType, GetByID, List |
| `internal/repository/main.go` | Register acknowledgment + template repos |
| `internal/services/lease-checklist-item.go` | Add CreateItem, UpdateItem, DeleteItem (with DRAFT/DISPUTED guard) |
| `internal/services/lease-checklist.go` | Add Submit, Acknowledge, GetComparison; enhance Create for template + CHECK_OUT auto-population; DRAFT/DISPUTED guards on Update/Delete |
| `internal/services/main.go` | Wire acknowledgment repo, template repo, lease repo, NotificationService into checklist service deps |
| `internal/handlers/lease-checklist.go` | Update request structs; add Submit, Comparison, item CRUD, tenant-facing handlers |
| `internal/handlers/checklist-template.go` | **New** — ListTemplates, GetTemplate (read-only) |
| `internal/transformations/lease-checklist.go` | Add status, round, check_in_checklist_id, submitted_at, acknowledgments |
| `internal/transformations/lease-checklist-item.go` | Add notes, photos |
| `internal/transformations/lease-checklist-acknowledgment.go` | **New** |
| `internal/transformations/checklist-template.go` | **New** — template + item DTOs |
| `internal/router/client-user.go` | Add submit, comparison, item CRUD, template routes |
| `internal/router/tenant.go` | Add tenant checklist routes (list, get, acknowledge) |

## Step 1 — Checklist template models + seed data

**New file:** `internal/models/checklist-template.go`

```go
type ChecklistTemplate struct {
    BaseModelSoftDelete
    UnitType string                  `gorm:"not null;index" json:"unit_type"` // APARTMENT, HOUSE, STUDIO, OFFICE, RETAIL
    Name     string                  `gorm:"not null" json:"name"`
    Items    []ChecklistTemplateItem `json:"items"`
}

type ChecklistTemplateItem struct {
    BaseModelSoftDelete
    ChecklistTemplateId string            `gorm:"not null;index" json:"checklist_template_id"`
    ChecklistTemplate   ChecklistTemplate
    Category            string            `gorm:"not null" json:"category"`
    Description         string            `gorm:"not null" json:"description"`
}
```

**New file:** `init/migration/jobs/seed-checklist-templates.go`

ID: "202603180002_SEED_CHECKLIST_TEMPLATES"

**APARTMENT** — "Default Apartment Checklist"
| Category | Items |
|----------|-------|
| Living Room | Walls, Ceiling, Flooring, Windows, Doors, Light fixtures, Electrical outlets, AC/Fan |
| Kitchen | Walls, Ceiling, Flooring, Countertops, Sink & faucet, Cabinets, Stove/Oven, Refrigerator |
| Bathroom | Walls, Ceiling, Flooring, Toilet, Sink & faucet, Shower/Tub, Mirror, Towel racks |
| Bedroom | Walls, Ceiling, Flooring, Windows, Doors, Closet/Wardrobe, Light fixtures |
| General | Front door & locks, Balcony/Patio, Smoke detectors, Water heater, Plumbing |

**HOUSE** — "Default House Checklist"
| Category | Items |
|----------|-------|
| Living Room | Walls, Ceiling, Flooring, Windows, Doors, Light fixtures, Electrical outlets, AC/Fan |
| Kitchen | Walls, Ceiling, Flooring, Countertops, Sink & faucet, Cabinets, Stove/Oven, Refrigerator |
| Bathroom | Walls, Ceiling, Flooring, Toilet, Sink & faucet, Shower/Tub, Mirror, Towel racks |
| Bedroom | Walls, Ceiling, Flooring, Windows, Doors, Closet/Wardrobe, Light fixtures |
| General | Front door & locks, Smoke detectors, Water heater, Plumbing |
| Exterior | Roof, Gutters, Garage, Driveway, Yard/Garden, Fencing, Exterior paint |

**STUDIO** — "Default Studio Checklist"
| Category | Items |
|----------|-------|
| Main Room | Walls, Ceiling, Flooring, Windows, Doors, Light fixtures, Electrical outlets, AC/Fan |
| Kitchen | Walls, Ceiling, Flooring, Countertops, Sink & faucet, Cabinets, Stove/Oven, Refrigerator |
| Bathroom | Walls, Ceiling, Flooring, Toilet, Sink & faucet, Shower/Tub, Mirror |
| General | Front door & locks, Smoke detectors, Water heater, Plumbing |

**OFFICE** — "Default Office Checklist"
| Category | Items |
|----------|-------|
| Main Area | Walls, Ceiling, Flooring, Windows, Doors, Light fixtures, Electrical outlets, AC |
| Restroom | Walls, Flooring, Toilet, Sink |
| General | Front door & locks, Fire extinguisher, Smoke detectors, Plumbing, Internet/Network ports |

**RETAIL** — "Default Retail Checklist"
| Category | Items |
|----------|-------|
| Sales Floor | Walls, Ceiling, Flooring, Windows, Doors, Display fixtures, Light fixtures, AC |
| Storage | Walls, Flooring, Shelving, Doors & locks |
| Restroom | Walls, Flooring, Toilet, Sink |
| General | Front door & locks, Security system, Fire extinguisher, Smoke detectors, Plumbing |

Read-only API endpoints for PMs to browse templates when creating a checklist.

## Step 2 — Lease checklist model changes

**File:** `internal/models/lease-checklist.go`

**LeaseChecklist** — add fields:
- Status string (not null, default DRAFT) — DRAFT, SUBMITTED, ACKNOWLEDGED, DISPUTED
- CheckInChecklistId *string (index) — FK to CHECK_IN checklist for CHECK_OUT comparison
- SubmittedAt *time.Time
- Round int (not null, default 1) — increments on each re-submit after dispute
- Acknowledgments []LeaseChecklistAcknowledgment — has-many relationship

**LeaseChecklistItem** — add fields:
- Notes *string
- Photos pq.StringArray (type text[])

**New model — LeaseChecklistAcknowledgment:**
- LeaseChecklistId string (not null, uniqueIndex:idx_ack_checklist_tenant_round)
- TenantAccountId string (not null, uniqueIndex:idx_ack_checklist_tenant_round)
- Round int (not null, uniqueIndex:idx_ack_checklist_tenant_round)
- SubmittedAt time.Time (not null) — when PM submitted this round
- Action string (not null) — ACKNOWLEDGED or DISPUTED
- Comment *string

## Step 3 — Migration

**New file:** `init/migration/jobs/enhance-lease-checklist.go`

ID: "202603180001_ENHANCE_LEASE_CHECKLIST"
- ALTER TABLE lease_checklists ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
- ALTER TABLE lease_checklists ADD COLUMN check_in_checklist_id UUID REFERENCES lease_checklists(id)
- ALTER TABLE lease_checklists ADD COLUMN submitted_at TIMESTAMPTZ
- ALTER TABLE lease_checklists ADD COLUMN round INTEGER NOT NULL DEFAULT 1
- ALTER TABLE lease_checklist_items ADD COLUMN notes TEXT
- ALTER TABLE lease_checklist_items ADD COLUMN photos TEXT[]

Register in init/migration/main.go. Add LeaseChecklistAcknowledgment, ChecklistTemplate, ChecklistTemplateItem to AutoMigrate. Add SeedChecklistTemplates() after the enhance migration.

## Step 4 — Repository: template + acknowledgment + checklist enhancements

**New file:** `internal/repository/checklist-template.go`
- GetByUnitType(ctx, unitType) — WHERE unit_type = ?, Preload("Items"), first match
- GetByID(ctx, id) — WHERE id = ?, Preload("Items")
- List(ctx) — all templates with items preloaded

**New file:** `internal/repository/lease-checklist-acknowledgment.go`
- Create(ctx, ack)
- GetByChecklistTenantAndRound(ctx, checklistID, tenantAccountID, round) — checks if tenant already responded in current round
- ListByChecklist(ctx, checklistID) — full history across all rounds (ordered by round ASC)

**File:** `internal/repository/lease-checklist.go` — add:
- GetCheckInChecklist(ctx, leaseID) — WHERE lease_id = ? AND type = 'CHECK_IN', Preload("Items"), limit 1

**File:** `internal/repository/lease-checklist-item.go` — add:
- GetOne(ctx, id, checklistID)
- Update(ctx, item)
- Delete(ctx, id, checklistID)

## Step 5 — Service: item CRUD

**File:** `internal/services/lease-checklist-item.go`

Expand CreateLeaseChecklistItemInput to include Notes *string and Photos []string.

Add to interface:
- CreateLeaseChecklistItem(ctx, input) — single item creation
- UpdateLeaseChecklistItem(ctx, input) — partial update (description, status, notes, photos)
- DeleteLeaseChecklistItem(ctx, checklistID, itemID)

All item mutations enforce **editable guard**: parent checklist Status must be DRAFT or DISPUTED. Add checklistRepo to leaseChecklistItemService deps.

## Step 6 — Service: checklist enhancements

**File:** `internal/services/lease-checklist.go`

Add deps: AcknowledgmentRepo, TemplateRepo, LeaseRepo, NotificationService

New methods:

**SubmitLeaseChecklist(ctx, leaseID, checklistID):**
1. Fetch checklist with lease + tenant preloaded, verify Status == DRAFT or DISPUTED
2. If Type == CHECK_OUT and CheckInChecklistId is nil, auto-find CHECK_IN checklist and set FK
3. If status was DISPUTED, increment Round
4. Set Status = SUBMITTED, SubmittedAt = now()
5. Save
6. Send push notification to tenant (fire-and-forget): "Checklist submitted for review"

**AcknowledgeLeaseChecklist(ctx, input):**
1. Fetch checklist, verify Status == SUBMITTED
2. Check no existing acknowledgment for this checklist+tenant+round
3. Create acknowledgment record with current Round, SubmittedAt = checklist.SubmittedAt
4. Update checklist Status to ACKNOWLEDGED or DISPUTED
5. Transaction

**GetChecklistComparison(ctx, leaseID, checkoutChecklistID):**
1. Fetch CHECK_OUT checklist with items
2. Find CHECK_IN checklist (via CheckInChecklistId FK or by lease lookup)
3. Return both

**CreateLeaseChecklist enhancement:**
- Accept optional template_id in request (checklist_items changes from required to omitempty)
- If TemplateId is provided: fetch that template and populate items from it
- Else if ChecklistItems is empty and Type == CHECK_IN: auto-lookup template by unit type (Lease.Unit.Type)
- Else: use the provided ChecklistItems
- Items from templates use format: "Category - Description" (e.g. "Living Room - Walls"), status defaults to FUNCTIONAL
- When Type == CHECK_OUT: auto-lookup CHECK_IN checklist, set CheckInChecklistId, pre-populate items from CHECK_IN

**UpdateLeaseChecklist / DeleteLeaseChecklist:**
- Add editable guard: return error if Status is not DRAFT or DISPUTED

## Step 7 — Transformations

**File:** `internal/transformations/lease-checklist.go` — add: status, round, check_in_checklist_id, submitted_at, acknowledgments

**File:** `internal/transformations/lease-checklist-item.go` — add: notes, photos

**New file:** `internal/transformations/lease-checklist-acknowledgment.go`
Fields: id, tenant_account_id, round, submitted_at, action, comment, created_at

## Step 8 — Template endpoints (read-only)

**New file:** `internal/transformations/checklist-template.go`
Fields: id, unit_type, name, items (array of {id, category, description}), created_at

**New file:** `internal/handlers/checklist-template.go`
- ListTemplates — GET /api/v1/admin/checklist-templates — ClientUser any
- GetTemplate — GET /api/v1/admin/checklist-templates/{template_id} — ClientUser any

Register ChecklistTemplateHandler in handlers/main.go. Add routes in router/client-user.go.

## Step 9 — Handlers: update existing + add new

**File:** `internal/handlers/lease-checklist.go`

Update CreateLeaseChecklistItemRequest: status validates oneof=FUNCTIONAL DAMAGED MISSING NEEDS_REPAIR NOT_PRESENT, add notes and photos fields.

New handler methods:
| Method | Route | Auth | Body |
|--------|-------|------|------|
| SubmitLeaseChecklist | POST .../checklists/{checklist_id}/submit | ClientUser ADMIN/OWNER | none |
| GetChecklistComparison | GET .../checklists/{checklist_id}/comparison | ClientUser any | none |
| CreateLeaseChecklistItem | POST .../checklists/{checklist_id}/items | ClientUser ADMIN/OWNER | {description, status, notes?, photos?} |
| UpdateLeaseChecklistItem | PATCH .../checklists/{checklist_id}/items/{item_id} | ClientUser ADMIN/OWNER | {description?, status?, notes?, photos?} |
| DeleteLeaseChecklistItem | DELETE .../checklists/{checklist_id}/items/{item_id} | ClientUser ADMIN/OWNER | none |
| TenantListLeaseChecklists | GET /v1/leases/{lease_id}/checklists | TenantAccount | none |
| TenantGetLeaseChecklist | GET /v1/leases/{lease_id}/checklists/{checklist_id} | TenantAccount | none |
| TenantAcknowledgeChecklist | POST /v1/leases/{lease_id}/checklists/{checklist_id}/acknowledge | TenantAccount | {action, comment?} |

Tenant list filters to Status IN (SUBMITTED, ACKNOWLEDGED, DISPUTED) — no DRAFT visible.
Tenant get verifies tenant owns the lease and checklist is not DRAFT.

## Step 10 — Routes

**File:** `internal/router/client-user.go` — add under existing /{checklist_id} group:
- POST /submit (ADMIN/OWNER)
- GET /comparison (any)
- POST /items (ADMIN/OWNER)
- PATCH /items/{item_id} (ADMIN/OWNER)
- DELETE /items/{item_id} (ADMIN/OWNER)

**File:** `internal/router/tenant.go` — add in protected group:
- GET /v1/leases/{lease_id}/checklists
- GET /v1/leases/{lease_id}/checklists/{checklist_id}
- POST /v1/leases/{lease_id}/checklists/{checklist_id}/acknowledge

## Step 11 — Wire-up

**File:** `internal/repository/main.go` — add LeaseChecklistAcknowledgmentRepository, ChecklistTemplateRepository fields + instantiation.

**File:** `internal/services/main.go` — pass AcknowledgmentRepo, TemplateRepo, LeaseRepo, NotificationService to LeaseChecklistServiceDeps. Pass checklistRepo to LeaseChecklistItemService deps.
<!-- SECTION:PLAN:END -->
