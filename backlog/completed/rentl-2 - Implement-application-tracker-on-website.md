---
id: RENTL-2
title: Implement application tracker on website
status: Done
assignee:
  - Ben
created_date: '2026-03-04 18:19'
updated_date: '2026-03-09 10:25'
labels:
  - website
milestone: m-0
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement a fully functional application tracker on the public website at `/tenant-applications/{code}`.

**Auth mechanism:** Encrypted `httpOnly` cookies (AES-256-CBC). Cookie name: `rl_tracking_{code}`. All sensitive operations (OTP send/verify, phone lookup) happen in server-side route actions — phone number is never exposed to the client.

**Payment:** New public endpoint to initiate an offline payment (PENDING status). Admin separately verifies via a new admin endpoint.

The skeleton UI at `/tenant-applications/$code` already exists with mock data — this task wires it to real APIs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Visiting /tenant-applications/{code} without a cookie shows OTP verification UI
- [ ] #2 Clicking 'Send Verification Code' sends an SMS to the application's phone number (server-side, phone never exposed to client)
- [ ] #3 Entering the correct OTP sets an encrypted httpOnly cookie and shows the full application dashboard
- [ ] #4 Refreshing the page while cookie is valid keeps the dashboard visible without re-verifying
- [ ] #5 Tampered or expired cookie falls back to the OTP screen
- [ ] #6 Application dashboard shows: status, unit details, financial summary, lease document card with signing link, payment invoice
- [ ] #7 Invoice with ISSUED or PARTIALLY_PAID status shows a Pay Now form (amount, provider, reference)
- [ ] #8 Submitting the Pay Now form creates a PENDING payment and shows a confirmation message
- [ ] #9 Admin can verify a payment via PATCH /api/v1/admin/payments/{payment_id}/verify
- [ ] #10 GET /api/v1/tenant-applications/code/{code} is a public endpoint that returns application data
- [ ] #11 POST /api/v1/tenant-applications/code/{code}/invoice/{invoice_id}/pay is a public endpoint that initiates offline payment
- [ ] #12 yarn types:check passes in apps/website
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
# Implementation Plan

## Architecture

```
User visits /tenant-applications/{code}
  → Loader checks httpOnly cookie
  → Cookie valid: fetch app server-side → show dashboard
  → No cookie: show OTP verification UI

OTP Flow (all server-side via route actions):
  1. sendOtp action: fetch application by code → get phone → call /auth/codes
  2. verifyOtp action: call /auth/codes/verify → set encrypted cookie → return app data

Payment Flow:
  → Tenant submits Pay form → route action → new public initiate endpoint → returns paymentId
  → Admin verifies via new PATCH /admin/payments/{id}/verify endpoint
```

## Backend Changes

### 1. `services/main/internal/repository/tenant-application.go`
- Add `Code string` field to `GetTenantApplicationQuery`
- Update `GetOneWithQuery()` to `WHERE code = ?` when `Code` is set

### 2. `services/main/internal/handlers/tenant-application.go`
- **New `GetTenantApplicationByCode`** (public, no auth):
  - `GET /api/v1/tenant-applications/code/{code}`
  - Calls `GetOneWithQuery` with `Code: code`
  - Returns `OutputTenantApplication` with `DesiredUnit`, `ApplicationPaymentInvoice`, `LeaseAgreementDocumentSignatures` populated

- **New `InitiatePayment`** (public, no auth):
  - `POST /api/v1/tenant-applications/code/{code}/invoice/{invoice_id}/pay`
  - Body: `{ payment_account_id, amount, provider, reference?, metadata? }`
  - Fetches application by code → validates invoice belongs to it
  - Calls `CreateOfflinePayment` (does NOT auto-verify)
  - Returns `201 { data: { payment_id } }`

### 3. `services/main/internal/handlers/payment.go` (NEW FILE)
- **New `VerifyPayment`** (admin JWT required):
  - `PATCH /api/v1/admin/payments/{payment_id}/verify`
  - Body: `{ is_successful: bool, metadata? }`
  - Calls `VerifyOfflinePayment(paymentId, verifiedById, isSuccessful, metadata)`
  - Returns `204 No Content`

### 4. `services/main/internal/router/client-user.go`
- Public routes: `GET /v1/tenant-applications/code/{code}`, `POST /v1/tenant-applications/code/{code}/invoice/{invoice_id}/pay`
- Admin route: `PATCH /v1/admin/payments/{payment_id}/verify`

## Frontend Changes (apps/website)

### 5. `app/lib/actions/env.server.ts`
- Add `TRACKING_COOKIE_SECRET: z.string().min(32)` to env schema

### 6. `app/lib/tracking-session.server.ts` (NEW)
- AES-256-CBC encrypt/decrypt using Node built-in `crypto`
- `createTrackingCookie(code, phone, secret)` → Set-Cookie header value
- `getTrackedPhone(request, code, secret)` → decrypted phone or null
- Cookie flags: `HttpOnly`, `Secure` (prod), `SameSite=Lax`, `Max-Age=86400`

### 7. `app/api/tracking/server.ts` (NEW)
Server-side functions (called from loaders/actions, never client-exposed):
- `getApplicationByCode(apiAddress, code, populate?)` → TrackingApplication
- `sendOtpForApplication(apiAddress, phone)` → void
- `verifyOtpForApplication(apiAddress, phone, otpCode)` → void
- `initiateApplicationPayment(apiAddress, code, invoiceId, body)` → `{ payment_id }`

### 8. `app/routes/tenant-applications.$code.tsx` (REWRITE)
- **Loader**: check cookie → if valid, fetch + return `{ verified: true, application }`, else `{ verified: false, application: null }`
- **Actions** (intent-based via formData):
  - `sendOtp`: fetch app by code → call `/auth/codes` → return `{ maskedPhone }`
  - `verifyOtp`: fetch app → call `/auth/codes/verify` → set cookie header → return `{ application }`
  - `pay`: call `initiateApplicationPayment` → return `{ paymentId }`

### 9. `app/modules/tenants/track/index.tsx` (REWRITE)
- Remove `useEffect`/`sessionStorage`/`useState`
- Read from `useLoaderData<typeof loader>()`
- `verified && application` → `<TrackingDashboard>`, else `<VerifyOtp>`

### 10. `app/modules/tenants/track/components/verify-otp.tsx` (UPDATE)
- Replace `useSendTrackingOtp`/`useVerifyTrackingOtp` with `useFetcher`
- Submit `intent: 'sendOtp'` / `intent: 'verifyOtp'` to route action
- Remove `onVerified` prop — cookie + loader revalidation handles re-render

### 11. `app/api/tracking/index.ts` (REWRITE)
- Remove mock data
- Export `useFetcher`-based hooks: `useSendTrackingOtp`, `useVerifyTrackingOtp`, `useInitiatePayment`

### 12. `app/modules/tenants/track/components/payment-info.tsx` (UPDATE)
- Add "Pay Now" button for `ISSUED`/`PARTIALLY_PAID` invoices
- Inline payment form: amount (pre-filled), provider (MTN/VODAFONE/AIRTELTIGO/CASH), reference (optional)
- On success: "Payment submitted. Your landlord will verify shortly."

### 13. `apps/website/types/tenant-application.d.ts` (UPDATE)
- Add `id: string` to `TrackingInvoice` interface (needed for pay endpoint)
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the full application tracker on the public website with OTP verification and payment form.

**Backend:**
- Added `Code` field to `GetTenantApplicationQuery` for code-based lookups
- Added `application_payment_invoice` to public `DBTenantApplicationToRest` output
- New public endpoints: `GET /v1/tenant-applications/code/{code}`, `POST otp:send`, `POST otp:verify`, `POST invoice/{id}/pay`
- New admin endpoint: `PATCH /v1/admin/payments/{payment_id}/verify`
- Payment auto-discovers the property's default OFFLINE payment account

**Website:**
- httpOnly cookie session (`rl_tracking_{code}`) via `createCookieSessionStorage`
- Route rewritten with server-side loader + actions (sendOtp, verifyOtp, payInvoice)
- `VerifyOtp` component now uses `useFetcher` with intent-based form submissions
- `PaymentInfo` component adds "Pay Now" form (provider selector + reference field) for ISSUED/PARTIALLY_PAID invoices
- `TrackingInvoice` type updated with `id` field
<!-- SECTION:FINAL_SUMMARY:END -->
