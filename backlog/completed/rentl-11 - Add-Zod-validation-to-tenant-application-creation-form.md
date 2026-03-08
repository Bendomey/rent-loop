---
id: RENTL-11
title: Add Zod validation to tenant application creation form
status: Done
assignee: []
created_date: '2026-03-04 18:57'
updated_date: '2026-03-08 15:36'
labels:
  - frontend
  - property-manager
  - validation
milestone: m-3
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
routes/_auth.properties.$propertyId.tenants.applications.new.ts — The action handler manually extracts form data with formData.get() and type-casts without any Zod schema validation. Needs proper validation before sending to API.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Zod schema defined for all 25 form fields with correct enum values from TenantApplication type
- [x] #2 Action handler uses Object.fromEntries(formData) + safeParse instead of 25 individual formData.get() calls
- [x] #3 Invalid/missing fields return { error, fieldErrors } without calling the API
- [x] #4 Valid data passes through replaceNullUndefinedWithUndefined to createTenantApplication unchanged
- [x] #5 yarn types:check passes
- [x] #6 yarn lint passes — no unused variable warnings
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## File to Modify (1)

`apps/property-manager/app/routes/_auth.properties.$propertyId.tenants.applications.new.ts`

No new dependencies — `zod@4.1.12` is already installed.

---

## Schema Definition

Add after the existing imports at the top of the file:

```ts
import { z } from 'zod'

const CreateTenantApplicationSchema = z.object({
  property_id: z.string().min(1, 'Property is required'),
  desired_unit_id: z.string().min(1, 'Unit is required'),
  on_boarding_method: z.enum(['SELF', 'ADMIN']),
  first_name: z.string().min(1, 'First name is required'),
  other_names: z.string().optional(),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  gender: z.enum(['MALE', 'FEMALE']),
  marital_status: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']),
  profile_photo_url: z.string().optional(),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  current_address: z.string().min(1, 'Current address is required'),
  id_type: z
    .enum(['DRIVER_LICENSE', 'PASSPORT', 'NATIONAL_ID', 'GHANA_CARD'])
    .optional(),
  id_number: z.string().min(1, 'ID number is required'),
  id_front_url: z.string().optional(),
  id_back_url: z.string().optional(),
  emergency_contact_name: z.string().min(1, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(1, 'Emergency contact phone is required'),
  relationship_to_emergency_contact: z.string().min(1, 'Relationship is required'),
  employer_type: z.enum(['WORKER', 'STUDENT']),
  occupation: z.string().min(1, 'Occupation is required'),
  employer: z.string().min(1, 'Employer is required'),
  occupation_address: z.string().min(1, 'Occupation address is required'),
  proof_of_income_url: z.string().optional(),
})
```

Enum values come directly from the `TenantApplication` interface in `types/tenant-application.d.ts`. Note: `z.email()` is the Zod v4 API (not `z.string().email()`).

---

## Updated Action Handler

Replace the entire `action` function. The 25-variable `formData.get()` block is removed and replaced with a single `safeParse` call:

```ts
export async function action({ request }: Route.ActionArgs) {
  const baseUrl = environmentVariables().API_ADDRESS
  const authSession = await getAuthSession(request.headers.get('Cookie'))

  const formData = await request.formData()
  const result = CreateTenantApplicationSchema.safeParse(
    Object.fromEntries(formData),
  )

  if (!result.success) {
    return {
      error: 'Invalid form data',
      fieldErrors: result.error.flatten().fieldErrors,
    }
  }

  try {
    const tenantApplication = await createTenantApplication(
      replaceNullUndefinedWithUndefined(result.data),
      {
        baseUrl,
        authToken: authSession.get('authToken'),
      },
    )

    if (!tenantApplication) {
      throw new Error('Tenant application creation returned no data')
    }

    return redirect(`/properties/${result.data.property_id}/tenants/applications`)
  } catch {
    return { error: 'Failed to create tenant application' }
  }
}
```

---

## Key Notes

- `zod` is already installed (`zod@4.1.12`) — no new dependency
- `z.email()` is the Zod v4 API (not `z.string().email()`)
- `Object.fromEntries(formData)` works correctly here — all fields appear exactly once (no `getAll` needed, unlike units which have array fields like `tags`/`features`)
- Optional image URL fields (`profile_photo_url`, `id_front_url`, `id_back_url`, `proof_of_income_url`) use `.optional()` — if the form sends an empty string, it passes through to `replaceNullUndefinedWithUndefined` which handles conversion
- The `fieldErrors` key is added to the return type — the module currently only checks for `error` so this is a safe extension with no breaking changes

---

## Verification

1. `yarn types:check` passes
2. `yarn lint` passes — no unused variable warnings (removes 25 individual variable declarations)
3. Submit form with missing required fields → action returns `{ error, fieldErrors }` without calling the API
4. Submit with invalid email → `fieldErrors.email` contains the validation message
5. Submit complete valid form → application created, redirected to list
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced 25 individual `formData.get()` type-cast lines in the action handler with a single Zod `safeParse` call. Added `CreateTenantApplicationSchema` with all 25 fields — optional nullable fields use `.nullable().default(null)` to satisfy `Maybe<string>` / `Nullable<string>` required keys in `CreatePropertyTenantApplicationInput`. Invalid submissions return `{ error, fieldErrors }` without hitting the API. `yarn types:check` and `yarn lint` both pass with no new warnings.
<!-- SECTION:FINAL_SUMMARY:END -->
