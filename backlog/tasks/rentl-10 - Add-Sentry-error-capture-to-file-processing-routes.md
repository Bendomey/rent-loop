---
id: RENTL-10
title: Add Sentry error capture to file processing routes
status: Draft
assignee: []
created_date: '2026-03-04 18:57'
updated_date: '2026-03-07 20:47'
labels:
  - frontend
  - property-manager
  - observability
milestone: m-3
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Four route files have TODO comments for adding Sentry error tracking: routes/api.r2.upload.ts, routes/_auth.api.files.pdf.to-lexical.ts, routes/_auth.api.files.pdf.to-thumbnail.ts, routes/_auth.api.files.docx.to-lexical.ts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 @sentry/node installed in apps/property-manager/package.json
- [ ] #2 app/lib/sentry.server.ts created with lazy init and captureException export
- [ ] #3 captureException called in api.r2.upload.ts catch block (TODO comment removed)
- [ ] #4 captureException called in _auth.api.files.pdf.to-lexical.ts catch block (TODO comment removed)
- [ ] #5 captureException called in _auth.api.files.pdf.to-thumbnail.ts catch block (TODO comment removed)
- [ ] #6 captureException called in _auth.api.files.docx.to-lexical.ts catch block (TODO comment removed)
- [ ] #7 SENTRY_DSN from existing env.server.ts used — no new env vars added
- [ ] #8 yarn types:check passes
- [ ] #9 yarn lint passes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
## Files to Modify/Create (6)

1. `apps/property-manager/package.json` — add `@sentry/node` dependency
2. `apps/property-manager/app/lib/sentry.server.ts` (CREATE) — initialize Sentry and export `captureException`
3. `apps/property-manager/app/routes/api.r2.upload.ts` — add captureException, remove TODO
4. `apps/property-manager/app/routes/_auth.api.files.pdf.to-lexical.ts` — add captureException, remove TODO
5. `apps/property-manager/app/routes/_auth.api.files.pdf.to-thumbnail.ts` — add captureException, remove TODO
6. `apps/property-manager/app/routes/_auth.api.files.docx.to-lexical.ts` — add captureException, remove TODO

---

## Change 1: Install Sentry Node SDK

```bash
yarn add @sentry/node
```

---

## Change 2: Create Sentry Server Utility

**New file:** `app/lib/sentry.server.ts`

```ts
import * as Sentry from '@sentry/node'
import { environmentVariables } from '~/lib/actions/env.server'

let initialized = false

function ensureInitialized() {
  if (initialized) return
  const env = environmentVariables()
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
  })
  initialized = true
}

export function captureException(error: unknown) {
  ensureInitialized()
  Sentry.captureException(error)
}
```

Lazy initialization — no changes to app entry points required. Uses the existing `SENTRY_DSN` from `env.server.ts`.

---

## Change 3: Update All 4 Route Catch Blocks

Add this import to each file:
```ts
import { captureException } from '~/lib/sentry.server'
```

Replace `// TODO: sentry capture can be added here for better error tracking` with `captureException(error)` in each catch block, keeping the existing `console.error` call below it.

### `api.r2.upload.ts`:
```ts
} catch (error) {
  captureException(error)
  console.error('Error uploading file to R2:', error)
  ...
}
```

### `_auth.api.files.pdf.to-lexical.ts`:
```ts
} catch (error) {
  captureException(error)
  console.error('Error importing PDF:', error)
  ...
}
```

### `_auth.api.files.pdf.to-thumbnail.ts`:
```ts
} catch (error) {
  captureException(error)
  console.error('Error generating thumbnail:', error)
  ...
}
```

### `_auth.api.files.docx.to-lexical.ts`:
```ts
} catch (error) {
  captureException(error)
  console.error('Error importing DOCX:', error)
  ...
}
```

---

## Key Notes

- `SENTRY_DSN` already declared in `app/lib/actions/env.server.ts` with `default('fake_dsn_for_dev')` — no new env vars needed
- In dev, the fake DSN causes Sentry to warn and no-op silently
- `@sentry/node` ships its own TypeScript types — no `@types/` package needed
- Server-side only: `@sentry/node` is correct (not `@sentry/react-router` which adds client-side overhead)
<!-- SECTION:PLAN:END -->
