---
id: RENTL-16
title: duplicate a unit
status: Done
assignee: []
created_date: '2026-03-07 20:07'
updated_date: '2026-03-08 15:12'
labels: []
milestone: m-4
dependencies: []
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- We need an action menu on the unit listings page called duplicate.
- This is to help owners setup their units quickly
- make sure to default it to draft and just copy over the values. let users type in the new unit name though (`old unit name (copy)`)
- when you hit the duplicate, it should open the usual create unit page with a param (`?unit_id=sdgdsgsd`) and then autopopulate the details.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Unit listing cards show both 'View' and 'Duplicate' buttons in the footer
- [x] #2 Clicking 'Duplicate' navigates to the create unit page with ?unit_id={id} param
- [x] #3 Create unit page shows 'Duplicate Unit' heading when unit_id param is present
- [x] #4 All fields pre-populated from source unit (type, description, image, features, area, occupants, rent fee, currency, payment frequency, block)
- [x] #5 Name field defaults to '{original name} (copy)' and is editable
- [x] #6 Status always defaults to Draft regardless of source unit's status
- [x] #7 Rent fee is correctly converted from pesewas to cedis in the form
- [x] #8 Saving creates a new unit as draft and redirects to units list
- [x] #9 yarn types:check passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Files to Modify (3)

1. `apps/property-manager/app/modules/properties/property/assets/units/index.tsx` — Add Duplicate button to each unit card
2. `apps/property-manager/app/routes/_auth.properties.$propertyId.assets.units.new.ts` — Extend loader to fetch source unit when `unit_id` param is present
3. `apps/property-manager/app/modules/properties/property/assets/units/new/index.tsx` — Pre-populate form from `sourceUnit` loader data

---

## Change 1: Unit Listing — Add Duplicate Button

**File:** `app/modules/properties/property/assets/units/index.tsx`

Import `Copy` from lucide-react. Replace the single-button `CardFooter` with two equal-width buttons:

```tsx
import { CircleCheck, Copy, Eye, Users } from 'lucide-react'

// In CardFooter (replace existing):
<CardFooter className="flex justify-around gap-2 border-t-[1px] pt-3">
  <Button
    type="button"
    variant="outline"
    size="icon-sm"
    className="flex w-full flex-row gap-2 py-5 text-xs text-zinc-500"
    onClick={() => {
      void navigate(`/properties/${data.property_id}/assets/units/${data.id}`)
    }}
  >
    <Eye />
    View
  </Button>
  <Button
    type="button"
    variant="outline"
    size="icon-sm"
    className="flex w-full flex-row gap-2 py-5 text-xs text-zinc-500"
    onClick={() => {
      void navigate(
        `/properties/${data.property_id}/assets/units/new?unit_id=${data.id}`,
      )
    }}
  >
    <Copy />
    Duplicate
  </Button>
</CardFooter>
```

---

## Change 2: Route Loader — Fetch Source Unit

**File:** `app/routes/_auth.properties.$propertyId.assets.units.new.ts`

Add import:
```ts
import { getPropertyUnitForServer } from '~/api/units/server'
```

Extend the `loader`:
```ts
export async function loader({ request, context }: Route.LoaderArgs) {
  const clientUserProperty = context.get(propertyContext)

  if (clientUserProperty?.property?.type === 'SINGLE') {
		throw new Response(null, { status: 404, statusText: 'Not Found' })
  }

  const url = new URL(request.url)
  const unitId = url.searchParams.get('unit_id')

  let sourceUnit: PropertyUnit | null = null
  if (unitId && clientUserProperty?.property?.id) {
    const baseUrl = environmentVariables().API_ADDRESS
    const authSession = await getAuthSession(request.headers.get('Cookie'))
    sourceUnit =
      (await getPropertyUnitForServer(
        { property_id: clientUserProperty.property.id, unit_id: unitId },
        { baseUrl, authToken: authSession.get('authToken') },
      )) ?? null
  }

  return {
    origin: getDomainUrl(request),
    clientUserProperty,
    sourceUnit,
  }
}
```

---

## Change 3: New Unit Module — Pre-populate from Source

**File:** `app/modules/properties/property/assets/units/new/index.tsx`

Add import:
```ts
import { convertPesewasToCedis } from '~/lib/format-amount'
```

Get sourceUnit from loader:
```ts
const { clientUserProperty, sourceUnit } = useLoaderData<typeof loader>()
```

Add useEffect to pre-populate (after existing effects):
```ts
useEffect(() => {
  if (!sourceUnit) return
  rhfMethods.reset({
    status: 'Unit.Status.Draft',
    type: sourceUnit.type,
    name: `${sourceUnit.name} (copy)`,
    description: sourceUnit.description ?? '',
    image_url: sourceUnit.images?.[0] ?? '',
    features: sourceUnit.features ?? {},
    tags: [],
    area: sourceUnit.area ?? undefined,
    max_occupants_allowed: sourceUnit.max_occupants_allowed ?? 1,
    rent_fee: convertPesewasToCedis(sourceUnit.rent_fee),
    rent_fee_currency: sourceUnit.rent_fee_currency,
    payment_frequency: sourceUnit.payment_frequency,
    property_block_id: sourceUnit.property_block_id,
    block: sourceUnit.property_block?.name ?? '',
  })
}, [sourceUnit, rhfMethods])
```

Update header to show duplicate mode:
```tsx
<div className="space-y-2">
  <TypographyH2>
    {sourceUnit ? 'Duplicate Unit' : 'Add New Property Unit'}
  </TypographyH2>
  <TypographyMuted>
    {sourceUnit
      ? 'Review and adjust the copied details, then save to create the new unit.'
      : 'We break down properties into units to better organize and manage rental spaces.'}
  </TypographyMuted>
</div>
```

---

## Key Notes

- `rent_fee` is stored in pesewas on the API — must convert with `convertPesewasToCedis()` when pre-populating (the `onSubmit` already calls `convertCedisToPesewas` when sending)
- Duplicated unit always defaults to `Unit.Status.Draft` regardless of source status
- `tags` is not on the `PropertyUnit` TS type so it cannot be pre-populated — defaults to `[]`
- `BlockSelect` uses controlled `value={watch('property_block_id')}` so pre-populating via reset will select the correct block
- `image_url` pre-population works because `ImageUpload` reads `imageSrc={safeString(watch('image_url') ?? '')}`
- `getPropertyUnitForServer` already exists in `app/api/units/server.ts` — no new API functions needed
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Three files modified:

1. `app/modules/.../assets/units/index.tsx` — Added `Copy` icon import; added "Duplicate" button to `CardFooter` alongside "View", navigating to `/new?unit_id={id}`
2. `app/routes/_auth.properties.$propertyId.assets.units.new.ts` — Loader now reads `unit_id` search param, fetches source unit via `getPropertyUnitForServer`, and returns it as `sourceUnit`
3. `app/modules/.../assets/units/new/index.tsx` — Added `useEffect` that calls `rhfMethods.reset()` with source unit values when `sourceUnit` is present; name defaults to `{name} (copy)`, status always `Unit.Status.Draft`, rent converted from pesewas via `convertPesewasToCedis`; heading shows "Duplicate Unit" when in duplicate mode. `yarn types:check` passes.
<!-- SECTION:FINAL_SUMMARY:END -->
