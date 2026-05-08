# Apply Form — Single Page Design

## Overview

Collapse the existing 4-step wizard application form into a single scrollable page with labeled sections, following the same pattern as the unit create/edit form.

## Current State

- `app/modules/apply/index.tsx` — shell that renders one step at a time via `stepCount` state
- `app/modules/apply/context.tsx` — `ApplyProvider` / `useApplyContext` managing step navigation and accumulated `formData`
- `app/modules/apply/step0.tsx` — account type picker (INDIVIDUAL / COMPANY + sub_type)
- `app/modules/apply/step1.tsx` — basic info (name, logo, description, date of birth)
- `app/modules/apply/step2.tsx` — address
- `app/modules/apply/step3.tsx` — contact details + final submit

Each step has its own `useForm` + Zod schema. Context accumulates data across steps.

## Target State

### Component structure

```
app/modules/apply/
├── index.tsx   ← single component, all sections inline
```

All other files (`context.tsx`, `step0.tsx`–`step3.tsx`) are deleted.

### Sections (separated by `<hr />` + `TypographyH2`)

1. **Account Type** — INDIVIDUAL / COMPANY card picker; sub_type buttons shown when COMPANY selected
2. **Basic Information** — name; logo upload (company only); description (company only); date of birth (individual only)
3. **Address** — `AddressInput` component
4. **Contact Details** — contact name (company only); email; phone; terms/privacy text

Submit button at the bottom. No back/next buttons.

### Schema

Single Zod schema merging all four step schemas. Conditional rules via `superRefine`:
- COMPANY requires `sub_type` (not LANDLORD)
- INDIVIDUAL requires `date_of_birth` (18+ validation stays)
- COMPANY requires `contact_name` in the contact section

### Submit logic

The `onSubmit` from `context.tsx` (date formatting, phone normalization, fetcher.submit) moves inline into the component. `useFetcher` used directly in the component.

### Removed

- Progress bar (`(stepCount / STEPS) * 100`)
- Step navigation (Go Back / Next buttons between steps)
- `ApplyProvider` / `useApplyContext`
- `stepCount` state

### Preserved

- Navigation blocker (`useNavigationBlocker`) tied to form dirty state
- `BlockNavigationDialog`
- Logo upload via `useUploadObject`
- All field validations and conditional field visibility (INDIVIDUAL vs COMPANY)
- `rentLoopWebsiteUrl` from loader data (used in terms link)
- Date formatting and phone normalization on submit
