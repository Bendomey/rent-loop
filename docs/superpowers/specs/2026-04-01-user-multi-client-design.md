# User Multi-Client Design

**Date:** 2026-04-01  
**Branch:** `db/user-to-multiple-clients`  
**Status:** Approved

## Problem

`client_users` currently embeds user identity (email, password, name, phone) directly and enforces a global unique index on `email`. This means one email address can only ever belong to one client. The goal is to extract user identity into a separate `users` table so that a single person can be a member of multiple clients.

---

## Data Model

### New `users` table

Maps to a new `User` GORM model embedding `BaseModelSoftDelete`.

| Field | Type | Constraints |
|---|---|---|
| `id` | UUID PK | `uuid_generate_v4()` |
| `name` | string | not null |
| `email` | string | not null, globally unique |
| `phone_number` | string | not null |
| `password` | string | not null, hashed in `BeforeCreate` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |
| `deleted_at` | timestamp | soft delete |

GORM association (not a DB column):

```go
ClientUsers []ClientUser  // has-many via client_users.user_id
```

### `client_users` table (becomes a membership/join table)

Drops all identity columns (`name`, `email`, `phone_number`, `password`) and gains a `user_id` FK.

| Field | Type | Constraints |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → `users.id` | not null, indexed |
| `client_id` | UUID FK → `clients.id` | not null, indexed |
| `role` | string | `OWNER \| ADMIN \| STAFF` |
| `status` | string | `Active \| Inactive` |
| `created_by_id` | UUID FK → `client_users.id` | nullable (null = first owner) |
| `status_updated_by_id` | UUID FK → `client_users.id` | nullable |
| `created_at` / `updated_at` / `deleted_at` | | |

Unique composite index on `(user_id, client_id)` — a user can only have one membership per client.

`created_by_id` and `status_updated_by_id` remain scoped to `client_users.id`, not `users.id`.

### Data migration job

For each existing `client_user` row:
1. Insert a `user` row with `name`, `email`, `phone_number`, `password` (copy hashed password directly — no re-hash).
2. Set `client_users.user_id` to the new `user.id`.
3. Drop `name`, `email`, `phone_number`, `password` columns from `client_users`.

---

## Authentication & JWT

### Token shape change

| | Before | After |
|---|---|---|
| JWT claims | `{ id: <client_user_id>, client_id: <client_id> }` | `{ id: <user_id> }` |

Client context is removed from the token. It lives in the URL for API calls and in a cookie on the frontend.

### Login endpoint

```
POST /api/v1/users/login
Body:  { email, password }
Response: {
  token,
  user: {
    ...user fields,
    client_users: [
      { ...client_user fields, client: { ...client fields } }
    ]
  }
}
```

GORM preload: `db.Preload("ClientUsers.Client").Where("email = ?", email).First(&user)`

The frontend derives the client picker list from `user.client_users`. No separate `clients` array in the response.

### Context key change

```go
// Before
type ClientUserFromToken struct {
    ID       string
    ClientID string
}

// After
type UserFromToken struct {
    ID string  // user_id
}
```

### Middleware changes

**`InjectClientUserAuthMiddleware`:** validates JWT, injects `UserFromToken{ID}` into context. No `ClientID` read from token.

**`ValidateClientMembershipMiddleware`** (new): applied to all `/clients/{client_id}/*` routes. Reads `user_id` from context + `client_id` from URL param, looks up `client_users` row, 401s if not found. Injects the resolved `ClientUser` into context for downstream handlers.

**`ValidateRoleClientUserMiddleware`:** looks up role via `user_id` + `client_id` instead of `client_user.id` alone.

**`ValidateRoleClientUserPropertyMiddleware`:** same — resolves `ClientUser` via `user_id` + `client_id` from URL.

---

## API Routes

### Route prefix change

All protected client-user routes move from `/api/v1/...` to `/api/v1/clients/{client_id}/...`.

**Examples:**

| Before | After |
|---|---|
| `POST /api/v1/client-users` | `POST /api/v1/clients/{client_id}/client-users` |
| `GET /api/v1/client-users/me` | `GET /api/v1/clients/{client_id}/client-users/me` |
| `GET /api/v1/properties` | `GET /api/v1/clients/{client_id}/properties` |
| `GET /api/v1/invoices` | `GET /api/v1/clients/{client_id}/invoices` |
| `GET /api/v1/payment-accounts` | `GET /api/v1/clients/{client_id}/payment-accounts` |

### Routes that stay unchanged

- `POST /api/v1/clients/apply`
- `POST /api/v1/users/login` (was `/client-users/login`)
- `POST /api/v1/users/forgot-password`
- `GET/POST /api/v1/users/reset-password`
- `GET /api/v1/units/{unit_id}` (public)
- All admin routes (`/api/v1/admins/...`)
- All tenant routes (`/api/v1/auth/...`, `/api/v1/tenant-accounts/...`)

---

## Frontend

### Cookie session

`selectedClientId` is added to the existing `SessionData` in `auth.session.server.ts`:

```ts
type SessionData = {
  authToken: string
  selectedClientId: string  // new
}
```

Lives in the same httpOnly cookie as `authToken`. Cleared automatically on logout because `deleteAuthSession` destroys the entire session.

### React Router context

New `clientContext` (`lib/actions/client.context.server.ts`) mirrors `userContext`. Holds the resolved `ClientUser & { client: Client }` for the selected client.

### `clientMiddleware`

Applied to all `_auth.*` routes alongside `authMiddleware`. Reads `selectedClientId` from cookie:
- Missing → redirect to `/select-client`
- Present → fetch `client_user` record for `(userId, selectedClientId)` with `client` populated, set in `clientContext`

### React context (`ClientProvider`)

Mirrors `AuthProvider`. Receives data hydrated by loaders, exposes via `useClient()` hook.

### `/select-client` route

- Loader: reads `user.client_users` from `userContext` (already resolved by `authMiddleware`)
- Single client: action auto-selects, writes `selectedClientId` to cookie, redirects to dashboard
- Multiple clients: renders picker UI; on pick, action writes `selectedClientId` to cookie, redirects to dashboard

### Client switcher

UI control (sidebar/header) that navigates to `/select-client`. Clears `selectedClientId` from the cookie and presents the picker.

### API layer

All API calls in `app/api/` prepend `/clients/${selectedClientId}` to their paths, reading `selectedClientId` from the client context.

---

## What Does Not Change

- Tenant auth flow (OTP, `TenantAccount`) — untouched
- Admin auth flow — untouched
- `ClientUserProperty` join table — still references `client_users.id`
- `CreatedBy` / `StatusUpdatedBy` self-references on `ClientUser` — still `client_users.id`
- Password hashing hook — moves to `User.BeforeCreate`
- `BeforeDelete` guard (cannot delete the owner) — stays on `ClientUser`, checks `created_by_id == nil`
