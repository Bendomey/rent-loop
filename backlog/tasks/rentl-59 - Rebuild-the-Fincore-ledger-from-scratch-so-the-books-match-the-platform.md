---
id: RENTL-59
title: Rebuild the Fincore ledger from scratch so the books match the platform
status: To Do
assignee: []
created_date: '2026-09-11 15:00'
updated_date: '2026-09-11 15:08'
labels:
  - backend
  - accounting
  - data
dependencies: []
references:
  - services/main/internal/services/accounting.go
  - services/main/internal/services/invoice.go
  - services/main/internal/clients/accounting/client.go
  - services/main/internal/config/config.go
documentation:
  - >-
    docs/superpowers/specs/2026-09-10-maintenance-financials-and-expenses-design.md
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The accounting ledger no longer reflects what the platform records. The database has been migrated several times, so entries were posted against shapes that have since changed, and at least one whole class of transaction never posted at all.

**What we know is wrong:**

- **No expense has ever reached the ledger.** Expenses debited a Maintenance Expense account that did not exist in Fincore, and the posting code only logged the failure instead of returning it. Checked at the time: of 200 journal entries, 131 referenced an invoice and **0** referenced an expense — while 46 expenses totalling ~GH₵ 73,359 existed in production. The account now exists (code 5002) and new expenses post correctly, but nothing historical was ever recorded.
- **Two stray accounts.** Three accounts are named "Account Payable" (codes 2001, 2002, 2003). Only 2001 is configured and used — 35 journal lines, 675,000 credit balance. **2002 and 2003 hold no journal lines at all**; they were created 1.3 seconds apart by a bootstrap with no idempotency check. Deleting them loses nothing, so this is tidy-up rather than consolidation.
- **Entries from earlier data shapes.** Repeated database migrations mean some entries reference records that have since been restructured, and there is no reconciliation anywhere that would have caught it.

The platform's own records — invoices, payments, charge instances, expenses — are the source of truth. The ledger should be derivable from them. This task is to make that true: tidy the chart of accounts, rebuild the entries from platform records, and leave behind a reconciliation that fails loudly if the two ever diverge again.

Sequencing note: this is bookkeeping history, not live behaviour. New transactions already post correctly, so this can be scheduled independently of feature work — but the longer it waits, the more history has to be rebuilt.

Value: financial reports that can be trusted, a real answer to "what do we owe vendors and what are we owed", and a check that stops the books drifting away from the platform silently.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The two unused duplicate Account Payable accounts (codes 2002 and 2003, both empty) are deleted, leaving 2001 as the only payable, and whatever created them is made idempotent so it cannot recur
- [ ] #2 Every account the code references is present in Fincore and configured in every environment, with a startup check that refuses to run against a missing or unset account rather than failing silently at posting time
- [ ] #3 Ledger entries are rebuilt from the platform's own invoices, payments, charges and expenses, so every posted entry traces back to a record that still exists
- [ ] #4 Historical expenses appear in the ledger, dated to when they were incurred rather than when the rebuild ran
- [ ] #5 Re-running the rebuild does not double-post: it is safe to run more than once
- [ ] #6 A reconciliation report compares platform totals against ledger balances per account and reports any difference
- [ ] #7 The reconciliation runs on a schedule and raises an alert when the two diverge, so this cannot silently recur
- [ ] #8 A dry-run mode reports what the rebuild would change without writing anything, and its output is reviewed before the live run
- [ ] #9 The rebuild is exercised against a restored production dump before it is run for real
- [ ] #10 No accounting posting path swallows an error: a failed journal entry fails the operation that caused it
<!-- AC:END -->
