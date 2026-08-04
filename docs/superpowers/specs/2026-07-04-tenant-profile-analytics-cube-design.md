# Tenant Profile Analytics Cube — Design

## Goal

The tenant profile page (`apps/property-manager/app/modules/properties/property/occupancy/tenants/tenant/profile/index.tsx`) currently shows four hardcoded stat cards: Total Payments, Total Leases, Total Bookings, Total Requests. Replace the hardcoded values with real analytics scoped to the given tenant + property, sourced from the Cube.js semantic layer (`services/cube`).

## Backend: Cube.js schema changes (`services/cube/model/cubes/`)

All cubes already scope rows to the authenticated client via `COMPILE_CONTEXT.securityContext.clientId` (see `Leases.js`, `Invoices.js`, `MaintenanceRequests.js`, `Units.js`, `Expenses.js`). New/changed cubes follow the same convention.

### 1. New cube: `Payments.js`

Payments track actual money received (vs. Invoices, which track what's owed). Base SQL joins `payments` → `invoices` to reuse the existing payee-scoping used by `Invoices.js`:

```sql
SELECT p.*
FROM payments p
JOIN invoices i ON i.id = p.invoice_id AND i.deleted_at IS NULL
WHERE p.deleted_at IS NULL
  AND i.payee_type = 'PROPERTY_OWNER'
  AND <payee_client_id scoped to securityContext.clientId, else 1=0>
```

- **Measures:**
  - `count` — total payment count
  - `totalAmount` — `sum(amount)` filtered to `status = 'SUCCESSFUL'` (pesewas) — this is "total payment made so far"
- **Dimensions:**
  - `id` (primary key)
  - `invoiceId`
  - `propertyId` — derived via a subquery against `invoices` keyed by `${CUBE}.invoice_id`, reusing the same COALESCE chain `Invoices.js` already uses for its own `propertyId` (tenant_application → unit, lease → unit, booking, expense, `payer_property_id` fallback)
  - `tenantId` — derived the same way, COALESCE of `leases.tenant_id` (via `context_lease_id`) and `bookings.tenant_id` (via `context_booking_id`)
  - `status`, `rail`, `createdAt`, `successfulAt`

### 2. `Leases.js` — add `tenantId` dimension

`leases.tenant_id` is already included via `SELECT l.*`, so this is a direct column dimension (`sql: 'tenant_id'`), no new join needed.

### 3. `MaintenanceRequests.js` — add `tenantId` dimension

`maintenance_requests.created_by_tenant_id` is already included via `SELECT mr.*`, so this is a direct column dimension (`sql: 'created_by_tenant_id'`).

### 4. New cube: `Bookings.js`

Mirrors the shape of `Leases.js`/`Units.js` — scoped directly via `bookings.property_id`:

```sql
SELECT b.*
FROM bookings b
JOIN properties p ON p.id = b.property_id AND p.deleted_at IS NULL
WHERE b.deleted_at IS NULL
  AND <p.client_id scoped to securityContext.clientId, else 1=0>
```

- **Measures:** `count`, `confirmedCount`, `checkedInCount`, `completedCount`, `canceledCount` (status filters matching `Booking.Status`: `PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`)
- **Dimensions:** `id` (primary key), `status`, `propertyId` (direct), `tenantId` (direct), `unitId` (direct), `checkInDate`, `checkOutDate`, `createdAt`

No DB migrations required — all referenced tables and columns already exist and are already in `AutoMigrate`.

## Frontend: `apps/property-manager`

### `TenantModule` (`.../occupancy/tenants/tenant/index.tsx`)

Pass `propertyId={clientUserProperty?.property?.id}` down to `TenantProfileModule` (currently only receives `tenant`).

### `TenantProfileModule` (`.../tenant/profile/index.tsx`)

Add a `propertyId: string` prop. Following the exact pattern already used in `PropertySectionCards` (`.../property/components/cards.tsx`):

- `useClient()` → `clientUser.client_id`
- `useGetAnalyticsToken(clientId)` → `token`
- Four `useCubeQuery` calls, each filtered by `tenantId` (equals `tenant.id`) AND `propertyId` (equals prop):
  - `Payments.totalAmount` → formatted via `formatAmount(convertPesewasToCedis(...))` → replaces "Total Payments" card value
  - `Leases.count` → replaces "Total Leases" card value
  - `Bookings.count` → replaces "Total Bookings" card value
  - `MaintenanceRequests.count` → replaces "Total Requests" card value
- Each card shows a `Skeleton` while its query `isPending`, matching `PropertySectionCards`/`SectionCards` conventions.

No new components, no layout changes — the 4 existing `Card` elements stay as-is; only their title values become computed instead of hardcoded.

## Out of scope

- No changes to invoice/payment creation flows.
- No changes to other tabs (Leases, Bookings, Payments, Maintenance Requests list tabs) — this only affects the summary cards on the Profile tab.
- No new cube deploy/migration steps beyond editing the schema files (Cube.js reads schema files at runtime; no separate build step in this repo based on existing cube files).
