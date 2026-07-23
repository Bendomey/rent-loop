# Maintenance Request Category: Free-Text Backend + Expanded List

Date: 2026-07-23

## Problem

Maintenance request `category` is currently constrained to 4 values
(`PLUMBING`, `ELECTRICAL`, `HVAC`, `OTHER`) via a `go-playground/validator`
`oneof=...` tag on the backend, mirrored by hand in a TypeScript literal
union on the frontend. This is too narrow to capture the range of real
maintenance scenarios, and the two lists (Go tag, TS union) have no shared
source of truth — they must be updated in lockstep by hand whenever a value
changes.

## Decision

- **Backend**: `category` becomes a fully open, unrestricted string. Remove
  the `oneof=...` validator tag everywhere it appears. It remains
  `required` (non-empty) — this is unchanged. No enum/oneof restriction is
  enforced server-side going forward, including for direct API callers
  (Swagger/Postman/etc.).
- **Frontend**: Category selection stays a closed dropdown (no free-text
  entry in the UI), but the preset list expands from 4 to 16 values. The
  dropdown is the only place values are constrained now that the backend is
  open.

This means the frontend dropdown becomes the sole source of category
value constraints for the normal app flow; the backend intentionally will
not reject anything.

## Category values

| Value | Label |
|---|---|
| `PLUMBING` | Plumbing |
| `ELECTRICAL` | Electrical |
| `HVAC` | HVAC |
| `APPLIANCE` | Appliance |
| `STRUCTURAL` | Structural (walls, ceilings, foundation) |
| `ROOFING` | Roofing |
| `PEST_CONTROL` | Pest Control |
| `LANDSCAPING` | Landscaping & Grounds |
| `LOCKS_SECURITY` | Locks & Security |
| `PAINTING` | Painting |
| `FLOORING` | Flooring |
| `WINDOWS_DOORS` | Windows & Doors |
| `SAFETY_FIRE` | Safety & Fire (smoke detectors, extinguishers, alarms) |
| `CLEANING` | Cleaning |
| `UTILITIES` | Utilities (power/water/gas outage) |
| `OTHER` | Other |

## Backend changes

`services/main/internal/handlers/maintenance-request.go`:
- Line 36 (create body): change `validate:"required,oneof=PLUMBING ELECTRICAL HVAC OTHER"` to `validate:"required"`.
- Line 45 (update body): change `validate:"omitempty,oneof=PLUMBING ELECTRICAL HVAC OTHER"` to `validate:"omitempty"` (drop the tag entirely if `omitempty` alone is a no-op — verify during implementation).
- Line 81, 822 (other bodies/query filters using the same `oneof` set): same treatment — drop the `oneof=...` list, keep whatever `required`/`omitempty` semantics currently apply.

`services/main/internal/models/maintenance-request.go`:
- Line 36: update the inline comment on `Category string` to reflect that the value is free text (not an exhaustive Go-side enum). No `gorm` tag or column-type change needed — the column is already a plain GORM-generated text/varchar, not a Postgres enum or CHECK constraint, so no migration is required.

No changes to service or repository layers — they already just pass the string through.

## Frontend changes

- `apps/property-manager/types/maintenance.d.ts:15` — expand the `category` literal union on `MaintenanceRequest` (and the derived `MaintenanceRequestCategory` alias at line 33) to all 16 values above.
- `apps/property-manager/app/lib/maintenance-request.utils.ts:18-23` — expand `CATEGORY_LABELS` to the 16 label pairs above.
- `apps/property-manager/app/modules/properties/property/activities/maintenance-requests/request/sidebar.tsx:57` — this file currently defines a second, duplicate `CATEGORY_LABELS` map. Since it's directly in the blast radius of this change (it would otherwise need the same 16-entry expansion applied twice by hand), replace it with an import from `app/lib/maintenance-request.utils.ts` instead of maintaining a second copy.
- Category select/dropdown UI is driven by `CATEGORY_LABELS`/the union type, so it should pick up the expanded list automatically. Verify no other component hardcodes the old 4-value list during implementation.

## Out of scope

- No database migration (column type is unaffected).
- No free-text/custom-category input in the UI — dropdown only, per user decision.
- No changes to existing maintenance requests already stored with the old 4 category values — they remain valid data, no backfill needed.
