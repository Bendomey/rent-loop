---
id: RENTL-50
title: Terminating a lease does not stop its rent billing
status: To Do
assignee: []
created_date: '2026-08-17 20:57'
labels:
  - backend
  - financials
  - bug
dependencies: []
references:
  - services/main/internal/services/lease-termination.go
  - services/main/internal/repository/financial-account.go
  - services/main/internal/services/financials/issuance.go
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In the pre-financial-account model, `LeaseTerminationService.Complete` stopped billing by setting `lease.NextBillingDate = nil`, because the old cron selected leases on `status = Active AND next_billing_date IS NOT NULL AND next_billing_date <= now()`.

The new issuance sweep does not look at leases at all. `IssueDueInvoices` iterates `FinancialAccountRepository.ListActiveForBilling`, which filters only on `financial_accounts.status = 'ACTIVE'` and `rent_billing_cadence != 'MANUAL'` (internal/repository/financial-account.go). Lease status is never consulted.

`internal/services/lease-termination.go` contains no reference to financial accounts or charges, so terminating a lease leaves its account ACTIVE with unsettled rent charges. The daily sweep will keep issuing rent invoices to a tenant whose lease has ended.

The `NextBillingDate` assignment was removed as part of the `next_billing_date` fix (the column is dropped by job 3 `DropLegacyFinancialColumns`, so the write was failing anyway). Removing it did not cause this gap — nothing had replaced the old mechanism.

Decide the correct semantics: close the account, void remaining unbilled rent charges, or prorate to the termination date. Note that a security deposit may still need to settle or refund after termination, so blanket-closing the account may be wrong.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Terminating a lease stops future rent charges from being swept into new invoices
- [ ] #2 Charges already invoiced before termination are unaffected
- [ ] #3 Any security-deposit obligation still resolves correctly after termination
- [ ] #4 An e2e scenario in services/main/scripts/e2e/cases/ covers terminate-then-sweep and asserts no new rent invoice is issued
<!-- AC:END -->
