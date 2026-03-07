---
id: RENTL-11
title: Add Zod validation to tenant application creation form
status: Draft
assignee: []
created_date: '2026-03-04 18:57'
labels:
  - frontend
  - property-manager
  - validation
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
routes/_auth.properties.$propertyId.tenants.applications.new.ts — The action handler manually extracts form data with formData.get() and type-casts without any Zod schema validation. Needs proper validation before sending to API.
<!-- SECTION:DESCRIPTION:END -->
