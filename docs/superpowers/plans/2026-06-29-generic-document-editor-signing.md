# Generic Document Editor & Signing Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple the document editor and signing pages from the tenant-application route hierarchy so any feature can link to them with an optional `applicationId` query param.

**Architecture:** New property-scoped routes (`/properties/:propertyId/documents/:documentId/editor|signing`) load the document always and the tenant application only when `?applicationId=` is present. Old application-scoped routes become pure redirects preserving backward compatibility. The `DocumentTemplateFieldMap` type replaces `Record<string, string>` at the template-field boundary, making every registered token explicit and typed.

**Tech Stack:** React Router v7, TypeScript, TanStack Query v5, Lexical editor, Tailwind CSS v4, Shadcn UI

## Global Constraints

- Run `yarn types:check` after every task — zero TypeScript errors before committing
- Run `yarn lint` after every task — zero lint errors before committing
- Never hardcode colors without a `dark:` counterpart
- Use `safeString()` from `~/lib/strings` instead of `?? ''`
- No auto-commits — leave changes unstaged for the user to review

---

## File Map

| Status | Path |
|--------|------|
| **modify** | `app/lib/resolve-template-fields.ts` |
| **modify** | `app/modules/properties/property/occupancy/applications/approve/use-approval-pipeline.ts` |
| **modify** | `app/modules/properties/property/occupancy/applications/application/docs/lease-signing.tsx` |
| **modify** | `app/components/blocks/signing-view/signing-view.tsx` |
| **modify** | `app/components/blocks/signing-view/signing-header.tsx` |
| **create** | `app/components/blocks/template-editor/document-menu-bar.tsx` |
| **create** | `app/modules/documents/document-editor.tsx` |
| **create** | `app/routes/_auth.properties.$propertyId_.documents.$documentId.editor.ts` |
| **create** | `app/modules/documents/document-signing.tsx` |
| **create** | `app/routes/_auth.properties.$propertyId_.documents.$documentId.signing.ts` |
| **modify → redirect** | `app/routes/_auth.properties.$propertyId_.occupancy.applications.$applicationId.editor.$documentId.ts` |
| **modify → redirect** | `app/routes/_auth.properties.$propertyId_.occupancy.applications.$applicationId.signing.$documentId.ts` |
| **delete** | `app/modules/properties/property/occupancy/applications/application/docs/lease-editor.tsx` |
| **delete** | `app/modules/properties/property/occupancy/applications/application/docs/lease-signing.tsx` |
| **delete** | `app/components/blocks/template-editor/lease-menu-bar.tsx` |
| **modify** | `app/modules/index.ts` |

---

## Task 1: `DocumentTemplateFieldMap` type + rename `buildTemplateFieldMap`

**Files:**
- Modify: `app/lib/resolve-template-fields.ts`
- Modify: `app/modules/properties/property/occupancy/applications/approve/use-approval-pipeline.ts`
- Modify: `app/modules/properties/property/occupancy/applications/application/docs/lease-signing.tsx`

**Interfaces:**
- Produces: `export type DocumentTemplateFieldMap` (all token keys optional)
- Produces: `export function buildTenantApplicationFieldMap(app: TenantApplication): DocumentTemplateFieldMap`
- Produces: `export function resolveTemplateFields(state: SerializedEditorState, fieldMap: DocumentTemplateFieldMap): SerializedEditorState`

- [ ] **Step 1: Add `DocumentTemplateFieldMap` type and rename the builder function**

Open `app/lib/resolve-template-fields.ts`. At the top of the file (before the first function), add the type. Then rename `buildTemplateFieldMap` → `buildTenantApplicationFieldMap` and narrow its return type.

The full new opening section of the file (replace from line 1 through the end of the old `buildTemplateFieldMap` signature line):

```ts
import dayjs from 'dayjs'
import type { SerializedEditorState } from 'lexical'

import { formatAmount, formatAmountWithoutCurrency } from '~/lib/format-amount'

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

export function buildTenantApplicationFieldMap(
  app: TenantApplication,
): DocumentTemplateFieldMap {
```

The body of the function is unchanged. Only the name and return type annotation change.

- [ ] **Step 2: Update `resolveTemplateFields` signature**

In the same file, find the `resolveTemplateFields` function signature and change its second parameter type:

```ts
// Before
export function resolveTemplateFields(
  state: SerializedEditorState,
  fieldMap: Record<string, string>,
): SerializedEditorState {

// After
export function resolveTemplateFields(
  state: SerializedEditorState,
  fieldMap: DocumentTemplateFieldMap,
): SerializedEditorState {
```

The function body is unchanged — the internal `walk` casts to `Record<string, unknown>` anyway.

- [ ] **Step 3: Update `use-approval-pipeline.ts`**

In `app/modules/properties/property/occupancy/applications/approve/use-approval-pipeline.ts`, find the import from `resolve-template-fields` and update the function name:

```ts
// Before
import {
  buildTemplateFieldMap,
  resolveTemplateFields,
} from '~/lib/resolve-template-fields'

// After
import {
  buildTenantApplicationFieldMap,
  resolveTemplateFields,
} from '~/lib/resolve-template-fields'
```

Then update the call site (search for `buildTemplateFieldMap(application)`):

```ts
// Before
const templateFieldMap = buildTemplateFieldMap(application)

// After
const templateFieldMap = buildTenantApplicationFieldMap(application)
```

- [ ] **Step 4: Update `lease-signing.tsx` (temporary — this file is deleted in Task 7)**

In `app/modules/properties/property/occupancy/applications/application/docs/lease-signing.tsx`, update the import:

```ts
// Before
import {
  buildTemplateFieldMap,
  resolveTemplateFields,
} from '~/lib/resolve-template-fields'

// After
import {
  buildTenantApplicationFieldMap,
  resolveTemplateFields,
} from '~/lib/resolve-template-fields'
```

Update the call site:

```ts
// Before
const fieldMap = buildTemplateFieldMap(tenantApplication)

// After
const fieldMap = buildTenantApplicationFieldMap(tenantApplication)
```

- [ ] **Step 5: Verify**

```bash
cd /Users/domeybenjamin/Kodes/personal/rent-loop/apps/property-manager
yarn types:check
yarn lint
```

Expected: zero errors on both commands.

---

## Task 2: Make `applicationCode` optional in `SigningView` and `SigningHeader`

The signing view currently requires `applicationCode: string`. The generic signing page may not always have an application, so this prop must become optional. The badge in the header is hidden when the value is absent.

**Files:**
- Modify: `app/components/blocks/signing-view/signing-header.tsx`
- Modify: `app/components/blocks/signing-view/signing-view.tsx`

**Interfaces:**
- Produces: `SigningView` prop `applicationCode?: string`
- Produces: `SigningHeader` prop `applicationCode?: string`

- [ ] **Step 1: Update `SigningHeader`**

In `app/components/blocks/signing-view/signing-header.tsx`, change the interface and hide the badge when `applicationCode` is absent:

```ts
interface SigningHeaderProps {
  documentTitle: string
  applicationCode?: string   // was: string
  signerRole: SignatureRole
  signatureStatuses: SignatureStatus[]
}
```

In the JSX, wrap the badge in a conditional:

```tsx
{/* Before */}
<Badge variant="outline" className="px-1.5 py-0 text-[10px]">
  #{applicationCode}
</Badge>

{/* After */}
{applicationCode && (
  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
    #{applicationCode}
  </Badge>
)}
```

- [ ] **Step 2: Update `SigningView`**

In `app/components/blocks/signing-view/signing-view.tsx`, change the interface:

```ts
interface SigningViewProps {
  documentTitle: string
  applicationCode?: string   // was: string
  editorState: SerializedEditorState
  signerRole: SignatureRole
  signerName: string
  signatureStatuses: SignatureStatus[]
  onSign: (role: SignatureRole, signatureDataUrl: string) => void
  isSigning: boolean
}
```

The `applicationCode` prop is passed straight through to `<SigningHeader>` — no other change needed in the body.

- [ ] **Step 3: Verify**

```bash
yarn types:check
yarn lint
```

Expected: zero errors.

---

## Task 3: `DocumentMenuBar` component

Replaces `LeaseMenuBar`. Accepts `docStatus` and an optional `subtitle` string instead of a full `TenantApplication`. Back navigation uses a `returnUrl` prop when provided.

**Files:**
- Create: `app/components/blocks/template-editor/document-menu-bar.tsx`

**Interfaces:**
- Consumes: nothing from previous tasks (standalone component)
- Produces:
  ```ts
  interface DocumentMenuBarProps {
    document: RentloopDocument
    docStatus: string | null
    subtitle?: string
    returnUrl?: string | null
    onFinalize?: () => void
    onRevertToDraft?: () => void
  }
  export function DocumentMenuBar(props: DocumentMenuBarProps): JSX.Element
  ```

- [ ] **Step 1: Create the file**

Create `app/components/blocks/template-editor/document-menu-bar.tsx` with the full component. This is a refactored copy of `lease-menu-bar.tsx` — the logic is identical but the TenantApplication dependency is removed:

```tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, $nodesOfType } from 'lexical'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Eye,
  Lock,
  RotateCcw,
  Save,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAdminUpdateDocument } from '~/api/documents'
import { SignatureNode } from '~/components/editor/nodes/signature-node'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Separator } from '~/components/ui/separator'
import { TypographyMuted } from '~/components/ui/typography'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'

interface DocumentMenuBarProps {
  document: RentloopDocument
  docStatus: string | null
  subtitle?: string
  returnUrl?: string | null
  onFinalize?: () => void
  onRevertToDraft?: () => void
}

export function DocumentMenuBar({
  document,
  docStatus,
  subtitle,
  returnUrl,
  onFinalize,
  onRevertToDraft,
}: DocumentMenuBarProps) {
  const navigate = useNavigate()
  const [editor] = useLexicalComposerContext()
  const { clientUser } = useClient()
  const updateDocument = useAdminUpdateDocument()
  const savedContentRef = useRef(document.content)
  const isFirstUpdateRef = useRef(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [hasPmSignature, setHasPmSignature] = useState(false)
  const [hasTenantSignature, setHasTenantSignature] = useState(false)
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      const currentContent = JSON.stringify(editorState.toJSON())

      if (isFirstUpdateRef.current) {
        savedContentRef.current = currentContent
        isFirstUpdateRef.current = false
      } else {
        setHasChanges(currentContent !== savedContentRef.current)
      }

      editorState.read(() => {
        const nodes = $nodesOfType(SignatureNode)
        setHasPmSignature(nodes.some((n) => n.getRole() === 'property_manager'))
        setHasTenantSignature(nodes.some((n) => n.getRole() === 'tenant'))
      })
    })
  }, [editor])

  const handleSaveDraft = () => {
    const editorState = editor.getEditorState()
    const content = JSON.stringify(editorState.toJSON())
    const charCount = editorState.read(() => $getRoot().getTextContent().length)

    updateDocument.mutate(
      {
        clientId: safeString(clientUser?.client_id),
        id: document.id,
        content,
        size: charCount,
      },
      {
        onSuccess: () => {
          savedContentRef.current = content
          setHasChanges(false)
          toast.success('Draft saved')
        },
        onError: (error) => {
          toast.error('Failed to save', { description: error.message })
        },
      },
    )
  }

  const handleBack = () => {
    if (returnUrl) {
      void navigate(returnUrl)
    } else {
      navigate(-1)
    }
  }

  const canFinalize = hasPmSignature && hasTenantSignature

  const checks = [
    { label: 'Property Manager signature field added', met: hasPmSignature },
    { label: 'Tenant signature field added', met: hasTenantSignature },
  ]

  return (
    <>
      <Dialog open={showFinalizeModal} onOpenChange={setShowFinalizeModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Finalize for Signing</DialogTitle>
            <DialogDescription>
              The following conditions must be met before this document can be
              finalized.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-2">
            {checks.map((check) => (
              <li key={check.label} className="flex items-center gap-2 text-sm">
                {check.met ? (
                  <CheckCircle2 className="size-4 shrink-0 text-teal-500" />
                ) : (
                  <Circle className="size-4 shrink-0 text-zinc-300" />
                )}
                <span className={check.met ? '' : 'text-muted-foreground'}>
                  {check.label}
                </span>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFinalizeModal(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-rose-600 hover:bg-rose-800"
              disabled={!canFinalize}
              onClick={() => {
                setShowFinalizeModal(false)
                onFinalize?.()
              }}
            >
              <Lock className="size-3" />
              Confirm & Finalize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col justify-between gap-2 border-b py-3 md:flex-row md:items-center md:px-3">
        <div className="flex items-center space-x-2">
          <Button onClick={handleBack} size="sm" variant="ghost">
            <ArrowLeft />
          </Button>
          <Separator orientation="vertical" className="!h-5" />
          <div className="flex flex-col">
            <h1 className="text-sm font-medium">{document.title}</h1>
            {subtitle && (
              <TypographyMuted className="text-xs">{subtitle}</TypographyMuted>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {docStatus === 'DRAFT' ? (
            hasChanges ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={handleSaveDraft}
                disabled={updateDocument.isPending}
              >
                <Save className="size-3" />
                {updateDocument.isPending ? 'Saving...' : 'Save Draft'}
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-rose-600 text-xs hover:bg-rose-800"
                onClick={() => setShowFinalizeModal(true)}
              >
                <Lock className="size-3" />
                Finalize for Signing
              </Button>
            )
          ) : docStatus === 'FINALIZED' ? (
            <>
              <Badge
                variant="outline"
                className="gap-1 border-amber-300 bg-amber-50 px-2 py-1 text-[10px] text-amber-700"
              >
                <Lock className="size-3" />
                Read Only — document is finalized
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={onRevertToDraft}
              >
                <RotateCcw className="size-3" />
                Back to Draft
              </Button>
            </>
          ) : (
            <Badge
              variant="outline"
              className="gap-1 border-zinc-300 bg-zinc-50 px-2 py-1 text-[10px] text-zinc-500"
            >
              <Eye className="size-3" />
              View Only
            </Badge>
          )}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify**

```bash
yarn types:check
yarn lint
```

Expected: zero errors.

---

## Task 4: Generic editor route + `DocumentEditorModule`

**Files:**
- Create: `app/modules/documents/document-editor.tsx`
- Create: `app/routes/_auth.properties.$propertyId_.documents.$documentId.editor.ts`
- Modify: `app/modules/index.ts`

**Interfaces:**
- Consumes: `DocumentMenuBar` from Task 3; `buildTenantApplicationFieldMap` / `DocumentTemplateFieldMap` not needed here (editor doesn't resolve fields)
- Produces: `export function DocumentEditorModule(): JSX.Element`
- Loader shape:
  ```ts
  {
    origin: string
    document: RentloopDocument
    tenantApplication: TenantApplication | null
    returnUrl: string | null
  }
  ```

- [ ] **Step 1: Create the route file**

Create `app/routes/_auth.properties.$propertyId_.documents.$documentId.editor.ts`:

```ts
import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId_.documents.$documentId.editor'
import { getDocument } from '~/api/documents'
import { getAdminPropertyTenantApplicationForServer } from '~/api/tenant-applications'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { DocumentEditorModule } from '~/modules'

export async function loader({ request, params }: Route.LoaderArgs) {
  const baseUrl = environmentVariables().API_ADDRESS
  const authSession = await getAuthSession(request.headers.get('Cookie'))
  const authToken = authSession.get('authToken')
  if (!authToken) return redirect('/login')

  const clientId = safeString(authSession.get('selectedClientId'))
  const url = new URL(request.url)
  const applicationId = url.searchParams.get('applicationId')
  const returnUrl = url.searchParams.get('returnUrl')

  try {
    const [document, tenantApplication] = await Promise.all([
      getDocument(clientId, params.documentId, { authToken, baseUrl }),
      applicationId
        ? getAdminPropertyTenantApplicationForServer(
            clientId,
            {
              id: applicationId,
              property_id: params.propertyId,
              populate: ['DesiredUnit', 'CreatedBy'],
            },
            { baseUrl, authToken },
          )
        : Promise.resolve(null),
    ])

    return {
      origin: getDomainUrl(request),
      document,
      tenantApplication,
      returnUrl,
    }
  } catch {
    throw new Response(null, { status: 404, statusText: 'Not Found' })
  }
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  const docTitle = loaderData?.document?.title ?? 'Document'
  return getSocialMetas({
    title: `Edit ${docTitle}`,
    url: getDisplayUrl({
      origin: loaderData.origin,
      path: location.pathname,
    }),
    origin: loaderData.origin,
  })
}

export default DocumentEditorModule
```

- [ ] **Step 2: Create `DocumentEditorModule`**

Create `app/modules/documents/document-editor.tsx`:

```tsx
import { type SerializedEditorState } from 'lexical'
import { CheckCircle2, Lock, PenLine } from 'lucide-react'
import { useState } from 'react'
import { useLoaderData, useNavigate, useRevalidator } from 'react-router'
import { toast } from 'sonner'

import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { Editor } from '~/components/blocks/template-editor/editor'
import { DocumentMenuBar } from '~/components/blocks/template-editor/document-menu-bar'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { safeString } from '~/lib/strings'
import { useClient } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId_.documents.$documentId.editor'

const initialValue = {
  root: {
    children: [
      {
        children: [],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
} as unknown as SerializedEditorState

export function DocumentEditorModule() {
  const { document, tenantApplication, returnUrl } =
    useLoaderData<typeof loader>()
  const updateTenantApplication = useAdminUpdateTenantApplication()
  const revalidator = useRevalidator()
  const navigate = useNavigate()
  const { clientUser } = useClient()

  const [editorState, setEditorState] = useState<SerializedEditorState>(
    document?.content ? JSON.parse(document.content) : initialValue,
  )

  if (!document) return null

  const goBack = () => {
    if (returnUrl) {
      void navigate(returnUrl)
    } else {
      navigate(-1)
    }
  }

  const handleFinalize = () => {
    if (!tenantApplication || updateTenantApplication.isPending) return
    updateTenantApplication.mutate(
      {
        client_id: safeString(clientUser?.client_id),
        id: tenantApplication.id,
        property_id: tenantApplication.desired_unit.property_id,
        data: { lease_agreement_document_status: 'FINALIZED' },
      },
      {
        onSuccess: () => {
          toast.success('Document finalized')
          void revalidator.revalidate()
          goBack()
        },
        onError: () => toast.error('Failed to finalize'),
      },
    )
  }

  const handleRevertToDraft = () => {
    if (!tenantApplication || updateTenantApplication.isPending) return
    updateTenantApplication.mutate(
      {
        client_id: safeString(clientUser?.client_id),
        id: tenantApplication.id,
        property_id: tenantApplication.desired_unit.property_id,
        data: { lease_agreement_document_status: 'DRAFT' },
      },
      {
        onSuccess: () => {
          toast.success('Reverted to draft')
          void revalidator.revalidate()
        },
        onError: () => toast.error('Failed to revert'),
      },
    )
  }

  const docStatus = tenantApplication?.lease_agreement_document_status ?? null

  const subtitle = tenantApplication
    ? [
        [tenantApplication.first_name, tenantApplication.last_name]
          .filter(Boolean)
          .join(' '),
        tenantApplication.desired_unit?.name,
      ]
        .filter(Boolean)
        .join(' / ') + ` • #${tenantApplication.code}`
    : undefined

  const readOnlyConfig = {
    FINALIZED: {
      icon: <Lock className="mx-auto mb-3 size-8 text-amber-500" />,
      title: 'Document Finalized',
      description:
        'This document has been finalized and is ready for signing. You cannot make edits in this state.',
      action: (
        <div className="space-x-2">
          <Button variant="outline" onClick={goBack}>
            Go Back
          </Button>
          <Button
            disabled={updateTenantApplication.isPending}
            onClick={handleRevertToDraft}
          >
            Back to Draft
          </Button>
        </div>
      ),
    },
    SIGNING: {
      icon: <PenLine className="mx-auto mb-3 size-8 text-blue-500" />,
      title: 'Signing in Progress',
      description:
        'This document is currently being signed by the relevant parties. No edits can be made.',
      action: null,
    },
    SIGNED: {
      icon: <CheckCircle2 className="mx-auto mb-3 size-8 text-teal-500" />,
      title: 'Document Signed',
      description:
        'This document has been fully executed and signed by all parties. It is now read-only.',
      action: null,
    },
  } as const

  const isReadOnly = docStatus != null && docStatus !== 'DRAFT'
  const config =
    isReadOnly && docStatus
      ? (readOnlyConfig[docStatus as keyof typeof readOnlyConfig] ?? null)
      : null

  return (
    <>
      {config && (
        <Dialog open onOpenChange={() => {}}>
          <DialogContent
            showCloseButton={false}
            className="text-center sm:max-w-sm"
          >
            <DialogHeader>
              {config.icon}
              <DialogTitle className="text-center">{config.title}</DialogTitle>
              <DialogDescription className="text-center">
                {config.description}
              </DialogDescription>
            </DialogHeader>
            {config.action && (
              <DialogFooter className="justify-center sm:justify-center">
                {config.action}
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}
      <Editor
        document={document}
        editorSerializedState={editorState}
        onSerializedChange={(value) => setEditorState(value)}
        menuBar={
          <DocumentMenuBar
            document={document}
            docStatus={docStatus}
            subtitle={subtitle}
            returnUrl={returnUrl}
            onFinalize={handleFinalize}
            onRevertToDraft={handleRevertToDraft}
          />
        }
      />
    </>
  )
}
```

- [ ] **Step 3: Export from `app/modules/index.ts`**

Add this line at the end of `app/modules/index.ts`:

```ts
export * from './documents/document-editor'
```

- [ ] **Step 4: Verify types and lint**

```bash
yarn types:check
yarn lint
```

Expected: zero errors.

- [ ] **Step 5: Smoke-test the new route in the browser**

Start the dev server (`yarn dev`). Navigate to an existing document's new URL — find a document ID from an in-progress application and open:

```
http://localhost:3000/properties/<propertyId>/documents/<documentId>/editor?applicationId=<applicationId>&returnUrl=%2Fproperties%2F<propertyId>%2Foccupancy%2Fapplications%2F<applicationId>%2Fdocs
```

Verify:
- Document loads and is editable
- The subtitle in the menu bar shows tenant name / unit / application code
- "Finalize for Signing" and "Back to Draft" work
- Back navigation returns to the `returnUrl`

---

## Task 5: Old editor route → redirect; delete orphaned files

**Files:**
- Modify: `app/routes/_auth.properties.$propertyId_.occupancy.applications.$applicationId.editor.$documentId.ts`
- Delete: `app/modules/properties/property/occupancy/applications/application/docs/lease-editor.tsx`
- Delete: `app/components/blocks/template-editor/lease-menu-bar.tsx`
- Modify: `app/modules/index.ts`

**Interfaces:**
- Consumes: nothing — this task removes code only

- [ ] **Step 1: Replace the old editor route with a redirect**

Overwrite `app/routes/_auth.properties.$propertyId_.occupancy.applications.$applicationId.editor.$documentId.ts` with:

```ts
import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId_.occupancy.applications.$applicationId.editor.$documentId'

export async function loader({ params }: Route.LoaderArgs) {
  const returnUrl = encodeURIComponent(
    `/properties/${params.propertyId}/occupancy/applications/${params.applicationId}/docs`,
  )
  return redirect(
    `/properties/${params.propertyId}/documents/${params.documentId}/editor?applicationId=${params.applicationId}&returnUrl=${returnUrl}`,
  )
}
```

No `export default` — this route renders nothing.

- [ ] **Step 2: Remove the `lease-editor` export from `app/modules/index.ts`**

Delete this line:

```ts
export * from './properties/property/occupancy/applications/application/docs/lease-editor'
```

- [ ] **Step 3: Delete orphaned files**

```bash
rm /Users/domeybenjamin/Kodes/personal/rent-loop/apps/property-manager/app/modules/properties/property/occupancy/applications/application/docs/lease-editor.tsx
rm /Users/domeybenjamin/Kodes/personal/rent-loop/apps/property-manager/app/components/blocks/template-editor/lease-menu-bar.tsx
```

- [ ] **Step 4: Verify**

```bash
yarn types:check
yarn lint
```

Expected: zero errors.

- [ ] **Step 5: Confirm redirect in browser**

Navigate to an old-style editor URL:
```
http://localhost:3000/properties/<propertyId>/occupancy/applications/<applicationId>/editor/<documentId>
```

Verify it redirects to the new `/documents/:documentId/editor?applicationId=...&returnUrl=...` URL and the document loads correctly.

---

## Task 6: Generic signing route + `DocumentSigningModule`

**Files:**
- Create: `app/modules/documents/document-signing.tsx`
- Create: `app/routes/_auth.properties.$propertyId_.documents.$documentId.signing.ts`
- Modify: `app/modules/index.ts`

**Interfaces:**
- Consumes: `buildTenantApplicationFieldMap`, `resolveTemplateFields`, `DocumentTemplateFieldMap` from Task 1; `SigningView` with optional `applicationCode` from Task 2
- Produces: `export function DocumentSigningModule(): JSX.Element`
- Loader shape:
  ```ts
  {
    origin: string
    document: RentloopDocument
    tenantApplication: TenantApplication | null
  }
  ```

- [ ] **Step 1: Create the route file**

Create `app/routes/_auth.properties.$propertyId_.documents.$documentId.signing.ts`:

```ts
import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId_.documents.$documentId.signing'
import { getDocument } from '~/api/documents'
import { getAdminPropertyTenantApplicationForServer } from '~/api/tenant-applications'
import { getAuthSession } from '~/lib/actions/auth.session.server'
import { environmentVariables } from '~/lib/actions/env.server'
import { getDisplayUrl, getDomainUrl } from '~/lib/misc'
import { getSocialMetas } from '~/lib/seo'
import { safeString } from '~/lib/strings'
import { DocumentSigningModule } from '~/modules'

export async function loader({ request, params }: Route.LoaderArgs) {
  const baseUrl = environmentVariables().API_ADDRESS
  const authSession = await getAuthSession(request.headers.get('Cookie'))
  const authToken = authSession.get('authToken')
  if (!authToken) return redirect('/login')

  const clientId = safeString(authSession.get('selectedClientId'))
  const url = new URL(request.url)
  const applicationId = url.searchParams.get('applicationId')

  try {
    const [document, tenantApplication] = await Promise.all([
      getDocument(clientId, params.documentId, { authToken, baseUrl }),
      applicationId
        ? getAdminPropertyTenantApplicationForServer(
            clientId,
            {
              id: applicationId,
              property_id: params.propertyId,
              populate: [
                'DesiredUnit',
                'CreatedBy',
                'CreatedBy.User',
                'LeaseAgreementDocumentSignatures',
                'LeaseAgreementDocument',
              ],
            },
            { baseUrl, authToken },
          )
        : Promise.resolve(null),
    ])

    return {
      origin: getDomainUrl(request),
      document,
      tenantApplication,
    }
  } catch {
    throw new Response(null, { status: 404, statusText: 'Not Found' })
  }
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  const docTitle = loaderData?.document?.title ?? 'Document'
  return getSocialMetas({
    title: `Sign ${docTitle}`,
    url: getDisplayUrl({
      origin: loaderData.origin,
      path: location.pathname,
    }),
    origin: loaderData.origin,
  })
}

export default DocumentSigningModule
```

- [ ] **Step 2: Create `DocumentSigningModule`**

Create `app/modules/documents/document-signing.tsx`:

```tsx
import type { SerializedEditorState } from 'lexical'
import { useState } from 'react'
import { useLoaderData, useParams, useRevalidator } from 'react-router'
import { toast } from 'sonner'

import { useAdminUpdateDocument } from '~/api/documents'
import { useSignDocumentDirect } from '~/api/signing'
import { useAdminUpdateTenantApplication } from '~/api/tenant-applications'
import { SigningView } from '~/components/blocks/signing-view/signing-view'
import type { SignatureRole } from '~/components/editor/nodes/signature-node'
import {
  getSignatureStatuses,
  injectSignatureIntoState,
} from '~/lib/lexical.utils'
import {
  buildTenantApplicationFieldMap,
  resolveTemplateFields,
} from '~/lib/resolve-template-fields'
import { safeString } from '~/lib/strings'
import { dataUrlToBlob } from '~/lib/utils'
import { useClient } from '~/providers/client-provider'
import type { loader } from '~/routes/_auth.properties.$propertyId_.documents.$documentId.signing'

export function DocumentSigningModule() {
  const { document, tenantApplication } = useLoaderData<typeof loader>()
  const { clientUser } = useClient()
  const { propertyId } = useParams()
  const signDocumentDirect = useSignDocumentDirect()
  const updateDocument = useAdminUpdateDocument()
  const updateTenantApplication = useAdminUpdateTenantApplication()
  const revalidator = useRevalidator()
  const [isSigning, setIsSigning] = useState(false)

  if (!document || !propertyId) return null

  const editorState: SerializedEditorState | null = document.content
    ? (JSON.parse(document.content) as SerializedEditorState)
    : null

  if (!editorState) return null

  const fieldMap = tenantApplication
    ? buildTenantApplicationFieldMap(tenantApplication)
    : {}
  const resolvedEditorState = resolveTemplateFields(editorState, fieldMap)
  const signatureStatuses = getSignatureStatuses(resolvedEditorState)

  const signerName =
    tenantApplication?.created_by?.user?.name ?? 'Property Manager'

  const uploadSignature = async (dataUrl: string) => {
    const blob = dataUrlToBlob(dataUrl)
    const file = new File([blob], 'signature.png', { type: 'image/png' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append(
      'objectKey',
      `signatures/${document.id}-${Date.now()}-pm.png`,
    )

    const uploadResponse = await fetch('/api/r2/upload', {
      method: 'POST',
      body: formData,
    })
    const uploadResult = (await uploadResponse.json()) as { url?: string }

    if (!uploadResponse.ok || !uploadResult.url) {
      toast.error('Failed to upload signature')
      return undefined
    }

    return uploadResult
  }

  const handleSign = async (role: SignatureRole, signatureDataUrl: string) => {
    setIsSigning(true)

    try {
      const uploadResult = await uploadSignature(signatureDataUrl)
      if (!uploadResult?.url) return

      await signDocumentDirect.mutateAsync({
        client_id: safeString(clientUser?.client_id),
        property_id: propertyId,
        document_id: document.id,
        signature_url: safeString(uploadResult.url),
        ...(tenantApplication
          ? { tenant_application_id: tenantApplication.id }
          : {}),
      })

      const signedAt = new Date().toISOString()
      const updatedState = injectSignatureIntoState(
        resolvedEditorState,
        role,
        uploadResult.url,
        signerName,
        signedAt,
      )

      await updateDocument.mutateAsync({
        clientId: safeString(clientUser?.client_id),
        id: document.id,
        content: JSON.stringify(updatedState),
      })

      if (tenantApplication) {
        const allSigned = getSignatureStatuses(updatedState).every(
          (s) => s.signed,
        )
        await updateTenantApplication.mutateAsync({
          client_id: safeString(clientUser?.client_id),
          id: tenantApplication.id,
          property_id: propertyId,
          data: {
            lease_agreement_document_status: allSigned ? 'SIGNED' : 'SIGNING',
          },
        })
      }

      toast.success('Document signed successfully')
      void revalidator.revalidate()
    } catch {
      toast.error('Failed to sign document')
    } finally {
      setIsSigning(false)
    }
  }

  const signedCount = signatureStatuses.filter((s) => s.signed).length

  return (
    <SigningView
      key={signedCount}
      documentTitle={document.title ?? 'Document'}
      applicationCode={tenantApplication?.code}
      editorState={resolvedEditorState}
      signerRole="property_manager"
      signerName={signerName}
      signatureStatuses={signatureStatuses}
      onSign={handleSign}
      isSigning={isSigning}
    />
  )
}
```

- [ ] **Step 3: Export from `app/modules/index.ts`**

Add this line at the end of `app/modules/index.ts`:

```ts
export * from './documents/document-signing'
```

- [ ] **Step 4: Verify**

```bash
yarn types:check
yarn lint
```

Expected: zero errors.

- [ ] **Step 5: Smoke-test the new signing route**

Navigate to the new signing URL:
```
http://localhost:3000/properties/<propertyId>/documents/<documentId>/signing?applicationId=<applicationId>
```

Verify:
- Document renders in the signing view
- Template tokens (e.g. `#TenantName`) are resolved to real values
- PM can draw a signature and submit — signing status updates
- Application `lease_agreement_document_status` updates to `SIGNING` or `SIGNED`

---

## Task 7: Old signing route → redirect; delete orphaned files

**Files:**
- Modify: `app/routes/_auth.properties.$propertyId_.occupancy.applications.$applicationId.signing.$documentId.ts`
- Delete: `app/modules/properties/property/occupancy/applications/application/docs/lease-signing.tsx`
- Modify: `app/modules/index.ts`

**Interfaces:**
- Consumes: nothing — removes code only

- [ ] **Step 1: Replace the old signing route with a redirect**

Overwrite `app/routes/_auth.properties.$propertyId_.occupancy.applications.$applicationId.signing.$documentId.ts` with:

```ts
import { redirect } from 'react-router'
import type { Route } from './+types/_auth.properties.$propertyId_.occupancy.applications.$applicationId.signing.$documentId'

export async function loader({ params }: Route.LoaderArgs) {
  return redirect(
    `/properties/${params.propertyId}/documents/${params.documentId}/signing?applicationId=${params.applicationId}`,
  )
}
```

- [ ] **Step 2: Remove the `lease-signing` export from `app/modules/index.ts`**

Delete this line:

```ts
export * from './properties/property/occupancy/applications/application/docs/lease-signing'
```

- [ ] **Step 3: Delete orphaned file**

```bash
rm /Users/domeybenjamin/Kodes/personal/rent-loop/apps/property-manager/app/modules/properties/property/occupancy/applications/application/docs/lease-signing.tsx
```

- [ ] **Step 4: Verify**

```bash
yarn types:check
yarn lint
```

Expected: zero errors.

- [ ] **Step 5: Confirm redirect in browser**

Navigate to an old-style signing URL:
```
http://localhost:3000/properties/<propertyId>/occupancy/applications/<applicationId>/signing/<documentId>
```

Verify it redirects to:
```
/properties/<propertyId>/documents/<documentId>/signing?applicationId=<applicationId>
```

And the signing page loads correctly with all template tokens resolved.

- [ ] **Step 6: End-to-end verification**

Walk the full application docs flow to confirm nothing regressed:
1. Open an in-progress application → Docs Setup tab
2. Select "Select from Library" → pick a template → Save
3. Click "Edit Document" — verify redirect takes you to new editor URL
4. Finalize the document — verify back navigation returns to Docs Setup
5. Click "Sign Document" — verify redirect takes you to new signing URL
6. Sign as Property Manager — verify status updates to `SIGNING`
