# User Multi-Client — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the property manager portal to support multi-client login (client picker after login, `selectedClientId` in cookie, all API calls prefixed with `/clients/{selectedClientId}`).

**Architecture:** `selectedClientId` stored in the existing httpOnly cookie session (same as `authToken`). React Router middleware resolves the selected client user into a new `clientContext`. A `/select-client` route handles the picker. All API calls read `selectedClientId` from a new `ClientProvider` context. `GET /v1/admin/users/me` replaces `GET /v1/admin/client-users/me`.

**Tech Stack:** React Router v7, React 19, TypeScript, TanStack Query v5, Tailwind CSS v4

**Prerequisite:** Backend plan must be deployed before this plan can be tested end-to-end.

---

## File Map

**Create:**
- `apps/property-manager/types/user.d.ts`
- `apps/property-manager/app/lib/actions/client.context.server.ts`
- `apps/property-manager/app/lib/actions/client.middleware.server.ts`
- `apps/property-manager/app/providers/client-provider.tsx`
- `apps/property-manager/app/routes/select-client.tsx`

**Modify:**
- `apps/property-manager/types/client-user.d.ts` — remove auth fields, add user_id
- `apps/property-manager/app/lib/actions/auth.session.server.ts` — add selectedClientId to SessionData
- `apps/property-manager/app/lib/actions/auth.context.server.ts` — hold User instead of ClientUser
- `apps/property-manager/app/lib/actions/auth.middleware.server.ts` — call /users/me, set User in context
- `apps/property-manager/app/lib/actions/property.middleware.server.ts` — read client_user_id from clientContext
- `apps/property-manager/app/providers/auth-provider.tsx` — hold User type
- `apps/property-manager/app/providers/index.tsx` — add ClientProvider
- `apps/property-manager/app/api/auth/index.ts` — update login, getCurrentUser, remove old endpoints
- `apps/property-manager/app/routes/login.ts` — after login redirect to select-client if needed
- `apps/property-manager/app/routes/logout.ts` — clear selectedClientId (auto via deleteAuthSession)
- `apps/property-manager/app/routes/_auth._dashboard.tsx` — read from clientContext
- `apps/property-manager/app/routes/_auth.ts` — add clientMiddleware

---

## Task 1: TypeScript types

**Files:**
- Create: `apps/property-manager/types/user.d.ts`
- Modify: `apps/property-manager/types/client-user.d.ts`

- [ ] **Step 1: Create User type**

```ts
// apps/property-manager/types/user.d.ts
interface User {
  id: string
  name: string
  email: string
  phone_number: string
  created_at: Date
  updated_at: Date
  client_users: Array<ClientUser & { client: Client }>
}
```

- [ ] **Step 2: Update ClientUser type — remove auth fields, add user_id**

Replace `apps/property-manager/types/client-user.d.ts`:

```ts
interface ClientUser {
  id: string
  user_id: string
  client_id: string
  client: Nullable<Client>
  role: 'OWNER' | 'ADMIN' | 'STAFF'
  status: 'ClientUser.Status.Active' | 'ClientUser.Status.Inactive'
  created_at: Date
  updated_at: Date
}

interface FetchClientUserFilter {
  role?: string
  status?: string
  client_id?: string
  not_in_property_id?: string
  ids?: Array<string>
}
```

- [ ] **Step 3: Type check**

```bash
cd apps/property-manager && yarn types:check 2>&1 | head -30
```

Expected: errors where `clientUser.name` / `clientUser.email` are used — we'll fix them in later tasks.

- [ ] **Step 4: Commit**

```bash
git add apps/property-manager/types/user.d.ts apps/property-manager/types/client-user.d.ts
git commit -m "feat: add User type, update ClientUser type for multi-client"
```

---

## Task 2: Cookie session + context files

**Files:**
- Modify: `apps/property-manager/app/lib/actions/auth.session.server.ts`
- Modify: `apps/property-manager/app/lib/actions/auth.context.server.ts`
- Create: `apps/property-manager/app/lib/actions/client.context.server.ts`

- [ ] **Step 1: Add selectedClientId to session**

In `apps/property-manager/app/lib/actions/auth.session.server.ts`, update `SessionData`:

```ts
type SessionData = {
  authToken: string
  selectedClientId: string
}
```

- [ ] **Step 2: Update auth context to hold User**

Replace `apps/property-manager/app/lib/actions/auth.context.server.ts`:

```ts
import { createContext } from 'react-router'

export const userContext = createContext<{
  user: User
} | null>(null)
```

- [ ] **Step 3: Create client context**

```ts
// apps/property-manager/app/lib/actions/client.context.server.ts
import { createContext } from 'react-router'

export const clientContext = createContext<{
  clientUser: ClientUser & { client: Client }
} | null>(null)
```

- [ ] **Step 4: Commit**

```bash
git add apps/property-manager/app/lib/actions/auth.session.server.ts apps/property-manager/app/lib/actions/auth.context.server.ts apps/property-manager/app/lib/actions/client.context.server.ts
git commit -m "feat: add selectedClientId to session, add clientContext"
```

---

## Task 3: Update authMiddleware + create clientMiddleware

**Files:**
- Modify: `apps/property-manager/app/lib/actions/auth.middleware.server.ts`
- Create: `apps/property-manager/app/lib/actions/client.middleware.server.ts`

- [ ] **Step 1: Update authMiddleware to call /users/me**

Replace `apps/property-manager/app/lib/actions/auth.middleware.server.ts`:

```ts
import { redirect, type MiddlewareFunction } from 'react-router'
import { userContext } from './auth.context.server'
import { deleteAuthSession, getAuthSession } from './auth.session.server'
import { USER_CACHE_KEY, userCache } from './cache.server'
import { environmentVariables } from './env.server'
import { getCurrentUser } from '~/api/auth'

export const authMiddleware: MiddlewareFunction = async ({
  request,
  context,
}) => {
  const baseUrl = environmentVariables().API_ADDRESS
  const authSession = await getAuthSession(request.headers.get('Cookie'))
  const url = new URL(request.url)
  const returnTo = `${url.pathname}${url.search}`
  const redirectToLogin = `/login?return_to=${encodeURIComponent(returnTo)}`

  const authToken = authSession.get('authToken')

  if (!authToken) {
    return redirect(redirectToLogin)
  }

  const cacheKey = USER_CACHE_KEY.replace('{token}', authToken)
  try {
    const user = await getCurrentUser({ baseUrl, authToken })

    if (!user) {
      throw new Error('No user found')
    }

    context.set(userContext, { user })
  } catch {
    userCache.delete(cacheKey)
    return redirect(redirectToLogin, {
      headers: {
        'Set-Cookie': await deleteAuthSession(authSession),
      },
    })
  }
}
```

- [ ] **Step 2: Create clientMiddleware**

```ts
// apps/property-manager/app/lib/actions/client.middleware.server.ts
import { redirect, type MiddlewareFunction } from 'react-router'
import { clientContext } from './client.context.server'
import { userContext } from './auth.context.server'
import { getAuthSession, saveAuthSession } from './auth.session.server'
import { environmentVariables } from './env.server'
import { getClientUserForServer } from '~/api/client-users/server'

export const clientMiddleware: MiddlewareFunction = async ({
  request,
  context,
}) => {
  const baseUrl = environmentVariables().API_ADDRESS
  const authSession = await getAuthSession(request.headers.get('Cookie'))
  const authToken = authSession.get('authToken')
  const selectedClientId = authSession.get('selectedClientId')

  if (!authToken) return

  const userData = context.get(userContext)
  if (!userData) return

  // No client selected → redirect to picker (unless we're already going there)
  const url = new URL(request.url)
  if (!selectedClientId && url.pathname !== '/select-client') {
    return redirect('/select-client')
  }

  if (!selectedClientId) return

  // Verify the selected client is still valid for this user
  const clientUser = userData.user.client_users.find(
    (cu) => cu.client_id === selectedClientId,
  )

  if (!clientUser) {
    // selectedClientId is stale — clear it and re-pick
    authSession.unset('selectedClientId')
    return redirect('/select-client', {
      headers: { 'Set-Cookie': await saveAuthSession(authSession) },
    })
  }

  context.set(clientContext, { clientUser })
}
```

- [ ] **Step 3: Register clientMiddleware on the _auth route**

In `apps/property-manager/app/routes/_auth.ts`, add `clientMiddleware` to the middleware chain. Read the current file first to see what's there, then add:

```ts
import { clientMiddleware } from '~/lib/actions/client.middleware.server'

export const unstable_middleware = [authMiddleware, clientMiddleware]
```

- [ ] **Step 4: Type check**

```bash
cd apps/property-manager && yarn types:check 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add apps/property-manager/app/lib/actions/auth.middleware.server.ts apps/property-manager/app/lib/actions/client.middleware.server.ts apps/property-manager/app/routes/_auth.ts
git commit -m "feat: update authMiddleware for User, add clientMiddleware"
```

---

## Task 4: Update API auth layer

**Files:**
- Modify: `apps/property-manager/app/api/auth/index.ts`

- [ ] **Step 1: Rewrite auth API**

Replace the full content of `apps/property-manager/app/api/auth/index.ts`:

```ts
import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchClient, fetchServer } from '~/lib/transport'

export const CURRENT_USER_QUERY_KEY = ['current-user']

export interface LoginInput {
  email: string
  password: string
}

interface LoginResponse {
  user: User
  token: string
}

export const login = async (
  props: LoginInput,
  apiConfig?: ApiConfigForServerConfig,
) => {
  try {
    const response = await fetchServer<ApiResponse<LoginResponse>>(
      `${apiConfig?.baseUrl}/v1/admin/users/login`,
      {
        method: 'POST',
        body: JSON.stringify(props),
      },
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

export const getCurrentUser = async (apiConfig?: ApiConfigForServerConfig) => {
  try {
    const response = await fetchServer<ApiResponse<User>>(
      `${apiConfig?.baseUrl}/v1/admin/users/me`,
      {
        method: 'GET',
        ...(apiConfig ? apiConfig : {}),
      },
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

const getCurrentUserClient = async () => {
  const response = await fetchClient<ApiResponse<User>>(
    `/v1/admin/users/me`,
    { method: 'GET' },
  )
  return response.parsedBody.data
}

export const useGetCurrentUser = (initialData?: User) =>
  useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentUserClient,
    initialData,
  })

export interface SendForgotPasswordLinkInput {
  email: string
}

export const sendForgotPasswordLink = async (
  props: SendForgotPasswordLinkInput,
  apiConfig?: ApiConfigForServerConfig,
) => {
  try {
    await fetchServer(
      `${apiConfig?.baseUrl}/v1/admin/users/forgot-password`,
      {
        method: 'POST',
        body: JSON.stringify(props),
      },
    )
  } catch (error: unknown) {
    if (error instanceof Response) {
      const response = await error.json()
      throw new Error(response.errors?.message || 'Unknown error')
    }
    if (error instanceof Error) throw error
  }
}

export interface ResetPasswordInput {
  newPassword: string
}

export const resetPassword = async (
  props: ResetPasswordInput,
  apiConfig?: ApiConfigForServerConfig,
) => {
  try {
    await fetchServer<ApiResponse<string>>(
      `${apiConfig?.baseUrl}/v1/admin/users/reset-password`,
      {
        method: 'POST',
        body: JSON.stringify(props),
        authToken: apiConfig?.authToken,
      },
    )
  } catch (error: unknown) {
    if (error instanceof Response) {
      const response = await error.json()
      throw new Error(response.errors?.message || 'Unknown error')
    }
    if (error instanceof Error) throw error
  }
}

interface UpdatePasswordProps {
  new_password: string
  old_password: string
}

const updatePassword = async (props: UpdatePasswordProps) => {
  try {
    const response = await fetchClient<ApiResponse<User>>(
      `/v1/admin/users/me/password`,
      {
        method: 'PATCH',
        body: JSON.stringify(props),
      },
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

export const useUpdatePassword = () =>
  useMutation({ mutationFn: updatePassword })

export interface UpdateUserMeInput {
  name?: string
  phone_number?: string
  email?: string
}

const updateUserMe = async (props: UpdateUserMeInput) => {
  try {
    const response = await fetchClient<ApiResponse<User>>(
      `/v1/admin/users/me`,
      {
        method: 'PATCH',
        body: JSON.stringify(props),
      },
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

export const useUpdateUserMe = () =>
  useMutation({ mutationFn: updateUserMe })

// OTP
interface GetOtpCodeInput {
  channel: Array<OTP['channel']>
  phone?: Maybe<string>
  email?: Maybe<string>
}

export const getOtpCode = async (props: GetOtpCodeInput) => {
  try {
    const response = await fetchClient<ApiResponse<OTP>>(`/v1/auth/codes`, {
      method: 'POST',
      body: JSON.stringify(props),
    })
    return response.parsedBody.data
  } catch (error: unknown) {
    if (error instanceof Response) {
      const response = await error.json()
      throw new Error(response.errors?.message || 'Unknown error')
    }
    if (error instanceof Error) throw error
  }
}

export const useGetOtpCode = () => useMutation({ mutationFn: getOtpCode })

interface VerifyOtpCodeInput {
  code: string
  phone?: Maybe<string>
  email?: Maybe<string>
}

export const verifyOtpCode = async (props: VerifyOtpCodeInput) => {
  try {
    const response = await fetchClient<ApiResponse<OTP>>(
      `/v1/auth/codes/verify`,
      {
        method: 'POST',
        body: JSON.stringify(props),
      },
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

export const useVerifyOtpCode = () => useMutation({ mutationFn: verifyOtpCode })
```

- [ ] **Step 2: Type check**

```bash
cd apps/property-manager && yarn types:check 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add apps/property-manager/app/api/auth/index.ts
git commit -m "feat: update auth API — /users/me, /users/login, remove client-users endpoints"
```

---

## Task 5: Update login route

**Files:**
- Modify: `apps/property-manager/app/routes/login.ts`

- [ ] **Step 1: After login, redirect to /select-client instead of directly to the dashboard**

In the `action` function, after `session.set('authToken', loginResponse.token)`, replace the redirect logic:

```ts
// After setting authToken, check how many clients the user has
const clientUsers = loginResponse.user.client_users ?? []

if (clientUsers.length === 1) {
  // Auto-select the single client
  session.set('selectedClientId', clientUsers[0].client_id)
  const returnTo = url.searchParams.get('return_to') || '/'
  return redirect(returnTo, {
    headers: { 'Set-Cookie': await saveAuthSession(session) },
  })
}

// Multiple clients (or zero — edge case) → go to picker
return redirect('/select-client', {
  headers: { 'Set-Cookie': await saveAuthSession(session) },
})
```

- [ ] **Step 2: Type check**

```bash
cd apps/property-manager && yarn types:check 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add apps/property-manager/app/routes/login.ts
git commit -m "feat: redirect to /select-client after login when multiple clients"
```

---

## Task 6: Select-client route

**Files:**
- Create: `apps/property-manager/app/routes/select-client.tsx`

- [ ] **Step 1: Create the route**

```tsx
// apps/property-manager/app/routes/select-client.tsx
import { data, redirect } from 'react-router'
import type { Route } from './+types/select-client'
import { userContext } from '~/lib/actions/auth.context.server'
import {
  getAuthSession,
  saveAuthSession,
} from '~/lib/actions/auth.session.server'

export async function loader({ request, context }: Route.LoaderArgs) {
  const userData = context.get(userContext)
  if (!userData) return redirect('/login')

  const clientUsers = userData.user.client_users ?? []

  // If only one client, auto-select and redirect
  if (clientUsers.length === 1) {
    const session = await getAuthSession(request.headers.get('Cookie'))
    session.set('selectedClientId', clientUsers[0].client_id)
    return redirect('/', {
      headers: { 'Set-Cookie': await saveAuthSession(session) },
    })
  }

  return data({ clientUsers })
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getAuthSession(request.headers.get('Cookie'))
  const form = await request.formData()
  const selectedClientId = form.get('client_id')

  if (!selectedClientId || typeof selectedClientId !== 'string') {
    return data({ error: 'Please select a client.' })
  }

  session.set('selectedClientId', selectedClientId)

  return redirect('/', {
    headers: { 'Set-Cookie': await saveAuthSession(session) },
  })
}

export default function SelectClientPage() {
  const { clientUsers } = useLoaderData<typeof loader>()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Select workspace</h1>
          <p className="text-sm text-muted-foreground">
            Choose which workspace you want to continue with.
          </p>
        </div>
        <Form method="post" className="space-y-3">
          {clientUsers.map((cu) => (
            <button
              key={cu.client_id}
              type="submit"
              name="client_id"
              value={cu.client_id}
              className="w-full flex items-center gap-3 rounded-lg border bg-card p-4 text-left hover:bg-accent transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{cu.client?.name ?? cu.client_id}</p>
                <p className="text-xs text-muted-foreground capitalize">{cu.role.toLowerCase()}</p>
              </div>
            </button>
          ))}
        </Form>
      </div>
    </div>
  )
}
```

Add `import { Form, useLoaderData } from 'react-router'` at the top.

- [ ] **Step 2: Register the route in `app/routes.ts`**

Read `apps/property-manager/app/routes.ts` and add:

```ts
route('select-client', 'routes/select-client.tsx'),
```

before the `_auth` routes.

- [ ] **Step 3: Type check**

```bash
cd apps/property-manager && yarn types:check 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add apps/property-manager/app/routes/select-client.tsx apps/property-manager/app/routes.ts
git commit -m "feat: add /select-client route for multi-client picker"
```

---

## Task 7: ClientProvider + update AuthProvider

**Files:**
- Create: `apps/property-manager/app/providers/client-provider.tsx`
- Modify: `apps/property-manager/app/providers/auth-provider.tsx`
- Modify: `apps/property-manager/app/providers/index.tsx`

- [ ] **Step 1: Create ClientProvider**

```tsx
// apps/property-manager/app/providers/client-provider.tsx
import { createContext, useContext, type PropsWithChildren } from 'react'

interface Props {
  data?: ClientUser & { client: Client }
}

interface IClientContext {
  clientUser?: ClientUser & { client: Client }
}

const ClientContext = createContext<IClientContext | null>(null)

export function ClientProvider({ data, children }: PropsWithChildren<Props>) {
  return (
    <ClientContext.Provider value={{ clientUser: data ?? undefined }}>
      {children}
    </ClientContext.Provider>
  )
}

export function useClient() {
  const context = useContext(ClientContext)
  if (!context) {
    throw new Error('useClient must be used within a ClientProvider')
  }
  return context
}
```

- [ ] **Step 2: Update AuthProvider to hold User**

Replace `apps/property-manager/app/providers/auth-provider.tsx`:

```tsx
import { createContext, useContext, type PropsWithChildren } from 'react'

interface Props {
  data?: User
}

interface IAuthContext {
  currentUser?: User
}

const AuthContext = createContext<IAuthContext | null>(null)

export function AuthProvider({ data, children }: PropsWithChildren<Props>) {
  return (
    <AuthContext.Provider value={{ currentUser: data ?? undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

- [ ] **Step 3: Export ClientProvider from providers/index.tsx**

In `apps/property-manager/app/providers/index.tsx`, add `ClientProvider` to the exports and wrap it into the `Providers` component tree.

Read the file first, then add the import and wrap children:

```tsx
import { ClientProvider } from './client-provider'
// Pass clientUser prop down from wherever Providers is called
```

> Note: `Providers` is called in `root.tsx` — it may need a `clientUser` prop passed from the root loader. Read `root.tsx` to see if `Providers` already accepts a `data` prop, and follow the same pattern used for `AuthProvider`.

- [ ] **Step 4: Type check**

```bash
cd apps/property-manager && yarn types:check 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add apps/property-manager/app/providers/client-provider.tsx apps/property-manager/app/providers/auth-provider.tsx apps/property-manager/app/providers/index.tsx
git commit -m "feat: add ClientProvider, update AuthProvider for User type"
```

---

## Task 8: Update _auth._dashboard layout + property middleware

**Files:**
- Modify: `apps/property-manager/app/routes/_auth._dashboard.tsx`
- Modify: `apps/property-manager/app/lib/actions/property.middleware.server.ts`

- [ ] **Step 1: Update _auth._dashboard.tsx to read from clientContext**

In `apps/property-manager/app/routes/_auth._dashboard.tsx`, replace `context.get(userContext)` with `context.get(clientContext)` where `clientUser.role` is read.

Import `clientContext` from `~/lib/actions/client.context.server`.

Change:
```ts
const authData = context.get(userContext)
if (authData.clientUser.role === 'STAFF') {
```
To:
```ts
const clientData = context.get(clientContext)
if (clientData?.clientUser.role === 'STAFF') {
```

For all other places in this file that read `authData.clientUser`, change to `clientData.clientUser`.

- [ ] **Step 2: Update property middleware to read client_user_id from clientContext**

In `apps/property-manager/app/lib/actions/property.middleware.server.ts`, replace `context.get(userContext)` with `context.get(clientContext)`:

```ts
import { clientContext } from './client.context.server'

// Replace:
const authData = context.get(userContext)
// ...
client_user_id: authData.clientUser.id,

// With:
const clientData = context.get(clientContext)
// ...
client_user_id: clientData?.clientUser.id,
```

- [ ] **Step 3: Type check**

```bash
cd apps/property-manager && yarn types:check 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add apps/property-manager/app/routes/_auth._dashboard.tsx apps/property-manager/app/lib/actions/property.middleware.server.ts
git commit -m "feat: update dashboard and property middleware to use clientContext"
```

---

## Task 9: Update all API calls to include selectedClientId

All API calls that target protected client-scoped endpoints (properties, invoices, client-users, etc.) must prepend `/clients/${selectedClientId}` to the path.

**Strategy:** The `useClient()` hook gives `clientUser.client_id`. Each API file that makes calls to `/v1/admin/<resource>` must update to `/v1/admin/clients/${clientId}/<resource>`.

- [ ] **Step 1: Find all affected API files**

```bash
grep -rl "/v1/admin/" apps/property-manager/app/api/ | grep -v auth
```

- [ ] **Step 2: For each file found, update paths**

For each call that uses `/v1/admin/<resource>` (excluding `/v1/admin/users/*`), change the path to `/v1/admin/clients/${clientId}/<resource>`.

The `clientId` comes from:
- In **server functions** (`server.ts`): passed as part of `apiConfig` or via a new `clientId` parameter
- In **client hooks** (`index.ts`): read from a `selectedClientId` stored in `window.ENV` or passed as a hook argument

Recommended pattern for client-side hooks — pass `clientId` as a parameter:

```ts
// Before
const getProperties = async () => {
  const response = await fetchClient<ApiResponse<...>>(`/v1/admin/properties`, ...)
  ...
}

// After
const getProperties = async (clientId: string) => {
  const response = await fetchClient<ApiResponse<...>>(`/v1/admin/clients/${clientId}/properties`, ...)
  ...
}
```

For server-side functions, add `clientId: string` to `ApiConfigForServerConfig`-style param objects and thread it through.

> Apply this to all files returned in Step 1. This is the broadest task — work file by file, running `yarn types:check` after each file to catch issues immediately.

- [ ] **Step 3: Update root.tsx to expose selectedClientId to client-side**

In `apps/property-manager/app/root.tsx` loader, add `selectedClientId` to the `ENV` object:

```ts
const authSession = await getAuthSession(request.headers.get('Cookie'))
// ...
ENV: {
  // ...existing fields...
  SELECTED_CLIENT_ID: authSession.get('selectedClientId') ?? '',
},
```

Update the `Window['ENV']` type in `apps/property-manager/types/global.d.ts`:

```ts
interface Window {
  ENV: {
    API_ADDRESS: string
    AUTH_TOKEN?: string
    GOOGLE_MAPS_API_KEY: string
    CUBEJS_API_URL: string
    SELECTED_CLIENT_ID: string
  }
  // ...
}
```

- [ ] **Step 3b: Handle 403 on property-scoped routes**

The backend now enforces property-level access: **only OWNER** has universal access to all properties in a client. ADMIN and STAFF receive a `403 Forbidden` if they request a property they are not explicitly assigned to. This means any UI that lists or links to properties should gracefully handle the case where a non-OWNER user navigates to an unassigned property — show a "You don't have access to this property" message rather than a generic error. No API changes are needed, but add error boundary handling for 403 responses on all property-scoped API calls (e.g. `/v1/admin/clients/${clientId}/properties/${propertyId}/...`).

- [ ] **Step 4: Add client switcher to sidebar**

In the app sidebar component (find with `grep -r "AppSidebar\|sidebar" apps/property-manager/app/components/ -l`), add a "Switch workspace" link that navigates to `/select-client`:

```tsx
<Link to="/select-client" className="text-sm text-muted-foreground hover:text-foreground">
  Switch workspace
</Link>
```

- [ ] **Step 5: Full type check**

```bash
cd apps/property-manager && yarn types:check
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add apps/property-manager/
git commit -m "feat: prepend /clients/{id} to all API calls, add workspace switcher"
```

---

## Task 10: Verify settings pages that reference clientUser.name/email

Several settings pages likely display `currentUser.name` or `currentUser.email`. After this refactor these come from `useAuth().currentUser` (which is now a `User`) — no longer from `useClient().clientUser`.

- [ ] **Step 1: Find affected components**

```bash
grep -rl "currentUser\." apps/property-manager/app/ | grep -v node_modules
```

- [ ] **Step 2: Update references**

For each file, check whether the access is:
- `currentUser.name` / `currentUser.email` / `currentUser.phone_number` → these are on `User`, so `useAuth().currentUser` works directly
- `currentUser.role` / `currentUser.status` → these are on `ClientUser`, so use `useClient().clientUser`

- [ ] **Step 3: Type check + lint**

```bash
cd apps/property-manager && yarn types:check && yarn lint
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/property-manager/
git commit -m "fix: update currentUser references — identity from User, role from ClientUser"
```
