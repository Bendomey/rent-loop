# Insights Module — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split analytics out of the home page: `/` becomes an "Overview" nav item, and a new `/insights` module ships with a shared filter bar and an executive Insights Overview page powered by Cube.js.

**Architecture:** New `/insights` layout route (React Router v7 dot-notation) holds a URL-search-param-backed filter bar; child pages are grids of shared widget components that query Cube.js via the existing `useGetAnalyticsToken` + `useCubeQuery` layer in `app/api/analytics/index.ts`. One additive Cube model change (`Leases.moveOutDate`). No Go backend changes in this phase.

**Tech Stack:** React Router v7, React 19, TypeScript, TanStack Query v5, Tailwind v4, Shadcn UI (`ChartContainer`/Recharts), Cube.js (services/cube), dayjs (`localizedDayjs`).

**Spec:** `docs/superpowers/specs/2026-07-18-insights-module-design.md`

## Global Constraints

- **NEVER run `git commit`** (repo rule in CLAUDE.md). Leave all changes unstaged; the user commits. Tasks end at verification, not commit.
- All UI must work in **both dark and light mode**: Shadcn primitives + CSS variables (`bg-background`, `text-muted-foreground`, …); no raw one-mode colors.
- `Card` components always get `className="shadow-none"` (except where an existing pattern like the dashboard KPI gradient is copied verbatim).
- Use `safeString()` from `~/lib/strings` instead of `?? ''` for nullable strings.
- Dates: `localizedDayjs` from `~/lib/date`; format `'YYYY-MM-DD'` for Cube date ranges.
- Money: Cube returns **pesewas**; display via `formatAmount(convertPesewasToCedis(n))` from `~/lib/format-amount`.
- After every task: `yarn types:check` and `yarn lint` (run from `apps/property-manager/`) must pass. `yarn types:check` also generates the `./+types/*` route types new route files import.
- Unused imports are lint **errors**; unhandled promises need the `void` operator.
- Charts in this phase are single-series in `var(--color-primary)` on themed surfaces — no legend (the card title names the series), tooltips on, recessive grid (`CartesianGrid vertical={false}`), rounded bar ends (`radius={8}`). Multi-series/categorical charts arrive in Phase 3 and must run the dataviz palette validator then.
- Working directory for all frontend commands: `apps/property-manager/`. Cube model work: `services/cube/`.

---

### Task 1: Add `moveOutDate` dimension to the Leases cube

The Insights Overview risk summary needs "active leases expiring in the next 60 days". The `leases.move_out_date` column exists (see `services/main/internal/models/lease.go:49`) but is not exposed in the cube. Open-ended leases use a `2099-01-01` sentinel value — a "next 60 days" date-range filter naturally excludes it, so no special handling is needed.

**Files:**
- Modify: `services/cube/model/cubes/Leases.js`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: Cube time dimension `Leases.moveOutDate`, queried by Task 6's risk summary as `timeDimensions: [{ dimension: 'Leases.moveOutDate', dateRange: [today, today+60d] }]`.

- [ ] **Step 1: Add the dimension**

In `services/cube/model/cubes/Leases.js`, inside `dimensions: { … }`, after the `moveInDate` block, add:

```js
    moveOutDate: {
      sql: `move_out_date`,
      type: `time`,
      title: `Move-out Date`,
    },
```

- [ ] **Step 2: Syntax-check the model file**

Run: `node --check /Users/domeybenjamin/Kodes/personal/rent-loop/services/cube/model/cubes/Leases.js`
Expected: no output, exit 0. (Full behavioral verification happens in Task 7 once the frontend queries it; the cube service deploys via `.github/workflows/cube-deploy-staging.yml`.)

---

### Task 2: Rename `/` to Overview and add the Insights sidebar group + tour

**Files:**
- Modify: `apps/property-manager/app/components/app-sidebar.tsx`
- Modify: `apps/property-manager/app/lib/tours.ts`
- Modify: `apps/property-manager/app/routes/_auth._dashboard._index.tsx`

**Interfaces:**
- Consumes: `NavMain` item shape (`app/components/nav-main.tsx`) — sub-item links compose as `${item.url}${subItem.url}`; `isComingSoon: true` routes a sub-item to `COMING_SOON_ROUTE`.
- Produces: sidebar links to `/insights` (live) and `/insights/{revenue,occupancy,rent-collection,leases,tenants,maintenance,expenses}` (coming-soon; later phases flip `isComingSoon` off). Tour element ids `#tour-nav-overview` (on `/` item) and `#tour-nav-insights` (on Insights item).

- [ ] **Step 1: Update the sidebar nav data**

In `app/components/app-sidebar.tsx`, add `LayoutDashboard` to the lucide-react import:

```ts
import {
	GalleryVerticalEnd,
	Settings2,
	LifeBuoy,
	Megaphone,
	PieChart,
	House,
	BookOpenText,
	LayoutDashboard,
} from 'lucide-react'
```

Replace the first `navMain` entry (the `title: 'Insights'` object at the top of `data.navMain`) with these two entries:

```ts
		{
			title: 'Overview',
			isHome: true,
			url: '/',
			icon: LayoutDashboard,
			id: 'tour-nav-overview',
		},
		{
			title: 'Insights',
			url: '/insights',
			icon: PieChart,
			id: 'tour-nav-insights',
			items: [
				{ title: 'Overview', url: '' },
				{ title: 'Revenue', url: '/revenue', isComingSoon: true },
				{ title: 'Occupancy', url: '/occupancy', isComingSoon: true },
				{ title: 'Rent Collection', url: '/rent-collection', isComingSoon: true },
				{ title: 'Leases', url: '/leases', isComingSoon: true },
				{ title: 'Tenants', url: '/tenants', isComingSoon: true },
				{ title: 'Maintenance', url: '/maintenance', isComingSoon: true },
				{ title: 'Expenses', url: '/expenses', isComingSoon: true },
			],
		},
```

(`NavMain` renders items with `items` as a collapsible group; the `Overview` sub-item's empty `url` composes to `/insights`, and its active check is `pathname === '/insights'`, which is correct for the index page.)

- [ ] **Step 2: Update the dashboard tour**

In `app/lib/tours.ts`:

a. Bump the storage key so the changed tour re-runs for existing users:

```ts
	DASHBOARD: 'rent-loop:tour-v2',
```

b. In `DASHBOARD_TOUR_STEPS`, replace the existing `#tour-nav-insights` step (currently titled "Insights" / "Your command center…") with these two steps, keeping the welcome step before and the `#tour-nav-properties` step after:

```ts
	{
		element: '#tour-nav-overview',
		popover: {
			title: 'Overview',
			description:
				'Your daily command center. See key numbers at a glance plus what needs your attention: overdue rent, expiring leases, and open maintenance requests.',
			side: 'right',
			align: 'start',
		},
	},
	{
		element: '#tour-nav-insights',
		popover: {
			title: 'Insights',
			description:
				'Analytics for your portfolio. Explore revenue, occupancy, rent collection, and more — filter by date range or property, and compare against previous periods.',
			side: 'right',
			align: 'start',
		},
	},
```

- [ ] **Step 3: Update the `/` breadcrumb**

In `app/routes/_auth._dashboard._index.tsx`, change:

```ts
export const handle = {
	breadcrumb: 'Overview',
}
```

- [ ] **Step 4: Verify**

Run (from `apps/property-manager/`): `yarn types:check && yarn lint`
Expected: both pass with no errors.

---

### Task 3: `useInsightsFilters` hook (URL-param filter state)

**Files:**
- Create: `apps/property-manager/app/modules/insights/use-insights-filters.ts`

**Interfaces:**
- Consumes: `CubeFilter`, `CubeTimeDimension` types exported from `~/api/analytics`; `localizedDayjs` from `~/lib/date`; `useSearchParams` from `react-router`.
- Produces (used by Tasks 4 and 6):

```ts
function useInsightsFilters(): {
	from: string // 'YYYY-MM-DD', default: 12 months ago
	to: string // 'YYYY-MM-DD', default: today
	propertyId?: string // undefined = all properties
	compare: boolean
	setFilters: (updates: Partial<{ from: string; to: string; propertyId?: string; compare: boolean }>) => void
	previousRange: [string, string] // equal-length period ending the day before `from`
	timeDimension: (dimension: string, granularity?: CubeTimeDimension['granularity']) => CubeTimeDimension
	propertyFilter: (member: string) => CubeFilter[]
}
```

- [ ] **Step 1: Write the hook**

Create `app/modules/insights/use-insights-filters.ts`:

```ts
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { CubeFilter, CubeTimeDimension } from '~/api/analytics'
import { localizedDayjs } from '~/lib/date'

const DATE_FORMAT = 'YYYY-MM-DD'

export interface InsightsFilters {
	from: string
	to: string
	propertyId?: string
	compare: boolean
}

/**
 * Shared filter state for all /insights pages, backed by URL search params
 * (?from=&to=&property=&compare=1) so filters persist across insights pages,
 * survive refresh, and are shareable. Defaults: last 12 months, all
 * properties, compare off.
 */
export function useInsightsFilters() {
	const [searchParams, setSearchParams] = useSearchParams()

	const from =
		searchParams.get('from') ??
		localizedDayjs().subtract(12, 'month').format(DATE_FORMAT)
	const to = searchParams.get('to') ?? localizedDayjs().format(DATE_FORMAT)
	const propertyId = searchParams.get('property') ?? undefined
	const compare = searchParams.get('compare') === '1'

	const setFilters = useCallback(
		(updates: Partial<InsightsFilters>) => {
			setSearchParams(
				(prev) => {
					const next = new URLSearchParams(prev)
					if (updates.from !== undefined) next.set('from', updates.from)
					if (updates.to !== undefined) next.set('to', updates.to)
					if ('propertyId' in updates) {
						if (updates.propertyId) next.set('property', updates.propertyId)
						else next.delete('property')
					}
					if (updates.compare !== undefined) {
						if (updates.compare) next.set('compare', '1')
						else next.delete('compare')
					}
					return next
				},
				{ preventScrollReset: true },
			)
		},
		[setSearchParams],
	)

	// Equal-length period ending the day before `from`, for compare mode.
	const previousRange = useMemo((): [string, string] => {
		const fromDate = localizedDayjs(from)
		const days = localizedDayjs(to).diff(fromDate, 'day')
		return [
			fromDate.subtract(days + 1, 'day').format(DATE_FORMAT),
			fromDate.subtract(1, 'day').format(DATE_FORMAT),
		]
	}, [from, to])

	const timeDimension = useCallback(
		(
			dimension: string,
			granularity?: CubeTimeDimension['granularity'],
		): CubeTimeDimension => ({
			dimension,
			...(granularity ? { granularity } : {}),
			dateRange: [from, to] as [string, string],
		}),
		[from, to],
	)

	const propertyFilter = useCallback(
		(member: string): CubeFilter[] =>
			propertyId
				? [{ member, operator: 'equals', values: [propertyId] }]
				: [],
		[propertyId],
	)

	return {
		from,
		to,
		propertyId,
		compare,
		setFilters,
		previousRange,
		timeDimension,
		propertyFilter,
	}
}
```

- [ ] **Step 2: Verify**

Run: `yarn types:check && yarn lint`
Expected: both pass. (The hook is exercised by Tasks 4 and 6.)

---

### Task 4: Insights layout route + filter bar

**Files:**
- Create: `apps/property-manager/app/modules/insights/layout/filter-bar.tsx`
- Create: `apps/property-manager/app/modules/insights/layout/index.tsx`
- Create: `apps/property-manager/app/modules/insights/index.ts`
- Modify: `apps/property-manager/app/modules/index.ts`
- Create: `apps/property-manager/app/routes/_auth._dashboard.insights.tsx`

**Interfaces:**
- Consumes: `useInsightsFilters` (Task 3); `useGetClientUserProperties(clientId, query)` from `~/api/client-user-properties` (same call shape as `app/components/nav-properties.tsx:19-28`); `DateRangePicker` from `~/components/ui/date-ranger-picker` (props: `initialDateFrom`, `initialDateTo`, `onUpdate({ range })`, `showCompare`, `align`); `Switch`, `Label`, `Select` UI primitives; `useClient` from `~/providers/client-provider`.
- Produces: `InsightsLayoutModule` (renders heading, `InsightsFilterBar`, and `<Outlet/>`), exported through the `~/modules` barrel. Route `/insights` with breadcrumb `'Insights'`.

- [ ] **Step 1: Write the filter bar**

Create `app/modules/insights/layout/filter-bar.tsx`:

```tsx
import { useMemo } from 'react'
import { useGetClientUserProperties } from '~/api/client-user-properties'
import { DateRangePicker } from '~/components/ui/date-ranger-picker'
import { Label } from '~/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useInsightsFilters } from '../use-insights-filters'

const ALL_PROPERTIES = 'all'

export function InsightsFilterBar() {
	const { from, to, propertyId, compare, setFilters } = useInsightsFilters()
	const { clientUser } = useClient()

	const { data: propertiesData } = useGetClientUserProperties(
		safeString(clientUser?.client_id),
		{
			pagination: { page: 1, per: 50 },
			sorter: {},
			search: {},
			populate: ['Property'],
			filters: { client_user_id: clientUser?.id },
		},
	)

	const properties = useMemo(
		() =>
			(propertiesData?.rows ?? []).flatMap((row) =>
				row.property
					? [{ id: row.property.id, name: row.property.name }]
					: [],
			),
		[propertiesData],
	)

	return (
		<div className="flex flex-col gap-3 md:flex-row md:items-center">
			<DateRangePicker
				key={`${from}:${to}`}
				initialDateFrom={from}
				initialDateTo={to}
				showCompare={false}
				align="start"
				onUpdate={({ range }) => {
					setFilters({
						from: localizedDayjs(range.from).format('YYYY-MM-DD'),
						to: localizedDayjs(range.to ?? range.from).format('YYYY-MM-DD'),
					})
				}}
			/>
			<Select
				value={propertyId ?? ALL_PROPERTIES}
				onValueChange={(value) =>
					setFilters({
						propertyId: value === ALL_PROPERTIES ? undefined : value,
					})
				}
			>
				<SelectTrigger className="w-full md:w-56">
					<SelectValue placeholder="All properties" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_PROPERTIES}>All properties</SelectItem>
					{properties.map((property) => (
						<SelectItem key={property.id} value={property.id}>
							{property.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<div className="flex items-center gap-2">
				<Switch
					id="insights-compare"
					checked={compare}
					onCheckedChange={(checked) => setFilters({ compare: checked })}
				/>
				<Label htmlFor="insights-compare">Compare previous period</Label>
			</div>
		</div>
	)
}
```

(The `key={`${from}:${to}`}` remounts `DateRangePicker` when the URL changes from elsewhere, since it holds internal state seeded from `initialDateFrom`/`initialDateTo`. If TypeScript reports the property row type on `row.property` differently — e.g. `row?.property` optional chaining as in `nav-properties.tsx:51` — match whatever the `ClientUserProperty` type requires.)

- [ ] **Step 2: Write the layout module**

Create `app/modules/insights/layout/index.tsx`:

```tsx
import { Outlet } from 'react-router'
import { InsightsFilterBar } from './filter-bar'
import { TypographyH2, TypographyMuted } from '~/components/ui/typography'

export function InsightsLayoutModule() {
	return (
		<main className="px-2 py-5 md:px-7">
			<div className="flex flex-col gap-4 px-4 lg:px-6">
				<div>
					<TypographyH2>Insights</TypographyH2>
					<TypographyMuted>
						Understand how your portfolio is performing.
					</TypographyMuted>
				</div>
				<InsightsFilterBar />
			</div>
			<div className="px-4 py-4 md:py-6 lg:px-6">
				<Outlet />
			</div>
		</main>
	)
}
```

- [ ] **Step 3: Barrel exports**

Create `app/modules/insights/index.ts`:

```ts
export * from './layout'
```

(Task 5 and 6 append to this file.) In `app/modules/index.ts`, add alongside the existing exports (alphabetical placement near `export * from './dashboard'`):

```ts
export * from './insights'
```

- [ ] **Step 4: Create the layout route**

Create `app/routes/_auth._dashboard.insights.tsx`:

```tsx
import { InsightsLayoutModule } from '~/modules'

export const handle = {
	breadcrumb: 'Insights',
}

export default InsightsLayoutModule
```

- [ ] **Step 5: Verify**

Run: `yarn types:check && yarn lint`
Expected: both pass. (Visiting `/insights` renders the heading + filter bar with an empty outlet until Task 6 adds the index page.)

---

### Task 5: Shared insights widget components

**Files:**
- Create: `apps/property-manager/app/modules/insights/components/kpi-card.tsx`
- Create: `apps/property-manager/app/modules/insights/components/comparison-badge.tsx`
- Create: `apps/property-manager/app/modules/insights/components/trend-chart.tsx`
- Create: `apps/property-manager/app/modules/insights/components/ranking-table.tsx`
- Modify: `apps/property-manager/app/modules/insights/index.ts`

**Interfaces:**
- Consumes: Shadcn `Card`/`Skeleton`/`Badge`/`Table`/`ChartContainer` primitives; Recharts.
- Produces (Task 6 and later phases build pages from exactly these):

```ts
function KpiCard(props: { label: string; value: ReactNode; isPending: boolean; badge?: ReactNode; footer?: ReactNode }): JSX.Element
function ComparisonBadge(props: { current: number; previous: number }): JSX.Element | null
interface TrendPoint { period: string; value: number }
function TrendChart(props: { title: string; description?: string; data: TrendPoint[]; isPending: boolean; valueFormatter?: (value: number) => string; emptyMessage?: string }): JSX.Element
interface RankingRow { id: string; name: string; value: number }
function RankingTable(props: { title: string; description?: string; rows: RankingRow[]; isPending: boolean; valueLabel?: string; valueFormatter?: (value: number) => string; emptyMessage?: string }): JSX.Element
```

- [ ] **Step 1: KpiCard**

Create `app/modules/insights/components/kpi-card.tsx`:

```tsx
import type { ReactNode } from 'react'
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'

export function KpiCard({
	label,
	value,
	isPending,
	badge,
	footer,
}: {
	label: string
	value: ReactNode
	isPending: boolean
	badge?: ReactNode
	footer?: ReactNode
}) {
	return (
		<Card className="@container/card shadow-none">
			<CardHeader>
				<CardDescription>{label}</CardDescription>
				<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{isPending ? <Skeleton className="h-8 w-24" /> : value}
				</CardTitle>
				{badge ? <CardAction>{badge}</CardAction> : null}
			</CardHeader>
			{footer ? (
				<CardFooter className="text-muted-foreground text-sm">
					{footer}
				</CardFooter>
			) : null}
		</Card>
	)
}
```

- [ ] **Step 2: ComparisonBadge**

Create `app/modules/insights/components/comparison-badge.tsx`:

```tsx
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Badge } from '~/components/ui/badge'

/**
 * Delta vs the previous period, e.g. "+12.4%". Renders nothing when the
 * previous value is 0 (no meaningful percentage exists).
 */
export function ComparisonBadge({
	current,
	previous,
}: {
	current: number
	previous: number
}) {
	if (previous === 0) return null
	const deltaPct = ((current - previous) / previous) * 100
	const up = deltaPct >= 0
	return (
		<Badge variant="outline">
			{up ? <TrendingUp /> : <TrendingDown />}
			{up ? '+' : ''}
			{deltaPct.toFixed(1)}%
		</Badge>
	)
}
```

- [ ] **Step 3: TrendChart**

Create `app/modules/insights/components/trend-chart.tsx`:

```tsx
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from '~/components/ui/chart'
import { Skeleton } from '~/components/ui/skeleton'

export interface TrendPoint {
	period: string
	value: number
}

/**
 * Single-series bar trend. The card title names the series, so no legend is
 * rendered; identity is never color-alone.
 */
export function TrendChart({
	title,
	description,
	data,
	isPending,
	valueFormatter = (value) => value.toLocaleString(),
	emptyMessage = 'No data for this period',
}: {
	title: string
	description?: string
	data: TrendPoint[]
	isPending: boolean
	valueFormatter?: (value: number) => string
	emptyMessage?: string
}) {
	const hasData = data.length > 0 && data.some((point) => point.value !== 0)
	const config = {
		value: { label: title, color: 'var(--color-primary)' },
	} satisfies ChartConfig

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description ? (
					<CardDescription>{description}</CardDescription>
				) : null}
			</CardHeader>
			<CardContent>
				{isPending ? (
					<Skeleton className="h-[220px] w-full rounded-lg" />
				) : !hasData ? (
					<div className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
						{emptyMessage}
					</div>
				) : (
					<ChartContainer config={config} className="h-[220px] w-full">
						<BarChart accessibilityLayer data={data}>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="period"
								tickLine={false}
								tickMargin={10}
								axisLine={false}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								width={60}
								tickFormatter={(value: number) => valueFormatter(value)}
							/>
							<ChartTooltip
								cursor={false}
								content={
									<ChartTooltipContent
										formatter={(value) => valueFormatter(Number(value))}
									/>
								}
							/>
							<Bar dataKey="value" fill="var(--color-primary)" radius={8} />
						</BarChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	)
}
```

- [ ] **Step 4: RankingTable**

Create `app/modules/insights/components/ranking-table.tsx`:

```tsx
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '~/components/ui/table'

export interface RankingRow {
	id: string
	name: string
	value: number
}

export function RankingTable({
	title,
	description,
	rows,
	isPending,
	valueLabel = 'Value',
	valueFormatter = (value) => value.toLocaleString(),
	emptyMessage = 'No data for this period',
}: {
	title: string
	description?: string
	rows: RankingRow[]
	isPending: boolean
	valueLabel?: string
	valueFormatter?: (value: number) => string
	emptyMessage?: string
}) {
	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description ? (
					<CardDescription>{description}</CardDescription>
				) : null}
			</CardHeader>
			<CardContent>
				{isPending ? (
					<Skeleton className="h-40 w-full rounded-lg" />
				) : rows.length === 0 ? (
					<div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
						{emptyMessage}
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10">#</TableHead>
								<TableHead>Property</TableHead>
								<TableHead className="text-right">{valueLabel}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row, index) => (
								<TableRow key={row.id}>
									<TableCell className="text-muted-foreground">
										{index + 1}
									</TableCell>
									<TableCell className="font-medium">{row.name}</TableCell>
									<TableCell className="text-right tabular-nums">
										{valueFormatter(row.value)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	)
}
```

- [ ] **Step 5: Export from the insights barrel**

Append to `app/modules/insights/index.ts`:

```ts
export * from './components/comparison-badge'
export * from './components/kpi-card'
export * from './components/ranking-table'
export * from './components/trend-chart'
```

- [ ] **Step 6: Verify**

Run: `yarn types:check && yarn lint`
Expected: both pass.

---

### Task 6: Insights Overview page

**Files:**
- Create: `apps/property-manager/app/modules/insights/overview/kpi-row.tsx`
- Create: `apps/property-manager/app/modules/insights/overview/trends.tsx`
- Create: `apps/property-manager/app/modules/insights/overview/property-rankings.tsx`
- Create: `apps/property-manager/app/modules/insights/overview/risk-summary.tsx`
- Create: `apps/property-manager/app/modules/insights/overview/index.tsx`
- Modify: `apps/property-manager/app/modules/insights/index.ts`
- Create: `apps/property-manager/app/routes/_auth._dashboard.insights._index.tsx`

**Interfaces:**
- Consumes: `useInsightsFilters` (Task 3); `KpiCard`, `ComparisonBadge`, `TrendChart`, `RankingTable`, `TrendPoint`, `RankingRow` (Task 5); `Leases.moveOutDate` (Task 1); `useCubeQuery`, `useGetAnalyticsToken` from `~/api/analytics`; `useGetClientUserProperties` from `~/api/client-user-properties`; `useClient`; `formatAmount`, `convertPesewasToCedis`; `safeString`; `localizedDayjs`.
- Produces: `InsightsOverviewModule` (default component of the `/insights` index route).

**Deliberate deferral:** the spec's Insights Overview lists revenue/occupancy/expense trends. The occupancy *trend* is omitted here — `Units.status` is current-state only, so a historical occupancy series needs the lease-based occupancy measures that Phase 3's Occupancy page adds. Phase 3 adds the occupancy TrendChart to this page. Current occupancy rate is still shown as a KPI card.

**Cube measures used (all existing except `Leases.moveOutDate` from Task 1):** `Invoices.paidAmount`, `Invoices.outstandingAmount`, `Expenses.totalAmount`, `Leases.activeCount`, `Units.count`, `Units.occupiedCount`, `MaintenanceRequests.newCount`, `MaintenanceRequests.inProgressCount`, `MaintenanceRequests.inReviewCount`. Property dimensions: `Invoices.propertyId`, `Expenses.propertyId`, `Leases.propertyId`, `Units.propertyId`, `MaintenanceRequests.propertyId`.

- [ ] **Step 1: KPI row**

Create `app/modules/insights/overview/kpi-row.tsx`:

```tsx
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { ComparisonBadge } from '../components/comparison-badge'
import { KpiCard } from '../components/kpi-card'
import { useInsightsFilters } from '../use-insights-filters'

interface RevenueRow {
	'Invoices.paidAmount': string | null
}
interface OutstandingRow {
	'Invoices.outstandingAmount': string | null
}
interface ExpenseRow {
	'Expenses.totalAmount': string | null
}
interface LeaseRow {
	'Leases.activeCount': string | null
}
interface UnitRow {
	'Units.count': string | null
	'Units.occupiedCount': string | null
}

function parseNum(value: string | null | undefined): number {
	return value ? Number(value) : 0
}

export function InsightsKpiRow() {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)
	const {
		from,
		to,
		propertyId,
		compare,
		previousRange,
		timeDimension,
		propertyFilter,
	} = useInsightsFilters()

	const scopeKey = [from, to, propertyId ?? 'all']

	const revenueQuery = useCubeQuery<RevenueRow>(
		token,
		['ins-ov-revenue', ...scopeKey],
		{
			measures: ['Invoices.paidAmount'],
			timeDimensions: [timeDimension('Invoices.paidAt')],
			filters: propertyFilter('Invoices.propertyId'),
		},
	)
	const prevRevenueQuery = useCubeQuery<RevenueRow>(
		token,
		['ins-ov-revenue-prev', ...scopeKey],
		{
			measures: ['Invoices.paidAmount'],
			timeDimensions: [
				{ dimension: 'Invoices.paidAt', dateRange: previousRange },
			],
			filters: propertyFilter('Invoices.propertyId'),
		},
		{ enabled: compare },
	)

	const expensesQuery = useCubeQuery<ExpenseRow>(
		token,
		['ins-ov-expenses', ...scopeKey],
		{
			measures: ['Expenses.totalAmount'],
			timeDimensions: [timeDimension('Expenses.createdAt')],
			filters: propertyFilter('Expenses.propertyId'),
		},
	)
	const prevExpensesQuery = useCubeQuery<ExpenseRow>(
		token,
		['ins-ov-expenses-prev', ...scopeKey],
		{
			measures: ['Expenses.totalAmount'],
			timeDimensions: [
				{ dimension: 'Expenses.createdAt', dateRange: previousRange },
			],
			filters: propertyFilter('Expenses.propertyId'),
		},
		{ enabled: compare },
	)

	const outstandingQuery = useCubeQuery<OutstandingRow>(
		token,
		['ins-ov-outstanding', propertyId ?? 'all'],
		{
			measures: ['Invoices.outstandingAmount'],
			filters: propertyFilter('Invoices.propertyId'),
		},
	)

	const leasesQuery = useCubeQuery<LeaseRow>(
		token,
		['ins-ov-active-leases', propertyId ?? 'all'],
		{
			measures: ['Leases.activeCount'],
			filters: propertyFilter('Leases.propertyId'),
		},
	)

	const unitsQuery = useCubeQuery<UnitRow>(
		token,
		['ins-ov-units', propertyId ?? 'all'],
		{
			measures: ['Units.count', 'Units.occupiedCount'],
			filters: propertyFilter('Units.propertyId'),
		},
	)

	const revenue = parseNum(revenueQuery.data?.[0]?.['Invoices.paidAmount'])
	const prevRevenue = parseNum(
		prevRevenueQuery.data?.[0]?.['Invoices.paidAmount'],
	)
	const expenses = parseNum(expensesQuery.data?.[0]?.['Expenses.totalAmount'])
	const prevExpenses = parseNum(
		prevExpensesQuery.data?.[0]?.['Expenses.totalAmount'],
	)
	const outstanding = parseNum(
		outstandingQuery.data?.[0]?.['Invoices.outstandingAmount'],
	)
	const activeLeases = parseNum(leasesQuery.data?.[0]?.['Leases.activeCount'])
	const totalUnits = parseNum(unitsQuery.data?.[0]?.['Units.count'])
	const occupiedUnits = parseNum(
		unitsQuery.data?.[0]?.['Units.occupiedCount'],
	)
	const occupancyRate =
		totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0.0'

	const showCompare = compare && !prevRevenueQuery.isPending

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
			<KpiCard
				label="Revenue"
				isPending={revenueQuery.isPending}
				value={formatAmount(convertPesewasToCedis(revenue))}
				badge={
					showCompare ? (
						<ComparisonBadge current={revenue} previous={prevRevenue} />
					) : undefined
				}
				footer="Paid invoices in the selected period"
			/>
			<KpiCard
				label="Expenses"
				isPending={expensesQuery.isPending}
				value={formatAmount(convertPesewasToCedis(expenses))}
				badge={
					compare && !prevExpensesQuery.isPending ? (
						<ComparisonBadge current={expenses} previous={prevExpenses} />
					) : undefined
				}
				footer="Expenses recorded in the selected period"
			/>
			<KpiCard
				label="Net Income"
				isPending={revenueQuery.isPending || expensesQuery.isPending}
				value={formatAmount(convertPesewasToCedis(revenue - expenses))}
				footer="Revenue minus expenses"
			/>
			<KpiCard
				label="Outstanding Rent"
				isPending={outstandingQuery.isPending}
				value={formatAmount(convertPesewasToCedis(outstanding))}
				footer="Across all issued invoices"
			/>
			<KpiCard
				label="Active Leases"
				isPending={leasesQuery.isPending}
				value={activeLeases.toLocaleString()}
				footer="Currently active tenancy agreements"
			/>
			<KpiCard
				label="Occupancy Rate"
				isPending={unitsQuery.isPending}
				value={`${occupancyRate}%`}
				footer={`${occupiedUnits} of ${totalUnits} units occupied`}
			/>
		</div>
	)
}
```

- [ ] **Step 2: Trend charts**

Create `app/modules/insights/overview/trends.tsx`:

```tsx
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { TrendChart, type TrendPoint } from '../components/trend-chart'
import { useInsightsFilters } from '../use-insights-filters'

interface RevenueTrendRow {
	'Invoices.paidAmount': string | null
	'Invoices.paidAt.month'?: string
}
interface ExpenseTrendRow {
	'Expenses.totalAmount': string | null
	'Expenses.createdAt.month'?: string
}

function amountTick(value: number): string {
	return value >= 1000
		? `GH₵ ${(value / 1000).toFixed(0)}k`
		: formatAmount(value)
}

export function InsightsTrends() {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)
	const { from, to, propertyId, timeDimension, propertyFilter } =
		useInsightsFilters()

	const scopeKey = [from, to, propertyId ?? 'all']

	const revenueTrendQuery = useCubeQuery<RevenueTrendRow>(
		token,
		['ins-ov-revenue-trend', ...scopeKey],
		{
			measures: ['Invoices.paidAmount'],
			timeDimensions: [timeDimension('Invoices.paidAt', 'month')],
			filters: propertyFilter('Invoices.propertyId'),
		},
	)

	const expenseTrendQuery = useCubeQuery<ExpenseTrendRow>(
		token,
		['ins-ov-expense-trend', ...scopeKey],
		{
			measures: ['Expenses.totalAmount'],
			timeDimensions: [timeDimension('Expenses.createdAt', 'month')],
			filters: propertyFilter('Expenses.propertyId'),
		},
	)

	const revenueData: TrendPoint[] = (revenueTrendQuery.data ?? []).map(
		(row) => ({
			period: localizedDayjs(row['Invoices.paidAt.month']).format('MMM YYYY'),
			value: convertPesewasToCedis(parseFloat(row['Invoices.paidAmount'] ?? '0')),
		}),
	)
	const expenseData: TrendPoint[] = (expenseTrendQuery.data ?? []).map(
		(row) => ({
			period: localizedDayjs(row['Expenses.createdAt.month']).format(
				'MMM YYYY',
			),
			value: convertPesewasToCedis(
				parseFloat(row['Expenses.totalAmount'] ?? '0'),
			),
		}),
	)

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<TrendChart
				title="Revenue Trend"
				description="Paid invoice revenue by month"
				data={revenueData}
				isPending={revenueTrendQuery.isPending}
				valueFormatter={amountTick}
			/>
			<TrendChart
				title="Expense Trend"
				description="Recorded expenses by month"
				data={expenseData}
				isPending={expenseTrendQuery.isPending}
				valueFormatter={amountTick}
			/>
		</div>
	)
}
```

- [ ] **Step 3: Property rankings**

Create `app/modules/insights/overview/property-rankings.tsx`:

```tsx
import { useMemo } from 'react'
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import { useGetClientUserProperties } from '~/api/client-user-properties'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { RankingTable, type RankingRow } from '../components/ranking-table'
import { useInsightsFilters } from '../use-insights-filters'

interface RevenueByPropertyRow {
	'Invoices.propertyId': string | null
	'Invoices.paidAmount': string | null
}

/**
 * Top/bottom properties by paid revenue. Rendered only in portfolio scope
 * (the parent hides this section when a single property is selected).
 */
export function PropertyRankings() {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)
	const { from, to, timeDimension } = useInsightsFilters()

	const revenueByPropertyQuery = useCubeQuery<RevenueByPropertyRow>(
		token,
		['ins-ov-revenue-by-property', from, to],
		{
			measures: ['Invoices.paidAmount'],
			dimensions: ['Invoices.propertyId'],
			timeDimensions: [timeDimension('Invoices.paidAt')],
			order: { 'Invoices.paidAmount': 'desc' },
		},
	)

	const { data: propertiesData } = useGetClientUserProperties(
		safeString(clientUser?.client_id),
		{
			pagination: { page: 1, per: 100 },
			sorter: {},
			search: {},
			populate: ['Property'],
			filters: { client_user_id: clientUser?.id },
		},
	)

	const nameById = useMemo(() => {
		const map = new Map<string, string>()
		for (const row of propertiesData?.rows ?? []) {
			if (row.property) map.set(row.property.id, row.property.name)
		}
		return map
	}, [propertiesData])

	const rows: RankingRow[] = (revenueByPropertyQuery.data ?? []).flatMap(
		(row) => {
			const id = row['Invoices.propertyId']
			if (!id) return []
			return [
				{
					id,
					name: nameById.get(id) ?? 'Unknown property',
					value: convertPesewasToCedis(
						parseFloat(row['Invoices.paidAmount'] ?? '0'),
					),
				},
			]
		},
	)

	const top = rows.slice(0, 5)
	const bottom = rows.length > 5 ? rows.slice(-5).reverse() : []

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<RankingTable
				title="Top Properties by Revenue"
				description="Highest paid revenue in the selected period"
				rows={top}
				isPending={revenueByPropertyQuery.isPending}
				valueLabel="Revenue"
				valueFormatter={(value) => formatAmount(value)}
			/>
			{bottom.length > 0 ? (
				<RankingTable
					title="Lowest Revenue Properties"
					description="Lowest paid revenue in the selected period"
					rows={bottom}
					isPending={revenueByPropertyQuery.isPending}
					valueLabel="Revenue"
					valueFormatter={(value) => formatAmount(value)}
				/>
			) : null}
		</div>
	)
}
```

- [ ] **Step 4: Risk summary**

Create `app/modules/insights/overview/risk-summary.tsx`:

```tsx
import { useCubeQuery, useGetAnalyticsToken } from '~/api/analytics'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '~/components/ui/card'
import { Skeleton } from '~/components/ui/skeleton'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useInsightsFilters } from '../use-insights-filters'

interface OutstandingRow {
	'Invoices.outstandingAmount': string | null
}
interface ExpiringRow {
	'Leases.activeCount': string | null
}
interface MaintenanceRow {
	'MaintenanceRequests.newCount': string | null
	'MaintenanceRequests.inProgressCount': string | null
	'MaintenanceRequests.inReviewCount': string | null
}

function parseNum(value: string | null | undefined): number {
	return value ? Number(value) : 0
}

function RiskStat({
	label,
	value,
	isPending,
}: {
	label: string
	value: string
	isPending: boolean
}) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-muted-foreground text-sm">{label}</span>
			{isPending ? (
				<Skeleton className="h-7 w-20" />
			) : (
				<span className="text-xl font-semibold tabular-nums">{value}</span>
			)}
		</div>
	)
}

export function RiskSummary() {
	const { clientUser } = useClient()
	const { data: token } = useGetAnalyticsToken(
		safeString(clientUser?.client_id),
	)
	const { propertyId, propertyFilter } = useInsightsFilters()

	const today = localizedDayjs().format('YYYY-MM-DD')
	const in60Days = localizedDayjs().add(60, 'day').format('YYYY-MM-DD')

	const outstandingQuery = useCubeQuery<OutstandingRow>(
		token,
		['ins-ov-risk-outstanding', propertyId ?? 'all'],
		{
			measures: ['Invoices.outstandingAmount'],
			filters: propertyFilter('Invoices.propertyId'),
		},
	)

	const expiringQuery = useCubeQuery<ExpiringRow>(
		token,
		['ins-ov-risk-expiring', propertyId ?? 'all'],
		{
			measures: ['Leases.activeCount'],
			timeDimensions: [
				{ dimension: 'Leases.moveOutDate', dateRange: [today, in60Days] },
			],
			filters: propertyFilter('Leases.propertyId'),
		},
	)

	const maintenanceQuery = useCubeQuery<MaintenanceRow>(
		token,
		['ins-ov-risk-maintenance', propertyId ?? 'all'],
		{
			measures: [
				'MaintenanceRequests.newCount',
				'MaintenanceRequests.inProgressCount',
				'MaintenanceRequests.inReviewCount',
			],
			filters: propertyFilter('MaintenanceRequests.propertyId'),
		},
	)

	const outstanding = parseNum(
		outstandingQuery.data?.[0]?.['Invoices.outstandingAmount'],
	)
	const expiring = parseNum(expiringQuery.data?.[0]?.['Leases.activeCount'])
	const maintenanceRow = maintenanceQuery.data?.[0]
	const openMaintenance =
		parseNum(maintenanceRow?.['MaintenanceRequests.newCount']) +
		parseNum(maintenanceRow?.['MaintenanceRequests.inProgressCount']) +
		parseNum(maintenanceRow?.['MaintenanceRequests.inReviewCount'])

	return (
		<Card className="shadow-none">
			<CardHeader>
				<CardTitle>Risk Summary</CardTitle>
				<CardDescription>
					Items that may need attention across the selected scope
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
					<RiskStat
						label="Outstanding rent"
						value={formatAmount(convertPesewasToCedis(outstanding))}
						isPending={outstandingQuery.isPending}
					/>
					<RiskStat
						label="Leases expiring in 60 days"
						value={expiring.toLocaleString()}
						isPending={expiringQuery.isPending}
					/>
					<RiskStat
						label="Open maintenance requests"
						value={openMaintenance.toLocaleString()}
						isPending={maintenanceQuery.isPending}
					/>
				</div>
			</CardContent>
		</Card>
	)
}
```

- [ ] **Step 5: Compose the module + route**

Create `app/modules/insights/overview/index.tsx`:

```tsx
import { PropertyRankings } from './property-rankings'
import { RiskSummary } from './risk-summary'
import { InsightsKpiRow } from './kpi-row'
import { InsightsTrends } from './trends'
import { useInsightsFilters } from '../use-insights-filters'

export function InsightsOverviewModule() {
	const { propertyId } = useInsightsFilters()
	return (
		<div className="flex flex-col gap-4 md:gap-6">
			<InsightsKpiRow />
			<InsightsTrends />
			{!propertyId ? <PropertyRankings /> : null}
			<RiskSummary />
		</div>
	)
}
```

Append to `app/modules/insights/index.ts`:

```ts
export * from './overview'
```

Create `app/routes/_auth._dashboard.insights._index.tsx`:

```tsx
import type { Route } from './+types/_auth._dashboard.insights._index'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { InsightsOverviewModule } from '~/modules'

export async function loader({ request }: Route.LoaderArgs) {
	return {
		origin: getDomainUrl(request),
	}
}

export const handle = {
	breadcrumb: 'Overview',
}

export function meta({ loaderData, location }: Route.MetaArgs) {
	return getSocialMetas({
		url: getDisplayUrl({
			origin: loaderData.origin,
			path: location.pathname,
		}),
		origin: loaderData.origin,
	})
}

export default InsightsOverviewModule
```

- [ ] **Step 6: Verify**

Run: `yarn types:check && yarn lint`
Expected: both pass.

---

### Task 7: End-to-end verification (browser, both themes)

**Files:** none (verification only).

- [ ] **Step 1: Run the app**

From the repo root: `make run` (or `yarn dev` in `apps/property-manager/` with the API already running). Log in as a client user with seeded data.

- [ ] **Step 2: Verify navigation**

- Sidebar shows **Overview** (highlighted on `/`) and a collapsible **Insights** group.
- Insights → Overview navigates to `/insights`; the seven other sub-items show "Coming Soon" badges and route to the coming-soon page.
- Breadcrumb on `/` reads "Overview"; on `/insights` it reads "Insights / Overview".
- The dashboard tour (clear `rent-loop:tour-v2` from localStorage to force it) highlights both nav items with the new copy.

- [ ] **Step 3: Verify the Insights Overview page**

- KPI row shows six cards with real numbers; Net Income = Revenue − Expenses.
- Changing the date range updates the URL (`?from=&to=`) and all widgets refetch.
- Selecting a single property updates `?property=`, all numbers narrow to that property, and the rankings section disappears; switching back to "All properties" restores it.
- Toggling "Compare previous period" sets `?compare=1` and delta badges appear on Revenue and Expenses.
- Navigating Insights → (any coming-soon page) → back preserves the URL filters.
- Risk summary shows outstanding rent, leases expiring in 60 days (sanity-check against known lease move-out dates; open-ended leases with the 2099 sentinel must NOT count), and open maintenance requests.
- Refresh the page with filters set — filters survive.

- [ ] **Step 4: Verify both themes and empty states**

- Toggle dark mode: every new card, chart, table, filter control, and skeleton renders correctly in both themes.
- If a test account with no data is available: KPI cards show zeros, charts show "No data for this period", tables show the empty message — nothing crashes.

- [ ] **Step 5: Final static checks**

Run: `yarn types:check && yarn lint && yarn build`
Expected: all pass. Leave all changes unstaged for the user to review and commit.
