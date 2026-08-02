---
id: RENTL-48
title: Maintenance Requests — multi-asset targeting (blocks + units)
status: To Do
assignee: []
created_date: '2026-08-01 14:19'
labels:
  - maintenance-requests
  - backend
  - frontend
  - mobile
dependencies: []
documentation:
  - docs/superpowers/specs/2026-08-01-maintenance-request-multi-asset-design.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Landlords can currently attach a maintenance request to exactly one unit. They need to be able to select multiple units and one or more blocks on a single request.

Blocks are first-class targets, not shorthand for their units — a lot of maintenance work is common-area work (roof, corridor, generator, stairwell) that belongs to no unit and cannot be logged today.

This parent tracks the whole change across the backend, the property manager portal, both Flutter apps, and the Cube.js analytics schema. The approved design — including all decisions, the data model, visibility rules, and the migration plan — is in docs/superpowers/specs/2026-08-01-maintenance-request-multi-asset-design.md. Read it before starting any subtask.

Key decisions a stranger needs to know:
- MaintenanceRequest.UnitID is dropped, replaced by a single MaintenanceRequestAsset table with an AssetType discriminator (UNIT | BLOCK) and nullable UnitID / PropertyBlockID.
- A denormalized PropertyID is added to MaintenanceRequest, because property scoping and access control run on every list/count/stats query.
- Any request with more than one asset, or with any block, is forced to INTERNAL_ONLY. Only the single-unit case can be tenant-visible, which preserves today's tenant behaviour exactly.
- An opt-in fan-out toggle creates one single-asset request per selected asset, so landlords can still notify each tenant.
- Assets are immutable after creation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A landlord can create one maintenance request targeting any combination of multiple units and multiple blocks
- [ ] #2 A landlord can create a maintenance request for a block alone, with no unit selected, to cover common-area work
- [ ] #3 A request with exactly one unit and no blocks behaves exactly as today: the tenant sees it in their lease feed and receives a push notification
- [ ] #4 A request with more than one asset, or with any block, is internal-only and notifies no tenant
- [ ] #5 With the fan-out option enabled, one request is created per selected asset; unit requests can still be tenant-visible while block requests are internal-only
- [ ] #6 Existing maintenance requests continue to display, filter, and report correctly after migration
- [ ] #7 Maintenance analytics remain correctly scoped to the caller's permitted properties after the change
<!-- AC:END -->
