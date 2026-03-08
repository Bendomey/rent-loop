---
id: RENTL-7
title: Add single lease page
status: Done
assignee: []
created_date: '2026-03-05 09:13'
updated_date: '2026-03-08 17:21'
labels:
  - frontend
  - property-manager
  - leases
milestone: m-1
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the single lease page — display lease details, terms, associated tenant, documents, and status information.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Navigating to a lease from the leases list loads the detail page with correct data
- [ ] #2 Tenant name and unit name render as links navigating to their respective detail pages
- [ ] #3 Status badge color matches the lease's current status
- [ ] #4 Details tab shows rent fee, payment frequency, duration, move-in date, and all event dates
- [ ] #5 Documents tab shows lease agreement link; shows termination agreement if present; shows N/A if null
- [ ] #6 Cancel/Terminate action buttons are only visible to MANAGER role
- [ ] #7 Dark mode renders correctly throughout the page
- [ ] #8 yarn types:check passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Implementation Plan

### Route
URL: `/properties/$propertyId/tenants/leases/$leaseId` — canonical lease detail, linked from all lease list views.

### Files

1. **`app/api/leases/server.ts`** (NEW) — `getLeaseForServer(leaseId, options)` → `GET /v1/admin/leases/{id}?populate=Tenant,Unit,TenantApplication`

2. **`app/routes/_auth.properties.$propertyId.tenants.leases.$leaseId.tsx`** (NEW) — loader calls `getLeaseForServer`, exports `LeaseDetailModule`, handle breadcrumb = 'Lease Details'

3. **`app/modules/properties/property/tenants/leases/lease/index.tsx`** (NEW):
   - 12-col grid layout (same as unit detail)
   - Left col-span-4: status badge, tenant link, unit link, rent fee, move-in date, MANAGER-gated action buttons
   - Right col-span-8 Tabs: Details (rent, duration, dates) | Documents (agreement URLs + signing status) | Invoices (inline list via useGetInvoices)

4. **`app/modules/index.ts`** (MODIFY) — add export for LeaseDetailModule

### Patterns
- Server fetch: `app/api/invoices/server.ts`
- Layout: `app/modules/properties/property/assets/units/unit/index.tsx`
- Status badge colors: Pending=yellow-500, Active=teal-500, Completed=blue-500, Cancelled=zinc-400, Terminated=rose-500
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the single lease detail page at `/properties/$propertyId/tenants/leases/$leaseId`.

Files created:
- `app/api/leases/server.ts`: `getLeaseForServer` SSR fetch from `/v1/admin/leases/{id}?populate=Tenant,Unit,TenantApplication`
- `app/routes/_auth.properties.$propertyId.tenants.leases.$leaseId.tsx`: loader (SSR fetch), breadcrumb = lease.code, meta tags
- `app/modules/properties/property/tenants/leases/lease/index.tsx`: `LeaseDetailModule` — 12-col grid layout:
  - Left col-4 card: code, status badge, tenant link, unit link, rent fee + frequency, move-in date, MANAGER-gated "Terminate Lease" button (disabled — no terminate API yet)
  - Right col-8 Tabs:
    - Details: payment frequency, duration, move-in, property inspection, utility transfers, activated/cancelled/terminated/completed dates
    - Documents: lease agreement (URL link + PM/tenant signed dates or N/A), termination agreement (same)

- `app/modules/index.ts`: Added export for `LeaseDetailModule`

Uses `getLeaseStatusClass`/`getLeaseStatusLabel` from `~/lib/lease.utils` and `getPaymentFrequencyLabel`/`getPaymentFrequencyPeriodLabel` from `~/lib/properties.utils`.
<!-- SECTION:FINAL_SUMMARY:END -->
