---
id: RENTL-6
title: Add Cube.js to Rentloop for analytics
status: Done
assignee: []
created_date: '2026-03-05 08:48'
updated_date: '2026-03-09 00:53'
labels:
  - analytics
  - infrastructure
milestone: m-6
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Integrate Cube.js as the analytics layer for Rentloop's analytics component.

Cube.js (often called Cube) is an analytics API layer that sits between your database and your frontend.
It turns raw SQL data into fast, structured analytics APIs (REST, GraphQL, SQL, etc.).

Think of it as a semantic layer + caching engine for analytics.

Instead of your frontend directly querying PostgreSQL (Supabase), it queries Cube, and Cube:

Translates requests → SQL queries

Caches results

Pre-aggregates large datasets

Returns analytics-friendly responses (time series, metrics, dimensions)

This is extremely useful for dashboards, BI tools, and analytics-heavy apps.

1. How Cube Fits With Supabase

Supabase already gives you:

PostgreSQL database

Auth

Realtime

Storage

Edge functions

But Supabase is not optimized for heavy analytics queries.

Cube sits on top like this:

Frontend Dashboard
       |
       v
    Cube.js
 (Analytics API)
       |
       v
Supabase PostgreSQL

Benefits:

faster dashboards

reusable metrics

pre-aggregations

no complex SQL in frontend

consistent analytics definitions

2. Example Problem Cube Solves

Imagine your Supabase DB has:

users
orders
products
payments

A dashboard needs:

revenue per month

orders per product

new users per day

Without Cube you’d write SQL like:

SELECT
  date_trunc('month', created_at) AS month,
  SUM(amount) AS revenue
FROM orders
GROUP BY 1
ORDER BY 1

With Cube, you define the metric once and reuse it everywhere.

3. Installing Cube

Install CLI:

npm install -g cubejs-cli

Create a project:

cubejs create my-analytics -d postgres

It will generate:

cubejs-server/
  schema/
  cube.js
  .env
4. Connect Cube to Supabase

Get your Supabase Postgres connection string:

postgres://postgres:<password>@db.supabase.co:5432/postgres

Put it in .env:

CUBEJS_DB_TYPE=postgres
CUBEJS_DB_HOST=db.supabase.co
CUBEJS_DB_NAME=postgres
CUBEJS_DB_USER=postgres
CUBEJS_DB_PASS=yourpassword
CUBEJS_DB_PORT=5432

Run Cube:

npm run dev

Cube will connect to your Supabase database.

5. Create a Cube (Analytics Model)

Example: orders.js

cube(`Orders`, {
  sql: `SELECT * FROM orders`,

  measures: {
    count: {
      type: `count`
    },

    totalRevenue: {
      sql: `amount`,
      type: `sum`
    }
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true
    },

    status: {
      sql: `status`,
      type: `string`
    },

    createdAt: {
      sql: `created_at`,
      type: `time`
    }
  }
});

Now Cube understands:

revenue

orders

time series

6. Query Cube from Your App

Install client:

npm install @cubejs-client/core

Example in React:

import cubejs from "@cubejs-client/core";

const cube = cubejs("CUBE_API_TOKEN", {
  apiUrl: "http://localhost:4000/cubejs-api/v1"
});

const result = await cube.load({
  measures: ["Orders.totalRevenue"],
  timeDimensions: [
    {
      dimension: "Orders.createdAt",
      granularity: "month"
    }
  ]
});

Response:

[
  {
    "Orders.createdAt.month": "2026-01-01",
    "Orders.totalRevenue": 2000
  }
]

Perfect for charts.

7. Pre-Aggregations (Why Cube is Powerful)

If you have millions of rows, Cube can build materialized rollups.

Example:

preAggregations: {
  monthlyRevenue: {
    type: `rollup`,
    measureReferences: [totalRevenue],
    timeDimensionReference: createdAt,
    granularity: `month`
  }
}

Now dashboards load instantly.

8. BI Tools Integration

Cube also exposes a SQL API, meaning tools like:

Metabase

Apache Superset

Tableau

can connect to Cube instead of directly hitting your database.

9. Example for Your SaaS Apps

For your platforms (RentLoop / Mylespudo / Sqorla), Cube could power:

RentLoop

rent collected per month

occupancy rate

maintenance cost per property

Delivery platform

orders per city

delivery time averages

rider performance

School SaaS

fees collected per term

attendance analytics

course performance

10. When You Should Use Cube

Use Cube when you need:

✔ dashboards
✔ analytics APIs
✔ heavy aggregation queries
✔ caching
✔ BI integrations

Don't use Cube for:

❌ normal CRUD queries
❌ transactional APIs

💡 Startup architecture suggestion for you

Supabase (Postgres)
      |
      v
   Cube.js
      |
      v
Analytics Dashboard / Admin Panels

If you want, I can also show you a very powerful architecture where:

Supabase + Cube + ClickHouse

makes your analytics 100–1000x faster (this is what big SaaS companies do).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Cube.js service runs locally and Playground shows correct data for Invoices/Leases/Units queries
- [ ] #2 GET /api/v1/client-user/analytics/token returns a valid signed JWT
- [ ] #3 Property Overview KPI cards show real values (not hardcoded $1,250 / 1,234 etc.)
- [ ] #4 Revenue bar chart shows real monthly invoice income; time range toggle filters data correctly
- [ ] #5 Units pie chart shows correct occupied/available/maintenance breakdown for the property
- [ ] #6 All queries are scoped to the current property_id (no cross-property data leakage)
- [ ] #7 UI renders correctly in both light and dark mode
- [ ] #8 yarn types:check passes with no errors
- [ ] #9 Cube.js service has Fly.io config ready for staging deployment
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Implementation Plan

### Architecture
- Cube.js as a standalone Fly.io service (`services/cube/`) connected directly to the same PostgreSQL DB
- Go backend signs Cube.js JWTs via a new `GET /api/v1/client-user/analytics/token` endpoint
- Frontend fetches token then queries Cube.js REST API using `@cubejs-client/core` pattern
- Existing Recharts + Shadcn chart wrappers are reused (already integrated)

### 1. New Cube.js Service (`services/cube/`)
- `cube.js` config: postgres driver using `DB_HOST/PORT/USER/PASS/NAME/SSLMODE` env vars + `CUBEJS_API_SECRET`
- `model/Invoices.yml`: measures (count, totalAmount, paidAmount), dimensions (status, context_type, property_id), time (issued_at, paid_at)
- `model/Leases.yml`: measures (count, activeCount, totalRentFee), dimensions (status, property_id, unit_id), time (activated_at, move_in_date)
- `model/Units.yml`: measures (count, occupancyRate), dimensions (status, type, property_id)
- `model/Payments.yml`: measures (count, totalAmount), dimensions (status, rail, provider), time (successful_at)
- `Dockerfile`, `fly.staging.toml` (app: rentloop-cube-staging, region: lhr, port: 4000)
- `.env.example`

### 2. Go Backend (`services/main/`)
- `internal/handlers/analytics.go` (NEW): `GET /api/v1/client-user/analytics/token` — signs HS256 JWT with payload `{ u: { clientId } }`, 1h expiry, using `golang-jwt/jwt`
- `internal/config/config.go` (MODIFY): add `CubeApiSecret string` from `CUBEJS_API_SECRET`
- `internal/router/client-user.go` (MODIFY): register the analytics token route
- `.envrc.example` (MODIFY): add `CUBEJS_API_SECRET=`

### 3. Frontend API Layer (`apps/property-manager/`)
- `app/lib/constants.ts`: add `ANALYTICS_TOKEN: 'analytics_token'` to `QUERY_KEYS`
- `app/api/analytics/index.ts` (NEW): `useGetAnalyticsToken()` hook + `useCubeQuery(token, query)` for REST queries to Cube.js
- `.env`: add `VITE_CUBEJS_API_URL=https://rentloop-cube-staging.fly.dev`

### 4. Replace Mock Charts
- `components/chart.tsx`: fetch Invoices paidAmount grouped by month, wire time range toggle to date filter
- `components/cards.tsx`: four live KPI queries — Total Rental Income, New Tenants (active leases this month), Occupancy Rate, Growth Rate (MoM delta)
- `components/units-chart.tsx`: fetch Units count grouped by status for current property_id
<!-- SECTION:PLAN:END -->
