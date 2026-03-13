---
id: RENTL-27
title: Maintenance Requests — Full Backend Implementation
status: Done
assignee: []
created_date: '2026-03-11 20:42'
updated_date: '2026-03-13 12:38'
labels:
  - backend
  - maintenance
  - workflow
dependencies: []
references:
  - internal/models/maintenance-request.go
  - internal/repository/maintenance-request.go
  - internal/services/maintenance-request.go
  - internal/handlers/maintenance-request.go
  - internal/router/client-user.go
  - internal/router/tenant.go
  - init/migration/jobs/
  - internal/transformations/maintenance-request.go
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

`MaintenanceRequest` and `MaintenanceRequestActivityLog` models exist in the codebase but are commented out of migrations with no routes, service, or repository. This task activates and completes them with the full workflow: creation by tenant or admin, worker assignment, **free-form status transitions** with full audit trail, expenses as line items with **manual billing**, and role-based permissions.

---

## Model Changes — `internal/models/maintenance-request.go`

The existing stub is nearly complete. Add 3 missing fields:

```go
Visibility         string     // TENANT_VISIBLE | INTERNAL_ONLY (default: TENANT_VISIBLE)
ReviewedAt         *time.Time
CancellationReason *string
```

Add `BeforeCreate` hook to generate `Code` in `MR-YYMM-XXXXXX` format (follow Invoice pattern with `gonanoid`).

### New model: `MaintenanceExpense`

```go
type MaintenanceExpense struct {
    BaseModelSoftDelete
    MaintenanceRequestID  string
    MaintenanceRequest    *MaintenanceRequest
    Description           string
    Amount                int64
    Currency              string
    PaidBy                string  // BUSINESS | TENANT | OWNER
    BillableToTenant      bool    // if true, can be linked to tenant invoice later
    InvoiceID             *string // set when billed via expenses:invoice
    Invoice               *Invoice
    CreatedByClientUserID string
    CreatedByClientUser   ClientUser
}
```

---

## Migration — `init/migration/jobs/activate-maintenance-requests.go`

Migration ID: `ACTIVATE_MAINTENANCE_REQUESTS`

- Adds `visibility`, `reviewed_at`, `cancellation_reason` to `maintenance_requests`
- Creates `maintenance_expenses` table
- Uncomment `&models.MaintenanceRequest{}`, `&models.MaintenanceRequestActivityLog{}` in AutoMigrate
- Add `&models.MaintenanceExpense{}`

---

## Status Transitions (free-form — any → any)

The kanban UI lets users drag cards to any status freely. The backend does **NOT** enforce strict allowed-next-state rules. Every transition:
1. Saves new status + relevant timestamp field
2. Appends `ActivityLog` entry with actor + `{from, to}` in metadata

Timestamp fields updated per target status:
- → `IN_PROGRESS` — sets `StartedAt` (if nil)
- → `IN_REVIEW` — sets `ReviewedAt` (if nil)
- → `RESOLVED` — sets `ResolvedAt`; cleared if later moved back
- → `CANCELED` — sets `CanceledAt`, requires `CancellationReason`

**Invoice decoupling:** Status moves NEVER auto-create or void invoices. Billing is a separate explicit action (see `expenses:invoice` endpoint).

---

## Repository — `internal/repository/maintenance-request.go`

```go
type MaintenanceRequestRepository interface {
    Create(ctx, *models.MaintenanceRequest) error
    GetOneWithPopulate(ctx, GetMaintenanceRequestQuery) (*models.MaintenanceRequest, error)
    List(ctx, ListMaintenanceRequestsFilter) (*[]models.MaintenanceRequest, error)
    Count(ctx, ListMaintenanceRequestsFilter) (int64, error)
    Update(ctx, *models.MaintenanceRequest) error
    Delete(ctx, id string) error
    CreateActivityLog(ctx, *models.MaintenanceRequestActivityLog) error
    ListActivityLogs(ctx, maintenanceRequestID string) (*[]models.MaintenanceRequestActivityLog, error)
    CreateExpense(ctx, *models.MaintenanceExpense) error
    ListExpenses(ctx, maintenanceRequestID string) (*[]models.MaintenanceExpense, error)
    DeleteExpense(ctx, expenseID string) error
}
```

Filter struct includes: `ClientID`, `PropertyID`, `UnitID`, `LeaseID`, `Status`, `Priority`, `Category`, `AssignedWorkerID`, `TenantID` (tenant-scoped queries also enforce TENANT_VISIBLE filter).

---

## Service — `internal/services/maintenance-request.go`

```go
type MaintenanceRequestService interface {
    CreateByTenant(ctx, CreateByTenantInput) (*models.MaintenanceRequest, error)
    CreateByAdmin(ctx, CreateByAdminInput) (*models.MaintenanceRequest, error)
    GetMaintenanceRequest(ctx, id string) (*models.MaintenanceRequest, error)
    ListMaintenanceRequests(ctx, filter) (*[]models.MaintenanceRequest, error)
    CountMaintenanceRequests(ctx, filter) (int64, error)
    UpdateMaintenanceRequest(ctx, UpdateInput) (*models.MaintenanceRequest, error)
    AssignWorker(ctx, AssignWorkerInput) error
    AssignManager(ctx, AssignManagerInput) error

    // Single free-form status transition — any → any
    UpdateStatus(ctx, UpdateStatusInput) error
    // UpdateStatusInput: { RequestID, NewStatus, ActorType, ActorID, CancellationReason? }

    ListActivityLogs(ctx, id string) (*[]models.MaintenanceRequestActivityLog, error)
    AddExpense(ctx, AddExpenseInput) (*models.MaintenanceExpense, error)
    ListExpenses(ctx, id string) (*[]models.MaintenanceExpense, error)
    DeleteExpense(ctx, expenseID string) error
    GenerateExpenseInvoice(ctx, id string) (*models.Invoice, error)  // billable expenses → DRAFT invoice
}
```

Each status transition: update fields + timestamps → `repo.Update` → append `ActivityLog` → fire-and-forget notifications.

`GenerateExpenseInvoice`:
1. Fetch all `BillableToTenant = true` expenses where `InvoiceID IS NULL`
2. Create `Invoice { ContextType: MAINTENANCE, ContextMaintenanceRequestID: id, Status: DRAFT }` with line items
3. Set `expense.InvoiceID` on each included expense

Dependencies: `notificationService NotificationService`, `invoiceService InvoiceService`, `appCtx`.

---

## Handler — `internal/handlers/maintenance-request.go`

**PM/Admin routes (client user JWT):**
```
POST   /v1/maintenance-requests
GET    /v1/maintenance-requests
GET    /v1/maintenance-requests/{id}
PATCH  /v1/maintenance-requests/{id}
POST   /v1/maintenance-requests/{id}/assign-worker
POST   /v1/maintenance-requests/{id}/assign-manager
PATCH  /v1/maintenance-requests/{id}/status        ← single endpoint, body: { status, cancellation_reason? }
GET    /v1/maintenance-requests/{id}/activity
POST   /v1/maintenance-requests/{id}/expenses
GET    /v1/maintenance-requests/{id}/expenses
DELETE /v1/maintenance-requests/{id}/expenses/{expense_id}
POST   /v1/maintenance-requests/{id}/expenses:invoice
```

**Property-nested (same handlers, property_id injected as filter):**
```
POST   /v1/properties/{property_id}/maintenance-requests
GET    /v1/properties/{property_id}/maintenance-requests
```

**Tenant routes (tenant JWT):**
```
POST   /v1/tenant/maintenance-requests
GET    /v1/tenant/maintenance-requests
GET    /v1/tenant/maintenance-requests/{id}
```

---

## Permissions (enforced in service layer)

| Action | Roles |
|---|---|
| Create (admin) | ADMIN, OWNER |
| Create (tenant) | Any tenant with active lease |
| Assign worker/manager | ADMIN, OWNER, property MANAGER |
| Update status | ADMIN, OWNER, MANAGER; tenant can only cancel their own NEW request |
| Add expense | ADMIN, OWNER, assigned worker |
| Delete expense | ADMIN, OWNER only |
| Generate expense invoice | ADMIN, OWNER |
| View INTERNAL_ONLY requests | ADMIN, OWNER, MANAGER, STAFF — NOT tenants |

---

## Notifications (fire-and-forget per transition)

- Worker assigned → push + email/SMS to worker
- → `IN_PROGRESS` → push to tenant (if TENANT_VISIBLE): "Work has started on your request"
- → `IN_REVIEW` → push to assigned manager
- → `RESOLVED` → push + email/SMS to tenant (if TENANT_VISIBLE): "Your request has been resolved"
- → `CANCELED` → push to tenant (if TENANT_VISIBLE)

---

## Critical Files

| File | Change |
|---|---|
| `internal/models/maintenance-request.go` | Add `Visibility`, `ReviewedAt`, `CancellationReason`; add `MaintenanceExpense`; add `BeforeCreate` for Code |
| `init/migration/jobs/activate-maintenance-requests.go` | **New** |
| `init/migration/main.go` | Uncomment AutoMigrate entries + register migration |
| `internal/repository/maintenance-request.go` | **New** |
| `internal/repository/main.go` | Register repository |
| `internal/services/maintenance-request.go` | **New** |
| `internal/services/main.go` | Register service (inject `invoiceService`) |
| `internal/handlers/maintenance-request.go` | **New** |
| `internal/handlers/main.go` | Register handler |
| `internal/transformations/maintenance-request.go` | **New** (PM view + tenant view) |
| `internal/router/client-user.go` | Add PM + property-nested routes |
| `internal/router/tenant.go` | Add tenant routes |
| `internal/lib/` (email constants) | Add notification templates per transition |
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 make update-db creates maintenance_requests, maintenance_request_activity_logs, maintenance_expenses tables with all new columns
- [ ] #2 Tenant POST /v1/tenant/maintenance-requests creates request with status=NEW, derives unitId from active lease
- [ ] #3 Admin POST /v1/maintenance-requests with leaseId=null creates INTERNAL_ONLY unit-level request
- [ ] #4 POST /v1/maintenance-requests/{id}/assign-worker sets AssignedWorkerID and appends activity log
- [ ] #5 PATCH /v1/maintenance-requests/{id}/status with body {status: IN_PROGRESS} sets StartedAt and appends activity log
- [ ] #6 PATCH /v1/maintenance-requests/{id}/status with body {status: RESOLVED} sets ResolvedAt and sends tenant notification
- [ ] #7 PATCH /v1/maintenance-requests/{id}/status from RESOLVED back to IN_PROGRESS clears ResolvedAt, does NOT affect any invoice
- [ ] #8 PATCH /v1/maintenance-requests/{id}/status to CANCELED without cancellation_reason returns 400
- [ ] #9 POST /v1/maintenance-requests/{id}/expenses creates expense record with BillableToTenant flag
- [ ] #10 POST /v1/maintenance-requests/{id}/expenses:invoice creates DRAFT invoice from BillableToTenant=true expenses, sets InvoiceID on each expense
- [ ] #11 Running expenses:invoice again only includes expenses without an existing InvoiceID (no duplicate billing)
- [ ] #12 GET /v1/maintenance-requests/{id}/activity returns full ordered audit trail with all transitions
- [ ] #13 Tenant GET /v1/tenant/maintenance-requests only returns TENANT_VISIBLE requests
- [ ] #14 Tenant cannot access INTERNAL_ONLY requests (403)
- [ ] #15 make lint passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Key Design Decisions

### 1. Free-form status transitions (no strict state machine)

The kanban UI allows dragging cards to any status at any time. The backend does NOT enforce allowed-next-state rules. Instead, every transition:
- Saves new status + relevant timestamp (StartedAt, ReviewedAt, ResolvedAt, CanceledAt)
- Appends an `ActivityLog` entry with actor + old/new status in metadata
- Fires notifications to relevant parties

Use a single `UpdateStatus(ctx, UpdateStatusInput)` service method rather than named transition methods.

### 2. Expenses are decoupled from invoices (manual billing)

Status moves NEVER auto-create or void invoices. When admin is ready to bill a tenant:
- `POST /v1/maintenance-requests/{id}/expenses:invoice`
- Creates a DRAFT invoice (`ContextType = MAINTENANCE`, `ContextMaintenanceRequestID`)
- Adds line items from all `BillableToTenant = true` expenses that don't yet have an `InvoiceID`
- Sets `expense.InvoiceID` on each included expense

This means moving RESOLVED → IN_PROGRESS never affects any invoice. No invoice churn.
<!-- SECTION:NOTES:END -->
