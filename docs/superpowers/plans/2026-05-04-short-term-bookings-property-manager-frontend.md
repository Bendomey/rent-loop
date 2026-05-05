# Short-Term Bookings — Property Manager Frontend (Plan 2 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add booking management UI to the property manager portal — mode selection in the creation wizard, conditional sidebar navigation, and four new pages: bookings list, new booking form, booking detail, and availability calendar.

**Architecture:** New modules follow the existing handlers → route → module pattern. Each route file is thin (loader + meta + default export to module). Data fetching uses TanStack Query hooks in `app/api/bookings/`. The availability calendar refetches blocks per visible month via `onMonthChange`. Verification after each task is `yarn types:check && yarn lint` from `apps/property-manager/`.

**Tech Stack:** React Router v7, React 19, TypeScript, TanStack Query v5, Tailwind CSS v4, Shadcn/Radix UI, react-day-picker v9

**Design spec:** `docs/superpowers/specs/2026-05-04-short-term-bookings-frontend-design.md`

---

## File Map

**New files:**
- `apps/property-manager/types/booking.d.ts` — Booking, UnitDateBlock, FetchBookingFilter global types
- `apps/property-manager/app/api/bookings/index.ts` — all TanStack Query hooks for bookings + availability
- `apps/property-manager/app/api/bookings/server.ts` — SSR booking fetch for detail page loader
- `apps/property-manager/app/routes/_auth.properties.$propertyId.bookings._index.tsx` — bookings list route
- `apps/property-manager/app/routes/_auth.properties.$propertyId.bookings.new.tsx` — new booking form route
- `apps/property-manager/app/routes/_auth.properties.$propertyId.bookings.$bookingId.tsx` — booking detail route
- `apps/property-manager/app/routes/_auth.properties.$propertyId.availability.tsx` — availability calendar route
- `apps/property-manager/app/modules/properties/property/bookings/index.tsx` — bookings list module
- `apps/property-manager/app/modules/properties/property/bookings/new/index.tsx` — new booking form module
- `apps/property-manager/app/modules/properties/property/bookings/booking/index.tsx` — booking detail module
- `apps/property-manager/app/modules/properties/property/availability/index.tsx` — availability calendar module

**Modified files:**
- `apps/property-manager/types/property.d.ts` — add `modes` and `booking_requires_upfront_payment`
- `apps/property-manager/app/lib/constants.ts` — add `BOOKINGS` and `DATE_BLOCKS` to `QUERY_KEYS`
- `apps/property-manager/app/api/properties/index.ts` — add `modes` to `CreatePropertyInput`
- `apps/property-manager/app/modules/properties/new/steps/step0.tsx` — add mode selection radio cards
- `apps/property-manager/app/modules/properties/new/steps/step3.tsx` — show selected mode in review
- `apps/property-manager/app/modules/properties/property/layout/sidebar.tsx` — conditional nav by modes
- `apps/property-manager/app/modules/properties/property/assets/units/unit/details/index.tsx` — add booking link
- `apps/property-manager/app/modules/index.ts` — export new modules

---

## Task 1: Types — Booking, UnitDateBlock, Property modes

**Files:**
- Create: `apps/property-manager/types/booking.d.ts`
- Modify: `apps/property-manager/types/property.d.ts`

- [ ] **Step 1: Create `types/booking.d.ts`**

```ts
type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'

type BookingSource = 'MANAGER' | 'GUEST_LINK'

type BlockType =
  | 'BOOKING'
  | 'LEASE'
  | 'MAINTENANCE'
  | 'PERSONAL'
  | 'OTHER'

interface Booking {
  id: string
  code: string
  tracking_code: string
  check_in_code: string
  unit_id: string
  unit: PropertyUnit
  property_id: string
  tenant_id: string
  tenant: Tenant
  check_in_date: Date
  check_out_date: Date
  rate: number
  currency: string
  status: BookingStatus
  cancellation_reason: string
  notes: string
  booking_source: BookingSource
  requires_upfront_payment: boolean
  created_by_client_user_id: Nullable<string>
  invoice_id: Nullable<string>
  invoice: Nullable<Invoice>
  created_at: Date
  updated_at: Date
}

interface UnitDateBlock {
  id: string
  unit_id: string
  start_date: Date
  end_date: Date
  block_type: BlockType
  booking_id: Nullable<string>
  lease_id: Nullable<string>
  reason: string
  created_at: Date
}

interface FetchBookingFilter {
  status?: BookingStatus
  unit_id?: string
}
```

- [ ] **Step 2: Add `modes` and `booking_requires_upfront_payment` to `types/property.d.ts`**

Open the file and add two fields to the `Property` interface after `tags`:

```ts
modes: Array<'LEASE' | 'BOOKING'>
booking_requires_upfront_payment: boolean
```

The `Property` interface after the edit:

```ts
interface Property {
  id: string
  client_id: string
  slug: string
  name: string
  description: Nullable<string>
  address: string
  gps_address: string
  country: string
  region: string
  city: string
  state: string
  type: 'SINGLE' | 'MULTI'
  status:
    | 'Property.Status.Active'
    | 'Property.Status.Inactive'
    | 'Property.Status.Maintenance'
  zip_code: string
  image: string[]
  tags: string[]
  modes: Array<'LEASE' | 'BOOKING'>
  booking_requires_upfront_payment: boolean
  created_at: Date
  updated_at: Date
}
```

- [ ] **Step 3: Run type check**

```bash
cd apps/property-manager && yarn types:check
```

Expected: exits 0. If you see errors about `Invoice` not found in booking.d.ts, check `types/invoice.d.ts` for the correct interface name — it may be `BillingInvoice`. Adjust the type in `booking.d.ts` accordingly.

- [ ] **Step 4: Commit**

```bash
git add apps/property-manager/types/booking.d.ts \
        apps/property-manager/types/property.d.ts
git commit -m "feat(types): add Booking, UnitDateBlock types; add modes to Property"
```

---

## Task 2: Constants — add BOOKINGS and DATE_BLOCKS query keys

**Files:**
- Modify: `apps/property-manager/app/lib/constants.ts`

- [ ] **Step 1: Add two keys to `QUERY_KEYS`**

Open `app/lib/constants.ts`. Find the `QUERY_KEYS` object and add these two lines before the closing `} as const`:

```ts
BOOKINGS: 'bookings',
DATE_BLOCKS: 'date-blocks',
```

- [ ] **Step 2: Commit**

```bash
git add apps/property-manager/app/lib/constants.ts
git commit -m "feat(constants): add BOOKINGS and DATE_BLOCKS query keys"
```

---

## Task 3: Booking API — client-side TanStack Query hooks

**Files:**
- Create: `apps/property-manager/app/api/bookings/index.ts`

- [ ] **Step 1: Create `app/api/bookings/index.ts`**

```ts
import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { getQueryParams } from '~/lib/get-param'
import { fetchClient } from '~/lib/transport'

// ---- Queries ----

const getPropertyBookings = async (
  clientId: string,
  propertyId: string,
  props: FetchMultipleDataInputParams<FetchBookingFilter>,
) => {
  try {
    const params = getQueryParams<FetchBookingFilter>(props)
    const response = await fetchClient<
      ApiResponse<FetchMultipleDataResponse<Booking>>
    >(
      `/v1/admin/clients/${clientId}/properties/${propertyId}/bookings?${params.toString()}`,
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

export const useGetPropertyBookings = (
  clientId: string,
  propertyId: string,
  query: FetchMultipleDataInputParams<FetchBookingFilter>,
) =>
  useQuery({
    queryKey: [QUERY_KEYS.BOOKINGS, clientId, propertyId, query],
    queryFn: () => getPropertyBookings(clientId, propertyId, query),
    enabled: !!clientId && !!propertyId,
  })

const getBooking = async (clientId: string, bookingId: string) => {
  try {
    const response = await fetchClient<ApiResponse<Booking>>(
      `/v1/admin/clients/${clientId}/bookings/${bookingId}?populate=Tenant,Unit,Property,Invoice`,
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

export const useGetBooking = (
  clientId: string,
  bookingId: string,
  initialData?: Booking,
) =>
  useQuery({
    queryKey: [QUERY_KEYS.BOOKINGS, clientId, bookingId],
    queryFn: () => getBooking(clientId, bookingId),
    enabled: !!clientId && !!bookingId,
    initialData,
  })

const getUnitAvailability = async (
  clientId: string,
  unitId: string,
  from: Date,
  to: Date,
) => {
  try {
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    })
    const response = await fetchClient<ApiResponse<UnitDateBlock[]>>(
      `/v1/admin/clients/${clientId}/units/${unitId}/availability?${params.toString()}`,
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

export const useGetUnitAvailability = (
  clientId: string,
  unitId: string,
  from: Date,
  to: Date,
) =>
  useQuery({
    queryKey: [
      QUERY_KEYS.DATE_BLOCKS,
      clientId,
      unitId,
      from.toISOString(),
      to.toISOString(),
    ],
    queryFn: () => getUnitAvailability(clientId, unitId, from, to),
    enabled: !!clientId && !!unitId,
  })

// ---- Mutations ----

export interface CreateBookingInput {
  clientId: string
  propertyId: string
  unit_id: string
  check_in_date: string
  check_out_date: string
  rate: number
  currency: string
  notes?: string
  guest_first_name: string
  guest_last_name: string
  guest_phone: string
  guest_email: string
  guest_id_number: string
}

const createBooking = async ({
  clientId,
  propertyId,
  ...body
}: CreateBookingInput) => {
  try {
    const response = await fetchClient<ApiResponse<Booking>>(
      `/v1/admin/clients/${clientId}/properties/${propertyId}/bookings`,
      { method: 'POST', body: JSON.stringify(body) },
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

export const useCreateBooking = () => useMutation({ mutationFn: createBooking })

const confirmBooking = async ({
  clientId,
  bookingId,
}: {
  clientId: string
  bookingId: string
}) => {
  try {
    const response = await fetchClient<ApiResponse<Booking>>(
      `/v1/admin/clients/${clientId}/bookings/${bookingId}/confirm`,
      { method: 'PUT' },
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

export const useConfirmBooking = () =>
  useMutation({ mutationFn: confirmBooking })

const checkInBooking = async ({
  clientId,
  bookingId,
}: {
  clientId: string
  bookingId: string
}) => {
  try {
    await fetchClient(
      `/v1/admin/clients/${clientId}/bookings/${bookingId}/check-in`,
      { method: 'PUT' },
    )
  } catch (error: unknown) {
    if (error instanceof Response) {
      const response = await error.json()
      throw new Error(response.errors?.message || 'Unknown error')
    }
    if (error instanceof Error) throw error
  }
}

export const useCheckInBooking = () =>
  useMutation({ mutationFn: checkInBooking })

const completeBooking = async ({
  clientId,
  bookingId,
}: {
  clientId: string
  bookingId: string
}) => {
  try {
    await fetchClient(
      `/v1/admin/clients/${clientId}/bookings/${bookingId}/complete`,
      { method: 'PUT' },
    )
  } catch (error: unknown) {
    if (error instanceof Response) {
      const response = await error.json()
      throw new Error(response.errors?.message || 'Unknown error')
    }
    if (error instanceof Error) throw error
  }
}

export const useCompleteBooking = () =>
  useMutation({ mutationFn: completeBooking })

export interface CancelBookingInput {
  clientId: string
  bookingId: string
  reason: string
}

const cancelBooking = async ({
  clientId,
  bookingId,
  reason,
}: CancelBookingInput) => {
  try {
    await fetchClient(
      `/v1/admin/clients/${clientId}/bookings/${bookingId}/cancel`,
      { method: 'PUT', body: JSON.stringify({ reason }) },
    )
  } catch (error: unknown) {
    if (error instanceof Response) {
      const response = await error.json()
      throw new Error(response.errors?.message || 'Unknown error')
    }
    if (error instanceof Error) throw error
  }
}

export const useCancelBooking = () =>
  useMutation({ mutationFn: cancelBooking })

export interface CreateDateBlockInput {
  clientId: string
  unitId: string
  start_date: string
  end_date: string
  block_type: 'MAINTENANCE' | 'PERSONAL' | 'OTHER'
  reason?: string
}

const createDateBlock = async ({
  clientId,
  unitId,
  ...body
}: CreateDateBlockInput) => {
  try {
    const response = await fetchClient<ApiResponse<UnitDateBlock>>(
      `/v1/admin/clients/${clientId}/units/${unitId}/date-blocks`,
      { method: 'POST', body: JSON.stringify(body) },
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

export const useCreateDateBlock = () =>
  useMutation({ mutationFn: createDateBlock })

const deleteDateBlock = async ({
  clientId,
  blockId,
}: {
  clientId: string
  blockId: string
}) => {
  try {
    await fetchClient(
      `/v1/admin/clients/${clientId}/date-blocks/${blockId}`,
      { method: 'DELETE' },
    )
  } catch (error: unknown) {
    if (error instanceof Response) {
      const response = await error.json()
      throw new Error(response.errors?.message || 'Unknown error')
    }
    if (error instanceof Error) throw error
  }
}

export const useDeleteDateBlock = () =>
  useMutation({ mutationFn: deleteDateBlock })
```

- [ ] **Step 2: Run type check**

```bash
cd apps/property-manager && yarn types:check
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add apps/property-manager/app/api/bookings/index.ts
git commit -m "feat(api): add booking and date-block TanStack Query hooks"
```

---

## Task 4: Booking API — SSR server-side fetch

**Files:**
- Create: `apps/property-manager/app/api/bookings/server.ts`

- [ ] **Step 1: Create `app/api/bookings/server.ts`**

```ts
import { fetchServer } from '~/lib/transport'

export const getBookingForServer = async (
  clientId: string,
  bookingId: string,
  apiConfig: ApiConfigForServerConfig,
) => {
  try {
    const response = await fetchServer<ApiResponse<Booking>>(
      `${apiConfig.baseUrl}/v1/admin/clients/${clientId}/bookings/${bookingId}?populate=Tenant,Unit,Property,Invoice`,
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

- [ ] **Step 2: Run type check**

```bash
cd apps/property-manager && yarn types:check
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add apps/property-manager/app/api/bookings/server.ts
git commit -m "feat(api): add server-side booking fetch for SSR detail page"
```

---

## Task 5: Property creation wizard — mode selection in Step 0

**Files:**
- Modify: `apps/property-manager/app/api/properties/index.ts`
- Modify: `apps/property-manager/app/modules/properties/new/steps/step0.tsx`
- Modify: `apps/property-manager/app/modules/properties/new/steps/step3.tsx`

- [ ] **Step 1: Add `modes` to `CreatePropertyInput` in `app/api/properties/index.ts`**

Find the `CreatePropertyInput` interface and add:

```ts
modes: Array<'LEASE' | 'BOOKING'>
```

The full updated interface:

```ts
export interface CreatePropertyInput {
  address: string
  city: string
  country: string
  description: Maybe<string>
  gps_address: Maybe<string>
  images: Maybe<string[]>
  latitude: number
  longitude: number
  modes: Array<'LEASE' | 'BOOKING'>
  name: string
  region: string
  status: Property['status']
  tags: string[]
  type: Property['type']
}
```

- [ ] **Step 2: Replace `app/modules/properties/new/steps/step0.tsx` with the updated version**

This adds a mode selection section below the existing status buttons, following the same `Item`/`ItemGroup` pattern used for property type:

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { Building, ClipboardList, Home, Hotel } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { useCreatePropertyContext } from '../context'
import { Button } from '~/components/ui/button'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemTitle,
} from '~/components/ui/item'
import {
  TypographyH2,
  TypographyMuted,
  TypographySmall,
} from '~/components/ui/typography'
import { ASSET_MANAGEMENT_GUIDE_URL } from '~/lib/constants'
import { cn } from '~/lib/utils'

const ValidationSchema = z.object({
  type: z.enum(['SINGLE', 'MULTI'], {
    error: 'Please select a type',
  }),
  status: z.enum(
    [
      'Property.Status.Active',
      'Property.Status.Maintenance',
      'Property.Status.Inactive',
    ],
    { error: 'Please select a status' },
  ),
  modeSelection: z.enum(['LEASE', 'BOOKING', 'BOTH'], {
    error: 'Please select a rental mode',
  }),
})

type FormSchema = z.infer<typeof ValidationSchema>

const propertyModels = [
  {
    type: 'SINGLE',
    name: 'Single Unit',
    description: 'A complete housing space rented by one family or tenant.',
    icon: Home,
  },
  {
    type: 'MULTI',
    name: 'Multi-Unit',
    description:
      'A property divided into separate spaces rented by multiple tenants.',
    icon: Building,
  },
]

const statusOptions: Array<{ label: string; value: Property['status'] }> = [
  { label: 'Active', value: 'Property.Status.Active' },
  { label: 'Inactive', value: 'Property.Status.Inactive' },
  { label: 'Maintenance', value: 'Property.Status.Maintenance' },
]

const modeOptions: Array<{
  value: 'LEASE' | 'BOOKING' | 'BOTH'
  name: string
  description: string
  icon: React.ElementType
}> = [
  {
    value: 'LEASE',
    name: 'Long-term (Leases)',
    description: 'Monthly rent, lease applications, lease agreements.',
    icon: ClipboardList,
  },
  {
    value: 'BOOKING',
    name: 'Short-term (Bookings)',
    description: 'Nightly/daily stays, guest booking link, availability calendar.',
    icon: Hotel,
  },
  {
    value: 'BOTH',
    name: 'Both',
    description: 'Some units long-term, others available for short stays.',
    icon: Building,
  },
]

export function Step0() {
  const { watch, setValue, formState, handleSubmit } = useForm<FormSchema>({
    resolver: zodResolver(ValidationSchema),
    defaultValues: {
      status: 'Property.Status.Active',
    },
  })

  const { goNext, updateFormData, formData } = useCreatePropertyContext()

  useEffect(() => {
    if (formData.type) {
      setValue('type', formData.type, { shouldDirty: true, shouldValidate: true })
    }
    if (formData.status) {
      setValue('status', formData.status, { shouldDirty: true, shouldValidate: true })
    }
    if (formData.modes) {
      const modeSelection =
        formData.modes.includes('LEASE') && formData.modes.includes('BOOKING')
          ? 'BOTH'
          : formData.modes.includes('BOOKING')
            ? 'BOOKING'
            : 'LEASE'
      setValue('modeSelection', modeSelection, { shouldDirty: true, shouldValidate: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = (data: FormSchema) => {
    const modes: Array<'LEASE' | 'BOOKING'> =
      data.modeSelection === 'BOTH'
        ? ['LEASE', 'BOOKING']
        : [data.modeSelection]
    updateFormData({ type: data.type, status: data.status, modes })
    goNext()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto mb-5 space-y-10 md:max-w-2/3"
    >
      {/* Property type */}
      <div className="space-y-2">
        <TypographyH2>What type of Property is this?</TypographyH2>
        <TypographyMuted>
          Choose the category that best matches your property's layout or use.
        </TypographyMuted>
        <p className="text-muted-foreground text-xs">
          Not sure which to choose?{' '}
          <a
            href={`${ASSET_MANAGEMENT_GUIDE_URL}#two-types-of-properties`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose-600 hover:underline"
          >
            Learn about property types
          </a>
        </p>
      </div>

      <div className="space-y-6">
        {/* Type selection */}
        <ItemGroup className="grid grid-cols-2 gap-4">
          {propertyModels.map((model) => {
            const isSelected = watch('type') === model.type
            return (
              <Item
                key={model.name}
                variant="outline"
                className={cn(
                  'cursor-pointer hover:bg-zinc-100',
                  isSelected ? 'border-1 border-rose-600' : '',
                )}
                onClick={() =>
                  setValue('type', model.type as Property['type'], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <ItemHeader className="flex items-center justify-center">
                  <model.icon className="size-20" />
                </ItemHeader>
                <ItemContent className="flex items-center justify-center">
                  <ItemTitle>{model.name}</ItemTitle>
                  <ItemDescription className="text-center">
                    {model.description}
                  </ItemDescription>
                </ItemContent>
              </Item>
            )
          })}
          {formState.errors?.type ? (
            <TypographySmall className="text-destructive col-span-2">
              {formState.errors.type.message}
            </TypographySmall>
          ) : null}
        </ItemGroup>

        {/* Status */}
        <div>
          <TypographyMuted>Status</TypographyMuted>
          <div className="mt-3 flex space-x-3">
            {statusOptions.map((s) => {
              const isSelected = watch('status') === s.value
              return (
                <Button
                  type="button"
                  onClick={() =>
                    setValue('status', s.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  key={s.value}
                  variant={isSelected ? 'default' : 'outline'}
                  className={cn({ 'bg-rose-600 text-white': isSelected })}
                >
                  {s.label}
                </Button>
              )
            })}
          </div>
          {formState.errors?.status ? (
            <TypographySmall className="text-destructive mt-3">
              {formState.errors.status.message}
            </TypographySmall>
          ) : null}
        </div>

        {/* Mode selection */}
        <div className="space-y-2">
          <TypographyMuted>What type of rentals does this property handle?</TypographyMuted>
          <ItemGroup className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {modeOptions.map((mode) => {
              const isSelected = watch('modeSelection') === mode.value
              return (
                <Item
                  key={mode.value}
                  variant="outline"
                  className={cn(
                    'cursor-pointer hover:bg-zinc-100',
                    isSelected ? 'border-1 border-rose-600' : '',
                  )}
                  onClick={() =>
                    setValue('modeSelection', mode.value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <ItemHeader className="flex items-center justify-center">
                    <mode.icon className="size-10" />
                  </ItemHeader>
                  <ItemContent className="flex items-center justify-center">
                    <ItemTitle className="text-center text-sm">{mode.name}</ItemTitle>
                    <ItemDescription className="text-center text-xs">
                      {mode.description}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              )
            })}
          </ItemGroup>
          {formState.errors?.modeSelection ? (
            <TypographySmall className="text-destructive">
              {formState.errors.modeSelection.message}
            </TypographySmall>
          ) : null}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-end space-x-5">
        <Link to="/properties">
          <Button type="button" size="sm" variant="ghost">
            <Home />
            Go Home
          </Button>
        </Link>
        <Button
          disabled={!formState.isDirty}
          size="lg"
          variant="default"
          className="bg-rose-600 hover:bg-rose-700"
        >
          Next
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Update the review screen `step3.tsx` to show the selected mode**

In `step3.tsx`, find the "Property type & Status" preview section (it currently shows `formData.type` and `formData.status`). Update the `p` tag to also show modes:

```tsx
<p className="mt-1 text-xs text-zinc-600">
  {formData.type ? getPropertyTypeLabel(formData.type) : '—'} ·{' '}
  {formData.status ? getPropertyStatusLabel(formData.status) : '—'} ·{' '}
  {formData.modes
    ? formData.modes.includes('LEASE') && formData.modes.includes('BOOKING')
      ? 'Long-term & Short-term'
      : formData.modes.includes('BOOKING')
        ? 'Short-term (Bookings)'
        : 'Long-term (Leases)'
    : '—'}
</p>
```

- [ ] **Step 4: Run type check and lint**

```bash
cd apps/property-manager && yarn types:check && yarn lint
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add apps/property-manager/app/api/properties/index.ts \
        apps/property-manager/app/modules/properties/new/steps/step0.tsx \
        apps/property-manager/app/modules/properties/new/steps/step3.tsx
git commit -m "feat(wizard): add rental mode selection to property creation Step 0"
```

---

## Task 6: Conditional sidebar navigation

**Files:**
- Modify: `apps/property-manager/app/modules/properties/property/layout/sidebar.tsx`

- [ ] **Step 1: Replace the `navMain` data array in `sidebar.tsx`**

The current sidebar hardcodes Tenants with Applications and Leases always visible. Replace the `data` object inside `PropertySidebar`:

```tsx
const modes = clientUserProperty?.property?.modes ?? []
const isLease = modes.includes('LEASE')
const isBooking = modes.includes('BOOKING')

const data = {
  navMain: [
    {
      title: 'Overview',
      isHome: true,
      url: '',
      icon: PieChart,
    },
    {
      title: 'Assets',
      url: '/assets',
      icon: House,
      items: [
        {
          title: 'Blocks',
          url: '/blocks',
          isHidden: clientUserProperty?.property?.type === 'SINGLE',
        },
        {
          title:
            clientUserProperty?.property?.type === 'SINGLE'
              ? 'Unit'
              : 'Apartments/Units',
          url: '/units',
        },
        {
          title: 'Facilities',
          url: '/facilities',
          isComingSoon: true,
        },
      ],
    },
    {
      title: 'Tenants',
      url: '/tenants',
      icon: Contact,
      items: [
        {
          title: 'All Tenants',
          url: '/all?filters=status&status=ACTIVE',
        },
        {
          title: 'Applications',
          url: '/applications',
          isHidden: !isLease,
        },
        {
          title: 'Leases',
          url: '/leases',
          isHidden: !isLease,
        },
      ],
    },
    {
      title: 'Bookings',
      url: '/bookings',
      icon: CalendarDays,
      isHidden: !isBooking,
      items: [
        {
          title: 'All Bookings',
          url: '',
        },
        {
          title: 'Availability',
          url: '/availability',
        },
      ],
    },
    {
      title: 'Activities',
      url: '/activities',
      icon: Headset,
      items: [
        {
          title: 'Maintenance Requests',
          url: '/maintenance-requests',
        },
        {
          title: 'Announcements',
          url: '/announcements',
        },
        {
          title: 'Inspections',
          url: '/inspections',
          isComingSoon: true,
        },
        {
          title: 'Polls',
          url: '/polls',
          isComingSoon: true,
        },
      ],
    },
    {
      title: 'Financials',
      url: '/financials',
      icon: DollarSign,
      items: [
        {
          title: 'Invoice Payments',
          url: '/invoices',
        },
        {
          title: 'Expenses',
          url: '/expenses',
        },
        {
          title: 'Reports',
          url: '/reports',
          isComingSoon: true,
        },
      ],
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings2,
    },
  ],
  // navSecondary unchanged
}
```

Also add `CalendarDays` to the imports from `lucide-react`:

```tsx
import {
  Settings2,
  LifeBuoy,
  PieChart,
  House,
  BookOpenText,
  DollarSign,
  Contact,
  Headset,
  CalendarDays,
} from 'lucide-react'
```

- [ ] **Step 2: Run type check and lint**

```bash
cd apps/property-manager && yarn types:check && yarn lint
```

Expected: exits 0. The `NavMain` component already accepts `isHidden` on items (used for Blocks). If there is a TypeScript error about `isHidden` not existing on the group-level item, check `app/components/nav-main.tsx` — if `isHidden` is only on sub-items, wrap the Bookings group in a conditional instead:

```tsx
...(isBooking
  ? [{
      title: 'Bookings',
      url: '/bookings',
      icon: CalendarDays,
      items: [
        { title: 'All Bookings', url: '' },
        { title: 'Availability', url: '/availability' },
      ],
    }]
  : []),
```

- [ ] **Step 3: Commit**

```bash
git add apps/property-manager/app/modules/properties/property/layout/sidebar.tsx
git commit -m "feat(sidebar): show Bookings nav for booking-mode properties; gate Applications/Leases on lease mode"
```

---

## Task 7: Bookings list — route and module

**Files:**
- Create: `apps/property-manager/app/routes/_auth.properties.$propertyId.bookings._index.tsx`
- Create: `apps/property-manager/app/modules/properties/property/bookings/index.tsx`

- [ ] **Step 1: Create the route file**

```tsx
// app/routes/_auth.properties.$propertyId.bookings._index.tsx
import type { Route } from './+types/_auth.properties.$propertyId.bookings._index'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { PropertyBookingsModule } from '~/modules'

export async function loader({ request, context }: Route.LoaderArgs) {
  const clientUserProperty = context.get(propertyContext)
  return { origin: getDomainUrl(request), clientUserProperty }
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
  return getSocialMetas({
    title: `Bookings | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
    url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
    origin: loaderData.origin,
  })
}

export const handle = { breadcrumb: 'Bookings' }

export default PropertyBookingsModule
```

- [ ] **Step 2: Create `app/modules/properties/property/bookings/index.tsx`**

```tsx
import type { ColumnDef } from '@tanstack/react-table'
import { CalendarDays } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useGetPropertyBookings } from '~/api/bookings'
import { DataTable } from '~/components/datatable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { PAGINATION_DEFAULTS } from '~/lib/constants'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

type BookingStatusConfig = {
  label: string
  className: string
}

const STATUS_CONFIG: Record<BookingStatus, BookingStatusConfig> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-500 text-white' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-teal-500 text-white' },
  CHECKED_IN: { label: 'Checked In', className: 'bg-blue-500 text-white' },
  COMPLETED: { label: 'Completed', className: 'bg-zinc-400 text-white' },
  CANCELLED: { label: 'Cancelled', className: 'bg-rose-500 text-white' },
}

const STATUS_TABS: Array<{ label: string; value: BookingStatus | '' }> = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Checked In', value: 'CHECKED_IN' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export function PropertyBookingsModule() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { clientUserProperty } = useProperty()
  const { clientUser } = useClient()

  const propertyId = clientUserProperty?.property_id ?? ''
  const clientId = safeString(clientUser?.client_id)

  const page = searchParams.get('page')
    ? Number(searchParams.get('page'))
    : PAGINATION_DEFAULTS.PAGE
  const per = searchParams.get('pageSize')
    ? Number(searchParams.get('pageSize'))
    : PAGINATION_DEFAULTS.PER_PAGE
  const status = (searchParams.get('status') as BookingStatus) ?? undefined

  const { data, isPending, isRefetching, error, refetch } =
    useGetPropertyBookings(clientId, propertyId, {
      filters: { status },
      pagination: { page, per },
      populate: ['Tenant', 'Unit'],
      sorter: { sort: 'desc', sort_by: 'created_at' },
    })

  const isLoading = isPending || isRefetching

  const columns: ColumnDef<Booking>[] = useMemo(
    () => [
      {
        id: 'code',
        header: 'Code',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarDays className="text-muted-foreground size-4" />
            <Link
              to={`/properties/${propertyId}/bookings/${row.original.id}`}
              className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
              {row.original.code}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: 'tenant',
        header: 'Guest',
        cell: ({ row }) => {
          const t = row.original.tenant
          return (
            <span className="text-xs">
              {t ? `${t.first_name} ${t.last_name}` : '—'}
            </span>
          )
        },
      },
      {
        accessorKey: 'unit',
        header: 'Unit',
        cell: ({ row }) => (
          <span className="text-xs">{row.original.unit?.name ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const s = getValue<BookingStatus>()
          const cfg = STATUS_CONFIG[s]
          return (
            <Badge variant="outline" className={`px-1.5 ${cfg.className}`}>
              {cfg.label}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'check_in_date',
        header: 'Check-in',
        cell: ({ getValue }) => (
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            {localizedDayjs(getValue<Date>()).format('MMM D, YYYY')}
          </span>
        ),
      },
      {
        accessorKey: 'check_out_date',
        header: 'Check-out',
        cell: ({ getValue }) => (
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            {localizedDayjs(getValue<Date>()).format('MMM D, YYYY')}
          </span>
        ),
      },
      {
        accessorKey: 'rate',
        header: 'Total',
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold">
            {formatAmount(convertPesewasToCedis(getValue<number>()))}
          </span>
        ),
      },
    ],
    [propertyId],
  )

  return (
    <div className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <TypographyH4>Bookings</TypographyH4>
          <TypographyMuted>All bookings for this property.</TypographyMuted>
        </div>
        <Link to={`/properties/${propertyId}/bookings/new`}>
          <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white">
            New Booking
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Button
            key={tab.value}
            size="sm"
            variant={status === tab.value || (!status && tab.value === '') ? 'default' : 'outline'}
            className={
              status === tab.value || (!status && tab.value === '')
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : ''
            }
            onClick={() => {
              const next = new URLSearchParams(searchParams)
              if (tab.value) {
                next.set('status', tab.value)
              } else {
                next.delete('status')
              }
              next.set('page', '1')
              setSearchParams(next)
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="bg-background space-y-4 rounded-lg border p-3 sm:p-5">
        <DataTable
          columns={columns}
          isLoading={isLoading}
          refetch={refetch}
          error={error ? 'Failed to load bookings.' : undefined}
          dataResponse={{
            rows: data?.rows ?? [],
            total: data?.meta?.total ?? 0,
            page,
            page_size: per,
            order: data?.meta?.order ?? 'desc',
            order_by: data?.meta?.order_by ?? 'created_at',
            has_prev_page: data?.meta?.has_prev_page ?? false,
            has_next_page: data?.meta?.has_next_page ?? false,
          }}
          empty={{
            message: 'No bookings yet',
            description: 'Create a booking or share the public booking link with your guests.',
          }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run type check and lint**

```bash
cd apps/property-manager && yarn types:check && yarn lint
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add apps/property-manager/app/routes/_auth.properties.\$propertyId.bookings._index.tsx \
        apps/property-manager/app/modules/properties/property/bookings/index.tsx
git commit -m "feat(bookings): add bookings list route and module"
```

---

## Task 8: New Booking form — route and module

**Files:**
- Create: `apps/property-manager/app/routes/_auth.properties.$propertyId.bookings.new.tsx`
- Create: `apps/property-manager/app/modules/properties/property/bookings/new/index.tsx`

- [ ] **Step 1: Create the route file**

```tsx
// app/routes/_auth.properties.$propertyId.bookings.new.tsx
import type { Route } from './+types/_auth.properties.$propertyId.bookings.new'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDomainUrl } from '~/lib/misc'
import { NewBookingModule } from '~/modules'

export async function loader({ request, context }: Route.LoaderArgs) {
  const clientUserProperty = context.get(propertyContext)
  return { origin: getDomainUrl(request), clientUserProperty }
}

export const handle = { breadcrumb: 'New Booking' }

export default NewBookingModule
```

- [ ] **Step 2: Create `app/modules/properties/property/bookings/new/index.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import { useCreateBooking } from '~/api/bookings'
import { useGetPropertyUnits } from '~/api/units'
import { DatePickerInput } from '~/components/date-picker-input'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Spinner } from '~/components/ui/spinner'
import { Textarea } from '~/components/ui/textarea'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { convertPesewasToCedis } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'

const schema = z
  .object({
    unit_id: z.string().min(1, 'Select a unit'),
    check_in_date: z.date({ required_error: 'Check-in date required' }),
    check_out_date: z.date({ required_error: 'Check-out date required' }),
    rate: z.coerce.number().min(1, 'Rate must be greater than 0'),
    currency: z.string().min(1),
    notes: z.string().optional(),
    guest_first_name: z.string().min(1, 'Required'),
    guest_last_name: z.string().min(1, 'Required'),
    guest_phone: z.string().min(1, 'Required'),
    guest_email: z.string().email('Invalid email'),
    guest_id_number: z.string().min(1, 'Required'),
  })
  .refine((d) => d.check_out_date > d.check_in_date, {
    message: 'Check-out must be after check-in',
    path: ['check_out_date'],
  })

type FormValues = z.infer<typeof schema>

export function NewBookingModule() {
  const { clientUserProperty } = useProperty()
  const { clientUser } = useClient()
  const navigate = useNavigate()

  const propertyId = clientUserProperty?.property_id ?? ''
  const clientId = safeString(clientUser?.client_id)

  const { data: unitsData } = useGetPropertyUnits(clientId, propertyId, {
    pagination: { per: 100 },
    filters: {},
  })

  const units = unitsData?.rows ?? []

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'GHS' },
  })

  const { mutateAsync: createBooking, isPending } = useCreateBooking()

  const selectedUnitId = form.watch('unit_id')
  const selectedUnit = units.find((u) => u.id === selectedUnitId)

  // Pre-fill rate when unit changes
  const handleUnitChange = (unitId: string) => {
    form.setValue('unit_id', unitId)
    const unit = units.find((u) => u.id === unitId)
    if (unit) {
      form.setValue('rate', convertPesewasToCedis(unit.rent_fee))
      form.setValue('currency', unit.rent_fee_currency)
    }
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const booking = await createBooking({
        clientId,
        propertyId,
        unit_id: values.unit_id,
        check_in_date: values.check_in_date.toISOString(),
        check_out_date: values.check_out_date.toISOString(),
        rate: Math.round(values.rate * 100), // convert to pesewas
        currency: values.currency,
        notes: values.notes,
        guest_first_name: values.guest_first_name,
        guest_last_name: values.guest_last_name,
        guest_phone: values.guest_phone,
        guest_email: values.guest_email,
        guest_id_number: values.guest_id_number,
      })
      toast.success('Booking created')
      void navigate(`/properties/${propertyId}/bookings/${booking?.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create booking')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link to={`/properties/${propertyId}/bookings`}>
          <Button size="sm" variant="ghost">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <TypographyH4>New Booking</TypographyH4>
          <TypographyMuted>Create a booking on behalf of a guest.</TypographyMuted>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Unit + Dates */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Stay Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={handleUnitChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="check_in_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-in</FormLabel>
                      <FormControl>
                        <DatePickerInput
                          value={field.value}
                          onChange={field.onChange}
                          startMonth={new Date()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="check_out_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-out</FormLabel>
                      <FormControl>
                        <DatePickerInput
                          value={field.value}
                          onChange={field.onChange}
                          startMonth={form.watch('check_in_date') ?? new Date()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate ({selectedUnit?.rent_fee_currency ?? 'GHS'})</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Internal notes about this booking" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Guest info */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="guest_first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guest_last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="guest_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+233..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guest_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="guest_id_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="GHA-XXXXXXXX-X" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link to={`/properties/${propertyId}/bookings`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isPending ? <Spinner /> : null}
              Create Booking
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
```

> **Note:** `useGetPropertyUnits` must be imported from `~/api/units`. Check that the hook exists and accepts `(clientId, propertyId, query)` — look at `app/api/units/index.ts` for the exact function signature. Adjust the import and call if the parameter order differs.

- [ ] **Step 3: Check that `Textarea` exists in the UI components**

```bash
ls apps/property-manager/app/components/ui/textarea.tsx 2>/dev/null || echo "missing"
```

If it prints `missing`, install it:

```bash
cd apps/property-manager && npx shadcn@latest add textarea
```

- [ ] **Step 4: Run type check and lint**

```bash
cd apps/property-manager && yarn types:check && yarn lint
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add apps/property-manager/app/routes/_auth.properties.\$propertyId.bookings.new.tsx \
        apps/property-manager/app/modules/properties/property/bookings/new/index.tsx
git commit -m "feat(bookings): add new booking form route and module"
```

---

## Task 9: Booking detail — route and module

**Files:**
- Create: `apps/property-manager/app/routes/_auth.properties.$propertyId.bookings.$bookingId.tsx`
- Create: `apps/property-manager/app/modules/properties/property/bookings/booking/index.tsx`

- [ ] **Step 1: Create the route file**

```tsx
// app/routes/_auth.properties.$propertyId.bookings.$bookingId.tsx
import type { Route } from './+types/_auth.properties.$propertyId.bookings.$bookingId'
import { getBookingForServer } from '~/api/bookings/server'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { BookingDetailModule } from '~/modules'

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const clientUserProperty = context.get(propertyContext)
  const baseUrl = environmentVariables().API_ADDRESS
  const authSession = await getAuthSession(request.headers.get('Cookie'))
  const authToken = authSession.get('authToken')
  const clientId = safeString(authSession.get('selectedClientId'))

  try {
    const booking = await getBookingForServer(clientId, safeString(clientUserProperty?.property_id), safeString(params.bookingId), {
      authToken,
      baseUrl,
    })
    return { origin: getDomainUrl(request), booking, clientUserProperty }
  } catch {
    throw new Response(null, { status: 404, statusText: 'Not Found' })
  }
}

export const handle = {
  breadcrumb: (data: Awaited<ReturnType<typeof loader>>) =>
    data?.booking?.code ?? 'Booking',
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
  return getSocialMetas({
    title: `${loaderData?.booking?.code ?? 'Booking'} | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
    url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
    origin: loaderData.origin,
  })
}

export default BookingDetailModule
```

- [ ] **Step 2: Create `app/modules/properties/property/bookings/booking/index.tsx`**

```tsx
import { useState } from 'react'
import { Link, useLoaderData, useParams } from 'react-router'
import { toast } from 'sonner'
import {
  useCancelBooking,
  useCheckInBooking,
  useCompleteBooking,
  useConfirmBooking,
  useGetBooking,
} from '~/api/bookings'
import { PropertyPermissionGuard } from '~/components/permissions/permission-guard'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Separator } from '~/components/ui/separator'
import { Spinner } from '~/components/ui/spinner'
import { TypographyMuted } from '~/components/ui/typography'
import { localizedDayjs } from '~/lib/date'
import { convertPesewasToCedis, formatAmount } from '~/lib/format-amount'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import type { loader } from '~/routes/_auth.properties.$propertyId.bookings.$bookingId'

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-500 text-white' },
  CONFIRMED: { label: 'Confirmed', className: 'bg-teal-500 text-white' },
  CHECKED_IN: { label: 'Checked In', className: 'bg-blue-500 text-white' },
  COMPLETED: { label: 'Completed', className: 'bg-zinc-400 text-white' },
  CANCELLED: { label: 'Cancelled', className: 'bg-rose-500 text-white' },
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <TypographyMuted className="text-xs">{label}</TypographyMuted>
      <div className="text-sm font-medium">{value ?? '—'}</div>
    </div>
  )
}

export function BookingDetailModule() {
  const { booking: initialBooking, clientUserProperty } =
    useLoaderData<typeof loader>()
  const { clientUser } = useClient()
  const params = useParams()
  const queryClient = useQueryClient()

  const clientId = safeString(clientUser?.client_id)
  const propertyId = clientUserProperty?.property_id ?? ''

  const { data: booking } = useGetBooking(
    clientId,
    propertyId,
    params.bookingId ?? '',
    initialBooking ?? undefined,
  )

  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const { mutateAsync: confirm, isPending: confirming } = useConfirmBooking()
  const { mutateAsync: checkIn, isPending: checkingIn } = useCheckInBooking()
  const { mutateAsync: complete, isPending: completing } = useCompleteBooking()
  const { mutateAsync: cancel, isPending: cancelling } = useCancelBooking()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.BOOKINGS, clientId] })

  const handleConfirm = async () => {
    try {
      await confirm({ clientId, bookingId: params.bookingId ?? '' })
      toast.success('Booking confirmed')
      await invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm')
    }
  }

  const handleCheckIn = async () => {
    try {
      await checkIn({ clientId, bookingId: params.bookingId ?? '' })
      toast.success('Guest checked in')
      await invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to check in')
    }
  }

  const handleComplete = async () => {
    try {
      await complete({ clientId, bookingId: params.bookingId ?? '' })
      toast.success('Booking completed')
      await invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete')
    }
  }

  const handleCancel = async () => {
    try {
      await cancel({
        clientId,
        bookingId: params.bookingId ?? '',
        reason: cancelReason,
      })
      toast.success('Booking cancelled')
      setCancelOpen(false)
      await invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel')
    }
  }

  if (!booking) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <TypographyMuted>Booking not found</TypographyMuted>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[booking.status]
  const isPending = booking.status === 'PENDING'
  const isConfirmed = booking.status === 'CONFIRMED'
  const isCheckedIn = booking.status === 'CHECKED_IN'
  const isCancellable = booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED'
  const showCheckInCode =
    booking.status === 'CONFIRMED' ||
    booking.status === 'CHECKED_IN' ||
    booking.status === 'COMPLETED'

  return (
    <div className="m-5 grid grid-cols-12 gap-6">
      {/* Sidebar */}
      <div className="col-span-12 lg:col-span-4">
        <Card className="shadow-none">
          <CardHeader className="flex items-start justify-between gap-2">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wide">
                Booking
              </p>
              <CardTitle className="mt-1 text-base">{booking.code}</CardTitle>
            </div>
            <Badge variant="outline" className={`px-2 py-0.5 text-xs ${cfg.className}`}>
              {cfg.label}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-5">
            {showCheckInCode && (
              <div className="rounded-md border border-teal-200 bg-teal-50 p-3 text-center dark:border-teal-800 dark:bg-teal-950">
                <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">
                  Check-in Code
                </p>
                <p className="mt-1 text-3xl font-bold tracking-widest text-teal-800 dark:text-teal-200">
                  {booking.check_in_code}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                Guest
              </p>
              <Separator />
              <div className="space-y-2 pt-1">
                <DetailRow
                  label="Name"
                  value={`${booking.tenant.first_name} ${booking.tenant.last_name}`}
                />
                <DetailRow label="Phone" value={booking.tenant.phone} />
                <DetailRow label="Email" value={booking.tenant.email} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                Stay
              </p>
              <Separator />
              <div className="space-y-2 pt-1">
                <DetailRow
                  label="Check-in"
                  value={localizedDayjs(booking.check_in_date).format('MMM D, YYYY')}
                />
                <DetailRow
                  label="Check-out"
                  value={localizedDayjs(booking.check_out_date).format('MMM D, YYYY')}
                />
                <DetailRow
                  label="Total"
                  value={formatAmount(convertPesewasToCedis(booking.rate))}
                />
              </div>
            </div>

            {/* Actions */}
            <PropertyPermissionGuard roles={['MANAGER']}>
              <div className="space-y-2 pt-2">
                {isPending && (
                  <Button
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={confirming}
                    onClick={handleConfirm}
                  >
                    {confirming ? <Spinner /> : null}
                    Confirm Booking
                  </Button>
                )}
                {isConfirmed && (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={checkingIn}
                    onClick={handleCheckIn}
                  >
                    {checkingIn ? <Spinner /> : null}
                    Mark Checked In
                  </Button>
                )}
                {isCheckedIn && (
                  <Button
                    className="w-full bg-zinc-600 hover:bg-zinc-700 text-white"
                    disabled={completing}
                    onClick={handleComplete}
                  >
                    {completing ? <Spinner /> : null}
                    Mark Completed
                  </Button>
                )}
                {isCancellable && (
                  <Button
                    variant="outline"
                    className="w-full border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400"
                    onClick={() => setCancelOpen(true)}
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            </PropertyPermissionGuard>
          </CardContent>
        </Card>
      </div>

      {/* Main */}
      <div className="col-span-12 space-y-4 lg:col-span-8">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow
              label="Unit"
              value={
                <Link
                  to={`/properties/${propertyId}/assets/units/${booking.unit_id}`}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {booking.unit?.name ?? booking.unit_id}
                </Link>
              }
            />
            <DetailRow label="Booking source" value={booking.booking_source} />
            {booking.notes && <DetailRow label="Notes" value={booking.notes} />}
            {booking.invoice_id && (
              <DetailRow
                label="Invoice"
                value={
                  <Link
                    to={`/properties/${propertyId}/financials/invoices/${booking.invoice_id}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    View invoice
                  </Link>
                }
              />
            )}
            {booking.status === 'CANCELLED' && booking.cancellation_reason && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-950">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                  Cancellation reason
                </p>
                <p className="mt-1 text-sm text-rose-800 dark:text-rose-200">
                  {booking.cancellation_reason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Input
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Back
            </Button>
            <Button
              variant="destructive"
              disabled={!cancelReason.trim() || cancelling}
              onClick={handleCancel}
            >
              {cancelling ? <Spinner /> : null}
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

- [ ] **Step 3: Run type check and lint**

```bash
cd apps/property-manager && yarn types:check && yarn lint
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add apps/property-manager/app/routes/_auth.properties.\$propertyId.bookings.\$bookingId.tsx \
        apps/property-manager/app/modules/properties/property/bookings/booking/index.tsx
git commit -m "feat(bookings): add booking detail route and module"
```

---

## Task 10: Availability calendar — route and module

**Files:**
- Create: `apps/property-manager/app/routes/_auth.properties.$propertyId.availability.tsx`
- Create: `apps/property-manager/app/modules/properties/property/availability/index.tsx`

- [ ] **Step 1: Create the route file**

```tsx
// app/routes/_auth.properties.$propertyId.availability.tsx
import type { Route } from './+types/_auth.properties.$propertyId.availability'
import { propertyContext } from '~/lib/actions/property.context.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { PropertyAvailabilityModule } from '~/modules'

export async function loader({ request, context }: Route.LoaderArgs) {
  const clientUserProperty = context.get(propertyContext)
  return { origin: getDomainUrl(request), clientUserProperty }
}

export function meta({ loaderData, location, params }: Route.MetaArgs) {
  return getSocialMetas({
    title: `Availability | ${loaderData?.clientUserProperty?.property?.name ?? params.propertyId}`,
    url: getDisplayUrl({ origin: loaderData.origin, path: location.pathname }),
    origin: loaderData.origin,
  })
}

export const handle = { breadcrumb: 'Availability' }

export default PropertyAvailabilityModule
```

- [ ] **Step 2: Create `app/modules/properties/property/availability/index.tsx`**

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  useCreateDateBlock,
  useDeleteDateBlock,
  useGetUnitAvailability,
} from '~/api/bookings'
import { useGetPropertyUnits } from '~/api/units'
import { Calendar } from '~/components/ui/calendar'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet'
import { Spinner } from '~/components/ui/spinner'
import { TypographyH4, TypographyMuted } from '~/components/ui/typography'
import { DatePickerInput } from '~/components/date-picker-input'
import { localizedDayjs } from '~/lib/date'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import { useProperty } from '~/providers/property-provider'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'

// Colors per block type (dark-mode safe via CSS variables)
const BLOCK_COLORS: Record<BlockType, { bg: string; dot: string; label: string }> = {
  BOOKING: { bg: 'bg-blue-100 dark:bg-blue-900/40', dot: 'bg-blue-500', label: 'Booking' },
  LEASE: { bg: 'bg-green-100 dark:bg-green-900/40', dot: 'bg-green-500', label: 'Lease' },
  MAINTENANCE: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', dot: 'bg-yellow-500', label: 'Maintenance' },
  PERSONAL: { bg: 'bg-purple-100 dark:bg-purple-900/40', dot: 'bg-purple-500', label: 'Personal' },
  OTHER: { bg: 'bg-zinc-100 dark:bg-zinc-800', dot: 'bg-zinc-400', label: 'Other' },
}

// For DayPicker modifierStyles (inline, no Tailwind needed here since DayPicker
// applies these directly to day cells which aren't Tailwind-aware by default)
const MODIFIER_STYLES: Record<string, React.CSSProperties> = {
  bookingBlock: { backgroundColor: 'rgb(219 234 254)', borderRadius: '0' },
  leaseBlock: { backgroundColor: 'rgb(220 252 231)', borderRadius: '0' },
  maintenanceBlock: { backgroundColor: 'rgb(254 249 195)', borderRadius: '0' },
  personalBlock: { backgroundColor: 'rgb(243 232 255)', borderRadius: '0' },
  otherBlock: { backgroundColor: 'rgb(241 245 249)', borderRadius: '0' },
}

const blockSchema = z.object({
  start_date: z.date({ required_error: 'Required' }),
  end_date: z.date({ required_error: 'Required' }),
  block_type: z.enum(['MAINTENANCE', 'PERSONAL', 'OTHER'], {
    required_error: 'Select a type',
  }),
  reason: z.string().optional(),
})

type BlockFormValues = z.infer<typeof blockSchema>

function getMonthRange(month: Date): { from: Date; to: Date } {
  const from = new Date(month.getFullYear(), month.getMonth(), 1)
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59)
  return { from, to }
}

function blocksToModifiers(blocks: UnitDateBlock[]) {
  const modifiers: Record<string, { from: Date; to: Date }[]> = {
    bookingBlock: [],
    leaseBlock: [],
    maintenanceBlock: [],
    personalBlock: [],
    otherBlock: [],
  }

  for (const block of blocks) {
    const range = { from: new Date(block.start_date), to: new Date(block.end_date) }
    switch (block.block_type) {
      case 'BOOKING':
        modifiers.bookingBlock.push(range)
        break
      case 'LEASE':
        modifiers.leaseBlock.push(range)
        break
      case 'MAINTENANCE':
        modifiers.maintenanceBlock.push(range)
        break
      case 'PERSONAL':
        modifiers.personalBlock.push(range)
        break
      case 'OTHER':
        modifiers.otherBlock.push(range)
        break
    }
  }

  return modifiers
}

export function PropertyAvailabilityModule() {
  const { clientUserProperty } = useProperty()
  const { clientUser } = useClient()
  const queryClient = useQueryClient()

  const propertyId = clientUserProperty?.property_id ?? ''
  const clientId = safeString(clientUser?.client_id)

  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<UnitDateBlock | null>(null)

  const { data: unitsData } = useGetPropertyUnits(clientId, propertyId, {
    pagination: { per: 100 },
    filters: {},
  })

  const units = unitsData?.rows ?? []

  // Default to first unit
  const unitId = selectedUnitId || units[0]?.id || ''

  const { from, to } = getMonthRange(currentMonth)

  const { data: blocks = [], isFetching } = useGetUnitAvailability(
    clientId,
    propertyId,
    unitId,
    from,
    to,
  )

  const { mutateAsync: createBlock, isPending: creating } = useCreateDateBlock()
  const { mutateAsync: deleteBlock, isPending: deleting } = useDeleteDateBlock()

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.DATE_BLOCKS, clientId, propertyId, unitId],
    })

  const blockForm = useForm<BlockFormValues>({
    resolver: zodResolver(blockSchema),
  })

  const onCreateBlock = async (values: BlockFormValues) => {
    try {
      await createBlock({
        clientId,
        propertyId,
        unitId,
        start_date: values.start_date.toISOString(),
        end_date: values.end_date.toISOString(),
        block_type: values.block_type,
        reason: values.reason,
      })
      toast.success('Block created')
      setSheetOpen(false)
      blockForm.reset()
      await invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create block')
    }
  }

  const onDeleteBlock = async (blockId: string) => {
    try {
      await deleteBlock({ clientId, propertyId, blockId })
      toast.success('Block removed')
      setSelectedBlock(null)
      await invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete block')
    }
  }

  const modifiers = blocksToModifiers(blocks)

  return (
    <div className="mx-6 my-6 flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <TypographyH4>Availability</TypographyH4>
          <TypographyMuted>Blocked date ranges for each unit.</TypographyMuted>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              disabled={!unitId}
            >
              Block Dates
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Block Dates</SheetTitle>
            </SheetHeader>
            <Form {...blockForm}>
              <form
                onSubmit={blockForm.handleSubmit(onCreateBlock)}
                className="mt-6 space-y-4 px-1"
              >
                <FormField
                  control={blockForm.control}
                  name="block_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                          <SelectItem value="PERSONAL">Personal</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={blockForm.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start</FormLabel>
                        <FormControl>
                          <DatePickerInput
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={blockForm.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End</FormLabel>
                        <FormControl>
                          <DatePickerInput
                            value={field.value}
                            onChange={field.onChange}
                            startMonth={blockForm.watch('start_date')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={blockForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Plumbing repairs" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white"
                  disabled={creating}
                >
                  {creating ? <Spinner /> : null}
                  Create Block
                </Button>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Unit selector */}
      {units.length > 1 && (
        <Select
          value={unitId}
          onValueChange={(val) => {
            setSelectedUnitId(val)
            setSelectedBlock(null)
          }}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select unit" />
          </SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Calendar */}
      <Card className="shadow-none">
        <CardContent className="p-4">
          {isFetching && (
            <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
              <Spinner className="size-3" />
              Loading availability…
            </div>
          )}
          <Calendar
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            modifiers={modifiers}
            modifierStyles={MODIFIER_STYLES}
            onDayClick={(day) => {
              const clicked = blocks.find((b) => {
                const d = day.getTime()
                return (
                  new Date(b.start_date).getTime() <= d &&
                  new Date(b.end_date).getTime() >= d
                )
              })
              setSelectedBlock(clicked ?? null)
            }}
          />

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(BLOCK_COLORS).map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`size-2.5 rounded-sm ${cfg.dot}`} />
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {cfg.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Block detail popover (shown when a blocked day is clicked) */}
      {selectedBlock && (
        <Card className="shadow-none border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className={`size-2.5 rounded-sm ${BLOCK_COLORS[selectedBlock.block_type]?.dot ?? 'bg-zinc-400'}`}
                />
                {BLOCK_COLORS[selectedBlock.block_type]?.label ?? selectedBlock.block_type}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-zinc-400 hover:text-zinc-600"
                onClick={() => setSelectedBlock(null)}
              >
                ✕
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {localizedDayjs(selectedBlock.start_date).format('MMM D')} –{' '}
              {localizedDayjs(selectedBlock.end_date).format('MMM D, YYYY')}
            </p>
            {selectedBlock.reason && (
              <p className="text-zinc-500">{selectedBlock.reason}</p>
            )}
            {selectedBlock.block_type !== 'BOOKING' &&
              selectedBlock.block_type !== 'LEASE' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400"
                  disabled={deleting}
                  onClick={() => onDeleteBlock(selectedBlock.id)}
                >
                  {deleting ? <Spinner /> : null}
                  Remove block
                </Button>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Check that `Sheet` components are exported from the UI**

```bash
grep -q "SheetContent\|SheetTrigger" apps/property-manager/app/components/ui/sheet.tsx && echo "ok" || echo "missing exports"
```

If `missing exports`, open `sheet.tsx` and confirm `SheetContent`, `SheetTrigger`, `SheetHeader`, `SheetTitle` are all exported. They should be — Shadcn generates them all.

- [ ] **Step 4: Run type check and lint**

```bash
cd apps/property-manager && yarn types:check && yarn lint
```

Expected: exits 0. If you get errors on `modifierStyles` not being a known `DayPicker` prop, check that you're using react-day-picker v9 (confirmed in package.json — it is v9.11.1). The `modifierStyles` prop was added in v9.

- [ ] **Step 5: Commit**

```bash
git add apps/property-manager/app/routes/_auth.properties.\$propertyId.availability.tsx \
        apps/property-manager/app/modules/properties/property/availability/index.tsx
git commit -m "feat(availability): add availability calendar route and module"
```

---

## Task 11: Unit detail — add public booking link

**Files:**
- Modify: `apps/property-manager/app/modules/properties/property/assets/units/unit/details/index.tsx`

- [ ] **Step 1: Add booking link below the existing content**

Open `details/index.tsx`. At the bottom of `PropertyAssetUnitDetailsModule`, after the last `<Card>`, add a booking link card that's only shown when the property has `BOOKING` mode:

```tsx
// Add this import at the top of the file:
import { useProperty } from '~/providers/property-provider'
import { useUnitContext } from '../context'  // already imported — keep existing imports

// Inside PropertyAssetUnitDetailsModule, add after the last Card:
const { clientUserProperty } = useProperty()
const isBookingMode = clientUserProperty?.property?.modes?.includes('BOOKING') ?? false

// Then at the bottom of the JSX:
{isBookingMode && (
  <Card className="shadow-none">
    <CardHeader>
      <CardTitle>Public Booking Link</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-2 rounded-md border bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
        <span className="flex-1 truncate text-xs text-zinc-600 dark:text-zinc-400">
          {`rentloopapp.com/book/${clientUserProperty?.property?.slug ?? ''}/${unit.slug ?? unit.id}`}
        </span>
        <button
          type="button"
          className="text-xs text-rose-600 hover:underline"
          onClick={() => {
            void navigator.clipboard.writeText(
              `https://rentloopapp.com/book/${clientUserProperty?.property?.slug ?? ''}/${unit.slug ?? unit.id}`,
            )
            toast.success('Link copied')
          }}
        >
          Copy
        </button>
      </div>
    </CardContent>
  </Card>
)}
```

Also add the `toast` import if not already present:
```tsx
import { toast } from 'sonner'
```

> **Note:** `PropertyUnit` may not have a `slug` field yet — check the type in `types/property-unit.d.ts`. If `slug` is missing, add it:
> ```ts
> slug: Nullable<string>
> ```
> If the backend unit endpoint doesn't return `slug`, use `unit.id` as the URL segment and update once the backend is confirmed to return it.

- [ ] **Step 2: Run type check and lint**

```bash
cd apps/property-manager && yarn types:check && yarn lint
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add apps/property-manager/app/modules/properties/property/assets/units/unit/details/index.tsx \
        apps/property-manager/types/property-unit.d.ts
git commit -m "feat(units): show public booking link on unit detail for booking-mode properties"
```

---

## Task 12: Export new modules and final verification

**Files:**
- Modify: `apps/property-manager/app/modules/index.ts`

- [ ] **Step 1: Add exports to `app/modules/index.ts`**

Append these lines at the end of the file:

```ts
export * from './properties/property/bookings'
export * from './properties/property/bookings/new'
export * from './properties/property/bookings/booking'
export * from './properties/property/availability'
```

- [ ] **Step 2: Run full type check and lint**

```bash
cd apps/property-manager && yarn types:check && yarn lint
```

Expected: exits 0. Fix any remaining type errors before committing.

- [ ] **Step 3: Start dev server and smoke test manually**

```bash
cd apps/property-manager && yarn dev
```

Manual checks:
1. Open a property that has `modes: ['BOOKING']` — verify Bookings and Availability appear in sidebar. All Tenants visible. Applications and Leases hidden.
2. Open a property with `modes: ['LEASE', 'BOOKING']` — verify all tabs visible.
3. Navigate to `/properties/:id/bookings` — list renders with status tabs.
4. Click New Booking — form opens, unit selector populates, date pickers work.
5. Navigate to `/properties/:id/availability` — calendar renders, Block Dates sheet opens.
6. Visit `/properties/new` — Step 0 shows the three mode radio cards below status buttons.

- [ ] **Step 4: Commit**

```bash
git add apps/property-manager/app/modules/index.ts
git commit -m "feat(modules): export new booking and availability modules"
```

---

## Verification Checklist

- [ ] `yarn types:check` passes with zero errors
- [ ] `yarn lint` passes with zero errors
- [ ] Property creation wizard Step 0 shows mode selection radio cards
- [ ] Sidebar shows Bookings section only for booking-mode properties
- [ ] All Tenants always visible; Applications/Leases hidden for booking-only properties
- [ ] Bookings list loads with status filter tabs
- [ ] New Booking form submits and navigates to detail page
- [ ] Booking detail shows check-in code once status is CONFIRMED
- [ ] Confirm / Check-in / Complete / Cancel actions call correct endpoints
- [ ] Availability calendar refetches on month navigation
- [ ] Block Dates sheet creates a block; clicking a block day shows its details
- [ ] Manual MAINTENANCE/PERSONAL/OTHER blocks can be deleted; BOOKING/LEASE blocks show no delete button
- [ ] Unit detail shows public booking link for booking-mode properties
- [ ] All new UI verified in both light and dark mode
