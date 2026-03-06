---
id: RENTL-4
title: Add theming
status: Done
assignee:
  - Ben
created_date: '2026-03-04 18:12'
updated_date: '2026-03-06 20:50'
labels: []
milestone: m-3
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add dark/light theme toggle to the property manager portal.

The app already has complete dark mode infrastructure — CSS variables for both light and dark themes in `app.css`, a `.dark` class selector, `dark:` Tailwind variants throughout UI components, and `next-themes` installed as a dependency. The missing piece is wiring it together: a `ThemeProvider` wrapping the app and a toggle UI for users.

### Implementation Plan

#### 1. Wrap app with `next-themes` ThemeProvider

**File:** `apps/property-manager/app/root.tsx`

- Import `ThemeProvider` from `next-themes`
- Wrap the `<body>` contents inside `Layout` with `<ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>`
- `attribute="class"` matches the existing `.dark` CSS selector
- `enableSystem` respects `prefers-color-scheme`
- `disableTransitionOnChange` prevents flash of colors during switch
- Must go in `Layout` (not `App`) because it needs to be above `<Toaster>` which already calls `useTheme()`
- Add `suppressHydrationWarning` to `<html>` tag (required by `next-themes` for SSR)

#### 2. Add theme toggle to the user dropdown menu

**File:** `apps/property-manager/app/components/nav-user.tsx`

- Import `Moon`, `Sun` from `lucide-react` and `useTheme` from `next-themes`
- Add a `DropdownMenuItem` after the Notifications item (before the separator/logout) that toggles theme
- Show Sun icon + "Light" when in dark mode, Moon icon + "Dark" when in light mode
- `onClick` calls `setTheme(theme === 'dark' ? 'light' : 'dark')`

#### 3. Fix CSS body dark mode rule

**File:** `apps/property-manager/app/app.css`

- Remove the hardcoded `@media (prefers-color-scheme: dark)` block since `next-themes` will manage the `.dark` class on `<html>` instead of relying on media queries
- Keep the `@apply bg-white dark:bg-gray-950` which will work via the `.dark` class

### Files Modified

| File | Change |
|------|--------|
| `apps/property-manager/app/root.tsx` | Wrap `Layout` body with `ThemeProvider`, add `suppressHydrationWarning` to `<html>` |
| `apps/property-manager/app/components/nav-user.tsx` | Add theme toggle menu item |
| `apps/property-manager/app/app.css` | Remove `prefers-color-scheme` media query |
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 app should have a theme toggle which changes from light/dark mode
- [x] #2 theme persists across page refreshes (localStorage)
- [x] #3 toast notifications respect the current theme
- [x] #4 `yarn types:check` passes with no errors
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Wired up `next-themes` ThemeProvider to complete the dark/light mode implementation:\n\n- **root.tsx**: Added `ThemeProvider` (attribute=\"class\", defaultTheme=\"light\", enableSystem, disableTransitionOnChange) wrapping body contents; added `suppressHydrationWarning` to `<html>`\n- **nav-user.tsx**: Added theme toggle `DropdownMenuItem` after Notifications — shows Moon/Dark or Sun/Light depending on current theme, calls `setTheme()` on click\n- **app.css**: Removed `@media (prefers-color-scheme: dark)` block — `next-themes` manages the `.dark` class on `<html>` instead\n\nAll 4 acceptance criteria met; `yarn types:check` passes with no errors.
<!-- SECTION:FINAL_SUMMARY:END -->
