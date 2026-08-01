---
id: RENTL-48.1
title: 'Backend — maintenance request assets model, migration, and API'
status: In Progress
assignee: []
created_date: '2026-08-01 14:19'
updated_date: '2026-08-01 14:57'
labels:
  - maintenance-requests
  - backend
dependencies: []
references:
  - services/main/internal/models/maintenance-request.go
  - services/main/internal/repository/maintenance-request.go
  - services/main/internal/services/maintenance-request.go
  - services/main/internal/handlers/maintenance-request.go
  - services/main/internal/transformations/maintenance-request.go
  - services/main/init/migration/main.go
  - services/main/init/migration/jobs/fix-lad-lease-id-partial-unique-index.go
documentation:
  - docs/superpowers/specs/2026-08-01-maintenance-request-multi-asset-design.md
parent_task_id: RENTL-48
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Replace the single-unit foreign key on maintenance requests with a multi-asset model, and expose it through the API. This is the foundation — every other subtask depends on the payload shape it lands.

Read docs/superpowers/specs/2026-08-01-maintenance-request-multi-asset-design.md first. It contains the exact model definition, the CHECK constraint and partial unique index SQL, the visibility matrix, and the migration steps.

Scope: services/main only. Model, migration job, repository scopes, service, handlers, transformations, Swagger.

Notes for whoever picks this up:
- Visibility is computed by the service and silently downgraded, never trusted from the client. This matches how CreateByAdmin already downgrades when a unit has no active lease.
- LeaseID and CreatedByTenantID stay on the request. They are only populated when the request has exactly one asset and it is a unit, which is precisely when a request may be tenant-visible. Tenant endpoints scope by lease_id and must not change.
- The at-least-one-asset rule cannot be expressed in validator struct tags; validate it explicitly.
- The denormalized property_id exists so property scoping and client-user access control stay simple; do not reintroduce subqueries through units.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A maintenance request can be created with any combination of unit ids and block ids, and rejects a request with neither
- [ ] #2 Creating a request with an asset that belongs to a different property is rejected with a clear error naming the offending asset
- [ ] #3 Effective visibility is forced to internal-only when a request has more than one asset or any block, and is honoured as requested for a single-unit request
- [ ] #4 Enabling the fan-out option creates one single-asset request per selected asset, with block requests internal-only and unit requests honouring the requested visibility
- [ ] #5 The create endpoint always responds with an array of created requests, including when only one is created
- [ ] #6 Maintenance request responses expose the property and the full asset list, and no longer expose a single unit
- [ ] #7 Requests can be filtered by unit, by block, and by property, and a request matching two selected units is returned only once
- [ ] #8 Tenant lease-scoped endpoints return the same results as before the change for single-unit requests
- [ ] #9 The migration backfills exactly one unit asset and a correct property for every pre-existing request, and is reversible
- [ ] #10 Database constraints reject an asset row whose type and populated foreign key disagree, and reject duplicate assets on the same request
- [ ] #11 Swagger annotations are updated for every changed handler, including the new block filter and the array-shaped create response
- [ ] #12 Tests cover the visibility matrix, fan-out, asset validation, the new filter scopes, and the migration backfill
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implementation complete and unstaged; awaiting the API smoke test before this can be closed.

Verified:
- go build ./... clean; go test ./... passing (8 new planner tests cover the full visibility matrix, fan-out, dedupe, empty-selection rejection).
- Migration applied to local dev DB. unit_id dropped, property_id NOT NULL, migration recorded.
- CHECK constraint and both partial unique indexes verified functionally in a rolled-back transaction: valid unit and block assets insert; asset_type/FK mismatch rejected; both-FKs-set rejected; duplicate unit asset on the same request rejected by idx_mra_request_unit.
- Server boots cleanly with the new model wiring.
- Swagger regenerated: unit_ids / block_ids / create_separate_requests present, asset_type / property_id present.

NOT yet verified:
- The backfill was not exercised on real data. maintenance_requests had 0 rows locally, so the "one unit asset per existing request" and property_id backfill checks passed vacuously. Worth re-checking against a database that actually has maintenance requests before this reaches staging.
- The end-to-end API smoke test (8 cases in the plan: single unit, multi unit, block-only, fan-out, empty selection, cross-property asset, block filter, duplicate-match filter) has not been run. It needs a client-user JWT.

Two fixes made beyond the plan:
- internal/services/expense.go fetched the request with Populate ["Unit"] purely to read mr.Unit.PropertyID; now reads mr.PropertyID with the populate dropped.
- Pre-existing bug in CreateByAdmin: the gorm.ErrRecordNotFound branch set INTERNAL_ONLY then returned InternalServerError regardless, so a unit with no active lease produced a 500 instead of downgrading. Now downgrades as intended.

Unrelated blocker fixed to get migrations running at all — see RENTL-49.
<!-- SECTION:NOTES:END -->
