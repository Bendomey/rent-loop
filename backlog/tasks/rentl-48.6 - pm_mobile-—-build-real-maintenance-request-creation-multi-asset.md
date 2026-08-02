---
id: RENTL-48.6
title: pm_mobile — build real maintenance request creation (multi-asset)
status: To Do
assignee: []
created_date: '2026-08-01 14:31'
updated_date: '2026-08-02 15:58'
labels:
  - maintenance-requests
  - mobile
dependencies:
  - RENTL-48.1
  - RENTL-48.4
references:
  - apps/pm_mobile/lib/src/modules/main/activity/add_maintenance.dart
  - apps/pm_mobile/lib/src/api/maintenance_request_api.dart
  - apps/pm_mobile/lib/src/navigation/routes.dart
documentation:
  - docs/superpowers/specs/2026-08-01-maintenance-request-multi-asset-design.md
parent_task_id: RENTL-48
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Discovered while planning RENTL-48.4: pm_mobile cannot actually create maintenance requests. The screen at apps/pm_mobile/lib/src/modules/main/activity/add_maintenance.dart is a static mockup — its unit picker reads a hardcoded _kUnits list of fake unit names, its "Create request" button only fires a haptic and calls no API, and apps/pm_mobile/lib/src/api/maintenance_request_api.dart has no POST method at all.

This task is to make that screen real, built multi-asset from the start so there is no second migration: multi-select blocks and units loaded from the API, matching the property manager portal.

This is NOT required to release RENTL-48. The multi-asset feature ships on the web portal; this brings mobile to parity afterwards. Do it after RENTL-48.4 has landed the model changes it depends on.

Behaviour to match (see docs/superpowers/specs/2026-08-01-maintenance-request-multi-asset-design.md):
- Blocks and units are independent selections; selecting a block plus a unit inside it is allowed.
- Selected assets always become ONE combined request. Creating one request per asset (fan-out) is deliberately not offered on the client — decided 2026-08-02. The backend still supports both modes for future use, but no client exposes the choice.
- Any block, or more than one asset, forces the request to internal-only and notifies no tenant. Tell the user before they submit.
- The internal-only explanation is not a standalone banner. It hangs off the visibility field itself, shown only while that field is locked to Internal Only and disabled — mirroring the tooltip on the web portal.
- Submitting with no asset selected shows an inline validation message on the asset pickers, on the first attempt, rather than a snackbar or silent no-op.
- The create endpoint returns an array of created requests; a combined request is always a single-element array.

Follow the app's existing conventions: shimmer skeleton loaders rather than spinners, and pull-to-refresh on list and detail screens.

Note: build_runner dirties unrelated .g.dart files and project.pbxproj. Revert unrelated churn before handing off.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The create screen loads real blocks and units for the selected property from the API, replacing the hardcoded placeholder list
- [ ] #2 A property manager can select multiple blocks and multiple units independently and submit, and a request is actually created
- [ ] #3 The form cannot be submitted with no asset selected, and shows an inline message on the asset pickers when that is attempted
- [ ] #4 The form states that the request will be internal-only when a block or more than one asset is selected, surfaced on the locked visibility field rather than as a standalone banner
- [ ] #5 No fan-out / 'create separate requests' option is offered — the selected assets always produce one combined request
- [ ] #6 Submission failures surface an error to the user rather than failing silently
- [ ] #7 New and changed screens use shimmer skeleton loaders and support pull-to-refresh, consistent with the rest of the app
- [ ] #8 Unrelated generated-file churn is reverted before handoff
<!-- AC:END -->
