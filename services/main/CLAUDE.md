# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rentloop Engine is a Go backend service for property rental management. It provides REST APIs for real-estate account management, properties, tenant applications, lease agreements, and payments.

**Monorepo Structure:**
- `/services/main` - Go backend service (this directory)
- `/apps/property-manager` - React Router v7 property manager portal
- `/apps/website` - Public website
- `/apps/go` - Flutter mobile app

## Common Commands

```bash
# Development (with hot reload via Reflex)
make run-dev

# Production
make run

# Build
make build-server

# Linting
make lint          # Check formatting (gofumpt + golines)
make lint-fix      # Auto-fix formatting

# Database migrations
make setup-db      # Initial migration (drops and recreates DB)
make update-db     # Apply new migrations only

# Generate Swagger docs
make generate-docs

# Install required tools (reflex, swag, gofumpt, golines)
make install-tools

# Deployment (Fly.io)
make deploy-staging
make deploy-production
```

## Architecture

**Layered Architecture Pattern:**

```
cmd/rentloop-engine/    Entry point - server initialization
internal/
├── handlers/           HTTP request handlers (API endpoints)
├── services/           Business logic layer
├── repository/         Data access layer (GORM queries)
├── models/             Domain entities (GORM models)
├── transformations/    DTOs for API responses
├── middlewares/        Auth (JWT), validation, content-type enforcement
├── clients/            External integrations (accounting, email, SMS)
├── router/             HTTP routing (go-chi)
├── config/             Environment configuration
├── lib/                Utilities (validation, constants, code generators)
└── db/                 Database and Redis connection
init/                   Database migrations and seeding
pkg/                    Shared utilities (error handling, Sentry)
docs/                   Auto-generated Swagger/OpenAPI
```

**Dependency Flow:** handlers → services → repository → models

## API Structure

Three main route groups under `/api`:
- **Admin routes** - Admin management endpoints
- **Client User routes** - Property manager endpoints
- **Tenant Account routes** - Tenant endpoints

Swagger docs available at `/swagger/index.html` (non-production only)

## Tech Stack

- **Go 1.24** with go-chi v5 router
- **PostgreSQL** via GORM ORM
- **Redis** for caching/sessions
- **JWT** authentication (dgrijalva/jwt-go)
- **Validator** (go-playground/validator)
- **Sentry** for error tracking
- **Resend** for email
- **Fly.io** for deployment

## Environment Configuration

Copy `.envrc.example` to `.envrc` and configure:
- Database: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `GO_ENV`: development/staging/production
- `PORT`: Default 5003
- JWT secrets, Sentry DSN, API keys for external services

Uses direnv for environment management.

## Code Patterns

- **Migrations:** Located in `init/migration/` with versioned migration jobs
- **Swagger annotations:** Added to handler functions, docs generated via `swag init`
- **Line length:** 120 characters max (enforced by golines)
- **Formatting:** gofumpt for code formatting
