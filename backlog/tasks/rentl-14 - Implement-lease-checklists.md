---
id: RENTL-14
title: Implement lease checklists
status: Draft
assignee: []
created_date: '2026-03-05 09:01'
updated_date: '2026-03-08 07:39'
labels:
  - frontend
  - property-manager
  - leases
milestone: m-1
dependencies:
  - RENTL-7
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement checklist functionality for active leases — tracking key steps like move-in inspection, utility transfers, key handover, and other lease-related milestones.

we do have different types of checklist
- MOVE_IN
- MOVE_OUT
- INSPECTIONS

now for each type, we should have default checklist items, but also allow users to add custom items.
- MOVE_IN should get created automatically when a new lease is created.
- MOVE_OUT should get created automtically when you initiate a lease termination or lease is about to end.
- INSPECTIONS could be created by an admin anytime they go for an inspection.

CAVEATS:
- On the FE, we should make sure to check all items on move in before we can mark the lease as active.
- Same for move out, we should make sure to check all items before we can mark the lease as terminated.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 CHECK_IN checklist auto-created with 4 BINARY PENDING items when a tenant application is approved
- [ ] #2 Tenant Leases tab shows list of leases with status badges and Checklists button per lease
- [ ] #3 Checklists Sheet opens per lease showing all checklists with items
- [ ] #4 BINARY items toggle between PENDING and DONE via button
- [ ] #5 CONDITION items can be set to FUNCTIONAL, DAMAGED, or MISSING via inline buttons
- [ ] #6 Activate Lease button is disabled until all CHECK_IN items are non-PENDING
- [ ] #7 ROUTINE inspection checklist can be created via New Inspection button with 4 CONDITION items
- [ ] #8 All changes pass yarn types:check and make lint-fix
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# Implementation Plan

## Context

Active leases need checklist tracking for move-in, move-out, and routine inspections. The backend has checklist CRUD at `/v1/admin/leases/{lease_id}/checklists` but lacks: PENDING item status, item type field (BINARY vs CONDITION), and an individual item update endpoint. The frontend `TenantLeasesModule` is completely empty.

**Decisions:** Checklist UI in existing tenant leases tab (RENTL-7 separate). BINARY items → PENDING/DONE. CONDITION items → PENDING/FUNCTIONAL/DAMAGED/MISSING. CHECK_IN auto-created server-side on lease approval. Termination gate skipped (no `/status:terminated`). Activation gate: all CHECK_IN items non-PENDING before activating.

---

## Part A — Backend (services/main)

### 1. Model
**`services/main/internal/models/lease-checklist.go`**
Add `Type string` field to `LeaseChecklistItem` (values: `BINARY`, `CONDITION`). Status comment: `PENDING, DONE, FUNCTIONAL, DAMAGED, MISSING`. GORM AutoMigrate adds the column automatically.

### 2. Repository
**`services/main/internal/repository/lease-checklist-item.go`**

Add to interface and implement:
```go
Update(ctx context.Context, item *models.LeaseChecklistItem) error
GetOne(ctx context.Context, id string, checklistID string) (*models.LeaseChecklistItem, error)
```
`Update` uses `db.Save()`. `GetOne` queries `WHERE id = ? AND lease_checklist_id = ? AND deleted_at IS NULL`.

### 3. Service — LeaseChecklistItem
**`services/main/internal/services/lease-checklist-item.go`**

Add to interface: `UpdateLeaseChecklistItem(ctx, input UpdateLeaseChecklistItemInput) (*models.LeaseChecklistItem, error)`

Add to `CreateLeaseChecklistItemInput`: `Type string`

```go
type UpdateLeaseChecklistItemInput struct {
	ItemID      string
	ChecklistID string
	Status      string
}
func (s *leaseChecklistItemService) UpdateLeaseChecklistItem(ctx context.Context, input UpdateLeaseChecklistItemInput) (*models.LeaseChecklistItem, error) {
	item, err := s.repo.GetOne(ctx, input.ItemID, input.ChecklistID)
	if err != nil {
		return nil, pkg.NotFoundError("LeaseChecklistItemNotFound", &pkg.RentLoopErrorParams{Err: err})
	}
	item.Status = input.Status
	if updateErr := s.repo.Update(ctx, item); updateErr != nil {
		return nil, pkg.InternalServerError(updateErr.Error(), &pkg.RentLoopErrorParams{Err: updateErr, Metadata: map[string]string{"function": "UpdateLeaseChecklistItem", "action": "updating checklist item"}})
	}
	return item, nil
}
```

### 4. Service — LeaseChecklist
**`services/main/internal/services/lease-checklist.go`**

In `CreateLeaseChecklist` items loop, add `Type: item.Type` when building model items.

### 5. Handler
**`services/main/internal/handlers/lease-checklist.go`**

Update handler struct to hold `itemService services.LeaseChecklistItemService`. Update constructor `NewLeaseChecklistHandler` to accept and store it.

Add `Type string` with `validate:"required,oneof=BINARY CONDITION"` to `CreateLeaseChecklistItemRequest`.

Add new request struct:
```go
type UpdateLeaseChecklistItemRequest struct {
	Status string `json:"status" validate:"required,oneof=PENDING DONE FUNCTIONAL DAMAGED MISSING"`
}
```

Add `UpdateLeaseChecklistItem` handler method: parse `checklist_id` and `item_id` from URL, decode + validate body, call `h.itemService.UpdateLeaseChecklistItem`, return result via `transformations.DBLeaseChecklistItemToRest`.

Also update `CreateLeaseChecklist` to pass `Type: item.Type` into `services.CreateLeaseChecklistItemInput`.

### 6. Transformation
**`services/main/internal/transformations/lease-checklist-item.go`**

Add `Type string json:"type"` to `OutputLeaseChecklistItem`. Add `"type": i.Type` to the map in `DBLeaseChecklistItemToRest`.

### 7. Router
**`services/main/internal/router/client-user.go`**

Inside existing `/{checklist_id}` route block, add:
```go
r.Route("/items/{item_id}", func(r chi.Router) {
	r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
		Patch("/", handlers.LeaseChecklistHandler.UpdateLeaseChecklistItem)
})
```

Update `NewLeaseChecklistHandler` call to pass `leaseChecklistItemService` as second arg.

### 8. Auto-Create CHECK_IN on Approval
**`services/main/internal/services/tenant-application.go`**

Add `leaseChecklistService LeaseChecklistService` to `tenantApplicationService` struct and `TenantApplicationServiceDeps`. Wire it in `NewTenantApplicationService`.

In `ApproveTenantApplication`, capture the lease return value (currently discarded with `_`) and after the existing error check, call `CreateLeaseChecklist` inside the transaction with default BINARY PENDING items:
```go
lease, createLeaseErr := s.leaseService.CreateLease(transCtx, leaseInput)
// ... existing error check ...

_, createChecklistErr := s.leaseChecklistService.CreateLeaseChecklist(transCtx, CreateLeaseChecklistInput{
	LeaseId:     lease.ID.String(),
	Type:        "CHECK_IN",
	CreatedById: input.ClientUserID,
	ChecklistItems: []CreateLeaseChecklistItemInput{
		{Description: "Keys Handed Over", Type: "BINARY", Status: "PENDING"},
		{Description: "Meter Reading Recorded", Type: "BINARY", Status: "PENDING"},
		{Description: "Property Walkthrough Done", Type: "BINARY", Status: "PENDING"},
		{Description: "Utilities Transferred", Type: "BINARY", Status: "PENDING"},
	},
})
if createChecklistErr != nil {
	transaction.Rollback()
	return createChecklistErr
}
```

**`cmd/rentloop-engine/main.go`** — Pass `leaseChecklistService` to `TenantApplicationServiceDeps`.

---

## Part B — Frontend (apps/property-manager)

### 1. TypeScript Types
**`apps/property-manager/types/lease-checklist.d.ts`** (new file)
```ts
type LeaseChecklistItemType = 'BINARY' | 'CONDITION'
type LeaseChecklistItemStatus = 'PENDING' | 'DONE' | 'FUNCTIONAL' | 'DAMAGED' | 'MISSING'
type LeaseChecklistType = 'CHECK_IN' | 'CHECK_OUT' | 'ROUTINE'

interface LeaseChecklistItem {
	id: string; description: string; type: LeaseChecklistItemType
	status: LeaseChecklistItemStatus; created_at: Date; updated_at: Date
}
interface LeaseChecklist {
	id: string; lease_id: string; type: LeaseChecklistType
	items: LeaseChecklistItem[]; created_by_id: string
	created_by: Nullable<ClientUser>; created_at: Date; updated_at: Date
}
```

### 2. API Layer
**`apps/property-manager/app/api/lease-checklists/index.ts`** (new file)

Four hooks using `useAuth()` for `authToken` and `useQueryClient()` for invalidation:

- `useGetLeaseChecklists(leaseId)` — GET with `?populate[]=Items`, queryKey `['lease-checklists', leaseId]`
- `useCreateLeaseChecklist(leaseId)` — POST checklist with items array
- `useUpdateLeaseChecklistItem(leaseId, checklistId)` — PATCH `/{checklistId}/items/{itemId}` with `{ status }`
- `useActivateLease(leaseId)` — PATCH `/leases/{leaseId}/status:active`, invalidates `['tenant-leases']`

### 3. Leases Route — Add Loader
**`apps/property-manager/app/routes/_auth.properties.$propertyId.tenants.all.$tenantId.leases.tsx`**

Add `loader` that fetches `/api/v1/admin/tenants/${params.tenantId}/leases?populate[]=Unit` and returns `{ leases: Lease[] }`. Keep existing `handle` and default export.

### 4. TenantLeasesModule
**`apps/property-manager/app/modules/properties/property/tenants/all/tenant/leases/index.tsx`**

Full implementation with:
- **Lease list cards**: unit name, status badge (`LEASE_STATUS_COLORS` map), move-in date, Checklists button, Activate Lease button (when Pending)
- **ChecklistSheet (in Shadcn `Sheet`)**: renders all checklists per lease, "New Inspection" button creates ROUTINE checklist with 4 CONDITION items
- **ChecklistCard**: shows type label, completion icon (CheckCircle when all resolved), list of items
- **ChecklistItemRow (BINARY)**: "Mark Done" / "Done" toggle button
- **ChecklistItemRow (CONDITION)**: three inline buttons for FUNCTIONAL / DAMAGED / MISSING (highlighted when active)
- **ActivateLeaseButton**: reads CHECK_IN checklist from `useGetLeaseChecklists`, disabled if `!checkInChecklist || items.some(i => i.status === 'PENDING')`, calls `useActivateLease`

Default CHECK_IN items (auto-created on backend): Keys Handed Over, Meter Reading Recorded, Property Walkthrough Done, Utilities Transferred — all BINARY PENDING.

Default ROUTINE items (created via "New Inspection"): General Property Condition, Plumbing Check, Electrical Check, Pest Inspection — all CONDITION PENDING.

---

## Files Modified

### Backend
| File | Change |
|---|---|
| `models/lease-checklist.go` | Add `Type` to `LeaseChecklistItem` |
| `repository/lease-checklist-item.go` | Add `Update`, `GetOne` |
| `services/lease-checklist-item.go` | Add `Type` to create input; add `UpdateLeaseChecklistItem` |
| `services/lease-checklist.go` | Pass `Type` in items loop |
| `handlers/lease-checklist.go` | Add `Type` to item request; inject `itemService`; add handler |
| `transformations/lease-checklist-item.go` | Add `type` field |
| `router/client-user.go` | Add `PATCH /{checklist_id}/items/{item_id}` |
| `services/tenant-application.go` | Inject checklist service; auto-create CHECK_IN |
| `cmd/rentloop-engine/main.go` | Wire `leaseChecklistService` into deps |

### Frontend
| File | Change |
|---|---|
| `types/lease-checklist.d.ts` | **New**: type aliases and interfaces |
| `app/api/lease-checklists/index.ts` | **New**: 4 TanStack Query hooks |
| `routes/...leases.tsx` | Add loader |
| `modules/.../leases/index.tsx` | Full implementation replacing placeholder |

## Verification

1. Approve tenant application → CHECK_IN checklist auto-created with 4 BINARY PENDING items
2. Tenant → Leases tab → shows lease list with Checklists button
3. Open Checklists Sheet → CHECK_IN appears with PENDING items
4. Click "Mark Done" on BINARY item → toggles to DONE
5. Activate Lease disabled while any CHECK_IN item is PENDING; enabled after all resolved
6. Activate → lease status badge changes to Active
7. "New Inspection" creates ROUTINE checklist with 4 CONDITION items
8. Click FUNCTIONAL/DAMAGED/MISSING → status updates with highlight
9. `make lint-fix` in services/main; `yarn types:check` in apps/property-manager
<!-- SECTION:PLAN:END -->
