---
id: RENTL-42
title: Invoice & Payments — Tenant-scoped endpoints + mobile UI
status: Done
assignee: []
created_date: '2026-03-22 16:24'
updated_date: '2026-03-22 16:43'
labels:
  - backend
  - flutter
  - payments
  - invoices
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Full invoice and payments feature for the mobile app.

Backend:
- Add ContextLeaseID + ContextTenantApplicationID repo filter scopes
- Add TenantListInvoices, TenantGetInvoice, TenantListPaymentAccounts handler methods to InvoiceHandler
- Register 3 new tenant routes: GET /v1/leases/{lease_id}/invoices, GET /v1/leases/{lease_id}/invoices/{invoice_id}, GET /v1/leases/{lease_id}/payment-accounts

Flutter:
- Update InvoiceModel with context IDs, payments, allowed_payment_rails
- Add PaymentModel, PaymentAccountModel
- Update InvoiceApi + invoicesProvider (lease-scoped)
- Add invoiceDetailProvider, leasePaymentAccountsProvider
- Add CreateOfflinePaymentNotifier
- Replace hardcoded UpcomingPaymentCard with real data
- Overhaul PaymentsScreen (tappable cards, due date banners, context badges)
- New InvoiceDetailScreen with line items, payments, pay button
- New OfflinePaymentSheet (fetches payment accounts, submits offline payment)
- Add /payments/:invoiceId route
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 GET /v1/leases/{lease_id}/invoices returns invoices sorted by due_date asc (tenant-scoped)
- [x] #2 GET /v1/leases/{lease_id}/invoices/{id} returns invoice with line_items + payments populated
- [x] #3 GET /v1/leases/{lease_id}/payment-accounts returns active PM payment accounts
- [x] #4 Home screen upcoming card shows real oldest-due invoice with severity banner
- [x] #5 Payments tab lists invoices for active lease with due date banners + context badges
- [x] #6 Tapping an invoice opens detail screen with line items, payments list
- [x] #7 Offline payment sheet loads available accounts and submits successfully
- [x] #8 Switching leases refreshes invoice data
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
## Implemented

### Go Backend
- **`internal/repository/invoice.go`**: Added `ContextLeaseID` and `ContextTenantApplicationID` fields to `ListInvoicesFilter` + compound OR scope `invoiceLeaseContextScope` wired into both `List()` and `Count()`
- **`internal/handlers/invoice.go`**: Added `tenantAccountService` field; added 3 new tenant handler methods:
  - `TenantListInvoices` — lists invoices for a lease (LEASE_RENT + optional TENANT_APPLICATION), sorted by due_date asc, preloads LineItems
  - `TenantGetInvoice` — fetches single invoice with LineItems + Payments, ownership-checked
  - `TenantListPaymentAccounts` — walks Lease→Unit→Property→Client to return active PROPERTY_OWNER payment accounts
- **`internal/router/tenant.go`**: Registered 3 new routes under the protected tenant group

### Flutter
- **Models**: Updated `InvoiceModel` (context IDs, payments, allowed_payment_rails, helper getters `isOutstanding`, `dueDateParsed`, `daysUntilDue`); new `PaymentModel`; new `PaymentAccountModel` (with `displayLabel` helper)
- **API**: `InvoiceApi` replaced with lease-scoped methods: `getLeaseInvoices`, `getInvoice`, `getLeasePaymentAccounts`
- **Providers**: `invoicesProvider` now watches `currentLeaseNotifierProvider` and passes lease application ID for OR filtering; new `invoiceDetailProvider(leaseId, invoiceId)`; new `leasePaymentAccountsProvider(leaseId)`
- **Notifier**: `CreateOfflinePaymentNotifier` — posts to `POST /api/v1/payments/offline:initiate`
- **Home screen**: `UpcomingPaymentCard` rewritten — watches real invoices, shows oldest outstanding invoice with severity-colored due date banner, "All caught up" empty state, shimmer skeleton
- **Payments tab**: `PaymentsScreen` overhauled — tappable invoice cards navigating to detail, due date banners (overdue/due-soon/due-this-week), context badges (tappable for lease/application), pull-to-refresh
- **Invoice detail**: New `InvoiceDetailScreen` — header card, due date banner, context section (tappable navigation to lease/application), line items table, payments list, sticky Pay Now button for outstanding invoices
- **Offline payment sheet**: New `OfflinePaymentSheet` — fetches PM payment accounts, OFFLINE-filtered dropdown, amount pre-fill, reference field, submits and refreshes detail + list on success
- **Navigation**: Added `/payments/:invoiceId` route; exported `InvoiceDetailScreen` from modules.dart
<!-- SECTION:FINAL_SUMMARY:END -->
