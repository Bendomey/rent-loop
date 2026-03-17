---
id: RENTL-41
title: Refactor IDs filter into lib.FilterQuery
status: Done
assignee: []
created_date: '2026-03-17 11:59'
labels: []
dependencies: []
---

Refactored Query filter IDs field to use centralized lib.FilterQuery across all handlers. Removed redundant explicit `IDs` fields from 6 handler filter structs (tenant-application.go, unit.go, signing.go, property.go, document.go, admin.go) since they already embed lib.FilterQueryInput which contains the IDs field. For signing.go, document.go, and admin.go handlers, updated the code to use filterQuery.IDs instead of the removed filters.IDs. Verified all changes work correctly by testing each list endpoint with the ids query parameter - all tested endpoints return 200 OK and properly filter results by the provided IDs.


