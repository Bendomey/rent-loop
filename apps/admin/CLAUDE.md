# CLAUDE.md — apps/admin

This file provides guidance to Claude Code when working in `apps/admin`.

## Purpose

The admin app is the internal Rentloop dashboard — used exclusively by the Rentloop team to:

- **Create** property manager accounts
- **Approve / decline** property manager registrations
- **View** a list and count of all property managers on the platform
- **Monitor** platform-level metrics via a dashboard

This is an internal tool, not customer-facing. There is no self-sign-up. Access is restricted to Rentloop admins only.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Router v7 (file-based routing via `flatRoutes`) |
| React | React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + Shadcn UI (Radix primitives) |
| Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod v4 |
| Notifications | Sonner (toast) |
| Build | Vite 8 |
| Package manager | Yarn 1 |

## Dev Commands

Run from `apps/admin/`:

```bash
yarn dev          # Dev server on port 3000
yarn build        # Production build
yarn typecheck    # React Router typegen + tsc
```

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```
NODE_ENV=development
API_ADDRESS=           # Go API base URL (e.g. http://localhost:5000/api)
RENTLOOP_WEBSITE_URL=
RENTLOOP_PROPERTY_MANAGER_URL=
GOOGLE_MAPS_API_KEY=
CF_ACCOUNT_ID=
BUCKET_NAME=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
RENTLOOP_IMAGES_BASE_URL=
SENTRY_DSN=
```

`API_ADDRESS` is the only required variable for core functionality in development.

## Project Structure

```
app/
├── api/                  API integration layer
│   └── auth/             Admin auth (login, getCurrentUser)
├── routes/               File-based routing (React Router v7 flat routes)
│   ├── login.ts          Public login action/loader
│   ├── _auth.ts          Auth layout — applies authMiddleware
│   ├── _auth._dashboard.tsx      Dashboard shell layout
│   └── _auth._dashboard._index.tsx   Dashboard home (/)
├── modules/              Route-level UI components (one folder per feature)
│   ├── dashboard/        Dashboard home view
│   ├── login/            Login form
│   └── auth-middleware/
├── components/
│   └── ui/               Shadcn/Radix primitives (Button, Input, Card, etc.)
├── providers/
│   ├── auth-provider.tsx  AuthContext — exposes currentUser (Admin)
│   └── react-query/       TanStack Query client setup
├── lib/
│   ├── transport.ts       fetchClient / fetchServer wrappers
│   ├── actions/
│   │   ├── auth.session.server.ts   Cookie session (authToken)
│   │   ├── auth.middleware.server.ts  authMiddleware (verifies token, sets userContext)
│   │   ├── auth.context.server.ts   React Router context key for user
│   │   └── env.server.ts            Zod-validated env vars
│   └── ...                Misc utils (date, strings, format-amount, etc.)
├── hooks/                 Custom hooks
└── types/
    ├── admin.d.ts         Admin interface
    └── fe.d.ts            Shared frontend types
```

## Routing Conventions

Routes follow React Router v7 flat-file naming:

- `_auth.*` — requires authentication (authMiddleware applied in `_auth.ts`)
- `_auth._dashboard.*` — nested under dashboard shell layout
- `_auth._dashboard._index` — the `/` dashboard home

To add a new protected page, create `_auth._dashboard.<slug>.tsx`. The route is automatically picked up by `flatRoutes`.

## Authentication

- Login endpoint: `POST /v1/admin/admins/login` → returns `{ user, token }`
- Current user: `GET /v1/admin/admins/me` → returns `Admin`
- Token is stored in an HTTP-only cookie session (`authToken` key)
- `authMiddleware` runs on every `_auth.*` route — fetches the current user and sets it in React Router's server context via `userContext`
- `AuthProvider` makes `currentUser` available client-side via `useAuth()`

```ts
interface Admin {
  id: string
  name: string
  email: string
  phone_number: string
  created_at: Date
  updated_at: Date
}
```

## API Layer Patterns

All API calls live in `app/api/<resource>/index.ts`.

**Server-side** (loaders/actions): use `fetchServer` with `{ baseUrl, authToken }` from env and session.

**Client-side** (TanStack Query hooks): use `fetchClient` — it reads `window.ENV.API_ADDRESS` and `window.ENV.AUTH_TOKEN` automatically.

```ts
// Server call (loader)
const data = await someEndpoint({ baseUrl, authToken })

// Client query hook
export const useSomeQuery = () =>
  useQuery({ queryKey: [...], queryFn: () => fetchClient('/v1/admin/...') })
```

## Adding New Features

### New API resource

1. Create `app/api/<resource>/index.ts`
2. Export typed server functions and a `useXxx` TanStack Query hook

### New page

1. Create `app/routes/_auth._dashboard.<slug>.tsx`
2. Export `loader`, `meta` (call `getSocialMetas`), and a default component
3. Add the UI in `app/modules/<slug>/index.tsx` and re-export from `app/modules/index.ts`

### New UI component

Use Shadcn CLI to add primitives:
```bash
npx shadcn add <component>
```
They land in `app/components/ui/`. Business-logic components go in `app/components/` directly.

## Planned Features (build these next)

- **Property manager list** — paginated table of all PM accounts with status badges
- **Approve / decline** — action buttons that call the appropriate API endpoints
- **Create PM account** — form to manually create a property manager
- **Dashboard metrics** — total PM count, pending approvals, recent sign-ups

## API Reference

All admin endpoints are under the `/v1/admin/` prefix and require a Bearer token.

Swagger docs (staging): **https://api.rentloopapp.com/swagger/index.html**

Use `WebFetch` on this URL to look up endpoint shapes before writing new API calls.

## Style Rules

- Use Tailwind CSS v4 utility classes
- Use `bg-background`, `text-foreground`, and other CSS variable-based tokens for theme compatibility
- Use `dark:` variants when hardcoding colors — verify all UI in both light and dark modes
- Prefer Shadcn primitives from `~/components/ui/` before writing custom components
- No inline styles
