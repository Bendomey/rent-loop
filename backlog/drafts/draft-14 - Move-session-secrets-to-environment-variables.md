---
id: DRAFT-14
title: Move session secrets to environment variables
status: Draft
assignee: []
created_date: '2026-03-04 18:57'
labels:
  - frontend
  - property-manager
  - security
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
lib/actions/auth.session.server.ts:33 — Session storage secrets are hardcoded as ['s3cret1']. Should be moved to environment variables for security.
<!-- SECTION:DESCRIPTION:END -->
