---
id: RENTL-21
title: Add Google Analytics to website and property-manager apps
status: Done
assignee: []
created_date: '2026-03-10 09:49'
updated_date: '2026-03-10 11:32'
labels: []
dependencies: []
priority: medium
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Inject GA4 (gtag.js) into both React Router v7 apps. Track page views on every route change. GA Measurement ID loaded from env var so it can differ per environment (dev can be empty to disable tracking).

Infra prerequisites (must be done before deploying):
- Create GA4 property/properties and obtain Measurement ID(s) (G-XXXXXXXXXX)
- Set GOOGLE_ANALYTICS_ID via fly secrets set on both Fly.io apps

Both apps follow identical patterns (React Router v7 + Vite, env via Zod schema, inline scripts like existing Tawk widget in root.tsx).
<!-- SECTION:DESCRIPTION:END -->
