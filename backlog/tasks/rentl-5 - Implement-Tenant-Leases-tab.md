---
id: RENTL-5
title: Implement Tenant Leases tab
status: To Do
assignee: []
created_date: '2026-03-04 18:56'
updated_date: '2026-03-07 13:17'
labels:
  - frontend
  - property-manager
  - stub
milestone: m-1
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement lease list views in three locations in the property manager portal:
- `/properties/{propertyId}/tenants/leases` — property-wide leases (new route + module)
- `/properties/{propertyId}/assets/units/{unitId}/leases` — leases for a specific unit (placeholder exists)
- `/properties/{propertyId}/tenants/all/{tenantId}/leases` — leases for a specific tenant (placeholder exists)

Backend endpoints already exist. Only the frontend API client and module implementations are needed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Property-wide leases at /properties/{id}/tenants/leases shows a DataTable of all leases for that property
- [ ] #2 Unit leases at /properties/{id}/assets/units/{unitId}/leases shows leases filtered to that unit only
- [ ] #3 Tenant leases at /properties/{id}/tenants/all/{tenantId}/leases shows leases filtered to that tenant only
- [ ] #4 Each list supports status filtering (Pending / Active / Completed / Cancelled / Terminated)
- [ ] #5 Each list supports pagination via URL search params
- [ ] #6 Status badges use appropriate colors: yellow (Pending), teal (Active), blue (Completed), zinc (Cancelled), rose (Terminated)
- [ ] #7 Tenant name and unit name cells link to their respective detail pages
- [ ] #8 Both dark and light modes render correctly
- [ ] #9 yarn types:check passes with no TypeScript errors
- [ ] #10 A 'Leases' item appears in the sidebar under the Tenants section and navigates to /properties/{id}/tenants/leases
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# Implementation Plan

## What Exists vs. What Needs Building

| Route | Route File | Module |
|---|---|---|
| `/properties/{id}/tenants/leases` | ❌ Create | ❌ Create |
| `/properties/{id}/assets/units/{unitId}/leases` | ✅ Exists | ✅ Placeholder → implement |
| `/properties/{id}/tenants/all/{tenantId}/leases` | ✅ Exists | ✅ Placeholder → implement |

**Backend (no changes needed):**
- `GET /api/v1/admin/properties/{property_id}/leases` — property-wide + unit-filtered
- `GET /api/v1/admin/tenants/{tenant_id}/leases` — per-tenant

## Files

### 1. `app/lib/constants.ts`
Add `LEASES: 'leases'` to `QUERY_KEYS`.

### 2. `types/lease.d.ts`
Add `FetchLeaseFilter` interface: `{ status?, property_id?, unit_ids?, tenant_id?, payment_frequency?, ids? }`

### 3. `app/api/leases/index.ts` (NEW)
Follow `app/api/invoices/index.ts` pattern:
- `useGetPropertyLeases(propertyId, query)` → `GET /v1/admin/properties/{id}/leases`
- `useGetTenantLeases(tenantId, query)` → `GET /v1/admin/tenants/{id}/leases`

### 4. `app/routes/_auth.properties.$propertyId.tenants.leases.tsx` (NEW)
Minimal route: `handle = { breadcrumb: 'Leases' }`, `export default PropertyTenantLeasesModule`

### 5. `app/modules/properties/property/tenants/leases/index.tsx` (NEW)
Property-wide lease list. Uses `useGetPropertyLeases` + `useProperty()` for property_id.
Columns: Tenant name (link), Unit name (link), Status badge, Rent fee, Move-in date, Created date.
Filter: Status.

### 6. `app/modules/properties/property/assets/units/unit/leases/index.tsx` (IMPLEMENT)
Unit lease list. Uses `useGetPropertyLeases` with `unit_ids: [unitId]` from `useParams()`.
Columns: Tenant name (link), Status badge, Rent fee, Move-in date, Duration.

### 7. `app/modules/properties/property/tenants/all/tenant/leases/index.tsx` (IMPLEMENT)
Tenant lease list. Uses `useGetTenantLeases` with `tenantId` from `useParams()`.
Columns: Unit name (link), Status badge, Rent fee, Move-in date, Duration.

### 8. `app/modules/index.ts`
Export `PropertyTenantLeasesModule`.

## Lease Status Badge Colors
- Pending: `bg-yellow-500 text-white`
- Active: `bg-teal-500 text-white`
- Completed: `bg-blue-500 text-white`
- Cancelled: `bg-zinc-400 text-white`
- Terminated: `bg-rose-500 text-white`

## Key Patterns to Reuse
- API: `fetchClient`, `getQueryParams`, `useQuery` (from `app/api/invoices/index.ts`)
- UI: `DataTable`, `useSearchParams`, `PAGINATION_DEFAULTS` (from invoices module)
- Context: `useProperty()` for property_id, `useParams()` for unitId/tenantId

### 9. `app/modules/properties/property/layout/sidebar.tsx` (MODIFY)
Add `Leases` item to the Tenants nav group:
```ts
{ title: 'Leases', url: '/leases' }
```
Added after `Applications` in the existing Tenants items array (line ~80).
<!-- SECTION:PLAN:END -->
