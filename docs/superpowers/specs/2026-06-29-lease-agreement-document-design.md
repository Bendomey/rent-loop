# Lease Agreement Document — Design Spec

**Date:** 2026-06-29
**Branch:** db/make-document-optional

---

## Overview

Introduces a `LeaseAgreementDocument` model to manage the lease document lifecycle independently of the lease itself. The lease's `lease_agreement_document_url` becomes optional (nullable), allowing leases to be created and approved without a document. A separate pipeline model tracks mode, status, and signatures until the document is finalized and the URL is promoted to the lease.

---

## Background

Previously, lease document state (mode, document\_id, status, signatures) lived on `TenantApplication`. On approval, the finalized URL was copied to `Lease.LeaseAgreementDocumentUrl`. With documents now optional at approval time, leases need their own document pipeline so a document can be attached and processed after the lease is created.

---

## Data Model

### `LeaseAgreementDocument` (new)

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | PK |
| `lease_id` | string | FK to Lease, not null |
| `mode` | string | `"MANUAL"` \| `"ONLINE"` |
| `document_id` | \*string | FK to Document — ONLINE mode only |
| `document_url` | \*string | Set when ONLINE doc is ready; MANUAL uploads set this directly |
| `status` | string | `"DRAFT"` \| `"FINALIZED"` \| `"SIGNING"` \| `"SIGNED"` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

Relation: `DocumentSignature` gets a new nullable `LeaseAgreementDocumentID *string` FK, so signatures can be linked to this pipeline record (separate from the existing `LeaseID`).

### `Lease` (updated)

- `LeaseAgreementDocumentUrl` changes from `string` to `*string` — nullable, optional at creation and approval time
- No FK to `LeaseAgreementDocument` — the relationship is owned by `LeaseAgreementDocument.LeaseID`

### `DocumentSignature` (updated)

- Add `LeaseAgreementDocumentID *string` — nullable FK linking signatures to the pipeline record

---

## Status Machine

| Status | Triggered by |
|--------|-------------|
| `DRAFT` | `POST /agreement-document` on creation |
| `FINALIZED` | Explicit PM action — locks document content, enables signing invites |
| `SIGNING` | Backend side effect — set automatically when the first signing token is created for this lease |
| `SIGNED` | Backend side effect — set automatically when the last required party submits their signature |

After `SIGNED`:
- **ONLINE mode** — frontend generates the PDF from the Rentloop document, then calls `PATCH /leases/:id` with `lease_agreement_document_url`
- **MANUAL mode** — the URL is already set on `LeaseAgreementDocument.document_url`; `PATCH /leases/:id` copies it over after signing completes

Both the lease URL and the `LeaseAgreementDocument` record persist forever — the pipeline record serves as the audit trail.

---

## Backend Endpoints

All routes are under the existing authenticated admin client/property namespace:
`/v1/admin/clients/:clientId/properties/:propertyId/leases/:leaseId`

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `.../agreement-document` | ADMIN/OWNER | Create pipeline record; status = DRAFT |
| `PATCH` | `.../agreement-document` | ADMIN/OWNER | Update mode/document\_id/document\_url; DRAFT only |
| `DELETE` | `.../agreement-document` | ADMIN/OWNER | Remove pipeline record; DRAFT only |
| `POST` | `.../agreement-document/finalize` | ADMIN/OWNER | Transition DRAFT → FINALIZED |

`PATCH /leases/:id` (existing) handles saving the final URL after PDF generation. No new endpoint needed.

Signing token creation and signature submission already support `lease_id` — the backend signing service gains side-effect logic to advance `LeaseAgreementDocument.status` to `SIGNING` (on first token creation) and `SIGNED` (on last signature submission).

---

## Frontend Types

### New interface

```ts
interface LeaseAgreementDocument {
  id: string
  lease_id: string
  mode: 'MANUAL' | 'ONLINE'
  document_id: Nullable<string>
  document?: Nullable<RentloopDocument>
  document_url: Nullable<string>
  status: 'DRAFT' | 'FINALIZED' | 'SIGNING' | 'SIGNED'
  signatures: Array<RentloopDocumentSignature>
  created_at: Date
  updated_at: Date
}
```

### Updated interfaces

**`Lease`**
- `lease_agreement_document_url: Nullable<string>` (was `string`)
- Add `lease_agreement_document?: LeaseAgreementDocument`

**`RentloopDocumentSignature`**
- Add `lease_id: Nullable<string>` (already on backend, missing from FE type)

---

## Frontend UI — Lease Documents Tab

### When `lease_agreement_document_url` is set (finalized)

Show the existing UI: link to the document + signature status rows.

Signature source logic:
- If `lease.lease_agreement_document?.signatures` is present → use those
- Else → fall back to `application.lease_agreement_document_signatures` (legacy path for leases approved before this feature)

### When `lease_agreement_document_url` is null

Show an empty state matching the application docs step:
- Dashed border card, file icon, "No document attached" label
- "Add Document" button (MANAGER role only) — opens `AddDocumentModal` wired to `POST .../agreement-document` instead of the application update mutation

Once a `LeaseAgreementDocument` record exists (status ≥ DRAFT), render `AttachedDocumentView` reusing the existing component, shaped from `LeaseAgreementDocument` data.

`AddDocumentModal` and `AttachedDocumentView` are reused without structural changes — only their data sources and mutation targets differ.

---

## Out of Scope

- Bulk lease onboarding document flow (separate concern)
- Termination agreement documents (separate model, unchanged)
- Any changes to the application approval pipeline
