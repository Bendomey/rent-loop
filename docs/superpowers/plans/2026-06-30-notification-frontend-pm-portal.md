# Notification System — Frontend PM Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-app notification center to the property manager portal — a bell icon with unread badge in the sidebar that opens a popover showing a scrollable notification list matching the mobile design (colored event icons, unread dot indicators, relative timestamps, "Mark all as read").

**Architecture:** A `NotificationBell` block component wraps a Shadcn `Popover`. It polls `GET /v1/notifications/unread-count` on mount and refetches after marking items read. The popover body renders a `NotificationList` that paginates via `GET /v1/notifications`. Individual items call `POST /v1/notifications/{id}/read` on click; "Mark all" calls `POST /v1/notifications/read-all`. The bell is mounted in `AppSidebar` between `SidebarContent` and `SidebarFooter`.

**Prerequisite:** The backend core plan (`2026-06-30-notification-backend-core.md`) must be fully deployed before the frontend can consume real data. Use seed/mock data during development if needed.

**Tech Stack:** React 19, React Router v7, TypeScript, TanStack Query v5, Tailwind CSS v4, Shadcn/Radix (`Popover`, `ScrollArea`, `Badge`), lucide-react icons, dayjs (already installed)

## Global Constraints

- All new UI must work in both light and dark modes — no hardcoded `bg-white` / `text-black`
- Use Shadcn/Radix primitives and CSS variables (`bg-background`, `text-foreground`, `border`, `muted`) for theming
- `dark:` variant required alongside any raw color class
- Never set default query params inside hooks — callers own their params
- Run `yarn types:check` before considering a task complete
- Never commit — leave all changes unstaged for the user to commit

## Mobile Reference

The web version mirrors this mobile design:
- Bell icon with badge showing unread count
- Popover opens on click with "Notifications" header + "Mark all as read" button (top right)
- List of notification items, newest first
- Each item: colored rounded icon (per event type) · bold title · muted body · relative timestamp (top right) · red dot for unread
- Unread rows: `bg-rose-50 dark:bg-rose-950/30` background tint
- Read rows: default `bg-background`
- Separator between items

## Event Icon Color Map

| Event prefix | Icon | Color class |
|---|---|---|
| `PAYMENT_*` | `Banknote` | `bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400` |
| `MAINTENANCE_*` | `Wrench` | `bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400` |
| `TENANT_APPLICATION_*` | `FileText` | `bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400` |
| `BOOKING_*` | `CalendarCheck` | `bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400` |
| `INVOICE_*` | `Bell` | `bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400` |
| `LEASE_*` | `CheckCircle` | `bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400` |
| (default) | `Bell` | `bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400` |

---

## File Map

| Action  | Path |
|---------|------|
| Create  | `app/api/notifications/index.ts` |
| Create  | `app/types/notifications.d.ts` |
| Create  | `app/components/blocks/notification-bell.tsx` |
| Modify  | `app/components/app-sidebar.tsx` |
| Modify  | `app/lib/constants.ts` |

---

### Task 1: TypeScript types

**Files:**
- Create: `app/types/notifications.d.ts`

**Interfaces:**
- Produces: `Notification` type — consumed by Tasks 2, 3

- [ ] **Step 1: Write the failing type check**

Create `app/types/notifications.d.ts`:

```ts
interface Notification {
  id: string
  organization_id: string
  recipient_id: string
  recipient_type: 'CLIENT_USER' | 'TENANT_ACCOUNT'
  event: string
  category: string | null
  visibility: 'IN_APP' | 'HIDDEN'
  title: string | null
  body: string | null
  data: Record<string, unknown> | null
  is_read: boolean
  read_at: string | null
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED'
  scheduled_at: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2: Verify types check**

```bash
cd apps/property-manager && yarn types:check 2>&1 | head -20
```

Expected: no errors related to `Notification`

- [ ] **Step 3: Commit**

```bash
git add apps/property-manager/app/types/notifications.d.ts
git commit -m "feat(notification): add Notification TypeScript type"
```

---

### Task 2: API client hooks

**Files:**
- Create: `app/api/notifications/index.ts`
- Modify: `app/lib/constants.ts`

**Interfaces:**
- Consumes: `Notification` from Task 1
- Produces:
  - `useGetNotifications(query)` — paginated list hook
  - `useGetNotificationUnreadCount()` — unread count hook
  - `useMarkNotificationRead()` — single mark-read mutation
  - `useMarkAllNotificationsRead()` — mark-all mutation
  - Consumed by Task 3 (NotificationBell component)

- [ ] **Step 1: Add NOTIFICATIONS to QUERY_KEYS in constants.ts**

In `app/lib/constants.ts`, add to the `QUERY_KEYS` object:

```ts
NOTIFICATIONS: 'notifications',
NOTIFICATION_UNREAD_COUNT: 'notification-unread-count',
```

- [ ] **Step 2: Create the API client**

`app/api/notifications/index.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient } from '~/lib/transport'

const getNotifications = async (page: number, pageSize: number) => {
  try {
    const response = await fetchClient<
      ApiResponse<FetchMultipleDataResponse<Notification>>
    >(`/v1/notifications?page=${page}&page_size=${pageSize}`)
    return response.parsedBody.data
  } catch (error: unknown) {
    if (error instanceof Response) {
      const body = await error.json()
      throw new Error(body.errors?.message || 'Unknown error')
    }
    if (error instanceof Error) throw error
  }
}

export const useGetNotifications = (page = 1, pageSize = 20) =>
  useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATIONS, page, pageSize],
    queryFn: () => getNotifications(page, pageSize),
  })

const getNotificationUnreadCount = async () => {
  try {
    const response = await fetchClient<{ data: { count: number } }>(
      '/v1/notifications/unread-count',
    )
    return response.parsedBody.data.count
  } catch (error: unknown) {
    if (error instanceof Response) {
      const body = await error.json()
      throw new Error(body.errors?.message || 'Unknown error')
    }
    if (error instanceof Error) throw error
    return 0
  }
}

export const useGetNotificationUnreadCount = () =>
  useQuery({
    queryKey: [QUERY_KEYS.NOTIFICATION_UNREAD_COUNT],
    queryFn: getNotificationUnreadCount,
    refetchInterval: 60_000, // poll every 60s
  })

const markNotificationRead = async (notificationId: string) => {
  try {
    await fetchClient(`/v1/notifications/${notificationId}/read`, {
      method: 'POST',
    })
  } catch (error: unknown) {
    if (error instanceof Response) {
      const body = await error.json()
      throw new Error(body.errors?.message || 'Unknown error')
    }
    if (error instanceof Error) throw error
  }
}

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] })
      void queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.NOTIFICATION_UNREAD_COUNT],
      })
    },
  })
}

const markAllNotificationsRead = async () => {
  try {
    await fetchClient('/v1/notifications/read-all', { method: 'POST' })
  } catch (error: unknown) {
    if (error instanceof Response) {
      const body = await error.json()
      throw new Error(body.errors?.message || 'Unknown error')
    }
    if (error instanceof Error) throw error
  }
}

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS] })
      void queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.NOTIFICATION_UNREAD_COUNT],
      })
    },
  })
}
```

- [ ] **Step 3: Verify types check**

```bash
cd apps/property-manager && yarn types:check 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/property-manager/app/api/notifications/index.ts \
        apps/property-manager/app/lib/constants.ts
git commit -m "feat(notification): add notification API hooks and query keys"
```

---

### Task 3: NotificationBell component

**Files:**
- Create: `app/components/blocks/notification-bell.tsx`

**Interfaces:**
- Consumes:
  - `useGetNotifications`, `useGetNotificationUnreadCount`, `useMarkNotificationRead`, `useMarkAllNotificationsRead` from Task 2
  - `Notification` type from Task 1
- Produces: `<NotificationBell />` — consumed by Task 4 (AppSidebar)

- [ ] **Step 1: Verify required Shadcn components are installed**

```bash
ls apps/property-manager/app/components/ui/ | grep -E "popover|scroll-area|badge|separator"
```

Expected: `popover.tsx`, `scroll-area.tsx`, `badge.tsx`, `separator.tsx` all present.

If any are missing, install them:
```bash
cd apps/property-manager && npx shadcn@latest add popover scroll-area badge separator
```

- [ ] **Step 2: Create the component**

`app/components/blocks/notification-bell.tsx`:

```tsx
import {
  Bell,
  Banknote,
  Wrench,
  FileText,
  CalendarCheck,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Separator } from '~/components/ui/separator'
import {
  useGetNotifications,
  useGetNotificationUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '~/api/notifications'
import { cn } from '~/lib/utils'

dayjs.extend(relativeTime)

type EventIconConfig = {
  icon: LucideIcon
  containerClass: string
  iconClass: string
}

function getEventIconConfig(event: string): EventIconConfig {
  if (event.startsWith('PAYMENT_'))
    return {
      icon: Banknote,
      containerClass:
        'bg-emerald-100 dark:bg-emerald-900/40',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
    }
  if (event.startsWith('MAINTENANCE_'))
    return {
      icon: Wrench,
      containerClass: 'bg-rose-100 dark:bg-rose-900/40',
      iconClass: 'text-rose-600 dark:text-rose-400',
    }
  if (event.startsWith('TENANT_APPLICATION_'))
    return {
      icon: FileText,
      containerClass: 'bg-blue-100 dark:bg-blue-900/40',
      iconClass: 'text-blue-600 dark:text-blue-400',
    }
  if (event.startsWith('BOOKING_'))
    return {
      icon: CalendarCheck,
      containerClass: 'bg-violet-100 dark:bg-violet-900/40',
      iconClass: 'text-violet-600 dark:text-violet-400',
    }
  if (event.startsWith('LEASE_'))
    return {
      icon: CheckCircle,
      containerClass: 'bg-teal-100 dark:bg-teal-900/40',
      iconClass: 'text-teal-600 dark:text-teal-400',
    }
  if (event.startsWith('INVOICE_'))
    return {
      icon: Bell,
      containerClass: 'bg-amber-100 dark:bg-amber-900/40',
      iconClass: 'text-amber-600 dark:text-amber-400',
    }
  return {
    icon: Bell,
    containerClass: 'bg-zinc-100 dark:bg-zinc-800',
    iconClass: 'text-zinc-600 dark:text-zinc-400',
  }
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification
  onRead: (id: string) => void
}) {
  const { icon: Icon, containerClass, iconClass } = getEventIconConfig(
    notification.event,
  )

  return (
    <button
      type="button"
      onClick={() => {
        if (!notification.is_read) onRead(notification.id)
      }}
      className={cn(
        'flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
        !notification.is_read && 'bg-rose-50 dark:bg-rose-950/30',
      )}
    >
      {/* Event icon */}
      <div
        className={cn(
          'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
          containerClass,
        )}
      >
        <Icon className={cn('size-4', iconClass)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold leading-snug">
            {notification.title ?? notification.event}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {dayjs(notification.created_at).fromNow(true)}
            </span>
            {!notification.is_read && (
              <span className="size-2 shrink-0 rounded-full bg-rose-500" />
            )}
          </div>
        </div>
        {notification.body ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {notification.body}
          </p>
        ) : null}
      </div>
    </button>
  )
}

export function NotificationBell() {
  const { data: unreadCount = 0 } = useGetNotificationUnreadCount()
  const { data: notificationsData, isLoading } = useGetNotifications(1, 20)
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = notificationsData?.rows ?? []

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[380px] p-0 shadow-lg"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <Separator />

        {/* Notification list */}
        <ScrollArea className="h-[420px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <Bell className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={(id) => markRead.mutate(id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 3: Verify types check**

```bash
cd apps/property-manager && yarn types:check 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/property-manager/app/components/blocks/notification-bell.tsx
git commit -m "feat(notification): add NotificationBell popover component"
```

---

### Task 4: Mount NotificationBell in AppSidebar

**Files:**
- Modify: `app/components/app-sidebar.tsx`

**Interfaces:**
- Consumes: `<NotificationBell />` from Task 3
- Produces: Bell icon visible in the sidebar footer area, above NavUser

- [ ] **Step 1: Import NotificationBell**

In `app/components/app-sidebar.tsx`, add to the existing imports:

```tsx
import { NotificationBell } from '~/components/blocks/notification-bell'
```

- [ ] **Step 2: Mount the bell in SidebarFooter**

In the `AppSidebar` return, replace:

```tsx
      <SidebarFooter>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
```

With:

```tsx
      <SidebarFooter>
        <NavSecondary items={data.navSecondary} className="mt-auto" />
        <div className="px-2 pb-1">
          <NotificationBell />
        </div>
        <NavUser />
      </SidebarFooter>
```

- [ ] **Step 3: Verify types check and lint**

```bash
cd apps/property-manager && yarn types:check 2>&1 | head -20 && yarn lint 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Start dev server and verify the bell renders**

```bash
cd apps/property-manager && yarn dev
```

Open http://localhost:3000 in both light and dark mode and verify:
- Bell icon appears in the sidebar footer
- Clicking it opens the popover
- "No notifications yet" empty state renders correctly
- The popover closes when clicking outside

- [ ] **Step 5: Commit**

```bash
git add apps/property-manager/app/components/app-sidebar.tsx
git commit -m "feat(notification): mount NotificationBell in AppSidebar footer"
```

---

## Spec Coverage

| Requirement | Covered By |
|---|---|
| Bell icon with unread badge count | `NotificationBell` — badge shows live unread count |
| Popover notification list, newest first | `useGetNotifications(1, 20)` + `ORDER BY created_at DESC` on backend |
| Colored event icon per type | `getEventIconConfig()` in `NotificationItem` |
| Unread dot indicator (red) | `span` with `bg-rose-500` when `!is_read` |
| Unread row tint | `bg-rose-50 dark:bg-rose-950/30` on unread rows |
| Relative timestamp | `dayjs(created_at).fromNow(true)` |
| Mark single notification as read on click | `useMarkNotificationRead` mutation, invalidates list + count |
| "Mark all as read" button | `useMarkAllNotificationsRead` mutation |
| Dark mode support | All colors use `dark:` variant or CSS variable |
| 60-second count polling | `refetchInterval: 60_000` in `useGetNotificationUnreadCount` |

**Not in this plan (follow-on):**
- Notification click deep-linking to the relevant resource (invoice, maintenance request, etc.)
- Infinite scroll / load-more for the notification list
- Real-time badge update via WebSocket (future)
- Per-event-type notification preference settings
