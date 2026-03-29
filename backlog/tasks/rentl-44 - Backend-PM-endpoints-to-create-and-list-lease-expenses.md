---
id: RENTL-44
title: 'Backend: PM endpoints to create and list lease expenses'
status: In Progress
assignee: []
created_date: '2026-03-25 14:27'
updated_date: '2026-03-27 09:44'
labels: []
dependencies: []
references:
  - services/main/internal/handlers/invoice.go
  - services/main/internal/services/invoice.go
  - services/main/internal/repository/invoice.go
  - services/main/internal/models/invoice.go
  - services/main/internal/router/
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add two new endpoints to the Go API so property managers can create and list arbitrary expenses charged against a lease.

## Endpoints

**POST `/api/v1/leases/{lease_id}/expenses`** — Client User JWT, ADMIN/OWNER/MANAGER role
**GET `/api/v1/leases/{lease_id}/expenses`** — Client User JWT, any role

## Implementation notes

### Handler (`internal/handlers/invoice.go`)

Add `PMCreateLeaseExpense` and `PMListLeaseExpenses` methods to `InvoiceHandler`.

**PMCreateLeaseExpense:**
1. Decode + validate request body: `label` (required string), `amount` (required int64, pesewas), `due_date` (optional time.Time)
2. Fetch lease with `Unit.Property` populated via `h.services.LeaseService.GetByIDWithPopulate`
3. Assert `lease.Unit.Property.ClientID == authenticatedClientUser.ClientID` — 403 if mismatch
4. Call `h.service.CreateInvoice` with:
   - `ContextType: "GENERAL_EXPENSE"`, `ContextLeaseID: &leaseID`
   - `PayerType: "TENANT"`, `PayerTenantID: &lease.TenantId`
   - `PayeeType: "PROPERTY_OWNER"`, `PayeeClientID: &lease.Unit.Property.ClientID`
   - `Status: "ISSUED"` (immediately actionable), `DueDate: input.DueDate`
   - `TotalAmount / SubTotal: input.Amount`, `Taxes: 0`, `Currency: "GHS"`
   - One line item: `Category: "EXPENSE"`, `Label: input.Label`, `Quantity: 1`, `UnitAmount: input.Amount`, `TotalAmount: input.Amount`
5. Return 201 with the created invoice

**PMListLeaseExpenses:**
1. Fetch list via `h.service.ListInvoices` with `ContextLeaseID: &leaseID`, `ContextType: "GENERAL_EXPENSE"`
2. Return paginated `OutputInvoice` list

### Router (`internal/router/`)

Register both routes under the client user protected group, alongside the existing `/v1/leases/{lease_id}` routes. Apply ADMIN/OWNER/MANAGER middleware to the POST route.

### Swagger annotations

Both handler methods need complete godoc annotations so `make lint-fix` / `make generate-docs` regenerates correctly.

## Parent task
RENTL-43
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 POST /api/v1/leases/{lease_id}/expenses creates a GENERAL_EXPENSE invoice with status ISSUED, ContextLeaseID set, PayerType=TENANT, PayeeType=PROPERTY_OWNER
- [ ] #2 GET /api/v1/leases/{lease_id}/expenses returns paginated list of GENERAL_EXPENSE invoices for the lease
- [ ] #3 Creating an expense on a lease owned by a different client returns 403
- [ ] #4 label and amount are required; missing either returns 422
- [ ] #5 Swagger docs regenerate cleanly with make generate-docs
- [ ] #6 make lint passes
<!-- AC:END -->
