# CLAUDE.md — Property Manager Frontend

## Commands

```bash
yarn dev          # Dev server (port 3000)
yarn build        # Production build
yarn types:check  # React Router typegen + TypeScript check
yarn lint         # ESLint
yarn format       # Prettier
```

## Architecture

**Stack:** React Router v7, React 19, TypeScript, TanStack Query v5, Tailwind
CSS v4, Shadcn/Radix UI, Lexical editor

```
app/
├── api/           # One folder per resource (index.ts = client, server.ts = server)
├── routes/        # File-based routing (dot notation for nesting)
├── modules/       # Page-level components (mirror route structure)
├── components/
│   ├── ui/        # Shadcn/Radix primitives
│   └── blocks/    # Shared business components
├── providers/     # Context providers (Auth, ReactQuery, Property)
├── hooks/         # Custom React hooks
├── lib/           # Utilities and helpers
└── types/         # Global TypeScript definitions (*.d.ts)
```

## Routing Conventions

- `_auth.*` prefix for authenticated routes
- `$paramName` for dynamic segments, `_index` for default child route
- Breadcrumbs: `export const handle = { breadcrumb: 'Label' }`
- Route loaders fetch data server-side using `getAuthSession` +
  `environmentVariables().API_ADDRESS`

## Data Access

- **In modules:** `useLoaderData<typeof loader>()` with typed loader import from
  the route file
- **Property context:** `useProperty()` hook from
  `~/providers/property-provider`
- **Client-side queries:** TanStack Query hooks in `app/api/<resource>/index.ts`
- **Server-side fetching:** Functions in `app/api/<resource>/server.ts`
- **Populating relations:** Pass `populate: ['Property', 'PropertyBlock']` etc.

### Server-side Fetch Pattern (detail pages)

For detail pages that need SSR data, follow this pattern:

**1. `app/api/<resource>/server.ts`** — server-only fetch function:

```ts
import { fetchServer } from '~/lib/transport'

export const getThingForServer = async (
	id: string,
	apiConfig: ApiConfigForServerConfig,
) => {
	try {
		const response = await fetchServer<ApiResponse<Thing>>(
			`${apiConfig.baseUrl}/v1/admin/things/${id}`,
			{ ...apiConfig },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const response = await error.json()
			throw new Error(response.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}
```

**2. Route loader** — fetch and return data:

```ts
export async function loader({ request, params }: Route.LoaderArgs) {
	const baseUrl = environmentVariables().API_ADDRESS
	const authSession = await getAuthSession(request.headers.get('Cookie'))
	const authToken = authSession.get('authToken')
	try {
		const thing = await getThingForServer(params.thingId, {
			authToken,
			baseUrl,
		})
		return { origin: getDomainUrl(request), thing }
	} catch {
		throw new Error('Failed to load thing')
	}
}
```

**3. Module** — use loader data as `initialData` for the TanStack Query hook:

```ts
import type { loader } from '~/routes/the-route-file'

export function ThingDetailModule() {
	const loaderData = useLoaderData<typeof loader>()
	const { data: thing } = useGetThing(
		params.thingId,
		loaderData.thing ?? undefined,
	)
	// ...
}
```

This pre-populates the query cache from SSR so the page renders immediately,
while still refetching client-side after mutations via
`queryClient.invalidateQueries`.

## Component Naming

- Module components: named export with `Module` suffix (e.g.,
  `PropertyAssetUnitModule`)
- Controller components: named export with `Controller` suffix
- Route default exports point to the module component

## Dark Mode

- The portal supports dark/light theme toggling — all UI changes MUST work in
  both modes
- Use Tailwind's `dark:` variant for mode-specific styles — never hardcode
  colors that only work in one mode
- Prefer Shadcn/Radix primitives and CSS variables (`bg-background`,
  `text-foreground`, `border`, `muted`, etc.) as they handle theming
  automatically
- Avoid raw color classes (e.g. `bg-white`, `text-black`, `bg-gray-100`) without
  a `dark:` counterpart
- Always verify new UI in both light and dark modes before considering a change
  complete

## UI Patterns

### Layout

- **Detail pages:** 12-col grid — sidebar `col-span-12 lg:col-span-4` + main
  `col-span-12 lg:col-span-8`
- **Dashboard pages:** `max-w-7xl mx-auto px-4 py-8`
- **List pages:** `mx-6 my-6 flex flex-col gap-4 sm:gap-6`

### Cards

- Always use `className="shadow-none"` on Card components
- Status badges use `variant="outline"` with colored backgrounds

### Unit Status Badge Colors

- Available: `bg-teal-500 text-white`
- Maintenance: `bg-yellow-500 text-white`
- Occupied: `bg-rose-500 text-white`
- Draft: `bg-zinc-400 text-white`

### Permission Guards

- `PropertyPermissionGuard` from `~/components/permissions/permission-guard`
- Wrap UI elements with `roles={['MANAGER']}` for role-based visibility

## Key Utilities

| Function                       | Import                   | Purpose                                 |
| ------------------------------ | ------------------------ | --------------------------------------- |
| `formatAmount()`               | `~/lib/format-amount`    | Formats as "GH₵ X,XXX.XX"               |
| `toFirstUpperCase()`           | `~/lib/strings`          | Capitalize first letter                 |
| `safeString()`                 | `~/lib/strings`          | Handle nullable strings                 |
| `cn()`                         | `~/lib/utils`            | Tailwind class merging (clsx + twMerge) |
| `getPropertyUnitStatusLabel()` | `~/lib/properties.utils` | Unit status enum to label               |
| `getPropertyStatusLabel()`     | `~/lib/properties.utils` | Property status enum to label           |

Dates: `dayjs(date).format('MMM D, YYYY')`

## Linting Rules

- Unused imports are errors — always clean up
- Unhandled promises need `void` operator (e.g., `void navigate(...)`)
- Run `yarn types:check` before considering work complete

## API Documentation

Backend REST API is documented at:
**https://rentloop-api-staging.fly.dev/swagger/index.html**

Always consult the Swagger docs when adding new API calls — use `WebFetch` on
that URL to look up available endpoints, request bodies, and response shapes
before writing mutations or queries.
