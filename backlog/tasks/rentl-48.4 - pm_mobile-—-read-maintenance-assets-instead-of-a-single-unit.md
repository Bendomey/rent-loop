---
id: RENTL-48.4
title: pm_mobile — read maintenance assets instead of a single unit
status: In Progress
assignee: []
created_date: '2026-08-01 14:20'
updated_date: '2026-08-01 15:28'
labels:
  - maintenance-requests
  - mobile
dependencies:
  - RENTL-48.1
references:
  - apps/pm_mobile/lib/src/repository/models/maintenance_request_model.dart
  - apps/pm_mobile/lib/src/api/maintenance_request_api.dart
  - apps/pm_mobile/lib/src/modules/main/activity/maintenance_detail.dart
  - apps/pm_mobile/lib/src/modules/main/activity/maintenance_board.dart
documentation:
  - docs/superpowers/specs/2026-08-01-maintenance-request-multi-asset-design.md
parent_task_id: RENTL-48
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The pm_mobile maintenance request model declares unit_id as required and non-nullable, so this app hard-breaks on deserialization the moment RENTL-48.1 removes the field from API responses. The detail and board screens also navigate using request.unit.propertyId and request.unitId, which stop resolving.

Scope correction made while planning: this task was originally written to also add a multi-asset create form. It cannot, because pm_mobile has no create feature to extend. add_maintenance.dart is a static mockup — its unit picker reads a hardcoded _kUnits list of fake names, the "Create request" button only fires a haptic, and maintenance_request_api.dart has no POST method at all. Building real creation is a separate feature, tracked as RENTL-48.6.

This task is therefore the break-fix only: read the asset list, render it, and keep navigation working.

See the "Flutter — pm_mobile" section of docs/superpowers/specs/2026-08-01-maintenance-request-multi-asset-design.md.

Note: build_runner dirties unrelated .g.dart files and project.pbxproj. Revert unrelated churn before handing off.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Maintenance request screens load without deserialization errors against the new API
- [ ] #2 The request detail screen shows all of a request's assets rather than a single unit
- [ ] #3 Tapping a unit asset still navigates to that unit's page, using the property from the request rather than from the unit
- [ ] #4 The board screen renders and navigates correctly for requests with any number of assets, including a block-only request with no unit
- [ ] #5 Nothing crashes or renders blank for a request whose assets list is empty or contains only blocks
- [ ] #6 Unrelated generated-file churn is reverted before handoff
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation complete and unstaged.

Verified:
- flutter analyze: 0 errors (remaining infos are pre-existing deprecated_member_use in generated Riverpod files and curly_braces lints elsewhere).
- flutter test: 212/212 passing.

Changed:
- models/maintenance_request_model.dart — MaintenanceBlockModel and MaintenanceAssetModel added (assetType discriminator, nullable unit/propertyBlock, label getter with type fallback). unitId/unit replaced by propertyId (non-nullable) and assets. Added unitAssets, blockAssets, and assetSummary getters.
- api/maintenance_request_api.dart — both _populate and _detailPopulate now request Assets,Assets.Unit,Assets.PropertyBlock instead of Unit. Stale doc comment about reading propertyId from the nested unit corrected.
- activity/maintenance_detail.dart — _PropertiesCard renders one row per asset (units link to the unit; blocks link to the property's blocks list, since no block detail route exists) and takes the property from the request.
- activity/maintenance_board.dart — card subtitle uses assetSummary; navigation extra uses m.propertyId.

Four sites beyond the plan, all reading .unit?.propertyId purely to reach the property — each now uses the non-nullable request.propertyId:
- maintenance_board.dart _refreshAssigneeSources()
- notifiers/activity/maintenance_request_status_notifier.dart — this one was a latent bug: status updates failed outright when the unit relation was not populated. Now it cannot.
- providers/activity/maintenance_detail_provider.dart
- board card subtitle (was m.unit?.name)

Tests updated and extended (the plan did not account for pm_mobile having a test suite):
- test/modules/main/activity/maintenance_detail_test.dart — fixture rebuilt around propertyId + a UNIT asset.
- test/api/maintenance_request_api_test.dart — fixture and populate expectations updated to the asset relations.
- test/repository/models/maintenance_detail_models_test.dart — fixtures updated, plus three new cases: a multi-unit-plus-block request (asserts unitAssets/blockAssets split and "A1 +2" summary), an unpopulated relation falling back to the asset-type label, and a payload with no assets key at all rendering "—" rather than throwing.

Codegen hygiene: build_runner rewrote 7 unrelated .g.dart files with formatting-only churn from a differing formatter version. All 7 reverted; analyze and the full suite still pass, confirming they were unnecessary. Only maintenance_request_model.g.dart remains, and its diff is purely the additive block/asset serializers. No project.pbxproj churn.

NOT verified:
- Nothing run on a simulator. Per project convention I did not launch the app. The six on-device checks in the plan (single-unit, multi-unit, block-only, mixed, board navigation, divider placement on the last row) still need a human pass.
<!-- SECTION:NOTES:END -->
