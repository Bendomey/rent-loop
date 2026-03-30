---
id: RENTL-43
title: Arbitrary expenses under a lease
status: Done
assignee: []
created_date: '2026-03-25 14:27'
updated_date: '2026-03-30 23:11'
labels: []
milestone: m-4
dependencies: []
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Property managers need to be able to create one-off charges against a tenant's lease — e.g. parking fees, cleaning charges, damage fees — and have those charges issued as invoices the tenant can see and pay.

## Context

The `Invoice` model already supports `ContextType: GENERAL_EXPENSE` and `ContextLeaseID`, and `ListInvoicesFilter` already has `ContextLeaseID` with the corresponding `invoiceLeaseContextScope` applied. No DB migration is needed — this is primarily wiring + UI.

## Scope not included (follow-up)
- Email/SMS notification to tenant when an expense is created
- Fincore journal entry for `GENERAL_EXPENSE` context type (currently `buildJournalEntryForInvoice` only handles `LEASE_RENT`, `TENANT_APPLICATION`, `SAAS_FEE`)
<!-- SECTION:DESCRIPTION:END -->
