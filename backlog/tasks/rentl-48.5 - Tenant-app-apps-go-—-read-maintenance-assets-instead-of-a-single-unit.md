---
id: RENTL-48.5
title: Tenant app (apps/go) — read maintenance assets instead of a single unit
status: In Progress
assignee: []
created_date: '2026-08-01 14:20'
updated_date: '2026-08-01 15:40'
labels:
  - maintenance-requests
  - mobile
dependencies:
  - RENTL-48.1
references:
  - apps/go/lib/src/repository/models/maintenance_request_model.dart
  - apps/go/lib/src/modules/main/maintenance_details/root.dart
  - apps/go/lib/src/modules/main/maintenance/request_card.dart
  - apps/go/lib/src/modules/main/new_maintenance/root.dart
documentation:
  - docs/superpowers/specs/2026-08-01-maintenance-request-multi-asset-design.md
parent_task_id: RENTL-48
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The tenant app declares unit_id and unit on its maintenance request model, but never reads either one — no maintenance screen displays the unit. Both fields are already nullable, so when RENTL-48.1 stops sending them, json_serializable simply leaves them null and nothing breaks.

Scope correction made while planning: this task was originally written as a fix. It is not — the app keeps working untouched. What remains is removing the two now-dead fields so the model stops advertising data the API no longer returns, which would otherwise mislead the next person to read it.

Do not add an assets field. The tenant app never displays assets, and tenant-visible requests are always single-unit by design. Adding one would be speculative.

The tenant create flow is unchanged: it posts to the lease-scoped endpoint and never selects a unit.

Note: build_runner dirties unrelated .g.dart files and project.pbxproj. Revert unrelated churn before handing off.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The dead unitId and unit fields are removed from the maintenance request model, along with MaintenanceUnitModel if nothing else uses it
- [ ] #2 Generated serialization code is regenerated and the app compiles
- [ ] #3 Maintenance list, detail, and stats screens render unchanged against the new API
- [ ] #4 Creating a maintenance request from a lease still works unchanged
- [ ] #5 Unrelated generated-file churn is reverted before handoff
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation complete and unstaged.

Premise re-confirmed before touching anything: every reference to unitId / unit / MaintenanceUnitModel lived inside maintenance_request_model.dart itself. No screen read them. The maintenance API populate strings request only ActivityLogs, Expenses and Expenses.Invoices — this app never asked for the Unit relation, which is why it never displayed one. So nothing here was broken by the backend change, and no populate fix was needed (unlike pm_mobile, where both populate constants had to change).

Changed:
- lib/src/repository/models/maintenance_request_model.dart — removed the MaintenanceUnitModel class entirely, and the unitId / unit fields plus their constructor parameters from MaintenanceRequestModel.
- Regenerated maintenance_request_model.g.dart; no unit references remain in generated code.
- docs/changelog.md — dated entry appended, per this app's CLAUDE.md convention of updating the docs index after every change. docs/implementation.md needed no edit: it indexes API classes, notifiers and providers, not model fields, and names none of the removed symbols.

Deliberately did NOT add an assets field. Tenant-visible requests are always single-unit by design and no screen renders assets, so it would be an unread field. Add it when a screen needs it.

Verified:
- flutter analyze: 0 errors (49 remaining infos are pre-existing deprecation and lint noise elsewhere).
- No test run: this app has no test harness configured (per apps/go/CLAUDE.md).

Codegen hygiene: build_runner also rewrote create_offline_payment_notifier.g.dart (source-hash line only) and invoices_provider.g.dart (formatting). Both reverted; analyze still clean. Final diff is two files plus the changelog. No project.pbxproj churn.

NOT verified:
- Not run on a simulator. Per project convention I did not launch the app. A quick pass over the maintenance list, detail and home stats card against the migrated API would confirm nothing regressed, though the risk is very low given the fields were unused.
<!-- SECTION:NOTES:END -->
