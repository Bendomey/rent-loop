---
id: RENTL-13
title: Ideate Terminate Lease flow
status: In Progress
assignee: []
created_date: '2026-03-05 08:56'
updated_date: '2026-03-11 19:05'
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
Design and plan the lease termination flow — how property managers initiate, process, and complete lease terminations. Covers early termination, mutual agreement, and end-of-term non-renewal scenarios.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 PATCH /v1/admin/leases/{lease_id}/termination sets termination document URL on Active leases
- [ ] #2 PATCH /v1/admin/leases/{lease_id}/status:terminated finalises termination on Active leases
- [ ] #3 Endpoint returns 400 if lease is not Active
- [ ] #4 terminated_at and terminated_by_id set after finalization
- [ ] #5 Unit reverts to Available when no other active leases remain on that unit
- [ ] #6 Tenant receives email and SMS notification with reason
- [ ] #7 4-step termination sheet: Checklist → Financial → Document → Confirm
- [ ] #8 CHECK_OUT checklist auto-created with 4 BINARY items if missing; Next blocked until complete
- [ ] #9 Document signing step reuses existing signing flow (direct PM sign + tenant token)
- [ ] #10 Financial settlement guidance shown using existing invoice system (no new backend)
- [ ] #11 Terminate button disabled until reason entered and checklist complete
- [ ] #12 All changes pass yarn types:check and make lint-fix
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Termination Flow (4 Steps in Sheet)

```
STEP 1 — Move-Out Checklist
  Auto-create CHECK_OUT checklist (4 BINARY items) if missing
  PM marks items DONE / FUNCTIONAL / DAMAGED / MISSING

STEP 2 — Financial Settlement (guidance only)
  Shows damaged item count → instructs PM to create settlement invoices in Financials tab
  Prorated rent refund: days_remaining × daily_rate → new DRAFT invoice (RENT category)
  Security deposit: deposit - deductions for DAMAGED/MISSING → settlement invoice

STEP 3 — Document Signing
  PM uploads termination agreement URL → saved via PATCH /termination
  PM signs via useSignDocumentDirect (existing ~/api/signing)
  Tenant signing link sent via useGenerateSigningToken (existing ~/api/signing)
  Both sign timestamps stored on lease model (fields already exist)

STEP 4 — Confirm
  Status summary: checklist done? PM signed? Tenant signed?
  Reason textarea (required)
  Terminate button (destructive) — disabled until checklist done + reason entered
  Signing gates are informational only (can proceed without doc)
```

---

## Part A — Backend (services/main)

### 1. New endpoint: PATCH /v1/admin/leases/{lease_id}/termination
Only callable on Active leases. Updates termination_agreement_document_url.

**services/main/internal/handlers/lease.go** — add:
```go
type UpdateLeaseTerminationRequest struct {
    TerminationAgreementDocumentUrl *string `json:"termination_agreement_document_url" validate:"omitempty,url"`
}
func (h *LeaseHandler) UpdateLeaseTermination(w http.ResponseWriter, r *http.Request) {
    leaseID := chi.URLParam(r, "lease_id")
    var body UpdateLeaseTerminationRequest
    json.NewDecoder(r.Body).Decode(&body)
    if !lib.ValidateRequest(h.appCtx.Validator, body, w) { return }
    lease, err := h.service.UpdateActiveLeaseTerminationDetails(r.Context(), services.UpdateActiveLeaseTerminationInput{
        LeaseID: leaseID, TerminationAgreementDocumentUrl: body.TerminationAgreementDocumentUrl,
    })
    if err != nil { HandleErrorResponse(w, err); return }
    json.NewEncoder(w).Encode(map[string]any{"data": transformations.DBAdminLeaseToRest(lease)})
}
```

**services/main/internal/services/lease.go** — add:
```go
type UpdateActiveLeaseTerminationInput struct {
    LeaseID string
    TerminationAgreementDocumentUrl *string
}
func (s *leaseService) UpdateActiveLeaseTerminationDetails(ctx context.Context, input UpdateActiveLeaseTerminationInput) (*models.Lease, error) {
    lease, err := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseQuery{ID: input.LeaseID})
    if err != nil { return nil, err }
    if lease.Status != "Lease.Status.Active" { return nil, pkg.BadRequestError("LeaseIsNotActive", nil) }
    if input.TerminationAgreementDocumentUrl != nil {
        lease.TerminationAgreementDocumentUrl = input.TerminationAgreementDocumentUrl
    }
    if err := s.repo.Update(ctx, lease); err != nil { return nil, err }
    return lease, nil
}
```

### 2. New endpoint: PATCH /v1/admin/leases/{lease_id}/status:terminated

**services/main/internal/handlers/lease.go** — add (follows CancelLease pattern):
```go
type TerminateLeaseRequest struct {
    TerminationReason string `json:"termination_reason" validate:"required"`
}
func (h *LeaseHandler) TerminateLease(w http.ResponseWriter, r *http.Request) {
    currentClientUser, ok := lib.ClientUserFromContext(r.Context())
    if !ok { http.Error(w, "Unauthorized", http.StatusUnauthorized); return }
    leaseID := chi.URLParam(r, "lease_id")
    var body TerminateLeaseRequest
    json.NewDecoder(r.Body).Decode(&body)
    if !lib.ValidateRequest(h.appCtx.Validator, body, w) { return }
    if err := h.service.TerminateLease(r.Context(), services.TerminateLeaseInput{
        LeaseID: leaseID, ClientUserId: currentClientUser.ID, TerminationReason: body.TerminationReason,
    }); err != nil { HandleErrorResponse(w, err); return }
    w.WriteHeader(http.StatusNoContent)
}
```

**services/main/internal/services/lease.go** — add:
```go
type TerminateLeaseInput struct { LeaseID, ClientUserId, TerminationReason string }
func (s *leaseService) TerminateLease(ctx context.Context, input TerminateLeaseInput) error {
    lease, err := s.repo.GetOneWithPopulate(ctx, repository.GetLeaseQuery{ID: input.LeaseID, Populate: &[]string{"Unit", "Tenant"}})
    if err != nil { return err }
    if lease.Status == "Lease.Status.Terminated" { return pkg.BadRequestError("LeaseIsAlreadyTerminated", nil) }
    if lease.Status != "Lease.Status.Active" { return pkg.BadRequestError("LeaseIsNotActive", nil) }
    now := time.Now()
    lease.Status = "Lease.Status.Terminated"
    lease.TerminatedAt = &now
    lease.TerminatedById = &input.ClientUserId
    if err := s.repo.Update(ctx, lease); err != nil { return err }
    // Revert unit if no other active leases
    if count, err := s.repo.CountActiveByUnitID(ctx, lease.UnitId); err == nil && count == 0 {
        _ = s.repo.UpdateUnitStatus(ctx, lease.UnitId, "Unit.Status.Available")
    }
    // Notify tenant via email + SMS (goroutines, same pattern as other lease notifications)
    return nil
}
```

### 3. Repository: add UpdateUnitStatus
**services/main/internal/repository/lease.go** — add to interface + impl:
```go
UpdateUnitStatus(ctx context.Context, unitID string, status string) error
// impl: db.Model(&models.Unit{}).Where("id = ?", unitID).Update("status", status)
```
Avoids adding unitService dep to leaseService.

### 4. Email templates
**services/main/internal/lib/** (wherever LEASE_CANCELLED_SUBJECT etc live):
```go
const LEASE_TERMINATED_SUBJECT = "Lease Termination Notice"
const LEASE_TERMINATED_BODY = `Dear {{tenant_name}}, your lease for unit {{unit_name}} has been terminated. Reason: {{termination_reason}}.`
```

### 5. Router
**services/main/internal/router/client-user.go** — inside existing `/leases/{lease_id}` block after `/status:cancelled`:
```go
r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
    Patch("/termination", handlers.LeaseHandler.UpdateLeaseTermination)
r.With(middlewares.ValidateRoleClientUserMiddleware(appCtx, "ADMIN", "OWNER")).
    Patch("/status:terminated", handlers.LeaseHandler.TerminateLease)
```

---

## Part B — Frontend (apps/property-manager)

### 1. New file: apps/property-manager/app/api/leases/index.ts
```ts
export function useUpdateLeaseTermination(leaseId: string) {
    // PATCH /api/v1/admin/leases/{leaseId}/termination
    // body: { termination_agreement_document_url?: string }
    // invalidates ['tenant-leases']
}
export function useTerminateLease(leaseId: string) {
    // PATCH /api/v1/admin/leases/{leaseId}/status:terminated
    // body: { termination_reason: string }
    // invalidates ['tenant-leases']
}
```

### 2. apps/property-manager/app/modules/.../tenants/all/tenant/leases/index.tsx
- Add "Terminate Lease" button (variant="destructive", size="sm") on Active lease cards
- Add `TerminateLeaseSheet` component with 4-step navigator (step indicator buttons, clickable)
  - Step 1 (checklist): renders `ChecklistCard` (from RENTL-14) for CHECK_OUT type; auto-creates if missing; Next disabled until all items non-PENDING
  - Step 2 (financial): guidance cards for prorated refund + deposit; shows damaged item count from CHECK_OUT checklist; Next always enabled
  - Step 3 (document): URL input + Save → `useUpdateLeaseTermination`; PM Sign → `useSignDocumentDirect`; Send Tenant Link → `useGenerateSigningToken`; badge shows signed/unsigned; Skip button if no doc
  - Step 4 (confirm): StatusRow checklist (checkOutDone, pmSigned, tenantSigned); reason Textarea (required); Terminate button calls `useTerminateLease` → toast + close on success

---

## Files Modified

| File | Change |
|---|---|
| `services/main/internal/services/lease.go` | Add `UpdateActiveLeaseTerminationDetails` + `TerminateLease` |
| `services/main/internal/repository/lease.go` | Add `UpdateUnitStatus` |
| `services/main/internal/lib/*.go` | Add `LEASE_TERMINATED_SUBJECT/BODY` constants |
| `services/main/internal/handlers/lease.go` | Add `UpdateLeaseTermination` + `TerminateLease` handlers |
| `services/main/internal/router/client-user.go` | Register 2 new PATCH routes |
| `apps/property-manager/app/api/leases/index.ts` | **New**: 2 mutation hooks |
| `apps/property-manager/app/modules/.../leases/index.tsx` | Terminate button + 4-step TerminateLeaseSheet |

## Reused (no changes needed)
- `~/api/signing` — `useSignDocumentDirect`, `useGenerateSigningToken`
- `~/api/lease-checklists` — `useGetLeaseChecklists`, `useCreateLeaseChecklist`, `ChecklistCard` (RENTL-14)

---

## Verification
1. `PATCH /termination` on Active lease → 200, url saved
2. `PATCH /status:terminated` on Active lease with reason → 204
3. `PATCH /status:terminated` on non-Active → 400 LeaseIsNotActive
4. `terminated_at` + `terminated_by_id` set on lease
5. Unit reverts to Available when no active leases remain
6. Tenant email + SMS received
7. "Terminate Lease" button visible only on Active lease cards
8. Step 1 auto-creates CHECK_OUT checklist if none exists
9. Confirm button disabled until checklist done + reason entered
10. Signing gates informational only (can terminate without signing)
11. `make lint-fix` passes; `yarn types:check` passes
<!-- SECTION:PLAN:END -->
