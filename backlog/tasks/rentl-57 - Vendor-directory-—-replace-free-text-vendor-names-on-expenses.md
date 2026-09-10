---
id: RENTL-57
title: Vendor directory — replace free-text vendor names on expenses
status: To Do
assignee: []
created_date: '2026-09-10 13:13'
labels:
  - backend
  - frontend
  - expenses
dependencies: []
references:
  - services/main/internal/models/expense.go
  - services/main/internal/models/invoice.go
  - services/main/internal/services/expense.go
  - apps/property-manager/app/modules/properties/property/expenses
documentation:
  - >-
    docs/superpowers/specs/2026-09-10-maintenance-financials-and-expenses-design.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Expenses currently identify the vendor being paid with free-text `vendor_name` and `vendor_contact` fields, and the invoice raised against an expense uses `payee_type: EXTERNAL` with no payee identity at all. This was a deliberate deferral when maintenance financials and expense management were redesigned (see the design doc in Documentation) — free text was chosen so that a vendor directory could arrive later as an additive change rather than a redesign.

The cost of the deferral is that a landlord cannot answer "how much have I spent with this vendor across my properties", cannot reuse a vendor's contact details, and gets no protection against the same vendor being spelled three different ways across three expenses.

This task introduces vendors as first-class records that expenses and their invoices point at, and migrates the existing free-text names onto them.

Value: vendor spend reporting, reusable vendor details at expense-entry time, and an invoice that names who is actually being paid.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A property manager can create, view, edit and deactivate vendors within their client, capturing at minimum name, contact details and a category
- [ ] #2 A vendor cannot be hard-deleted while any expense references it
- [ ] #3 When recording an expense, a property manager selects an existing vendor or creates one inline, instead of typing a free-text name
- [ ] #4 An expense's invoice identifies the vendor it is payable to, rather than an anonymous external payee
- [ ] #5 Existing expenses with free-text vendor names are migrated onto vendor records, with identical names collapsing to a single vendor and legacy expenses that have no vendor name left unassigned rather than given a placeholder
- [ ] #6 Expenses migrated to an unassigned vendor are surfaced to the property manager so they can be corrected
- [ ] #7 A property manager can see total spend and outstanding amount per vendor
- [ ] #8 Vendors are scoped to the client and visible across all of that client's properties
- [ ] #9 Swagger annotations are updated for every changed or added handler
- [ ] #10 Unit tests cover vendor creation, the reference guard on delete, and the name-collapsing migration
- [ ] #11 An end-to-end scenario covers creating a vendor, recording an expense against it, and paying that expense
<!-- AC:END -->
