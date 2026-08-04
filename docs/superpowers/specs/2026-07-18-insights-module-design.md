# Insights Module — Design

**Date:** 2026-07-18
**Status:** Approved

## Summary

Split the property manager portal's analytics from its operational home page:

- `/` becomes **Overview** — an operational landing page mixing KPI snapshots,
  action-required lists, a recent activity feed, and one mini trend chart. The
  current dashboard module dissolves into it.
- `/insights/...` becomes the new **Insights** module — eight analytical pages
  (Overview, Revenue, Occupancy, Rent Collection, Leases, Tenants, Maintenance,
  Expenses) sharing one filter bar.

**Data sourcing rule:** all numbers, trends, and charts come from **Cube.js**
(the existing semantic layer in `services/cube`, queried via
`useGetAnalyticsToken` + `useCubeQuery` in `app/api/analytics/index.ts`).
Record-level operational data (lists the user acts on) comes from the **Go
API**, specifically the client-scoped cross-property list endpoints added in
PR #374. No new analytics endpoints are built in Go; no bespoke
`/insights/...` REST API.

## Decisions made

| Decision | Choice |
|---|---|
| Analytics engine | Cube.js (already deployed; `services/cube`) |
| Operational data on Overview | Compose from existing cross-property Go list endpoints (Approach A) — no aggregated `/overview` endpoint |
| V1 insights pages | All eight; Accounting excluded (no ledger/budget data backing) |
| Scope | Portfolio-level only; components take optional `propertyId` for a later property-level mirror |
| Filter bar v1 | Date range + property selector + compare-previous-period; state in URL search params |
| `/` nav label | "Overview" |
| Insights navigation | Collapsible sidebar sub-items (Activities → Announcements pattern) |

## Navigation & routes

**Sidebar (`app/components/app-sidebar.tsx`):**

- `/` item renamed from "Insights" to **Overview** (keeps `isHome`, new icon
  e.g. `LayoutDashboard`).
- New **Insights** item at `/insights`, collapsible with sub-items: Overview,
  Revenue, Occupancy, Rent Collection, Leases, Tenants, Maintenance, Expenses.
- The `tour-nav-insights` id moves to the new Insights item; tour copy in
  `app/lib/tours.ts` updated to match.

**New route files:**

```
_auth._dashboard.insights.tsx                 layout: filter bar + <Outlet/>, breadcrumb 'Insights'
_auth._dashboard.insights._index.tsx          Insights Overview (executive summary)
_auth._dashboard.insights.revenue.tsx
_auth._dashboard.insights.occupancy.tsx
_auth._dashboard.insights.rent-collection.tsx
_auth._dashboard.insights.leases.tsx
_auth._dashboard.insights.tenants.tsx
_auth._dashboard.insights.maintenance.tsx
_auth._dashboard.insights.expenses.tsx
```

`_auth._dashboard._index.tsx` remains the `/` route; breadcrumb changes from
'Insights' to 'Overview'; renders the rebuilt Overview module.

**Module structure:**

```
app/modules/overview/          replaces app/modules/dashboard/ (renamed + rebuilt)
app/modules/insights/
├── layout/                    filter bar + insights layout chrome
├── overview/  revenue/  occupancy/  rent-collection/
├── leases/  tenants/  maintenance/  expenses/
└── components/                shared widgets: KpiCard, TrendChart, BreakdownChart,
                               RankingTable, ComparisonBadge
```

Shared widgets take a `CubeQuery` plus presentation props so pages are
composition, not bespoke chart code. Charts follow the existing Recharts
patterns from `modules/dashboard/chart.tsx`. All components use Shadcn
primitives and CSS variables (`bg-background`, `text-foreground`, …) so dark
and light mode both work; `Card` components use `shadow-none` per project
convention.

Every insights page component accepts an optional `propertyId` prop
(translated into a Cube filter). Only portfolio routes ship now; this prop is
the hook for the later property-level mirror under
`/properties/:propertyId/insights/...`.

## The `/` Overview page

Four blocks, top to bottom. All data client-side via TanStack Query (no SSR
loader data, matching the current dashboard); skeletons while loading.

1. **KPI snapshot cards (Cube).** Existing `SectionCards` carries over:
   Rental Income (this month, MoM change), Active Leases, Occupancy Rate —
   plus a new Outstanding Rent card (`Invoices.outstandingAmount`, already
   modeled). Each card links to its insights page (e.g. Outstanding Rent →
   `/insights/rent-collection`).

2. **Action-required lists (Go API).** Two-column grid of compact cards, each
   a top-5 list with a count badge and a "View all" link:

   | Widget | Source |
   |---|---|
   | Overdue rent | `GET /v1/admin/clients/{clientId}/invoices` filtered to overdue |
   | Expiring leases (next 60 days) | `GET .../leases` filtered by end date |
   | Open maintenance requests | `GET .../maintenance-requests?status=open` |
   | Vacant units | Cube `Units` status dimension (count + link only) |

   Rows show tenant/unit context (endpoints already populate relations) and
   click through to the record's detail page.

3. **Recent activity feed (Go API).** One card listing the latest ~10 events
   merged client-side from recent invoices-paid, new leases, and new
   maintenance requests (each endpoint sorted by created date; merged and
   sorted by timestamp). No backend aggregation endpoint.

4. **Mini trend chart (Cube).** Compact revenue trend (last 6 months; the
   existing `ChartBarDefault` slimmed down) with a "Full analysis →" link to
   `/insights/revenue`.

Go-API widgets get TanStack Query hooks in the relevant `app/api/<resource>/`
folders (reusing cross-property hooks where they already exist from the mobile
work). Cube widgets use `useGetAnalyticsToken` + `useCubeQuery`.

## Filter bar & filter state

Lives in the `insights.tsx` layout above `<Outlet/>`:

- **Date range** — presets (Last 30 days, Last 3/6/12 months, YTD, Custom)
  via the existing `DateRangePicker` component
- **Property** — All properties / single property (options from the client's
  properties list, same data source the sidebar's `NavProperties` uses)
- **Compare previous period** — toggle

State lives in URL search params (`?from=&to=&property=&compare=`), managed by
a `useInsightsFilters()` hook that parses/writes params and returns
`{ dateRange, propertyId, compare }` plus ready-made Cube
`timeDimensions`/`filters` fragments. Sidebar sub-nav links preserve the
search string so filters persist across insights pages, survive refresh, and
are shareable. Defaults: last 12 months, all properties, compare off.

**Compare mode:** widgets that support it run the same Cube query for the
previous period (Cube `compareDateRange`) and render a delta via
`ComparisonBadge`. Charts overlay or show % change; tables show current period
only.

## Insights pages & Cube model changes

Each page is a grid of the shared widgets. All page data comes from Cube.

| Page | Widgets | Cube changes needed |
|---|---|---|
| Overview | Exec KPIs; revenue/occupancy/expense trends; top/bottom properties; risk summary (overdue, expirations, open maintenance) | none — composes measures from other pages |
| Revenue | Revenue trend; by property; by payment method (`Payments.rail`); avg revenue per unit; MoM growth | none |
| Occupancy | Occupancy rate + trend; by property; vacant units; move-ins/move-outs | `Leases`: move-in/move-out measures (from `moveInDate` and end dates) |
| Rent Collection | Collection rate; outstanding trend; outstanding by property; aging buckets; payment method split | `Invoices`: `collectionRate` measure; aging-bucket dimension (days overdue) |
| Leases | Active count; expiration timeline; renewal vs termination; avg duration; distribution by status | `Leases`: `expiringCount`; renewal/termination measures (via `parent_lease_id`); avg-duration measure |
| Tenants | Tenant growth; move-ins/outs; avg stay; repeat tenants | **new `Tenants.js` cube** (id, propertyId, clientId, createdAt) + join to Leases |
| Maintenance | Open vs completed; resolution time; volume trend; by category; cost (linked expenses) | `MaintenanceRequests`: `avgResolutionTime` measure; category dimension if missing |
| Expenses | Expense trend; by category; by property; per unit; largest categories | `Expenses`: category dimension check; per-unit is a frontend calc from two queries |

Cube work is confined to `services/cube/model/cubes/` — additive measures on
existing cubes plus one new Tenants cube. All new measures respect the
existing `clientId` security-context filter pattern. Any widget whose
underlying DB column doesn't exist is dropped from its page rather than
triggering schema changes (flagged during implementation planning).

## Go API changes

Small and additive only:

- Missing filter/sort query params on the cross-property list endpoints
  (`/v1/admin/clients/{clientId}/leases|invoices|maintenance-requests|...`),
  checked handler-by-handler during implementation planning. Likely
  candidates: invoice overdue/status filter, lease `end_date_before` /
  expiring filter, `sort` + `limit` params for the activity feed.
- Every touched handler gets its Swagger godoc annotations updated.
- No new endpoints. No changes to the analytics token handler.

## Phasing

Each phase independently shippable:

1. **Foundation** — sidebar/tour changes; `/insights` layout + filter bar +
   `useInsightsFilters`; shared widget components; Insights Overview page.
2. **Overview rebuild** — dissolve `modules/dashboard` into `modules/overview`
   with the four blocks, plus any Go query-param additions it needs.
3. **Core analytics pages** — Revenue, Occupancy, Rent Collection.
4. **Remaining pages** — Leases, Maintenance, Expenses, then Tenants (new
   cube) last.

## Error handling & empty states

- Every Cube widget has a skeleton loading state and an inline error state
  (widget-level, not page-level, so one failed query doesn't blank the page).
- Empty states designed in from the start: new accounts with no data see
  friendly zero states, not broken charts.
- The analytics token query already retries once and refreshes at 45 min;
  widgets render their error state if the token fetch fails.

## Verification

- `yarn types:check` + `yarn lint` per phase; every new UI checked in both
  light and dark mode.
- Cube changes verified by running the cube service locally against dev data
  and exercising new measures via the REST API before wiring the frontend.
- Go param additions get handler tests following existing patterns; Swagger
  docs regenerated.

## Out of scope

- Property-level insights routes (components are `propertyId`-ready; routes
  come in a follow-up)
- Accounting page (no ledger/budget data backing)
- Currency, unit-type, and lease-type filters
- Exports (CSV/PDF), scheduled reports, forecasting, AI insights
