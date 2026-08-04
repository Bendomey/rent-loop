# Generic Document Editor & Signing Pages

**Date:** 2026-06-29  
**Status:** Approved for implementation

## Problem

The document editor and signing pages are hard-coupled to the tenant application flow:
- Routes live at `/applications/:applicationId/editor/:documentId` and `.../signing/:documentId`
- Modules import their loader types from application-specific route files
- `LeaseMenuBar` receives a full `TenantApplication` object just to display a name and doc status
- `buildTemplateFieldMap` accepts `TenantApplication` and returns `Record<string, string>` — no type safety on token names
- The signing API already supports optional `tenant_application_id` and `lease_id`, but the frontend never exploits this

Goal: make the editor and signing pages property-scoped, context-optional features any part of the app can link to.

## Out of Scope

- Lease page Documents tab (separate ticket)
- Application checklist / Approve button changes (separate ticket)

---

## 1. `DocumentTemplateFieldMap` — typed token registry

**File:** `app/lib/resolve-template-fields.ts`

Add an exported type that is a 1-to-1 mapping of every `#Token` registered in the system. All keys are optional so callers only provide what they have.

```ts
export type DocumentTemplateFieldMap = {
  // Landlord
  LandlordName?: string
  LandlordEmail?: string
  LandlordPhoneNumber?: string
  // Tenant
  TenantName?: string
  TenantAddress?: string
  TenantEmail?: string
  TenantPhoneNumber?: string
  TenantIDType?: string
  TenantIDNumber?: string
  TenantDateOfBirth?: string
  TenantNationality?: string
  TenantOccupation?: string
  TenantEmployer?: string
  TenantEmergencyContactName?: string
  TenantEmergencyContactPhone?: string
  // Property
  PropertyName?: string
  PropertyAddress?: string
  PropertyCity?: string
  PropertyRegion?: string
  PropertyGPSAddress?: string
  // Unit
  UnitNumber?: string
  UnitType?: string
  // Lease terms
  ApplicationCode?: string
  LeaseStartDate?: string
  LeaseDuration?: string
  LeaseEndDate?: string
  RentAmount?: string
  RentAmountInWords?: string
  RentFrequency?: string
  SecurityDeposit?: string
  InitialDeposit?: string
  // Signing timestamps
  LandlordSignedOn?: string
  TenantSignedOn?: string
  LandlordWitnessName?: string
  LandlordWitnessSignedOn?: string
  TenantWitnessName?: string
  TenantWitnessSignedOn?: string
}
```

**Changes to existing functions:**

- Rename `buildTemplateFieldMap(app: TenantApplication)` → `buildTenantApplicationFieldMap(app: TenantApplication): DocumentTemplateFieldMap`. Logic is unchanged; return type narrows from `Record<string, string>` to `DocumentTemplateFieldMap`.
- Change `resolveTemplateFields(state, fieldMap: Record<string, string>)` → accepts `DocumentTemplateFieldMap`. Internal walk logic is unchanged — tokens without a value in the map are left as `#Token`.
- Update all call sites: the only current call site is `lease-signing.tsx` (which becomes `document-signing.tsx`) and `use-approval-pipeline.ts`.

---

## 2. New property-scoped routes

### Route files (loaders only — no UI logic)

```
app/routes/_auth.properties.$propertyId_.documents.$documentId.editor.ts
app/routes/_auth.properties.$propertyId_.documents.$documentId.signing.ts
```

These produce URLs:
```
/properties/:propertyId/documents/:documentId/editor?applicationId=xxx&returnUrl=/...
/properties/:propertyId/documents/:documentId/signing?applicationId=xxx
```

**Editor loader** (`document-editor` route):

```ts
export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const applicationId = url.searchParams.get('applicationId')
  const returnUrl = url.searchParams.get('returnUrl') ?? null

  // Always fetch the document
  const document = await getDocument(clientId, params.documentId, { authToken, baseUrl })

  // Fetch application only when applicationId is present
  const tenantApplication = applicationId
    ? await getAdminPropertyTenantApplicationForServer(
        clientId,
        { id: applicationId, property_id: params.propertyId, populate: ['DesiredUnit', 'CreatedBy'] },
        { baseUrl, authToken },
      )
    : null

  return { document, tenantApplication, returnUrl }
}
```

**Signing loader** (`document-signing` route):

```ts
export async function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const applicationId = url.searchParams.get('applicationId')

  // Always fetch the document
  const document = await getDocument(clientId, params.documentId, { authToken, baseUrl })

  // Fetch application (with signatures + content) only when applicationId is present
  const tenantApplication = applicationId
    ? await getAdminPropertyTenantApplicationForServer(
        clientId,
        {
          id: applicationId,
          property_id: params.propertyId,
          populate: ['DesiredUnit', 'CreatedBy', 'CreatedBy.User',
                     'LeaseAgreementDocumentSignatures', 'LeaseAgreementDocument'],
        },
        { baseUrl, authToken },
      )
    : null

  return { document, tenantApplication }
}
```

### Old application routes → redirects

The existing routes:
```
_auth.properties.$propertyId_.occupancy.applications.$applicationId.editor.$documentId.ts
_auth.properties.$propertyId_.occupancy.applications.$applicationId.signing.$documentId.ts
```

Both become redirect-only loaders. No UI exported. Example for editor:

```ts
export async function loader({ request, params }: Route.LoaderArgs) {
  const returnUrl = `/properties/${params.propertyId}/occupancy/applications/${params.applicationId}/docs`
  const target = `/properties/${params.propertyId}/documents/${params.documentId}/editor`
    + `?applicationId=${params.applicationId}`
    + `&returnUrl=${encodeURIComponent(returnUrl)}`
  return redirect(target)
}
```

No module export needed on these files after the redirect is in place.

---

## 3. Refactored editor module

**New file:** `app/modules/documents/document-editor.tsx`  
**Old file:** `app/modules/properties/property/occupancy/applications/application/docs/lease-editor.tsx` — delete. The old route no longer imports it (it's a redirect-only loader now), so the file becomes an orphan.

### `DocumentMenuBar` (replaces `LeaseMenuBar`)

**File:** `app/components/blocks/template-editor/document-menu-bar.tsx`

Props change:

```ts
// Before
interface LeaseMenuBarProps {
  document: RentloopDocument
  tenantApplication: TenantApplication
  onFinalize?: () => void
  onRevertToDraft?: () => void
}

// After
interface DocumentMenuBarProps {
  document: RentloopDocument
  docStatus: string | null       // passed explicitly — not read from TenantApplication
  subtitle?: string              // e.g. "John Doe / Unit 2A • #APP-001" — built by parent
  returnUrl?: string             // used for back navigation; falls back to navigate(-1)
  onFinalize?: () => void
  onRevertToDraft?: () => void
}
```

The menu bar no longer knows about `TenantApplication` at all. The back button uses `returnUrl` if provided, otherwise `navigate(-1)`.

The parent module (`DocumentEditorModule`) builds the `subtitle` string when `tenantApplication` is available:

```ts
const subtitle = tenantApplication
  ? [
      [tenantApplication.first_name, tenantApplication.last_name].filter(Boolean).join(' '),
      tenantApplication.desired_unit?.name,
    ]
      .filter(Boolean)
      .join(' / ') + ` • #${tenantApplication.code}`
  : undefined
```

### `DocumentEditorModule`

Reads from the new generic loader type. Status update mutations only fire when `tenantApplication` is non-null. `returnUrl` flows from loader data into `DocumentMenuBar`.

After finalize/revert-to-draft, navigation goes to `returnUrl` (if present) or calls `navigate(-1)`.

---

## 4. Refactored signing module

**New file:** `app/modules/documents/document-signing.tsx`  
**Old file:** `app/modules/properties/property/occupancy/applications/application/docs/lease-signing.tsx` — delete. Same reason as editor: old route is redirect-only, old module becomes an orphan.

### Template field resolution

```ts
// When application context is available
const fieldMap = tenantApplication
  ? buildTenantApplicationFieldMap(tenantApplication)
  : {}

const resolvedEditorState = resolveTemplateFields(editorState, fieldMap)
```

When no application is provided, `fieldMap` is `{}` and all `#Token` nodes remain as-is in the rendered document.

### Signing record creation

```ts
await signDocumentDirect.mutateAsync({
  client_id: ...,
  property_id: propertyId,
  document_id: document.id,
  signature_url: uploadResult.url,
  // only include when available
  ...(tenantApplication ? { tenant_application_id: tenantApplication.id } : {}),
})
```

### Status updates

```ts
if (tenantApplication) {
  await updateTenantApplication.mutateAsync({
    ...,
    data: { lease_agreement_document_status: allSigned ? 'SIGNED' : 'SIGNING' },
  })
}
```

When there is no application context, the signing module signs the document and stamps the signature node in the content — but skips any application-level status update.

### Signer name fallback

```ts
const signerName = tenantApplication?.created_by?.user?.name ?? 'Property Manager'
```

---

## 5. Module registry

Update `app/modules/index.ts` to export `DocumentEditorModule` and `DocumentSigningModule` from the new `documents/` folder. Remove or alias the old `LeaseDocumentModule` / `LeaseSigningModule` exports.

---

## File map

| Old path | New path | Action |
|---|---|---|
| `routes/.../applications.$applicationId.editor.$documentId.ts` | unchanged | becomes redirect-only |
| `routes/.../applications.$applicationId.signing.$documentId.ts` | unchanged | becomes redirect-only |
| — | `routes/_auth.properties.$propertyId_.documents.$documentId.editor.ts` | new |
| — | `routes/_auth.properties.$propertyId_.documents.$documentId.signing.ts` | new |
| `modules/.../docs/lease-editor.tsx` | — | **delete** (orphan after route redirects) |
| `modules/.../docs/lease-signing.tsx` | — | **delete** (orphan after route redirects) |
| — | `modules/documents/document-editor.tsx` | new |
| — | `modules/documents/document-signing.tsx` | new |
| `components/blocks/template-editor/lease-menu-bar.tsx` | `components/blocks/template-editor/document-menu-bar.tsx` | refactored |
| `lib/resolve-template-fields.ts` | unchanged path | add type + rename function |

---

## Verification checklist

- [ ] `yarn types:check` passes with zero errors
- [ ] `yarn lint` passes
- [ ] Old editor URL (`/applications/:id/editor/:docId`) redirects to new URL
- [ ] Old signing URL (`/applications/:id/signing/:docId`) redirects to new URL
- [ ] New editor URL works with `?applicationId` — document loads, finalize/revert work, back nav returns to `returnUrl`
- [ ] New signing URL works with `?applicationId` — template tokens resolve, PM can sign, status updates on application
- [ ] New editor URL works without `?applicationId` — document loads, finalize/revert are skipped gracefully
- [ ] New signing URL works without `?applicationId` — signing works, no application status update attempted
- [ ] `buildTenantApplicationFieldMap` rename doesn't break `use-approval-pipeline.ts`
