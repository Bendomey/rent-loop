---
id: RENTL-9
title: Re-enable property filters when API supports it
status: Done
assignee: []
created_date: '2026-03-04 18:56'
updated_date: '2026-03-08 16:01'
labels:
  - frontend
  - property-manager
  - filters
milestone: m-4
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
modules/properties/controller.tsx:9 — ~48 lines of property filter system commented out, waiting for API to support filtering. Re-enable once backend has filtering endpoints. also add search fubnctionality
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Status filter (Active/Inactive/Maintenance) is visible and filters the property list correctly
- [ ] #2 Type filter (Single/Multi) is visible and filters correctly
- [ ] #3 Search bar is visible and filters by property name and address
- [ ] #4 Combining status + search filters both apply simultaneously
- [ ] #5 Search generates valid SQL (no client_user_properties.Property.name invalid reference)
- [ ] #6 Dark mode renders correctly
- [ ] #7 yarn types:check passes
- [ ] #8 Go backend make lint passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Root Causes
1. **Broken search**: `SearchScope("client_user_properties", search)` generates invalid SQL (`client_user_properties.Property.name ILIKE ?`). Needs a JOIN on the properties table.
2. **Missing backend filters**: `ListClientUserPropertiesFilter` has no `PropertyStatus` or `PropertyType` fields, and the handler doesn't parse them.
3. **Frontend UI commented out**: FilterSet + SearchInput render blocks are commented out in controller.tsx. Both components (`app/components/filter-set.tsx`, `app/components/search.tsx`) already exist — just need to be re-enabled.

---

## Backend Changes

### `services/main/internal/repository/client-user-property.go`

Add to `ListClientUserPropertiesFilter`:
```go
PropertyStatus *string
PropertyType   *string
```

Add new scope functions:
```go
func joinPropertiesScope() func(db *gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        return db.Joins("JOIN properties ON properties.id = client_user_properties.property_id AND properties.deleted_at IS NULL")
    }
}

func propertySearchScope(search *lib.Search) func(db *gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        if search == nil || search.Query == "" { return db }
        q := fmt.Sprintf("%%%s%%", search.Query)
        return db.Where("properties.name ILIKE ? OR properties.address ILIKE ?", q, q)
    }
}

func propertyStatusScope(status *string) func(db *gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        if status == nil { return db }
        return db.Where("properties.status = ?", *status)
    }
}

func propertyTypeScope(propertyType *string) func(db *gorm.DB) *gorm.DB {
    return func(db *gorm.DB) *gorm.DB {
        if propertyType == nil { return db }
        return db.Where("properties.type = ?", *propertyType)
    }
}
```

Update `List()` and `Count()` scopes (replace existing `SearchScope` call):
```go
joinPropertiesScope(),
IDsFilterScope("client_user_properties", filterQuery.IDs),
DateRangeScope("client_user_properties", filterQuery.DateRange),
propertySearchScope(filterQuery.Search),   // replaces broken SearchScope
clientUserIDScope(filterQuery.ClientUserID),
propertyIDScope(filterQuery.PropertyID),
roleScope(filterQuery.Role),
propertyStatusScope(filterQuery.PropertyStatus),
propertyTypeScope(filterQuery.PropertyType),
// PaginationScope + OrderScope only in List()
```

### `services/main/internal/handlers/client-user-property.go`

Add to `ListMyPropertiesFilterRequest`:
```go
PropertyStatus string `json:"property_status" validate:"omitempty,oneof=Property.Status.Active Property.Status.Inactive Property.Status.Maintenance"`
PropertyType   string `json:"property_type"   validate:"omitempty,oneof=SINGLE MULTI"`
```

Update `ListClientUserProperties()` input:
```go
input := repository.ListClientUserPropertiesFilter{
    ...existing fields...
    PropertyStatus: lib.NullOrString(r.URL.Query().Get("property_status")),
    PropertyType:   lib.NullOrString(r.URL.Query().Get("property_type")),
}
```

---

## Frontend Changes

### `apps/property-manager/types/client-user-property.d.ts`
Add to `FetchClientUserPropertyFilter`:
```ts
property_status?: string
property_type?: string
```
Use `property_status` / `property_type` as field names (not `status`/`type`) so they map directly to the API query params without any mapping layer.

### `apps/property-manager/app/modules/properties/index.tsx`
```ts
const property_status = searchParams.get('property_status') ?? undefined
const property_type = searchParams.get('property_type') ?? undefined

useGetMyProperties({
  filters: { property_status, property_type },
  ...
})
```

### `apps/property-manager/app/modules/properties/controller.tsx`
- Add back `ToggleLeft` to the lucide-react import
- Uncomment `FilterSet` and `SearchInput` imports
- Update filter definitions to use `urlParam: 'property_status'` and `urlParam: 'property_type'`
- Uncomment the FilterSet render block
- Uncomment the SearchInput render block

---

## Filter URL Params

| Filter | urlParam | API param |
|---|---|---|
| Status | `property_status` | `property_status` |
| Type | `property_type` | `property_type` |
| Search | `query` | `search[query]` + `search[fields]` |
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Re-enabled property filters and search on the My Properties page.

Backend changes:
- `repository/client-user-property.go`: Added `PropertyStatus` and `PropertyType` to `ListClientUserPropertiesFilter`; added `joinPropertiesScope()` (JOIN properties table), `propertySearchScope()` (searches properties.name/address via ILIKE), `propertyStatusFilterScope()`, `propertyTypeFilterScope()`; replaced broken `SearchScope` with new JOIN-based search in both `List()` and `Count()`
- `handlers/client-user-property.go`: Parse `property_status` and `property_type` query params in `ListClientUserProperties`

Frontend changes:
- `types/client-user-property.d.ts`: Added `property_status?` and `property_type?` to `FetchClientUserPropertyFilter`
- `modules/properties/index.tsx`: Read `property_status`/`property_type` from search params, pass as filters
- `modules/properties/controller.tsx`: Uncommented `FilterSet` and `SearchInput`, fixed urlParams (`status`→`property_status`, `type`→`property_type`), added `ToggleLeft` import
<!-- SECTION:FINAL_SUMMARY:END -->
