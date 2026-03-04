---
id: DRAFT-15
title: Fix link insertion UI in editor
status: Draft
assignee: []
created_date: '2026-03-04 18:57'
labels:
  - frontend
  - property-manager
  - editor
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
components/editor/utils/url.ts:27 — TODO: Fix UI for link insertion; it should never default to an invalid URL such as https://. Should show a dialog where the user can type the URL before inserting it.
<!-- SECTION:DESCRIPTION:END -->
