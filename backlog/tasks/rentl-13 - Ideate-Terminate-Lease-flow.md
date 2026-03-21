---
id: RENTL-13
title: Ideate Terminate Lease flow
status: In Progress
assignee: []
created_date: '2026-03-05 08:56'
updated_date: '2026-03-21 23:02'
labels:
  - frontend
  - backend
  - property-manager
  - leases
milestone: m-1
dependencies: []
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Design and implement the lease termination flow as a structured process (like TenantApplication) with its own lifecycle. Property managers initiate a LeaseTermination process that can be cancelled at any point. Covers evictions, mutual agreements, and tenant-initiated terminations. The process includes: selecting termination type/reason, optional move-out inspection (CHECK_OUT checklist), drafting/uploading a termination agreement document with signing flow, configuring financial settlement (bidirectional invoices — tenant→landlord or landlord→tenant), and final confirmation that transitions the lease to Terminated status.

The termination is modeled as a separate `LeaseTermination` table with statuses: InProgress → Completed / Cancelled. The actual lease status only changes to `Lease.Status.Terminated` when the process is completed. Cancelling the process leaves the lease Active.

Invoice system is extended to support `TENANT` as a payee type (for deposit refunds/landlord-to-tenant payments), `LEASE_TERMINATION` as a context type, and new line item categories (DEPOSIT_REFUND, EARLY_TERMINATION_FEE, DAMAGE_CHARGE). A single termination can have multiple invoices in both payment directions.

Document support is dual-mode: PM can either draft in the existing Lexical editor (ONLINE mode) or upload an external URL (MANUAL mode). Both go through the existing signing flow (PM signs via useSignDocumentDirect, tenant signs via useGenerateSigningToken). DocumentSignature model extended with LeaseTerminationID FK.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 LeaseTermination model created with: Code (auto-gen), Status (InProgress/Completed/Cancelled), Type (EVICTION/MUTUAL_AGREEMENT/TENANT_INITIATED), Reason, LeaseID, LeaseChecklistID (optional), DocumentMode (MANUAL/ONLINE), DocumentUrl, DocumentID, InitiatedById, CompletedAt/By, CancelledAt/By
- [ ] #2 POST /v1/admin/properties/{property_id}/leases/{lease_id}/terminations creates InProgress termination on Active leases
- [ ] #3 POST returns 400 if lease is not Active or if an InProgress termination already exists for the lease
- [ ] #4 PATCH /v1/admin/.../terminations/{termination_id} updates Type, Reason, DocumentMode, DocumentUrl, DocumentID, LeaseChecklistID on InProgress terminations
- [ ] #5 PATCH /v1/admin/.../terminations/{termination_id}/complete finalizes: sets LeaseTermination to Completed, sets Lease to Terminated (terminated_at, terminated_by_id), reverts unit to Available if no other active leases remain — all in a DB transaction
- [ ] #6 PATCH /v1/admin/.../terminations/{termination_id}/cancel sets LeaseTermination to Cancelled, lease remains Active
- [ ] #7 Tenant receives email and SMS notification with termination reason when process is completed
- [ ] #8 Invoice model extended: TENANT added as PayeeType, LEASE_TERMINATION added as ContextType, ContextLeaseTerminationID FK added
- [ ] #9 New invoice line item categories: DEPOSIT_REFUND, EARLY_TERMINATION_FEE, DAMAGE_CHARGE
- [ ] #10 Multiple invoices supported per termination in both directions (tenant→landlord, landlord→tenant)
- [ ] #11 DocumentSignature model extended with LeaseTerminationID nullable FK
- [ ] #12 5-step termination sheet UI: Reason/Type → Move-Out Inspection (optional) → Document (optional, MANUAL URL or ONLINE Lexical) → Financial Settlement → Confirm
- [ ] #13 Step 1 (Reason): select termination type + enter detailed reason, creates LeaseTermination on first save
- [ ] #14 Step 2 (Inspection): optional, auto-creates CHECK_OUT checklist if missing, links to termination
- [ ] #15 Step 3 (Document): toggle MANUAL (URL input) or ONLINE (Lexical editor), PM sign via useSignDocumentDirect, tenant link via useGenerateSigningToken, skip button available
- [ ] #16 Step 4 (Settlement): create/view invoices under this termination, configure line items, supports both payment directions
- [ ] #17 Step 5 (Confirm): status summary, Complete Termination (destructive) button, Cancel Process button
- [ ] #18 Terminate Lease button on Active lease cards opens the sheet; shows 'Continue Termination' if InProgress termination exists
- [ ] #19 All changes pass yarn types:check and make lint-fix
- [ ] #20 Both light and dark modes supported in all new UI
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## New Model: LeaseTermination

```
BaseModelSoftDelete
Code                     string    (auto-gen via BeforeCreate hook)
Status                   string    (LeaseTermination.Status.InProgress | .Completed | .Cancelled)
Type                     string    (EVICTION | MUTUAL_AGREEMENT | TENANT_INITIATED)
Reason                   string    (detailed reason text, required)

LeaseID                  string    (FK, required)
Lease                    Lease

// Move-out report (optional — links to CHECK_OUT checklist)
LeaseChecklistID         *string   (FK, nullable)
LeaseChecklist           *LeaseChecklist

// Document (optional, supports both modes)
DocumentMode             *string   (MANUAL | ONLINE)
DocumentUrl              *string   (for MANUAL mode — external URL)
DocumentID               *string   (FK, nullable — for ONLINE mode, Lexical document)
Document                 *Document

// Process tracking
InitiatedById            string
InitiatedBy              ClientUser
CompletedAt              *time.Time
CompletedById            *string
CompletedBy              *ClientUser
CancelledAt              *time.Time
CancelledById            *string
CancelledBy              *ClientUser
```

---

## Invoice System Extensions

| Change | Detail |
|---|---|
| New PayeeType value | TENANT — enables landlord-to-tenant payments (deposit refunds) |
| New ContextType value | LEASE_TERMINATION |
| New FK on Invoice model | ContextLeaseTerminationID *string |
| New line item categories | DEPOSIT_REFUND, EARLY_TERMINATION_FEE, DAMAGE_CHARGE (in addition to existing EXPENSE) |

A single termination can have multiple invoices — e.g., one where tenant pays landlord (damages) and one where landlord pays tenant (deposit refund).

---

## DocumentSignature Extension

Add LeaseTerminationID *string FK to the DocumentSignature model so signatures can be associated with the specific termination process.

---

## Implementation Steps

### Phase 1: Backend — Models & Migration

**Step 1.** Create LeaseTermination model
- **New file:** services/main/internal/models/lease-termination.go
- Follow TenantApplication pattern: BaseModelSoftDelete, auto-gen Code in BeforeCreate, status enum, timestamp+actor pairs

**Step 2.** Extend Invoice model
- **File:** services/main/internal/models/invoice.go
- Add ContextLeaseTerminationID *string FK field
- Add TENANT to payee type validation, LEASE_TERMINATION to context type validation
- Add new line item categories: DEPOSIT_REFUND, EARLY_TERMINATION_FEE, DAMAGE_CHARGE

**Step 3.** Extend DocumentSignature model
- **File:** services/main/internal/models/document_signature.go
- Add LeaseTerminationID *string FK

**Step 4.** Create migration job
- **New file:** services/main/init/migration/jobs/ (follow naming convention)
- AutoMigrate LeaseTermination, Invoice, DocumentSignature
- Register in services/main/init/migration/main.go

### Phase 2: Backend — Repository

**Step 5.** Create LeaseTerminationRepository
- **New file:** services/main/internal/repository/lease-termination.go
- Interface: Create, Update, GetOneWithPopulate, List, Count
- Follow LeaseRepository pattern with lib.ResolveDB for transaction support
- GetOneWithPopulate supports: Lease, Lease.Unit, Lease.Tenant, Lease.Tenant.TenantAccount, LeaseChecklist, Document, InitiatedBy, CompletedBy, CancelledBy

**Step 6.** Register repository
- **File:** services/main/internal/repository/main.go
- Add LeaseTerminationRepository to the Repository struct and initialize it

### Phase 3: Backend — Service Layer

**Step 7.** Create LeaseTerminationService
- **New file:** services/main/internal/services/lease-termination.go
- Dependencies: appCtx, leaseTerminationRepo, leaseRepo, unitService, invoiceService, notificationService

Interface methods:
- CreateLeaseTermination(ctx, input) (*LeaseTermination, error)
- UpdateLeaseTermination(ctx, input) (*LeaseTermination, error)
- CompleteLeaseTermination(ctx, input) error
- CancelLeaseTermination(ctx, input) error
- GetByID(ctx, query) (*LeaseTermination, error)
- ListByLease(ctx, leaseID, filters) ([]LeaseTermination, error)

**CreateLeaseTermination:**
- Guard: lease must be Active
- Guard: no other InProgress termination exists for this lease
- Create with status InProgress, set InitiatedById
- Return the created record

**UpdateLeaseTermination:**
- Guard: status must be InProgress
- Update allowed fields: Type, Reason, DocumentMode, DocumentUrl, DocumentID, LeaseChecklistID

**CompleteLeaseTermination** (transactional):
- Guard: status must be InProgress
- Guard: Type and Reason must be set
- Inside transaction:
  1. Set status to Completed, CompletedAt, CompletedById
  2. Update lease: Status = Terminated, TerminatedAt, TerminatedById, NextBillingDate = nil
  3. Copy DocumentUrl to lease.TerminationAgreementDocumentUrl if set
  4. Unit revert: CountActiveByUnitID → if 0, SetSystemUnitStatus → Available
  5. Commit
- Post-transaction: send email + SMS notification to tenant (fire-and-forget goroutines)

**CancelLeaseTermination:**
- Guard: status must be InProgress
- Set status to Cancelled, CancelledAt, CancelledById
- Lease remains Active (no changes)

**Step 8.** Wire service in factory
- **File:** services/main/internal/services/main.go
- Create leaseTerminationService with required dependencies
- Add to Services struct

### Phase 4: Backend — Email Templates

**Step 9.** Add termination email template
- **File:** services/main/internal/lib/email-templates.go
- Add LEASE_TERMINATED_SUBJECT and LEASE_TERMINATED_BODY
- Placeholders: {{tenant_name}}, {{unit_name}}, {{termination_reason}}

### Phase 5: Backend — Handlers & Router

**Step 10.** Create LeaseTerminationHandler
- **New file:** services/main/internal/handlers/lease-termination.go

| Handler | Method | Route | Response |
|---|---|---|---|
| Create | POST | /leases/{lease_id}/terminations | 201 {data: ...} |
| GetByID | GET | /leases/{lease_id}/terminations/{termination_id} | 200 {data: ...} |
| List | GET | /leases/{lease_id}/terminations | 200 {data: [...]} |
| Update | PATCH | /leases/{lease_id}/terminations/{termination_id} | 200 {data: ...} |
| Complete | PATCH | /leases/{lease_id}/terminations/{termination_id}/complete | 204 |
| Cancel | PATCH | /leases/{lease_id}/terminations/{termination_id}/cancel | 204 |

**Step 11.** Create transformation
- **New file:** services/main/internal/transformations/lease-termination.go
- DBAdminLeaseTerminationToRest — maps all fields including nested relations

**Step 12.** Register handler
- **File:** services/main/internal/handlers/main.go
- Add LeaseTerminationHandler to Handlers struct

**Step 13.** Register routes
- **File:** services/main/internal/router/client-user.go
- Inside /leases/{lease_id} block (after line 213), add:

```go
r.Route("/terminations", func(r chi.Router) {
    r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
        Post("/", handlers.LeaseTerminationHandler.Create)
    r.Get("/", handlers.LeaseTerminationHandler.List)
    r.Route("/{termination_id}", func(r chi.Router) {
        r.Get("/", handlers.LeaseTerminationHandler.GetByID)
        r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
            Patch("/", handlers.LeaseTerminationHandler.Update)
        r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
            Patch("/complete", handlers.LeaseTerminationHandler.Complete)
        r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
            Patch("/cancel", handlers.LeaseTerminationHandler.Cancel)
    })
})
```

### Phase 6: Frontend — API Layer

**Step 14.** Create lease termination API hooks
- **New file:** apps/property-manager/app/api/lease-terminations/index.ts

| Hook | Method | Endpoint |
|---|---|---|
| useGetLeaseTerminations(propertyId, leaseId) | GET | .../leases/:leaseId/terminations |
| useGetLeaseTermination(propertyId, leaseId, terminationId) | GET | .../terminations/:id |
| useCreateLeaseTermination() | POST | .../leases/:leaseId/terminations |
| useUpdateLeaseTermination() | PATCH | .../terminations/:id |
| useCompleteLeaseTermination() | PATCH | .../terminations/:id/complete |
| useCancelLeaseTermination() | PATCH | .../terminations/:id/cancel |

All mutations invalidate [QUERY_KEYS.LEASE_TERMINATIONS, propertyId, leaseId].

**Step 15.** Add TypeScript type
- **New file:** apps/property-manager/types/lease-termination.d.ts
- Define LeaseTermination interface matching the REST output
- Define LeaseTerminationType union: 'EVICTION' | 'MUTUAL_AGREEMENT' | 'TENANT_INITIATED'
- Define LeaseTerminationStatus union

**Step 16.** Add query key constant
- **File:** apps/property-manager/app/lib/constants.ts
- Add LEASE_TERMINATIONS: 'lease-terminations' to QUERY_KEYS

### Phase 7: Frontend — Termination Sheet UI

**Step 17.** Create termination sheet component
- **New directory:** apps/property-manager/app/modules/properties/property/tenants/leases/lease/terminate/

| File | Purpose |
|---|---|
| index.tsx | TerminateLeaseSheet — Sheet wrapper, step state (0-4), step indicator, Next/Back navigation |
| step-reason.tsx | Step 1 — Reason & Type: Select termination type (EVICTION/MUTUAL_AGREEMENT/TENANT_INITIATED), enter detailed reason (textarea, required). Calls useCreateLeaseTermination on first save, useUpdateLeaseTermination on subsequent edits. |
| step-inspection.tsx | Step 2 — Move-Out Inspection (optional): Auto-create CHECK_OUT checklist if missing; render checklist items; link checklist to termination via update. Skip button available. |
| step-document.tsx | Step 3 — Termination Agreement (optional): Toggle between MANUAL (URL input) and ONLINE (select/create Lexical document). PM sign via useSignDocumentDirect. Tenant signing link via useGenerateSigningToken. Skip button available. |
| step-settlement.tsx | Step 4 — Financial Settlement: Create/view invoices under this termination. Configure line items (deposit refund, damage charges, fees). Supports both directions (tenant→landlord, landlord→tenant). Uses existing invoice creation UI patterns. |
| step-confirm.tsx | Step 5 — Confirm: Status summary (reason set, inspection done, docs signed, settlement configured). "Complete Termination" destructive button → useCompleteLeaseTermination. "Cancel Process" secondary button → useCancelLeaseTermination. |

**Step 18.** Wire up the button
- **File:** apps/property-manager/app/modules/properties/property/tenants/leases/lease/index.tsx (lines 211-219)
- Add useState for sheet open state
- Remove disabled from button, add onClick
- If an InProgress termination already exists for this lease, the button should say "Continue Termination" and open with existing data
- Render TerminateLeaseSheet with lease, propertyId, open, onOpenChange

### Phase 8: Frontend — Invoice Extensions

**Step 19.** Update invoice types
- **File:** apps/property-manager/types/invoice.d.ts
- Add TENANT to payee type
- Add LEASE_TERMINATION to context type
- Add context_lease_termination_id field
- Add new line item categories

**Step 20.** Add settlement invoice creation UI
- Part of step-settlement.tsx in Step 17
- Reuse existing invoice creation patterns from apps/property-manager/app/api/invoices/
- Allow PM to select direction (who pays whom) and add line items

---

## Files Summary

### New files
| File | Description |
|---|---|
| services/main/internal/models/lease-termination.go | LeaseTermination model |
| services/main/internal/repository/lease-termination.go | Repository layer |
| services/main/internal/services/lease-termination.go | Service layer |
| services/main/internal/handlers/lease-termination.go | HTTP handlers |
| services/main/internal/transformations/lease-termination.go | REST transformation |
| services/main/init/migration/jobs/<new>.go | Migration |
| apps/property-manager/app/api/lease-terminations/index.ts | API hooks |
| apps/property-manager/types/lease-termination.d.ts | TypeScript types |
| apps/property-manager/app/modules/.../lease/terminate/*.tsx | 5-step sheet UI (6 files) |

### Modified files
| File | Change |
|---|---|
| services/main/internal/models/invoice.go | Add ContextLeaseTerminationID, new payee/context/category values |
| services/main/internal/models/document_signature.go | Add LeaseTerminationID FK |
| services/main/internal/repository/main.go | Register LeaseTerminationRepository |
| services/main/internal/services/main.go | Wire LeaseTerminationService |
| services/main/internal/handlers/main.go | Register LeaseTerminationHandler |
| services/main/internal/router/client-user.go | Add termination routes |
| services/main/internal/lib/email-templates.go | Add LEASE_TERMINATED templates |
| services/main/init/migration/main.go | Register migration |
| apps/property-manager/app/lib/constants.ts | Add LEASE_TERMINATIONS query key |
| apps/property-manager/types/invoice.d.ts | Extend payee/context/category types |
| apps/property-manager/app/modules/.../lease/index.tsx | Wire Terminate button |

### Reused (no changes)
- ~/api/signing — useSignDocumentDirect, useGenerateSigningToken
- ~/api/lease-checklists — useGetLeaseChecklists, useCreateLeaseChecklist
- ~/api/invoices — existing invoice hooks
- UnitService.SetSystemUnitStatus — unit status revert
- LeaseRepository.CountActiveByUnitID — check remaining active leases

---

## Verification

1. make update-db — migration applies cleanly (new table + altered columns)
2. make lint-fix — passes
3. POST termination on Active lease → 201, InProgress record created
4. POST termination on lease with existing InProgress termination → 400
5. PATCH update on InProgress termination → 200
6. PATCH complete on InProgress termination → 204, lease becomes Terminated
7. PATCH complete on non-InProgress → 400
8. PATCH cancel on InProgress → 204, lease stays Active
9. Unit reverts to Available when no active leases remain after completion
10. Tenant email + SMS received on completion
11. Frontend: Terminate button opens 5-step sheet
12. Step 1 (Reason): type select + reason textarea, creates termination on save
13. Step 2 (Inspection): optional, auto-creates CHECK_OUT checklist
14. Step 3 (Document): both MANUAL URL and ONLINE Lexical modes work, signing flow works
15. Step 4 (Settlement): can create invoices in both directions
16. Step 5 (Confirm): Complete button works, Cancel button works
17. "Continue Termination" shown if InProgress termination exists
18. yarn types:check + yarn lint pass
19. Both light and dark modes verified
<!-- SECTION:PLAN:END -->
