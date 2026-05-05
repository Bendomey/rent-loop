---
id: RENTL-3
title: Introduce a new status for the unit to handle availablity use case
status: Done
assignee:
  - Ben
created_date: '2026-03-04 18:23'
updated_date: '2026-03-09 09:18'
labels:
  - property-manager-portal
milestone: m-0
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When a unit has more than 1 occupants allowed, once there is at least one active lease, unit should not be allowed to be updated like the occupied state.

**New status:** `Unit.Status.PartiallyOccupied`
- Triggered when: `1 ≤ occupyingLeases < MaxOccupantsAllowed` (and `MaxOccupantsAllowed > 1`)
- Blocks: unit editing, manual status changes
- Allows: new lease applications (still has open slots)
- Tenant-facing API: maps to `Available` (space still exists)

No DB migration needed — status is a plain string column, not a PostgreSQL enum.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Unit with MaxOccupantsAllowed=1 transitions directly Available → Occupied when first lease is approved (no change to existing behaviour)
- [ ] #2 Unit with MaxOccupantsAllowed>1 transitions to PartiallyOccupied when first lease is approved (occupyingLeases >= 1 but < MaxOccupantsAllowed)
- [ ] #3 Unit with MaxOccupantsAllowed>1 transitions to Occupied when all slots are filled (occupyingLeases >= MaxOccupantsAllowed)
- [ ] #4 New lease applications can be created for PartiallyOccupied units (same as Available)
- [ ] #5 Approving a lease application is allowed for PartiallyOccupied units (same as Available)
- [ ] #6 Manual unit field edits (PATCH /units/{id}) are blocked for PartiallyOccupied units (403)
- [ ] #7 Manual status changes (draft/maintenance/available endpoints) are blocked for PartiallyOccupied units (403 UnitIsOccupied)
- [ ] #8 Tenant-facing REST API returns status Available for PartiallyOccupied units
- [ ] #9 Frontend badge shows orange colour and 'Partially Occupied' label for PartiallyOccupied units
- [ ] #10 Status change dropdown is hidden in the portal for PartiallyOccupied units (same as Occupied)
- [ ] #11 yarn types:check passes with no TypeScript errors
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# Implementation Plan

## New Status: `Unit.Status.PartiallyOccupied`

## Backend

### 1. `services/main/internal/services/unit.go`
- Add `SetSystemUnitStatus(ctx context.Context, input UpdateUnitStatusInput) error` to the `UnitService` interface and implement it — same as `UpdateUnitStatus` but WITHOUT the locked-status guard. Used only for internal/system-triggered transitions.
- Modify `UpdateUnitStatus` guard (line 324) to also block `PartiallyOccupied`:
  ```go
  if unit.Status == "Unit.Status.Occupied" || unit.Status == "Unit.Status.PartiallyOccupied" {
  ```

### 2. `services/main/internal/services/tenant-application.go`
- `CreateTenantApplication()` line 124: allow PartiallyOccupied units:
  ```go
  if unit.Status != "Unit.Status.Available" && unit.Status != "Unit.Status.PartiallyOccupied" {
  ```
- `ApproveTenantApplication()` line 731: same change.
- Auto-status block (lines 843–861): rework to:
  ```go
  var newUnitStatus string
  if occupyingLeases >= int64(unit.MaxOccupantsAllowed) {
      newUnitStatus = "Unit.Status.Occupied"
  } else if occupyingLeases >= 1 && unit.MaxOccupantsAllowed > 1 {
      newUnitStatus = "Unit.Status.PartiallyOccupied"
  }
  if newUnitStatus != "" && unit.Status != newUnitStatus {
      // use SetSystemUnitStatus (not UpdateUnitStatus) to allow PartiallyOccupied → Occupied
      s.unitService.SetSystemUnitStatus(transCtx, UpdateUnitStatusInput{...})
  }
  ```

### 3. `services/main/internal/transformations/unit.go`
- `DBUnitToRest()`: map PartiallyOccupied → Available for tenant-facing API:
  ```go
  if i.Status == "Unit.Status.Available" || i.Status == "Unit.Status.PartiallyOccupied" {
      status = "Unit.Status.Available"
  }
  ```

## Frontend

### 4. `apps/property-manager/types/property-unit.d.ts`
- Add `'Unit.Status.PartiallyOccupied'` to the status union type.

### 5. `apps/property-manager/app/lib/properties.utils.ts`
- Add case in `getPropertyUnitStatusLabel()`:
  ```ts
  case 'Unit.Status.PartiallyOccupied': return 'Partially Occupied'
  ```

### 6. `apps/property-manager/app/modules/properties/property/assets/units/index.tsx`
- Add orange badge (`bg-orange-500 text-white`) for PartiallyOccupied.
- Use `getPropertyUnitStatusLabel(data.status)` instead of inline ternary chain.

### 7. `apps/property-manager/app/modules/properties/property/assets/units/unit/index.tsx`
- `getStatusBadgeClass()`: add `'Unit.Status.PartiallyOccupied'` → `'bg-orange-500 text-white'`
- `isOccupied`: extend to include PartiallyOccupied:
  ```ts
  const isOccupied = unit.status === 'Unit.Status.Occupied' || unit.status === 'Unit.Status.PartiallyOccupied'
  ```
  (`isEditable` already blocks PartiallyOccupied implicitly — no change needed.)

## Verification
1. Unit with MaxOccupantsAllowed=3, approve 1st application → PartiallyOccupied
2. Attempt PATCH unit fields → 403
3. Attempt manual status change → 403 UnitIsOccupied
4. Approve 2nd application → still PartiallyOccupied
5. Approve 3rd application → Occupied
6. Frontend: orange badge, "Partially Occupied" label, no status dropdown
7. `yarn types:check` passes
<!-- SECTION:PLAN:END -->
