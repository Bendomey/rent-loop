# Changelog

## 2026-06-06 — Initial index
- First scan of codebase (v0.1.1+4)
- Generated architecture.md, implementation.md, patterns.md, decisions.md
- Modules present: auth, home, payments, maintenance, more (announcements, profile, lease details, unit details, application details, unit condition reports, delete account)
- Notifiers: send_otp, verify_otp, create_maintenance_request, maintenance_requests (paginated), acknowledge_checklist, create_offline_payment, register_fcm_token
- Providers: leases, invoices, announcements, checklists, unit, paymentAccounts, maintenanceRequest, maintenanceBadge, tenantApplication
