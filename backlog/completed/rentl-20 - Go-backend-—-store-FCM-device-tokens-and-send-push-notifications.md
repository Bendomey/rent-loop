---
id: RENTL-20
title: Go backend — store FCM device tokens and send push notifications
status: Done
assignee: []
created_date: '2026-03-09 20:39'
updated_date: '2026-03-09 21:52'
labels: []
dependencies: []
priority: medium
ordinal: 1500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add backend support for FCM push notifications: store multiple device tokens per tenant and expose a utility to send notifications via FCM HTTP v1 API. Depends on RENTL-18 (FCM service account JSON).

1. DB migration: create fcm_tokens table (id, tenant_id, token, platform "ios"|"android", created_at, updated_at) with unique index on (tenant_id, token)
2. New endpoint: POST /api/v1/tenant-accounts/fcm-token — accepts { token: string, platform: "ios"|"android" }, auth required. Upserts the token (insert if new, update updated_at if exists) so multi-device works naturally
3. FCM sender utility (internal): use firebase-admin-go SDK (or raw HTTP v1 API) with service account credentials loaded from env var
4. Notification helper: sendToTenant(tenantID, title, body, data) — fetches ALL tokens for tenant, fans out to each. On FCM error response indicating invalid/unregistered token, delete that token from DB
5. Wire up first notification trigger: payment reminder or payment received event

Token hygiene:
- Delete tokens that FCM reports as invalid (unregistered, not found)
- Upsert on registration prevents duplicates across reinstalls

Config:
- FIREBASE_SERVICE_ACCOUNT_JSON env var (base64 or file path)
- Add to services/main/.envrc.example

References:
- services/main/CLAUDE.md for backend patterns
- services/main handler/service/repository layers
<!-- SECTION:DESCRIPTION:END -->
