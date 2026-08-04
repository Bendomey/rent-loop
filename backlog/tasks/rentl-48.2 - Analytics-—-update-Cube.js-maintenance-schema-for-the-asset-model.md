---
id: RENTL-48.2
title: Analytics — update Cube.js maintenance schema for the asset model
status: In Progress
assignee: []
created_date: '2026-08-01 14:19'
updated_date: '2026-08-01 15:06'
labels:
  - maintenance-requests
  - analytics
dependencies:
  - RENTL-48.1
references:
  - services/cube/model/cubes/MaintenanceRequests.js
  - apps/property-manager/app/modules/insights/overview/risk-summary.tsx
  - apps/pm_mobile/lib/src/lib/activity_counts_logic.dart
documentation:
  - docs/superpowers/specs/2026-08-01-maintenance-request-multi-asset-design.md
parent_task_id: RENTL-48
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Cube.js maintenance schema reads the database directly and joins units on mr.unit_id to reach the property, then derives its row-level property security scope from that join. When RENTL-48.1 drops the unit_id column, maintenance analytics break outright — including access control, not just display.

Critical rollout note: because Cube reads the database directly, it breaks the moment the migration runs, regardless of API deploy order. This must ship together with the migration, not after it.

The denormalized property_id added in RENTL-48.1 makes this a simplification rather than extra work — see the Analytics section of docs/superpowers/specs/2026-08-01-maintenance-request-multi-asset-design.md for the exact diff.

The unitId dimension is to be removed rather than reworked: a request no longer has one unit, and the dimension is unused. The only consumers of this cube are the portal insights overview and the pm_mobile activity counts, both of which read status counts and propertyId only. Unit-level maintenance analytics, if wanted later, belongs in a separate cube over the assets table.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The maintenance cube resolves its property without joining through units
- [ ] #2 Row-level property scoping still restricts results to the caller's permitted properties, verified with a user who has access to a subset of properties
- [ ] #3 The property dimension no longer runs a per-row correlated subquery
- [ ] #4 The unused unit dimension is removed
- [ ] #5 All existing maintenance measures are unchanged, and the portal insights overview and pm_mobile activity counts render the same numbers as before the migration
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation complete and unstaged.

Verified:
- node --test services/cube/model/ — 17/17 passing (scope.js helpers untouched but confirmed still correct).
- yarn --cwd services/cube check:schema — schema compiles, all 8 cubes present including MaintenanceRequests. NOTE: this requires Node 20+; the default shell Node here is 18.20.8 and fails with "Cube.js CLI requires Node.js 20 or higher". Ran it under nvm v22.19.0.
- Row-level scoping verified directly against the migrated schema, in a rolled-back transaction with one maintenance request per property: OWNER saw all 3 properties of their client; the same user demoted to STAFF (holding a single client_user_properties grant) saw exactly 1; a different client saw 0. Rollback left no residue and the role was restored.
- The cube's base SQL executes against the migrated schema, which is the real regression risk — it proves no reference to the dropped unit_id column remains.

NOT verified:
- The dashboards were not rendered visually. The Insights overview and pm_mobile activity counts were not opened in a browser/simulator. Evidence that they are unaffected is indirect but strong: no measure definition was touched, the propertyId dimension keeps its name and type, and the compile check passes. Worth a quick visual pass before release.

Changes are confined to services/cube/model/cubes/MaintenanceRequests.js: units join removed, scope predicate reads mr.property_id, propertyId dimension drops its per-row correlated subquery, unused unitId dimension removed.

RELEASE CONSTRAINT: this must ship in the same release as the RENTL-48.1 migration. Cube reads the database directly, so it breaks the moment unit_id is dropped, regardless of API deploy order.
<!-- SECTION:NOTES:END -->
