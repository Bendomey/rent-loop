# CLAUDE.md — services/main (Rentloop Engine)

Go backend API for the Rent-Loop platform. Layered architecture: Handlers → Services → Repository → Models.

---

## Commands

```bash
make install-tools    # Install reflex (hot reload), swag (docs), gofumpt, golines
make run-dev          # Generate Swagger docs + run with hot reload (reflex)
make run              # Generate Swagger docs + run production server
make build-server     # Build binary via scripts/build.sh
make lint             # Check formatting (gofumpt + golines, 120 char limit)
make lint-fix         # Auto-fix formatting + regenerate Swagger annotations
make setup-db         # Drop + recreate DB + run all migrations (-init true)
make update-db        # Apply new migrations only (-init false)
make generate-docs    # Regenerate Swagger docs from internal/router/main.go
make deploy-staging   # Deploy to Fly.io staging
make deploy-production# Deploy to Fly.io production
```

Swagger UI (non-production): `http://localhost:5003/swagger/index.html`

---

## Project Structure

```
services/main/
├── cmd/rentloop-engine/main.go     # Entry point — wires all components, starts HTTP server
├── init/
│   ├── main.go                     # DB init CLI entry point
│   ├── setup.go                    # DB creation/drop logic
│   └── migration/
│       ├── main.go                 # AutoMigrate + seed runner
│       └── jobs/                   # Individual migration jobs (versioned)
├── internal/
│   ├── clients/                    # External HTTP client wrappers
│   │   ├── main.go                 # Clients aggregator struct
│   │   └── accounting/             # Fincore accounting API client
│   ├── config/config.go            # Config struct + env var loader
│   ├── db/
│   │   ├── main.go                 # PostgreSQL connection (GORM + pgx)
│   │   └── redis.go                # Redis connection
│   ├── handlers/                   # HTTP handler layer — one file per resource
│   ├── lib/                        # Internal utilities
│   │   ├── context.go              # Context keys (auth injection)
│   │   ├── error.go                # Custom error types
│   │   ├── filter.go               # Query filter helpers
│   │   ├── transaction.go          # WithTransaction / ResolveDB helpers
│   │   ├── slug.go                 # Slug generation
│   │   └── email-templates/        # HTML email templates
│   ├── middlewares/                # HTTP middleware (JWT auth, role checks)
│   ├── models/                     # GORM struct definitions
│   ├── repository/                 # Data access layer (GORM queries)
│   ├── router/                     # Route registration — 3 route groups
│   ├── services/                   # Business logic layer
│   └── transformations/            # DB model → REST response DTO converters
├── pkg/                            # Shared utilities
│   ├── common.go
│   ├── context.go                  # AppContext struct
│   ├── error.go                    # Custom error helpers
│   ├── send-email.go               # Resend email wrapper
│   ├── send-sms.go                 # Wittyflow SMS wrapper
│   └── sentry.go                   # Sentry init
├── docs/                           # Auto-generated Swagger docs (do not edit manually)
├── scripts/                        # Shell scripts for run/build
└── Makefile
```

---

## Architecture Patterns

### Layered Architecture
```
HTTP Request
    → Router (chi) + Middleware
    → Handler (parse request, validate, call service, return response)
    → Service (business logic, orchestration)
    → Repository (GORM queries, returns models)
    → Model (GORM struct)
```

### DB Transactions
The `lib.WithTransaction` / `lib.ResolveDB` pattern propagates a `*gorm.DB` transaction through `context.Context`. Used in all critical multi-step operations (e.g. `ApproveTenantApplication`, `VerifyOfflinePayment`).

### Async Notifications
All email/SMS sends are fire-and-forget goroutines: `go pkg.SendEmail(...)`. Non-blocking.

### Soft Deletes
All primary entities embed `BaseModelSoftDelete` — UUID PK with `uuid_generate_v4()`, `CreatedAt`, `UpdatedAt`, `DeletedAt` (GORM soft delete).

### Model Hooks
- `Admin`, `ClientUser`: Hash passwords in `BeforeCreate`
- `Property`, `Unit`: Generate slug from Name in `BeforeCreate`
- `TenantApplication`, `SigningToken`, `Invoice`: Generate unique codes/tokens in `BeforeCreate`

---

## Authentication

Three separate JWT realms with separate secrets and context keys:

| Realm | Secret Env Var | Login Endpoint | Context Key |
|---|---|---|---|
| Admin | `ADMIN_SECRET` | `POST /v1/admins/login` | `AdminFromToken{ID}` |
| Client User (PM) | `CLIENT_USER_SECRET` | `POST /v1/client-users/login` | `ClientUserFromToken{ID, ClientID}` |
| Tenant | `TENANT_USER_SECRET` | OTP flow (see below) | `TenantAccountFromToken{ID}` |

**Token format:** `Bearer <jwt>` in `Authorization` header.

**Tenant OTP flow:**
1. `POST /v1/auth/codes` → generates 6-digit code, hashes it, stores in Redis (1hr TTL), sends via email/SMS
2. `POST /v1/auth/codes/verify` → validates hash, deletes Redis key, returns JWT

**Client User roles:**
- Global: `OWNER`, `ADMIN`, `STAFF`
- Property-level: `MANAGER`, `STAFF` (via `ClientUserProperty` table)
- Role enforcement: `ValidateRoleClientUserMiddleware` (global) and `ValidateRoleClientUserPropertyMiddleware` (property-scoped)

---

## Models

All embed `BaseModelSoftDelete` (UUID PK, soft delete) unless noted.

| Model | File | Key Fields |
|---|---|---|
| `Admin` | `models/admin.go` | Name, Email, Password (hashed) |
| `ClientApplication` | `models/client-application.go` | Type, SubType, Status (Pending/Approved/Rejected), contact/company/individual fields |
| `Client` | `models/client.go` | Type (INDIVIDUAL/COMPANY), SubType (LANDLORD/PM/DEVELOPER/AGENCY), ClientApplicationId |
| `ClientUser` | `models/client-user.go` | ClientID, Name, Email, Phone, Role (OWNER/ADMIN/STAFF), Status |
| `ClientUserProperty` | `models/client-user-property.go` | PropertyID, ClientUserID, Role (MANAGER/STAFF) — join table |
| `Property` | `models/property.go` | ClientID, Name, Slug, Type (SINGLE/MULTI), Status |
| `PropertyBlock` | `models/property-block.go` | PropertyID, Name, FloorsCount, UnitsCount, Status |
| `Unit` | `models/unit.go` | PropertyID, PropertyBlockID, Name, Slug, Type, Status, RentFee, PaymentFrequency |
| `Tenant` | `models/tenant.go` | Personal info, ID docs, emergency contact, occupation/income |
| `TenantAccount` | `models/tenant-account.go` | TenantId (unique), PhoneNumber (unique), NotificationToken |
| `TenantApplication` | `models/tenant-application.go` | Code (unique, auto-gen), Status (InProgress/Cancelled/Completed), DesiredUnitId, all personal info, lease/deposit terms |
| `Lease` | `models/lease.go` | Status (Pending→Active→Terminated/Completed/Cancelled), UnitId, TenantId, TenantApplicationId, ParentLeaseId (renewals) |
| `LeaseChecklist` | `models/lease-checklist.go` | LeaseId, Type (CheckIn/CheckOut/Routine), Items[] |
| `LeaseChecklistItem` | `models/lease-checklist.go` | LeaseChecklistId, Description, Status (Functional/Damaged/Missing) |
| `LeasePayment` | `models/lease-payment.go` | LeaseId, Status, Amount, PaymentId, Reference |
| `Invoice` | `models/invoice.go` | Code (INV-YYMM-XXXXXX), PayerType, PayeeType, ContextType, Status (DRAFT/ISSUED/PARTIALLY_PAID/PAID/VOID), LineItems[] |
| `InvoiceLineItem` | `models/invoice.go` | InvoiceID, Label, Category (RENT/SECURITY_DEPOSIT/INITIAL_DEPOSIT/etc), Quantity, UnitAmount |
| `Payment` | `models/payment.go` | InvoiceID, Rail (MOMO/BANK_TRANSFER/CARD/OFFLINE), Provider, Amount, Status |
| `PaymentAccount` | `models/payment-account.go` | OwnerType, ClientID, Rail, Provider, Identifier, IsDefault, Status |
| `Document` | `models/document.go` | Title, Size, Content (JSONB Lexical state), Tags[], PropertyID |
| `DocumentSignature` | `models/document_signature.go` | DocumentID, TenantApplicationID, LeaseID, Role (PROPERTY_MANAGER/TENANT/etc), SignatureUrl |
| `SigningToken` | `models/signing_token.go` | Token (unique, auto-gen), DocumentID, TenantApplicationID, Role, ExpiresAt, SignedAt |
| `MaintenanceRequest` | `models/maintenance-request.go` | **Not yet active** — commented out of migrations |

---

## API Routes

Base prefix: `/api`

### Admin Routes — `InjectAdminAuthMiddleware`

| Method | Path | Auth |
|---|---|---|
| POST | `/v1/admins/login` | Public |
| POST | `/v1/admins` | Admin JWT |
| GET | `/v1/admins/me` | Admin JWT |
| GET | `/v1/admins/{admin_id}` | Admin JWT |
| GET | `/v1/admins` | Admin JWT |
| GET | `/v1/client-applications` | Admin JWT |
| GET | `/v1/client-applications/{application_id}` | Admin JWT |
| PATCH | `/v1/client-applications/{application_id}/approve` | Admin JWT |
| PATCH | `/v1/client-applications/{application_id}/reject` | Admin JWT |

### Client User Routes — `InjectClientUserAuthMiddleware`

**Public:**

| Method | Path |
|---|---|
| POST | `/v1/clients/apply` |
| POST | `/v1/client-users/login` |
| POST | `/v1/client-users/forgot-password` |
| GET | `/v1/units/{unit_id}` |

**Protected (Client User JWT):**

| Method | Path | Role Required |
|---|---|---|
| POST | `/v1/client-users` | ADMIN or OWNER |
| POST/GET | `/v1/client-users/reset-password` | Any |
| GET | `/v1/client-users` | Any |
| GET/PATCH | `/v1/client-users/me` | Any |
| PATCH | `/v1/client-users/me/password` | Any |
| GET | `/v1/client-users/{id}` | Any |
| POST | `/v1/client-users/{id}/properties:link` | ADMIN or OWNER |
| DELETE | `/v1/client-users/{id}/properties:unlink` | ADMIN or OWNER |
| POST | `/v1/client-users/{id}/activate` | ADMIN or OWNER |
| POST | `/v1/client-users/{id}/deactivate` | ADMIN or OWNER |
| POST | `/v1/properties` | ADMIN or OWNER |
| GET | `/v1/properties` | ADMIN or OWNER |
| GET | `/v1/properties/me` | Any |
| GET | `/v1/properties/slug/{slug}` | Any |
| GET | `/v1/properties/{id}` | Any |
| PATCH | `/v1/properties/{id}` | ADMIN or OWNER |
| DELETE | `/v1/properties/{id}` | ADMIN or OWNER |
| POST | `/v1/properties/{id}/client-users:link` | ADMIN or OWNER |
| DELETE | `/v1/properties/{id}/client-users:unlink` | ADMIN or OWNER |
| GET | `/v1/properties/{id}/leases` | Any |
| POST | `/v1/properties/{id}/blocks` | Property MANAGER |
| GET | `/v1/properties/{id}/blocks` | Any |
| GET | `/v1/properties/{id}/blocks/{block_id}` | Any |
| PATCH | `/v1/properties/{id}/blocks/{block_id}` | Property MANAGER |
| DELETE | `/v1/properties/{id}/blocks/{block_id}` | Property MANAGER |
| POST | `/v1/properties/{id}/blocks/{block_id}/units` | Property MANAGER |
| GET | `/v1/properties/{id}/units` | Any |
| GET | `/v1/properties/{id}/units/{unit_id}` | Any |
| PATCH | `/v1/properties/{id}/units/{unit_id}` | Property MANAGER |
| DELETE | `/v1/properties/{id}/units/{unit_id}` | Property MANAGER |
| PATCH | `/v1/properties/{id}/units/{unit_id}/status:draft` | Property MANAGER |
| PATCH | `/v1/properties/{id}/units/{unit_id}/status:maintenance` | Property MANAGER |
| PATCH | `/v1/properties/{id}/units/{unit_id}/status:available` | Property MANAGER |
| POST | `/v1/documents` | Any |
| GET | `/v1/documents` | Any |
| GET | `/v1/documents/{document_id}` | Any |
| PATCH | `/v1/documents/{document_id}` | Any |
| DELETE | `/v1/documents/{document_id}` | Any |
| GET | `/v1/client-user-properties` | Any |
| GET | `/v1/client-user-properties/{id}` | Any |
| POST | `/v1/tenant-applications/invite` | ADMIN or OWNER |
| GET | `/v1/tenant-applications` | Any |
| GET | `/v1/tenant-applications/{id}` | Any |
| PATCH | `/v1/tenant-applications/{id}` | ADMIN or OWNER |
| DELETE | `/v1/tenant-applications/{id}` | ADMIN or OWNER |
| PATCH | `/v1/tenant-applications/{id}/cancel` | ADMIN or OWNER |
| POST | `/v1/tenant-applications/{id}/invoice:generate` | ADMIN or OWNER |
| POST | `/v1/tenant-applications/{id}/invoice/{invoice_id}/pay` | ADMIN or OWNER |
| PATCH | `/v1/tenant-applications/{id}/approve` | ADMIN or OWNER |
| GET | `/v1/tenants/{tenant_id}/leases` | Any |
| GET | `/v1/leases/{lease_id}` | Any |
| PATCH | `/v1/leases/{lease_id}` | ADMIN or OWNER |
| PATCH | `/v1/leases/{lease_id}/status:active` | ADMIN or OWNER |
| PATCH | `/v1/leases/{lease_id}/status:cancelled` | ADMIN or OWNER |
| POST | `/v1/payment-accounts` | ADMIN or OWNER |
| GET | `/v1/payment-accounts` | Any |
| GET | `/v1/payment-accounts/{id}` | Any |
| PATCH | `/v1/payment-accounts/{id}` | ADMIN or OWNER |
| DELETE | `/v1/payment-accounts/{id}` | ADMIN or OWNER |
| GET | `/v1/invoices` | Any |
| GET | `/v1/invoices/{invoice_id}` | Any |
| PATCH | `/v1/invoices/{invoice_id}` | ADMIN or OWNER |
| PATCH | `/v1/invoices/{invoice_id}/void` | ADMIN or OWNER |
| POST | `/v1/invoices/{invoice_id}/line-items` | ADMIN or OWNER |
| DELETE | `/v1/invoices/{invoice_id}/line-items/{line_item_id}` | ADMIN or OWNER |
| GET | `/v1/invoices/{invoice_id}/line-items` | Any |

### Tenant Account Routes — `InjectTenantAuthMiddleware` (optional)

**Public:**

| Method | Path |
|---|---|
| POST | `/v1/tenant-applications` |
| GET | `/v1/tenants/phone/{phone}` |
| POST | `/v1/auth/codes` |
| POST | `/v1/auth/codes/verify` |

**Protected (Tenant JWT):**

| Method | Path |
|---|---|
| POST | `/v1/payments/offline:initiate` |

### Other
- `GET /` — Health check (200 OK)
- `GET /swagger/*` — Swagger UI (non-production only)

---

## Key Services

### TenantApplicationService
Core onboarding orchestrator. `ApproveTenantApplication` is the main transactional operation:
1. Marks application `Completed`
2. Creates `Tenant` record
3. Creates `TenantAccount` (mobile login)
4. Creates `Lease` (status: `Pending`)
5. Marks `Unit` as `Occupied`
6. Sends approval email/SMS
All steps inside a DB transaction — rollback on any failure.

### LeaseService
Manages lease lifecycle: `Pending → Active → (Terminated | Completed | Cancelled)`.
- `UpdateLease`: Only allowed when status is `Pending`
- `ActivateLease` / `CancelLease`: Send email/SMS notifications

### InvoiceService
- `CreateInvoice`: Generates code `INV-YYMM-XXXXXX`, creates line items, posts journal entry to Fincore if status is `ISSUED`
- `VoidInvoice`: Cannot void `PARTIALLY_PAID`/`PAID` invoices; posts reversing journal entry
- `AddLineItem` / `RemoveLineItem`: Only on `DRAFT` invoices; recalculates totals transactionally

**Journal entry routing (Fincore double-entry):**
- `TENANT_APPLICATION` → Debit AR / Credit Security Deposits Held + Rental Income
- `LEASE_RENT` → Debit AR / Credit Rental Income + Maintenance Reimbursement
- `SAAS_FEE` → Debit AR / Credit Subscription Revenue

### PaymentService
- `CreateOfflinePayment`: Validates account is `ACTIVE` + `OFFLINE` rail, invoice is `ISSUED`/`PARTIALLY_PAID`, amount ≤ remaining balance
- `VerifyOfflinePayment`: Marks payment `SUCCESSFUL`/`FAILED`, updates invoice to `PAID`/`PARTIALLY_PAID` transactionally

### DocumentService
CRUD for Lexical editor documents. Content stored as JSONB. Supports per-property or global documents with tag filtering.

### AuthService (Tenant OTP)
- `SendCode`: 6-digit code, hashed, Redis TTL 1hr, sent via email or SMS
- `VerifyCode`: Validate hash, delete Redis key on success

---

## Environment Variables

```bash
# Server
PORT=5003
GO_ENV=development                # development | staging | production

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=
DB_PASS=
DB_NAME=
DB_SSLMODE=disable
DB_DEFAULT_DBNAME=postgres        # Used during db init/setup

# Redis
REDIS_URL=redis://localhost:6379

# Sentry
SENTRY_DSN=
SENTRY_ENVIRONMENT=

# JWT Secrets
ADMIN_SECRET=
CLIENT_USER_SECRET=
TENANT_USER_SECRET=

# Seed Data (used by make setup-db)
SUPER_ADMIN_NAME=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=

# SMS — Wittyflow
WITTYFLOW_APP_ID=
WITTYFLOW_APP_SECRET=

# Email — Resend
RESEND_API_KEY=

# Support
SUPPORT_EMAIL=
SUPPORT_PHONE=

# Portal URLs
ADMIN_PORTAL_URL=
PROPERTY_MANAGER_PORTAL_URL=
TENANT_PORTAL_URL=
WEBSITE_URL=

# Fincore Accounting API
FINCORE_API_BASE_URL=
FINCORE_CLIENT_ID=
FINCORE_CLIENT_SECRET=

# Fincore Chart of Accounts (IDs from accounting system)
FINCORE_ACCOUNT_CASH_BANK=
FINCORE_ACCOUNT_RECEIVABLE=
FINCORE_ACCOUNT_SECURITY_DEPOSITS=
FINCORE_ACCOUNT_RENTAL_INCOME=
FINCORE_ACCOUNT_MAINTENANCE_REIMBURSEMENT=
FINCORE_ACCOUNT_SUBSCRIPTION_REVENUE=
FINCORE_ACCOUNT_MAINTENANCE_EXPENSE=
FINCORE_ACCOUNT_PROPERTY_MGMT_EXPENSE=
```

Use `direnv` with `.envrc` (copy from `.envrc.example`).

---

## External Dependencies

| Library | Purpose |
|---|---|
| `github.com/go-chi/chi/v5` | HTTP router |
| `github.com/go-chi/cors` | CORS middleware |
| `github.com/go-chi/httprate` | Rate limiting (100 req/min per IP) |
| `gorm.io/gorm` + `gorm.io/driver/postgres` | ORM |
| `github.com/jackc/pgx/v5` | PostgreSQL driver |
| `github.com/go-gormigrate/gormigrate/v2` | Versioned GORM migrations |
| `github.com/redis/go-redis/v9` | Redis client (OTP storage) |
| `github.com/Bendomey/goutilities` | Password hashing, JWT validation |
| `github.com/dgrijalva/jwt-go` | JWT parsing |
| `github.com/go-playground/validator/v10` | Request struct validation |
| `github.com/gofrs/uuid` | UUID primary key type |
| `github.com/lib/pq` | PostgreSQL array types (`pq.StringArray`) |
| `github.com/matoous/go-nanoid` | Nanoid for codes/tokens |
| `github.com/resend/resend-go/v2` | Transactional email (Resend) |
| `github.com/sirupsen/logrus` | Structured logging |
| `github.com/swaggo/http-swagger` | Swagger UI |
| `gorm.io/datatypes` | JSONB field type |
| `github.com/getsentry/sentry-go` | Error monitoring |

---

## Not Yet Implemented

The following models are defined but **commented out of migrations** — do not add routes for them without enabling the migrations first:
- `MaintenanceRequest`
- `MaintenanceRequestActivityLog`
- `Announcement`
