---
id: RENTL-45
title: 'Frontend: lease expenses section in lease detail page'
status: Done
assignee: []
created_date: '2026-03-25 14:28'
updated_date: '2026-03-30 23:11'
labels: []
milestone: m-4
dependencies:
  - RENTL-44
references:
  - >-
    apps/property-manager/app/modules/properties/property/tenants/leases/lease/index.tsx
  - apps/property-manager/app/api/invoices/index.ts
  - >-
    apps/property-manager/app/modules/properties/property/tenants/leases/lease/components/
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add an Expenses tab to the lease detail page so property managers can create and view arbitrary charges against a tenant's lease.

## Depends on
RENTL-44 (backend endpoints must exist first)

## API endpoints (from RENTL-44)
- `POST /api/v1/leases/{lease_id}/expenses` — body: `{ label, amount (pesewas), due_date? }`
- `GET /api/v1/leases/{lease_id}/expenses` — paginated list of `OutputInvoice`

## Implementation notes

### API hooks (`app/api/invoices/index.ts` or new `app/api/expenses/`)
- `useGetLeaseExpenses(leaseId, query?)` — GET hook, paginated
- `useCreateLeaseExpense()` — mutation hook; on success invalidate the expenses query

### New component: `app/modules/properties/property/tenants/leases/lease/components/create-expense-dialog.tsx`
Form dialog with fields:
- `label` (text input, required) — e.g. "Parking Fee", "Cleaning Charge"
- `amount` (number input in cedis, required) — converted to pesewas (`* 100`) on submit
- `due_date` (date picker, optional)

Calls `useCreateLeaseExpense`, closes on success and invalidates the list.

### `LeaseDetailModule` (`app/modules/properties/property/tenants/leases/lease/index.tsx`)
Add an Expenses tab to the existing `Tabs` component:
- List expenses as rows/cards: label, formatted amount (`formatAmount`), invoice status badge, due date, link to invoice detail page
- "Add Expense" button (wrapped in `PropertyPermissionGuard roles={['MANAGER']}`) opens `CreateExpenseDialog`
- Empty state when no expenses exist

## Dark mode
All new UI must work in both light and dark mode. Use CSS variable classes (`bg-background`, `text-foreground`, `border`, etc.) — no hardcoded colors.

## Parent task
RENTL-43
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Expenses tab appears in the lease detail page
- [ ] #2 Expenses tab lists existing GENERAL_EXPENSE invoices for the lease with label, amount, status badge, due date, and a link to the invoice detail
- [ ] #3 Empty state is shown when no expenses exist
- [ ] #4 Add Expense button is only visible to users with MANAGER permission
- [ ] #5 Create expense dialog validates label and amount as required before submitting
- [ ] #6 Amount field accepts cedis and is converted to pesewas on submit
- [ ] #7 After successful creation the expense list refreshes and the dialog closes
- [ ] #8 All new UI renders correctly in both light and dark mode
<!-- AC:END -->
