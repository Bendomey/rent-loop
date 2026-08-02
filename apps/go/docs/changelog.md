# Changelog

## 2026-06-06 — Initial index
- First scan of codebase (v0.1.1+4)
- Generated architecture.md, implementation.md, patterns.md, decisions.md
- Modules present: auth, home, payments, maintenance, more (announcements, profile, lease details, unit details, application details, unit condition reports, delete account)
- Notifiers: send_otp, verify_otp, create_maintenance_request, maintenance_requests (paginated), acknowledge_checklist, create_offline_payment, register_fcm_token
- Providers: leases, invoices, announcements, checklists, unit, paymentAccounts, maintenanceRequest, maintenanceBadge, tenantApplication

## 2026-08-01 — Maintenance requests: removed dead unit fields
- API change (RENTL-48): a maintenance request now targets many assets (units and/or blocks), so it no longer carries a single `unit_id`/`unit`.
- Removed `MaintenanceUnitModel`, and `unitId` / `unit` from `MaintenanceRequestModel`. Both fields were already unused — no maintenance screen in this app displayed the unit — and both were nullable, so the app kept working regardless. This is dead-code removal, not a fix.
- No `assets` field was added: tenant-visible requests are always single-unit by design, and nothing here renders assets. Add it only when a screen needs it.
- The maintenance API populate strings were unaffected (`ActivityLogs`, `Expenses`, `Expenses.Invoices` — this app never requested `Unit`).
