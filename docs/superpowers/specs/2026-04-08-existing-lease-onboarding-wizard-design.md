# Existing Lease Onboarding Wizard — Design Spec

**Date:** 2026-04-08  
**Status:** Approved

---

## Context

New landlords signing up to Rent-Loop often have existing tenants already occupying their units. The current onboarding path — tenant application → invoice → payment → signing → approval — is designed for new tenants and is inappropriate for backfilling existing leases. Landlords need a fast, guided way to register their current tenants and leases, including uploading existing PDF lease agreements.

---

## Scope

- **Who:** Landlords new to Rent-Loop, backfilling existing occupied units
- **When:** After properties and units have already been created in the system
- **What:** A batch wizard that creates Tenant, TenantAccount, TenantApplication, Invoice (auto-paid), and Lease records for up to 20 existing tenant-lease pairs per submission
- **Not in scope:** Renewals, mid-lease transfers, or tenants without existing PDF leases

---

## Backend

### New Endpoint

```
POST /api/v1/admin/clients/{client_id}/properties/{property_id}/leases:bulk-onboard
Auth: Client User JWT (ADMIN or OWNER role)
```

**Request body:**
```json
{
  "entries": [
    {
      "unit_id": "uuid",
      "first_name": "string",
      "last_name": "string",
      "other_names": "string?",
      "email": "string?",
      "phone": "string",
      "gender": "Male|Female",
      "date_of_birth": "RFC3339",
      "nationality": "string",
      "marital_status": "Single|Married|Divorced|Widowed",
      "current_address": "string",
      "id_type": "NationalID|Passport|DriverLicense",
      "id_number": "string",
      "emergency_contact_name": "string",
      "emergency_contact_phone": "string",
      "relationship_to_emergency_contact": "string",
      "occupation": "string?",
      "employer": "string?",
      "rent_fee": 120000,
      "rent_fee_currency": "GHS",
      "payment_frequency": "MONTHLY|QUARTERLY|...",
      "move_in_date": "RFC3339",
      "stay_duration_frequency": "HOURS|DAYS|MONTHS",
      "stay_duration": 12,
      "paid_through_date": "RFC3339?",
      "initial_deposit_fee": 120000,
      "initial_deposit_fee_currency": "GHS",
      "security_deposit_fee": 60000,
      "security_deposit_fee_currency": "GHS",
      "lease_agreement_document_url": "string (S3 URL)"
    }
  ]
}
```

**Validation:**
- `len(entries)` must be 1–20; return 422 if exceeded
- All `unit_id`s must belong to `property_id`; return 400 `UnitsNotUnderProperty` otherwise
- All units must have status `Available` or `PartiallyOccupied`; return 400 `UnitNoLongerAvailable` per offending unit

**Response:** `204 No Content` on success.

**Swagger godoc** must be added per project conventions.

---

### New Service Method

`BulkOnboardLeases(ctx, clientUserID, propertyID string, entries []BulkOnboardLeaseEntry) error`

Added to `LeaseService` in `services/main/internal/services/lease.go`.

**Transaction logic** (single `lib.WithTransaction`):

Pre-flight validation (before any writes):
- Fetch all units by ID, verify they belong to `propertyID` and have eligible status

For each entry inside the transaction:
1. **Create TenantApplication** — status `Completed`, `CompletedAt: now`, `CompletedById: clientUserID`. Set `LeaseAgreementDocumentUrl`, `DesiredMoveInDate`, `StayDuration`, `StayDurationFrequency`, `RentFee`, `RentFeeCurrency`, `InitialDepositFee`, `SecurityDepositFee`. Optional fields (`Occupation`, `Employer`, `OccupationAddress`) default to `"N/A"` if not provided.
2. **Create invoice** (if `InitialDepositFee > 0` or `SecurityDepositFee > 0`) — `TENANT_APPLICATION` type, inserted directly with status `PAID` (historical record; bypasses the `ISSUED` state and Fincore journal entry posting entirely — no double-entry for backfilled data). Use `InvoiceRepository.Create` directly rather than `InvoiceService.CreateInvoice`.
3. **GetOrCreateTenant** — reuse existing `TenantService.GetOrCreateTenant`.
4. **GetOrCreateTenantAccount** — reuse existing `TenantAccountService.GetOrCreateTenantAccount`.
5. **CreateLease** — status `Lease.Status.Active`, `ActivatedAt: now`, `ActivatedById: clientUserID`, `TenantApplicationId` set from step 1. Store `paid_through_date` in the `Meta` JSON field alongside deposit amounts.
6. **Update unit status** — same occupancy logic as `ApproveTenantApplication` (Occupied vs PartiallyOccupied based on `MaxOccupantsAllowed`).

After commit — fire notifications per tenant (goroutines, non-blocking). Reuse the same email + SMS templates as `ApproveTenantApplication` (`TENANT_APPLICATION_APPROVED_BODY`, `TENANT_APPLICATION_APPROVED_SMS_BODY`).

---

### Router Change

`services/main/internal/router/client-user.go` — add under the properties group:

```go
r.With(ValidateRoleClientUserMiddleware("ADMIN", "OWNER")).
    Post("/properties/{id}/leases:bulk-onboard", leaseHandler.BulkOnboardLeases)
```

---

## Frontend

### New Route

`apps/property-manager/app/routes/_auth.properties.$propertyId.tenants.leases.bulk-onboard.tsx`

Loader fetches the property (reuse existing server fetch pattern). Default export renders `BulkOnboardModule`.

### Module Structure

```
app/modules/properties/property/tenants/leases/bulk-onboard/
├── index.tsx           # Table view — home base
├── context.tsx         # Batch state management
└── wizard/
    ├── index.tsx       # Wizard shell — progress bar + step switcher
    ├── step1.tsx       # Unit selection (available/partially-occupied only)
    ├── step2.tsx       # Tenant info
    ├── step3.tsx       # Lease terms + deposits
    └── step4.tsx       # PDF upload
```

### Context State

```ts
interface DraftLeaseEntry {
  id: string                         // local uuid for table keying
  unit_id: string
  unit_name: string
  tenant_name: string                // derived: first_name + last_name
  rent_fee: number
  rent_fee_currency: string
  lease_agreement_document_url: string
  formData: Partial<BulkOnboardEntryInput>
  isComplete: boolean
  missingFields: string[]
}

interface BulkOnboardContextType {
  entries: DraftLeaseEntry[]         // max 20
  editingEntryId: string | null      // null = table view, set = wizard open for that entry
  isSubmitting: boolean
  addOrUpdateEntry: (entry: DraftLeaseEntry) => void
  removeEntry: (id: string) => void
  startEdit: (id: string | null) => void  // null = new entry
  submitAll: () => Promise<void>
}
```

### Table View (`index.tsx`)

- Header: property name, `{n} / 20 added` counter, `+ Add Tenant` button (disabled at 20), `Submit All ({n})` button (disabled if 0 entries or any entry incomplete)
- Progress bar: `(entries.length / 20) * 100%` width, rose-600
- Table columns: Tenant name | Unit | Rent | Status badge | Edit button | Remove button
- Status badge: green `✓ Complete` or amber `⚠ {missing field}` 
- Info callout at 20 entries: "Max 20 tenants per submission. Submit this batch first, then start a new one."
- On `Submit All`: calls `POST /leases:bulk-onboard`, on success shows toast + redirects to property tenants page

### Wizard (`wizard/index.tsx`)

4 steps. Progress bar fills per step. "Back to Overview" always visible — discards current entry (with confirmation if dirty).

**Step 1 — Unit**
- `UnitSelect` component (reuse existing), filtered to `Available` and `PartiallyOccupied` units only
- Excludes units already assigned in the current batch session

**Step 2 — Tenant Info**
Fields: first name, other names (optional), last name, phone, email (optional), gender, date of birth, nationality, marital status, current address, ID type, ID number, emergency contact name, emergency contact phone, relationship to emergency contact.

**Step 3 — Lease Terms**
Fields: rent fee, rent fee currency, payment frequency, move-in date, stay duration + frequency, paid-through date (optional, labelled "Last payment date / paid through"), initial deposit fee + currency (optional), security deposit fee + currency (optional).

**Step 4 — PDF Upload**
- S3 presigned URL upload (reuse `useUploadObject` hook)
- Accept PDF only
- On upload success, stores URL in entry
- "Save & Back to Table" button — validates all 4 steps complete, adds/updates entry in context, returns to table view

### New API Call

`apps/property-manager/app/api/leases/index.ts` — add `useBulkOnboardLeases` mutation:

```ts
POST /v1/admin/clients/{clientId}/properties/{propertyId}/leases:bulk-onboard
body: { entries: BulkOnboardEntryInput[] }
```

---

## Entry Point

Add a prominent entry point on the property tenants list page (or dashboard) for new properties with 0 active leases: a callout card — "Have existing tenants? Onboard them quickly →" linking to the bulk onboard route.

---

## Verification

1. Create a property with 3+ available units
2. Navigate to the bulk onboard wizard
3. Add 2–3 tenant entries through the wizard (including one with deposits, one without)
4. Verify table shows correct status badges
5. Submit — confirm DB has `TenantApplication`, `Invoice` (if deposits), `Tenant`, `TenantAccount`, `Lease` (Active) for each entry
6. Confirm unit statuses updated (Occupied / PartiallyOccupied)
7. Confirm email/SMS notifications fired (check logs)
8. Attempt to submit 21 entries — confirm 422 response
9. Attempt with a unit already Occupied — confirm 400 `UnitNoLongerAvailable`
10. Confirm dark mode renders correctly throughout wizard
