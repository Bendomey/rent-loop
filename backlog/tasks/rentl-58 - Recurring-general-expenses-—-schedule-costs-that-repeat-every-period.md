---
id: RENTL-58
title: Recurring general expenses — schedule costs that repeat every period
status: To Do
assignee: []
created_date: '2026-09-10 13:14'
labels:
  - backend
  - frontend
  - expenses
dependencies: []
references:
  - services/main/internal/models/charge-definition.go
  - services/main/internal/models/expense.go
  - services/main/internal/services/expense.go
  - services/main/internal/services/financials/materialise.go
documentation:
  - >-
    docs/superpowers/specs/2026-09-10-maintenance-financials-and-expenses-design.md
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
General (non-maintenance) expenses are entered one at a time. Many of the costs a landlord actually carries repeat on a fixed cadence — monthly landscaping, quarterly generator servicing, annual insurance, a monthly security contract. Today each occurrence has to be typed in by hand, which means they get entered late, entered inconsistently, or forgotten, and the "owed to vendors" figure on the expense page understates reality until someone remembers.

The tenant side of the platform already solves the equivalent problem: `ChargeDefinition` is a template and `ChargeInstance` is one materialised occurrence, with a cron generating instances ahead of their due date. This task gives general expenses the same treatment.

Scope is general expenses only. Maintenance expenses arise from a specific request and do not repeat by nature.

Value: recurring property costs land in the books on time without manual entry, and the payables figure reflects what is genuinely owed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A property manager can define a recurring general expense with an amount, category, vendor, cadence and start date, and an optional end date
- [ ] #2 Occurrences are generated automatically ahead of their due date without manual intervention
- [ ] #3 Each generated occurrence behaves exactly like a manually created general expense, including its invoice and its effect on the ledger
- [ ] #4 A property manager can see the schedule and its upcoming occurrences before they are generated
- [ ] #5 Changing the amount on a schedule affects only occurrences not yet generated; already-generated ones keep the amount they were created with
- [ ] #6 Ending or pausing a schedule stops future generation and leaves already-generated occurrences untouched
- [ ] #7 An occurrence that has already been paid cannot be removed by editing or ending its schedule
- [ ] #8 No duplicate occurrence is generated if the scheduled job runs more than once for the same period
- [ ] #9 Swagger annotations are updated for every changed or added handler
- [ ] #10 Unit tests cover cadence arithmetic, the amount-change boundary, and the duplicate-generation guard
- [ ] #11 An end-to-end scenario covers defining a schedule, generating occurrences across several periods, and paying one
<!-- AC:END -->
