---
id: RENTL-8
title: Fix autocomplete address component
status: Draft
assignee: []
created_date: '2026-03-05 09:05'
updated_date: '2026-03-07 15:17'
labels:
  - frontend
  - property-manager
  - ui
  - bugfix
milestone: m-3
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fix the autocomplete address component — currently has issues with address selection and/or suggestion behavior.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Typing a partial address shows Google suggestions in the dropdown
- [ ] #2 Selecting a suggestion closes the dropdown and populates city/region/country/lat/lng fields
- [ ] #3 Typing again after a selection re-opens the dropdown with fresh suggestions
- [ ] #4 Clearing the input does not show stale suggestions
- [ ] #5 Dropdown background renders correctly in dark mode (not white-on-dark)
- [ ] #6 yarn types:check passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Bugs & Fixes

### Bug 1 — `enabled` condition is inverted (core bug)
In `app/components/address-input.tsx` line 62-63:
```ts
enabled: sessionToken !== null && watch('addressSearch') !== debouncedSearch,
```
`!== debouncedSearch` is true WHILE typing (debounce hasn't settled) and false AFTER debounce fires. This is backwards — the query gets disabled right when it should fire.

Fix: `enabled: isLoaded && sessionToken !== null && debouncedSearch.length > 0 && showDropdown`

### Bug 2 — Dropdown doesn't close after selection
After selecting, `addressSearch` is set to the selected text. The debounced value lags behind, so `enabled` flips back to true and the query re-fires, re-opening the dropdown.

Fix: Add `showDropdown` state (true on user typing, false after selection). Gate `isOpened` and `enabled` on `showDropdown`.

### Bug 3 — Session token not reset after selection
Google Places requires a fresh session token for each new search. `resetSessionToken()` must be called after `place.fetchFields()` completes.

### Bug 4 — Dark mode: `bg-white` without dark counterpart
`<Command className="... bg-white">` → change to `bg-background`.

## Implementation
Single file: `apps/property-manager/app/components/address-input.tsx`
- Add `showDropdown` boolean state
- Fix `enabled` condition
- Gate `isOpened` on `showDropdown`
- Call `resetSessionToken()` after place selection
- Change `bg-white` → `bg-background`
<!-- SECTION:PLAN:END -->
