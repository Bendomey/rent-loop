---
id: DRAFT-9
title: Replace editor mentions dummy data with real lookup
status: Draft
assignee: []
created_date: '2026-03-04 18:56'
labels:
  - frontend
  - property-manager
  - mock-data
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
app/components/editor/plugins/mentions-plugin.tsx uses 400+ hardcoded Star Wars character names as mention lookup (dummyMentionsData, dummyLookupService). Needs to be connected to real user/tenant service.
<!-- SECTION:DESCRIPTION:END -->
