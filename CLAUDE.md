# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rent-Loop is a property rental management platform consisting of a Go backend API, React Router v7 frontend applications, and a Flutter mobile app.

## Monorepo Structure

```
/apps
├── property-manager/    React Router v7 property manager portal (port 3000)
├── website/             Public marketing website
└── go/                  Flutter mobile app (Dart)

/services
└── main/                Go backend API (port 5003)
                         See services/main/CLAUDE.md for backend-specific guidance

/infrastructure          Terraform/Ansible configuration
```

## Common Commands

### Root Level
```bash
make run          # Run frontend + API simultaneously
make run-fe       # Frontend only
make run-api      # API only
```

### Frontend (apps/property-manager)
```bash
yarn dev          # Development server (port 3000)
yarn build        # Production build
yarn types:check  # TypeScript + React Router type generation
yarn lint         # ESLint check
yarn format       # Prettier formatting
```

### Backend (services/main)
See `services/main/CLAUDE.md` for complete backend commands including:
- `make run-dev` - Development with hot reload
- `make lint-fix` - Auto-fix formatting
- `make setup-db` / `make update-db` - Database migrations

## Frontend Architecture (apps/property-manager)

**Tech Stack:** React Router v7, React 19, TypeScript, TanStack Query v5, Tailwind CSS v4, Shadcn UI (Radix), Lexical editor

**Structure:**
```
app/
├── api/           API integration layer (one folder per resource)
├── routes/        File-based routing (React Router v7 convention)
│   ├── _auth.*/   Protected routes requiring authentication
│   └── _dashboard.*/ Dashboard layout routes
├── components/
│   ├── ui/        Shadcn/Radix UI primitives
│   └── blocks/    Business logic components
├── providers/     Context providers (Auth, React Query, Property)
├── hooks/         Custom React hooks
├── lib/           Utilities and helpers
└── types/         TypeScript definitions
```

**Key Patterns:**
- API calls use TanStack Query with typed endpoints in `app/api/`
- Authentication via JWT stored in AuthProvider context
- Form handling with React Hook Form + Zod validation
- File uploads via AWS S3 presigned URLs

## Backend Architecture

The Go backend follows a layered architecture: handlers → services → repository → models

Three API route groups under `/api`:
- Admin routes - Admin management
- Client User routes - Property manager endpoints
- Tenant Account routes - Tenant endpoints

Authentication: JWT Bearer tokens in Authorization header

For complete backend guidance, see `services/main/CLAUDE.md`.

## Environment Setup

**Backend:** Copy `services/main/.envrc.example` to `.envrc`, configure database and API keys, use direnv.

**Frontend:** API base URL configured via environment variables.

## API Documentation

Backend REST API Swagger docs (staging):
**https://rentloop-api-staging.fly.dev/swagger/index.html**

Use `WebFetch` on this URL to look up available endpoints, request/response
shapes, and required fields before writing any new API calls.

## Deployment

- **Platform:** Fly.io
- **CI/CD:** GitHub Actions (see `.github/workflows/`)
- Backend: `make deploy-staging` / `make deploy-production` from services/main

<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_workflow_overview()` tool to load the tool-oriented overview (it lists the matching guide tools).

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:
- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and finalization
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->
