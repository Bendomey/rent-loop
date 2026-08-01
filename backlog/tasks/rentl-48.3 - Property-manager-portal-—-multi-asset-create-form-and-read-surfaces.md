---
id: RENTL-48.3
title: Property manager portal — multi-asset create form and read surfaces
status: In Progress
assignee: []
created_date: '2026-08-01 14:20'
updated_date: '2026-08-01 15:18'
labels:
  - maintenance-requests
  - frontend
dependencies:
  - RENTL-48.1
references:
  - >-
    apps/property-manager/app/modules/properties/property/activities/maintenance-requests/new/index.tsx
  - >-
    apps/property-manager/app/modules/properties/property/activities/maintenance-requests/request-card.tsx
  - >-
    apps/property-manager/app/modules/properties/property/activities/maintenance-requests/request/sidebar.tsx
  - >-
    apps/property-manager/app/modules/properties/property/activities/maintenance-requests/controller.tsx
  - apps/property-manager/app/api/maintenance-requests/index.ts
  - apps/property-manager/app/components/multi-select.tsx
  - apps/property-manager/types/maintenance.d.ts
documentation:
  - docs/superpowers/specs/2026-08-01-maintenance-request-multi-asset-design.md
parent_task_id: RENTL-48
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace the single-unit select on the maintenance request create form with independent block and unit multi-selects, add the fan-out option, and update every surface that displays or filters by the old single unit.

See the "Frontend — Property Manager Portal" section of docs/superpowers/specs/2026-08-01-maintenance-request-multi-asset-design.md for the form layout and the per-file change list.

Notes for whoever picks this up:
- No new UI primitives are needed. MultiSelect already exists at app/components/multi-select.tsx with option-group support, and useGetPropertyBlocks already exists in app/api/blocks.
- Blocks and units are fully independent. Selecting a block and a unit inside that same block is legitimate and must not be blocked or warned about.
- The landlord must understand before submitting that a block or a multi-unit selection makes the request invisible to tenants, and that fan-out is the way to keep tenants notified.
- The unit detail maintenance tab needs no change; it filters by unit, which keeps working.
- While in types/maintenance.d.ts, remove the duplicated metadata key on MaintenanceRequestActivityLog.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The create form offers independent block and unit multi-selects, with units grouped by block, and selecting a block plus a unit inside it is allowed
- [ ] #2 The form cannot be submitted with no block and no unit selected
- [ ] #3 When the selection forces internal-only, the form says so before submission and the visibility control is disabled
- [ ] #4 The fan-out option appears once two or more assets are selected, is off by default, and explains that it creates one request per asset
- [ ] #5 After creating a single request the user lands on that request's detail page; after a fan-out the user lands on the list with the created count surfaced
- [ ] #6 The Kanban card and the request detail sidebar show all of a request's assets, with links to each unit and block
- [ ] #7 The list can be filtered by block as well as by unit
- [ ] #8 The unit detail maintenance tab still lists that unit's requests
- [ ] #9 The new form and asset displays are verified in both light and dark modes
- [ ] #10 yarn types:check and yarn lint pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation complete and unstaged.

Verified:
- yarn types:check exit 0, yarn lint exit 0 (none of the changed files appear in lint output), yarn build exit 0.
- NOTE: all three require Node 20+. The default shell Node here is 18.20.8 and types:check fails with "TypeError: crypto.hash is not a function". Ran under nvm v22.19.0. Check CI pins >= 20.

Changed:
- types/maintenance.d.ts — MaintenanceRequestAsset added; unit_id/unit replaced by property_id/property/assets; block_id added to the fetch filter; removed the duplicated metadata key on MaintenanceRequestActivityLog.
- api/maintenance-requests/index.ts — create input takes unit_ids / block_ids / create_separate_requests; create response typed as MaintenanceRequest[].
- api/maintenance-requests/server.ts — detail populate now Assets,Assets.Unit,Assets.PropertyBlock.
- activities/maintenance-requests/new/index.tsx — two independent MultiSelects (blocks, and units grouped by block), fan-out Switch shown at 2+ assets and defaulting off, live forced-internal banner, Visibility select disabled when forced, superRefine requiring at least one asset, post-create navigation branching on array length.
- activities/maintenance-requests/request-card.tsx — asset chip ("Block A", "A1 +2").
- activities/maintenance-requests/request/sidebar.tsx — one row per asset; unit rows link to the unit, block rows link to the blocks list (no block detail route exists).
- activities/maintenance-requests/index.tsx — list populate switched to the asset relations; block_id passed through.
- activities/maintenance-requests/controller.tsx — Block filter (selectType multi, urlParam "block"). Unit filter deliberately left on single.

Two things beyond the plan:
- The plan missed app/modules/insights/overview/risk-detail-modal.tsx, which read request.unit.property_id / unit.property.name / unit.name. It now reads request.property_id, request.property.name, and an assetSummary() of the assets, and its populate changed from ['Unit','Unit.Property'] to ['Property','Assets','Assets.Unit','Assets.PropertyBlock'].
- That required a small backend addition: the admin transformation now emits "property" (DBPropertyToRest, which already guards nil/uuid.Nil) alongside property_id, and OutputProperty was added to the swagger struct. Swagger regenerated. This is in services/main/internal/transformations/maintenance-request.go and is NOT part of commit d3953228.

NOT verified:
- No browser verification. The 8 create-form cases, the asset chips/sidebar rendering, the block filter behaviour, and dark mode were all checked by types/lint/build only. Running them needs the API plus a client-user login, which I do not have. This is the remaining work before the task can close.
<!-- SECTION:NOTES:END -->
