# Lease Agreement Document Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `LeaseAgreementDocument` pipeline model that manages the lease document lifecycle, making `lease_agreement_document_url` optional on the lease, with a full status machine (DRAFT→FINALIZED→SIGNING→SIGNED) and matching frontend UI.

**Architecture:** New `LeaseAgreementDocument` model owns the FK to `Lease` (not the reverse). `DocumentSignature` gains a `LeaseAgreementDocumentID` FK. The signing service auto-advances status as side effects of token creation and signature submission. Frontend adds an API layer and a new lease document setup UI to the lease detail Documents tab.

**Tech Stack:** Go (GORM, Chi), gormigrate, React Router v7, TanStack Query v5, TypeScript, Tailwind CSS v4, Shadcn/Radix UI

## Global Constraints

- Never auto-commit. Leave all changes unstaged.
- All JSON struct tags must be snake_case.
- Handlers never call repositories directly — always through a service.
- All UI changes must support both dark and light modes.
- Run `yarn types:check` after all frontend changes.
- Run `make lint-fix` after all backend changes.
- Swagger godoc annotations must be updated on every handler.

---

### Task 1: Backend model + migration

**Files:**
- Create: `services/main/internal/models/lease_agreement_document.go`
- Modify: `services/main/internal/models/document_signature.go`
- Modify: `services/main/internal/models/lease.go`
- Create: `services/main/init/migration/jobs/add-lease-agreement-document.go`
- Modify: `services/main/init/migration/main.go`

**Interfaces:**
- Produces: `models.LeaseAgreementDocument` struct used by all later backend tasks

- [ ] **Step 1: Create the LeaseAgreementDocument model**

Create `services/main/internal/models/lease_agreement_document.go`:

```go
package models

// LeaseAgreementDocument manages the document pipeline for a lease agreement.
// It lives alongside the lease while the document is being set up and signed.
// Once finalized, the document URL is promoted to Lease.LeaseAgreementDocumentUrl.
// Status: "DRAFT" -> "FINALIZED" -> "SIGNING" -> "SIGNED"
type LeaseAgreementDocument struct {
	BaseModelSoftDelete
	LeaseID  string `gorm:"not null;uniqueIndex"` // one pipeline record per lease
	Lease    *Lease
	Mode     string  `gorm:"not null"` // "MANUAL" | "ONLINE"
	DocumentID  *string // FK to Document (ONLINE mode only)
	Document    *Document
	DocumentUrl *string // final PDF URL; set on MANUAL attach or after ONLINE PDF generation
	Status      string  `gorm:"not null;default:'DRAFT'"` // "DRAFT" | "FINALIZED" | "SIGNING" | "SIGNED"
	Signatures  []DocumentSignature `gorm:"foreignKey:LeaseAgreementDocumentID"`
}
```

- [ ] **Step 2: Add LeaseAgreementDocumentID to DocumentSignature**

Edit `services/main/internal/models/document_signature.go` — add the new FK after `LeaseTerminationID`:

```go
LeaseAgreementDocumentID *string // nullable — links to the LeaseAgreementDocument pipeline
LeaseAgreementDocument   *LeaseAgreementDocument
```

- [ ] **Step 3: Make LeaseAgreementDocumentUrl nullable on Lease**

Edit `services/main/internal/models/lease.go` — change the docs setup section:

```go
// docs setup
LeaseAgreementDocumentUrl *string // nullable — set when document pipeline finalizes
```

- [ ] **Step 4: Write the migration job**

Create `services/main/init/migration/jobs/add-lease-agreement-document.go`:

```go
package jobs

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"gorm.io/gorm"
)

// AddLeaseAgreementDocument creates the lease_agreement_documents table,
// adds lease_agreement_document_id to document_signatures,
// and makes lease_agreement_document_url nullable on leases.
func AddLeaseAgreementDocument() *gormigrate.Migration {
	return &gormigrate.Migration{
		ID: "202606290001_ADD_LEASE_AGREEMENT_DOCUMENT",
		Migrate: func(db *gorm.DB) error {
			if err := db.Exec(`
				CREATE TABLE IF NOT EXISTS lease_agreement_documents (
					id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
					created_at TIMESTAMPTZ,
					updated_at TIMESTAMPTZ,
					deleted_at TIMESTAMPTZ,
					lease_id UUID NOT NULL UNIQUE,
					mode TEXT NOT NULL,
					document_id UUID,
					document_url TEXT,
					status TEXT NOT NULL DEFAULT 'DRAFT'
				)
			`).Error; err != nil {
				return err
			}
			if err := db.Exec(`
				ALTER TABLE document_signatures
				ADD COLUMN IF NOT EXISTS lease_agreement_document_id UUID
			`).Error; err != nil {
				return err
			}
			return db.Exec(`
				ALTER TABLE leases
				ALTER COLUMN lease_agreement_document_url DROP NOT NULL
			`).Error
		},
		Rollback: func(db *gorm.DB) error {
			if err := db.Exec(`DROP TABLE IF EXISTS lease_agreement_documents`).Error; err != nil {
				return err
			}
			if err := db.Exec(`
				ALTER TABLE document_signatures
				DROP COLUMN IF EXISTS lease_agreement_document_id
			`).Error; err != nil {
				return err
			}
			return db.Exec(`
				ALTER TABLE leases
				ALTER COLUMN lease_agreement_document_url SET NOT NULL
			`).Error
		},
	}
}
```

- [ ] **Step 5: Register model in AutoMigrate and job in migration list**

Edit `services/main/init/migration/main.go`:

In `updateMigration`, add after `&models.LeaseTermination{}`:
```go
&models.LeaseAgreementDocument{},
```

In the migration list, add after `jobs.AddLeaseTerminationContextFields()`:
```go
jobs.AddLeaseAgreementDocument(),
```

- [ ] **Step 6: Verify the migration runs**

```bash
cd services/main && make update-db
```

Expected: no errors, `lease_agreement_documents` table exists with correct columns.

---

### Task 2: Backend transformations + lease/signature output updates

**Files:**
- Create: `services/main/internal/transformations/lease-agreement-document.go`
- Modify: `services/main/internal/transformations/lease.go`
- Modify: `services/main/internal/transformations/document-signature.go`

**Interfaces:**
- Consumes: `models.LeaseAgreementDocument` from Task 1
- Produces: `DBAdminLeaseAgreementDocumentToRest(*models.LeaseAgreementDocument) any` used by handler in Task 4

- [ ] **Step 1: Create LeaseAgreementDocument transformation**

Create `services/main/internal/transformations/lease-agreement-document.go`:

```go
package transformations

import (
	"time"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/gofrs/uuid"
)

type OutputAdminLeaseAgreementDocument struct {
	ID          string               `json:"id"           example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	LeaseID     string               `json:"lease_id"     example:"4fce5dc8-8114-4ab2-a94b-b4536c27f43b"`
	Mode        string               `json:"mode"         example:"ONLINE"`
	DocumentID  *string              `json:"document_id,omitempty" example:"550e8400-e29b-41d4-a716-446655440000"`
	Document    *OutputAdminDocument `json:"document,omitempty"`
	DocumentUrl *string              `json:"document_url,omitempty" example:"https://example.com/lease.pdf"`
	Status      string               `json:"status"       example:"DRAFT"`
	Signatures  []any                `json:"signatures"`
	CreatedAt   time.Time            `json:"created_at"   example:"2024-06-01T09:00:00Z"`
	UpdatedAt   time.Time            `json:"updated_at"   example:"2024-06-10T09:00:00Z"`
}

func DBAdminLeaseAgreementDocumentToRest(i *models.LeaseAgreementDocument) any {
	if i == nil || i.ID == uuid.Nil {
		return nil
	}

	signatures := make([]any, 0)
	for _, sig := range i.Signatures {
		signatures = append(signatures, DBAdminDocumentSignatureToRest(&sig))
	}

	return map[string]any{
		"id":           i.ID,
		"lease_id":     i.LeaseID,
		"mode":         i.Mode,
		"document_id":  i.DocumentID,
		"document":     DBAdminDocumentToRestDocument(i.Document),
		"document_url": i.DocumentUrl,
		"status":       i.Status,
		"signatures":   signatures,
		"created_at":   i.CreatedAt,
		"updated_at":   i.UpdatedAt,
	}
}
```

- [ ] **Step 2: Update lease transformation to handle nullable URL and populate agreement doc**

Edit `services/main/internal/transformations/lease.go`:

In `OutputAdminLease`, change:
```go
LeaseAgreementDocumentUrl string `json:"lease_agreement_document_url" example:"https://example.com/lease.pdf"`
```
to:
```go
LeaseAgreementDocumentUrl *string `json:"lease_agreement_document_url,omitempty" example:"https://example.com/lease.pdf"`
LeaseAgreementDocument    *OutputAdminLeaseAgreementDocument `json:"lease_agreement_document,omitempty"`
```

In `DBAdminLeaseToRest`, change:
```go
"lease_agreement_document_url": i.LeaseAgreementDocumentUrl,
```
to:
```go
"lease_agreement_document_url": i.LeaseAgreementDocumentUrl,
"lease_agreement_document":     DBAdminLeaseAgreementDocumentToRest(i.LeaseAgreementDocument),
```

In `OutputLease` (tenant-facing), change:
```go
LeaseAgreementDocumentUrl string `json:"lease_agreement_document_url" example:"https://example.com/lease.pdf"`
```
to:
```go
LeaseAgreementDocumentUrl *string `json:"lease_agreement_document_url,omitempty" example:"https://example.com/lease.pdf"`
```

In `DBLeaseToRest` (tenant-facing), the map already has `"lease_agreement_document_url": i.LeaseAgreementDocumentUrl` — no change needed since it's now a pointer and will serialize as null when nil.

- [ ] **Step 3: Add lease_agreement_document_id to document signature transformation**

Edit `services/main/internal/transformations/document-signature.go`:

In `DBAdminDocumentSignatureToRest`, add to the data map:
```go
"lease_agreement_document_id": i.LeaseAgreementDocumentID,
```

In `DBDocumentSignatureToRest`, add to the data map:
```go
"lease_agreement_document_id": i.LeaseAgreementDocumentID,
```

- [ ] **Step 4: Run lint**

```bash
cd services/main && make lint-fix
```

Expected: no errors.

---

### Task 3: Make lease creation accept optional document URL + update lease service

**Files:**
- Modify: `services/main/internal/services/lease.go`
- Modify: `services/main/internal/services/tenant-application.go`

**Interfaces:**
- Consumes: updated `models.Lease` with `*string` URL from Task 1
- Produces: `CreateLeaseInput.LeaseAgreementDocumentUrl *string` (was `string`)

- [ ] **Step 1: Update CreateLeaseInput and CreateLease service**

Edit `services/main/internal/services/lease.go`:

Change `CreateLeaseInput`:
```go
LeaseAgreementDocumentUrl *string // nullable
```

Change the `lease := models.Lease{...}` construction in `CreateLease` — remove `LeaseAgreementDocumentUrl: input.LeaseAgreementDocumentUrl` and add:
```go
LeaseAgreementDocumentUrl: input.LeaseAgreementDocumentUrl,
```
(same field, now `*string` pointer — no cast needed since both are `*string`)

- [ ] **Step 2: Update UpdateLease service to handle *string model field**

In `UpdateLease`, change:
```go
if input.LeaseAgreementDocumentUrl != nil {
    lease.LeaseAgreementDocumentUrl = *input.LeaseAgreementDocumentUrl
}
```
to:
```go
if input.LeaseAgreementDocumentUrl != nil {
    lease.LeaseAgreementDocumentUrl = input.LeaseAgreementDocumentUrl
}
```

- [ ] **Step 3: Remove mandatory document check and update lease creation in tenant-application service**

Edit `services/main/internal/services/tenant-application.go`:

Remove the block (around line 1031):
```go
if tenantApplication.LeaseAgreementDocumentUrl == nil {
    return pkg.BadRequestError("ApplicationMissingLeaseAgreementDocument", nil)
}
```

Change the lease creation input (around line 1117):
```go
LeaseAgreementDocumentUrl: tenantApplication.LeaseAgreementDocumentUrl, // *string, nil if not set
```
(Remove the dereference `*tenantApplication.LeaseAgreementDocumentUrl`)

- [ ] **Step 4: Run lint**

```bash
cd services/main && make lint-fix
```

Expected: no errors.

---

### Task 4: Backend repository + service for LeaseAgreementDocument

**Files:**
- Create: `services/main/internal/repository/lease-agreement-document.go`
- Create: `services/main/internal/services/lease-agreement-document.go`
- Modify: `services/main/internal/repository/main.go`
- Modify: `services/main/internal/services/main.go`

**Interfaces:**
- Consumes: `models.LeaseAgreementDocument` from Task 1
- Produces:
  - `LeaseAgreementDocumentRepository` interface (Create, GetByLeaseID, Update, Delete)
  - `LeaseAgreementDocumentService` interface (CreateLeaseAgreementDocument, GetByLeaseID, UpdateLeaseAgreementDocument, DeleteLeaseAgreementDocument, FinalizeLeaseAgreementDocument)
  - Both registered in their respective `main.go` files

- [ ] **Step 1: Create the repository**

Create `services/main/internal/repository/lease-agreement-document.go`:

```go
package repository

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"gorm.io/gorm"
)

type LeaseAgreementDocumentRepository interface {
	Create(ctx context.Context, doc *models.LeaseAgreementDocument) error
	GetByLeaseID(ctx context.Context, leaseID string, populate *[]string) (*models.LeaseAgreementDocument, error)
	Update(ctx context.Context, doc *models.LeaseAgreementDocument) error
	Delete(ctx context.Context, id string) error
}

type leaseAgreementDocumentRepository struct {
	DB *gorm.DB
}

func NewLeaseAgreementDocumentRepository(db *gorm.DB) LeaseAgreementDocumentRepository {
	return &leaseAgreementDocumentRepository{DB: db}
}

func (r *leaseAgreementDocumentRepository) Create(ctx context.Context, doc *models.LeaseAgreementDocument) error {
	return r.DB.WithContext(ctx).Create(doc).Error
}

func (r *leaseAgreementDocumentRepository) GetByLeaseID(ctx context.Context, leaseID string, populate *[]string) (*models.LeaseAgreementDocument, error) {
	var doc models.LeaseAgreementDocument
	db := r.DB.WithContext(ctx).Where("lease_id = ?", leaseID)

	if populate != nil {
		for _, field := range *populate {
			db = db.Preload(field)
		}
	}

	if err := db.First(&doc).Error; err != nil {
		return nil, err
	}
	return &doc, nil
}

func (r *leaseAgreementDocumentRepository) Update(ctx context.Context, doc *models.LeaseAgreementDocument) error {
	return r.DB.WithContext(ctx).Save(doc).Error
}

func (r *leaseAgreementDocumentRepository) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Where("id = ?", id).Delete(&models.LeaseAgreementDocument{}).Error
}

// ErrLeaseAgreementDocumentNotFound is a sentinel used by the service layer.
var ErrLeaseAgreementDocumentNotFound = errors.New("lease_agreement_document_not_found")
```

- [ ] **Step 2: Register the repository in repository/main.go**

In `Repository` struct add:
```go
LeaseAgreementDocumentRepository LeaseAgreementDocumentRepository
```

In `NewRepository` add:
```go
leaseAgreementDocumentRepository := NewLeaseAgreementDocumentRepository(db)
```

And in the return struct:
```go
LeaseAgreementDocumentRepository: leaseAgreementDocumentRepository,
```

- [ ] **Step 3: Create the service**

Create `services/main/internal/services/lease-agreement-document.go`:

```go
package services

import (
	"context"
	"errors"

	"github.com/Bendomey/rent-loop/services/main/internal/models"
	"github.com/Bendomey/rent-loop/services/main/internal/repository"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"gorm.io/gorm"
)

type LeaseAgreementDocumentService interface {
	CreateLeaseAgreementDocument(ctx context.Context, input CreateLeaseAgreementDocumentInput) (*models.LeaseAgreementDocument, error)
	GetByLeaseID(ctx context.Context, leaseID string) (*models.LeaseAgreementDocument, error)
	UpdateLeaseAgreementDocument(ctx context.Context, input UpdateLeaseAgreementDocumentInput) (*models.LeaseAgreementDocument, error)
	DeleteLeaseAgreementDocument(ctx context.Context, leaseID string) error
	FinalizeLeaseAgreementDocument(ctx context.Context, leaseID string) (*models.LeaseAgreementDocument, error)
}

type leaseAgreementDocumentService struct {
	repo repository.LeaseAgreementDocumentRepository
}

func NewLeaseAgreementDocumentService(repo repository.LeaseAgreementDocumentRepository) LeaseAgreementDocumentService {
	return &leaseAgreementDocumentService{repo: repo}
}

type CreateLeaseAgreementDocumentInput struct {
	LeaseID     string
	Mode        string  // "MANUAL" | "ONLINE"
	DocumentID  *string // ONLINE only
	DocumentUrl *string // MANUAL only
}

func (s *leaseAgreementDocumentService) CreateLeaseAgreementDocument(ctx context.Context, input CreateLeaseAgreementDocumentInput) (*models.LeaseAgreementDocument, error) {
	// ensure no existing doc for this lease
	existing, err := s.repo.GetByLeaseID(ctx, input.LeaseID, nil)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	if existing != nil {
		return nil, pkg.BadRequestError("LeaseAgreementDocumentAlreadyExists", nil)
	}

	doc := &models.LeaseAgreementDocument{
		LeaseID:     input.LeaseID,
		Mode:        input.Mode,
		DocumentID:  input.DocumentID,
		DocumentUrl: input.DocumentUrl,
		Status:      "DRAFT",
	}
	if err := s.repo.Create(ctx, doc); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return doc, nil
}

func (s *leaseAgreementDocumentService) GetByLeaseID(ctx context.Context, leaseID string) (*models.LeaseAgreementDocument, error) {
	populate := []string{"Document", "Signatures", "Signatures.SignedBy"}
	doc, err := s.repo.GetByLeaseID(ctx, leaseID, &populate)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseAgreementDocumentNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return doc, nil
}

type UpdateLeaseAgreementDocumentInput struct {
	LeaseID     string
	DocumentID  *string
	DocumentUrl *string
	Mode        *string
}

func (s *leaseAgreementDocumentService) UpdateLeaseAgreementDocument(ctx context.Context, input UpdateLeaseAgreementDocumentInput) (*models.LeaseAgreementDocument, error) {
	doc, err := s.repo.GetByLeaseID(ctx, input.LeaseID, nil)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseAgreementDocumentNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	if doc.Status != "DRAFT" {
		return nil, pkg.BadRequestError("LeaseAgreementDocumentNotEditable", nil)
	}

	if input.DocumentID != nil {
		doc.DocumentID = input.DocumentID
	}
	if input.DocumentUrl != nil {
		doc.DocumentUrl = input.DocumentUrl
	}
	if input.Mode != nil {
		doc.Mode = *input.Mode
	}

	if err := s.repo.Update(ctx, doc); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return doc, nil
}

func (s *leaseAgreementDocumentService) DeleteLeaseAgreementDocument(ctx context.Context, leaseID string) error {
	doc, err := s.repo.GetByLeaseID(ctx, leaseID, nil)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return pkg.NotFoundError("LeaseAgreementDocumentNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	if doc.Status != "DRAFT" {
		return pkg.BadRequestError("LeaseAgreementDocumentNotEditable", nil)
	}

	if err := s.repo.Delete(ctx, doc.ID.String()); err != nil {
		return pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return nil
}

func (s *leaseAgreementDocumentService) FinalizeLeaseAgreementDocument(ctx context.Context, leaseID string) (*models.LeaseAgreementDocument, error) {
	doc, err := s.repo.GetByLeaseID(ctx, leaseID, nil)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, pkg.NotFoundError("LeaseAgreementDocumentNotFound", &pkg.RentLoopErrorParams{Err: err})
		}
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	if doc.Status != "DRAFT" {
		return nil, pkg.BadRequestError("LeaseAgreementDocumentAlreadyFinalized", nil)
	}

	doc.Status = "FINALIZED"
	if err := s.repo.Update(ctx, doc); err != nil {
		return nil, pkg.InternalServerError(err.Error(), &pkg.RentLoopErrorParams{Err: err})
	}
	return doc, nil
}
```

- [ ] **Step 4: Register service in services/main.go**

In `Services` struct add:
```go
LeaseAgreementDocumentService LeaseAgreementDocumentService
```

In `NewServices`, after `leaseService :=`:
```go
leaseAgreementDocumentService := NewLeaseAgreementDocumentService(
    params.Repository.LeaseAgreementDocumentRepository,
)
```

In the return struct:
```go
LeaseAgreementDocumentService: leaseAgreementDocumentService,
```

- [ ] **Step 5: Run lint**

```bash
cd services/main && make lint-fix
```

Expected: no errors.

---

### Task 5: Backend handler + routes

**Files:**
- Create: `services/main/internal/handlers/lease-agreement-document.go`
- Modify: `services/main/internal/handlers/main.go`
- Modify: `services/main/internal/router/client-user.go`

**Interfaces:**
- Consumes: `LeaseAgreementDocumentService` from Task 4
- Produces: 5 HTTP endpoints registered under `/leases/{lease_id}/agreement-document`

- [ ] **Step 1: Create the handler**

Create `services/main/internal/handlers/lease-agreement-document.go`:

```go
package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Bendomey/rent-loop/services/main/internal/lib"
	"github.com/Bendomey/rent-loop/services/main/internal/services"
	"github.com/Bendomey/rent-loop/services/main/internal/transformations"
	"github.com/Bendomey/rent-loop/services/main/pkg"
	"github.com/go-chi/chi/v5"
)

type LeaseAgreementDocumentHandler struct {
	appCtx  pkg.AppContext
	service services.LeaseAgreementDocumentService
}

func NewLeaseAgreementDocumentHandler(appCtx pkg.AppContext, service services.LeaseAgreementDocumentService) LeaseAgreementDocumentHandler {
	return LeaseAgreementDocumentHandler{appCtx: appCtx, service: service}
}

type CreateLeaseAgreementDocumentRequest struct {
	Mode        string  `json:"mode"         validate:"required,oneof=MANUAL ONLINE" example:"ONLINE"`
	DocumentID  *string `json:"document_id"  validate:"omitempty,uuid"               example:"550e8400-e29b-41d4-a716-446655440000"`
	DocumentUrl *string `json:"document_url" validate:"omitempty,url"                example:"https://example.com/lease.pdf"`
}

// CreateLeaseAgreementDocument godoc
//
//	@Summary		Create lease agreement document (Admin)
//	@Description	Start the document pipeline for a lease. Status is set to DRAFT.
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string									true	"Property ID"
//	@Param			lease_id	path		string									true	"Lease ID"
//	@Param			body		body		CreateLeaseAgreementDocumentRequest		true	"Request body"
//	@Success		201			{object}	object{data=transformations.OutputAdminLeaseAgreementDocument}
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		422			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/agreement-document [post]
func (h *LeaseAgreementDocumentHandler) CreateLeaseAgreementDocument(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")

	var body CreateLeaseAgreementDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	doc, err := h.service.CreateLeaseAgreementDocument(r.Context(), services.CreateLeaseAgreementDocumentInput{
		LeaseID:     leaseID,
		Mode:        body.Mode,
		DocumentID:  body.DocumentID,
		DocumentUrl: body.DocumentUrl,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminLeaseAgreementDocumentToRest(doc),
	})
}

// GetLeaseAgreementDocument godoc
//
//	@Summary		Get lease agreement document (Admin)
//	@Description	Fetch the agreement document pipeline record for a lease, with signatures.
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string	true	"Property ID"
//	@Param			lease_id	path		string	true	"Lease ID"
//	@Success		200			{object}	object{data=transformations.OutputAdminLeaseAgreementDocument}
//	@Failure		401			{object}	string
//	@Failure		404			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/agreement-document [get]
func (h *LeaseAgreementDocumentHandler) GetLeaseAgreementDocument(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")

	doc, err := h.service.GetByLeaseID(r.Context(), leaseID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminLeaseAgreementDocumentToRest(doc),
	})
}

type UpdateLeaseAgreementDocumentRequest struct {
	Mode        *string `json:"mode"         validate:"omitempty,oneof=MANUAL ONLINE"`
	DocumentID  *string `json:"document_id"  validate:"omitempty,uuid"`
	DocumentUrl *string `json:"document_url" validate:"omitempty,url"`
}

// UpdateLeaseAgreementDocument godoc
//
//	@Summary		Update lease agreement document (Admin)
//	@Description	Update mode, document_id, or document_url. Only allowed when status is DRAFT.
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string									true	"Property ID"
//	@Param			lease_id	path		string									true	"Lease ID"
//	@Param			body		body		UpdateLeaseAgreementDocumentRequest		true	"Request body"
//	@Success		200			{object}	object{data=transformations.OutputAdminLeaseAgreementDocument}
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		404			{object}	lib.HTTPError
//	@Failure		422			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/agreement-document [patch]
func (h *LeaseAgreementDocumentHandler) UpdateLeaseAgreementDocument(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")

	var body UpdateLeaseAgreementDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusUnprocessableEntity)
		return
	}
	if !lib.ValidateRequest(h.appCtx.Validator, body, w) {
		return
	}

	doc, err := h.service.UpdateLeaseAgreementDocument(r.Context(), services.UpdateLeaseAgreementDocumentInput{
		LeaseID:     leaseID,
		Mode:        body.Mode,
		DocumentID:  body.DocumentID,
		DocumentUrl: body.DocumentUrl,
	})
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminLeaseAgreementDocumentToRest(doc),
	})
}

// DeleteLeaseAgreementDocument godoc
//
//	@Summary		Delete lease agreement document (Admin)
//	@Description	Remove the agreement document pipeline record. Only allowed when status is DRAFT.
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string	true	"Property ID"
//	@Param			lease_id	path		string	true	"Lease ID"
//	@Success		204			{object}	nil
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		404			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/agreement-document [delete]
func (h *LeaseAgreementDocumentHandler) DeleteLeaseAgreementDocument(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")

	if err := h.service.DeleteLeaseAgreementDocument(r.Context(), leaseID); err != nil {
		HandleErrorResponse(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// FinalizeLeaseAgreementDocument godoc
//
//	@Summary		Finalize lease agreement document (Admin)
//	@Description	Lock the document content and advance status from DRAFT to FINALIZED.
//	@Tags			Lease
//	@Accept			json
//	@Security		BearerAuth
//	@Produce		json
//	@Param			property_id	path		string	true	"Property ID"
//	@Param			lease_id	path		string	true	"Lease ID"
//	@Success		200			{object}	object{data=transformations.OutputAdminLeaseAgreementDocument}
//	@Failure		400			{object}	lib.HTTPError
//	@Failure		401			{object}	string
//	@Failure		404			{object}	lib.HTTPError
//	@Failure		500			{object}	string
//	@Router			/api/v1/admin/clients/{client_id}/properties/{property_id}/leases/{lease_id}/agreement-document/finalize [post]
func (h *LeaseAgreementDocumentHandler) FinalizeLeaseAgreementDocument(w http.ResponseWriter, r *http.Request) {
	leaseID := chi.URLParam(r, "lease_id")

	doc, err := h.service.FinalizeLeaseAgreementDocument(r.Context(), leaseID)
	if err != nil {
		HandleErrorResponse(w, err)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"data": transformations.DBAdminLeaseAgreementDocumentToRest(doc),
	})
}
```

- [ ] **Step 2: Register handler in handlers/main.go**

In `Handlers` struct add:
```go
LeaseAgreementDocumentHandler LeaseAgreementDocumentHandler
```

In `NewHandlers`, after `leaseHandler :=`:
```go
leaseAgreementDocumentHandler := NewLeaseAgreementDocumentHandler(appCtx, services.LeaseAgreementDocumentService)
```

In the return struct:
```go
LeaseAgreementDocumentHandler: leaseAgreementDocumentHandler,
```

- [ ] **Step 3: Register routes in router/client-user.go**

Inside `r.Route("/leases/{lease_id}", func(r chi.Router) {`, add after the existing `/status:cancelled` route:

```go
r.Route("/agreement-document", func(r chi.Router) {
    r.Get("/", handlers.LeaseAgreementDocumentHandler.GetLeaseAgreementDocument)
    r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
        Post("/", handlers.LeaseAgreementDocumentHandler.CreateLeaseAgreementDocument)
    r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
        Patch("/", handlers.LeaseAgreementDocumentHandler.UpdateLeaseAgreementDocument)
    r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
        Delete("/", handlers.LeaseAgreementDocumentHandler.DeleteLeaseAgreementDocument)
    r.With(middlewares.ValidateRoleClientUserPropertyMiddleware(appCtx, "MANAGER")).
        Post("/finalize", handlers.LeaseAgreementDocumentHandler.FinalizeLeaseAgreementDocument)
})
```

- [ ] **Step 4: Run lint and start server to verify routes compile**

```bash
cd services/main && make lint-fix && make run-dev
```

Expected: server starts, no compilation errors.

---

### Task 6: Signing service side effects

**Files:**
- Modify: `services/main/internal/services/signing.go`
- Modify: `services/main/internal/services/main.go`

**Interfaces:**
- Consumes: `LeaseAgreementDocumentRepository` from Task 4
- Produces: `signingService` auto-advances `LeaseAgreementDocument.status` on token creation and signature submission

- [ ] **Step 1: Inject LeaseAgreementDocumentRepository into signing service**

Edit `services/main/internal/services/signing.go`:

Change `signingService` struct:
```go
type signingService struct {
	appCtx     pkg.AppContext
	repo       repository.SigningRepository
	ladRepo    repository.LeaseAgreementDocumentRepository // side effects only
}
```

Change `NewSigningService`:
```go
func NewSigningService(
	appCtx pkg.AppContext,
	repo repository.SigningRepository,
	ladRepo repository.LeaseAgreementDocumentRepository,
) SigningService {
	return &signingService{appCtx: appCtx, repo: repo, ladRepo: ladRepo}
}
```

- [ ] **Step 2: Advance status to SIGNING on first token creation for a lease**

In `GenerateToken`, after `s.sendSigningTokenNotification(...)`, add:

```go
// If this token is for a lease, advance LeaseAgreementDocument FINALIZED→SIGNING
if input.LeaseID != nil {
	go func() {
		doc, err := s.ladRepo.GetByLeaseID(context.Background(), *input.LeaseID, nil)
		if err != nil || doc == nil || doc.Status != "FINALIZED" {
			return
		}
		doc.Status = "SIGNING"
		_ = s.ladRepo.Update(context.Background(), doc)
	}()
}
```

- [ ] **Step 3: Advance status to SIGNED when last party signs (for lease documents)**

Add a helper method at the bottom of signing.go and call it from both `SignDocument` and `SignDocumentByPM`.

Helper (private, add at bottom of file):
```go
func (s *signingService) maybeAdvanceLeaseDocToSigned(ctx context.Context, leaseID string, documentID string) {
	doc, err := s.ladRepo.GetByLeaseID(ctx, leaseID, nil)
	if err != nil || doc == nil || doc.Status != "SIGNING" {
		return
	}

	// count total tokens for this document+lease and how many are signed
	filterQuery := lib.FilterQuery{Page: 1, Limit: 100}
	tokens, err := s.repo.ListSigningTokens(ctx, filterQuery, repository.ListSigningTokensFilter{
		DocumentID: &documentID,
		LeaseID:    &leaseID,
	})
	if err != nil || tokens == nil {
		return
	}

	for _, t := range *tokens {
		if t.SignedAt == nil {
			return // at least one unsigned — not done yet
		}
	}

	doc.Status = "SIGNED"
	_ = s.ladRepo.Update(ctx, doc)
}
```

In `SignDocument`, after the signature is saved successfully, add:
```go
if token.LeaseID != nil {
	s.maybeAdvanceLeaseDocToSigned(ctx, *token.LeaseID, input.DocumentID)
}
```

In `SignDocumentByPM`, after the signature is saved successfully, add:
```go
if input.LeaseID != nil {
	s.maybeAdvanceLeaseDocToSigned(ctx, *input.LeaseID, input.DocumentID)
}
```

- [ ] **Step 4: Update NewSigningService call in services/main.go**

Change:
```go
signingService := NewSigningService(params.AppCtx, params.Repository.SigningRepository)
```
to:
```go
signingService := NewSigningService(
    params.AppCtx,
    params.Repository.SigningRepository,
    params.Repository.LeaseAgreementDocumentRepository,
)
```

- [ ] **Step 5: Run lint**

```bash
cd services/main && make lint-fix
```

Expected: no errors.

---

### Task 7: Populate LeaseAgreementDocument when fetching a lease

**Files:**
- Modify: `services/main/internal/repository/lease.go`
- Modify: `services/main/internal/transformations/lease.go` (minor — LeaseAgreementDocument pointer type)

**Interfaces:**
- Produces: `populate=LeaseAgreementDocument` support on `GetOneWithPopulate`

- [ ] **Step 1: Verify populate=LeaseAgreementDocument works via GORM preload**

The `LeaseAgreementDocument` has `LeaseID` FK and `Lease.LeaseAgreementDocument *LeaseAgreementDocument` would need to be declared for GORM `HasOne` preload. Since the FK is on the child model, GORM can preload it if the parent struct declares the relation.

Add to `Lease` struct in `models/lease.go`:
```go
LeaseAgreementDocument *LeaseAgreementDocument `gorm:"foreignKey:LeaseID"`
```

This enables `populate=LeaseAgreementDocument` in `GetOneWithPopulate` with no other changes.

- [ ] **Step 2: Run lint**

```bash
cd services/main && make lint-fix
```

Expected: no errors.

---

### Task 8: Frontend types

**Files:**
- Create: `apps/property-manager/types/lease-agreement-document.d.ts`
- Modify: `apps/property-manager/types/lease.d.ts`
- Modify: `apps/property-manager/types/document.d.ts`

- [ ] **Step 1: Create LeaseAgreementDocument type**

Create `apps/property-manager/types/lease-agreement-document.d.ts`:

```ts
interface LeaseAgreementDocument {
	id: string
	lease_id: string
	mode: 'MANUAL' | 'ONLINE'
	document_id: Nullable<string>
	document?: Nullable<RentloopDocument>
	document_url: Nullable<string>
	status: 'DRAFT' | 'FINALIZED' | 'SIGNING' | 'SIGNED'
	signatures: Array<RentloopDocumentSignature>
	created_at: Date
	updated_at: Date
}
```

- [ ] **Step 2: Update Lease type**

Edit `apps/property-manager/types/lease.d.ts`:

Change `lease_agreement_document_url: string` to:
```ts
lease_agreement_document_url: Nullable<string>
lease_agreement_document?: LeaseAgreementDocument
```

- [ ] **Step 3: Add lease_agreement_document_id to RentloopDocumentSignature**

Edit `apps/property-manager/types/document.d.ts` — add to `RentloopDocumentSignature`:
```ts
lease_agreement_document_id: Nullable<string>
```

- [ ] **Step 4: Run types check**

```bash
cd apps/property-manager && yarn types:check
```

Expected: no type errors from the type file changes (other errors may exist from downstream usages — fix in next task).

---

### Task 9: Frontend API layer

**Files:**
- Create: `apps/property-manager/app/api/lease-agreement-document/index.ts`

- [ ] **Step 1: Create the API hooks**

Create `apps/property-manager/app/api/lease-agreement-document/index.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '~/lib/constants'
import { fetchClient } from '~/lib/transport'

// ─── Fetch ────────────────────────────────────────────────────────────────────

const fetchLeaseAgreementDocument = async (
	clientId: string,
	propertyId: string,
	leaseId: string,
) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseAgreementDocument>>(
			`/v1/admin/clients/${clientId}/properties/${propertyId}/leases/${leaseId}/agreement-document`,
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useLeaseAgreementDocument = (
	clientId: string,
	propertyId: string,
	leaseId: string,
	enabled = true,
) =>
	useQuery({
		queryKey: [QUERY_KEYS.LEASE_AGREEMENT_DOCUMENT, clientId, propertyId, leaseId],
		queryFn: () => fetchLeaseAgreementDocument(clientId, propertyId, leaseId),
		enabled: enabled && !!clientId && !!propertyId && !!leaseId,
		retry: false,
	})

// ─── Create ───────────────────────────────────────────────────────────────────

export interface CreateLeaseAgreementDocumentInput {
	client_id: string
	property_id: string
	lease_id: string
	mode: 'MANUAL' | 'ONLINE'
	document_id?: string | null
	document_url?: string | null
}

const createLeaseAgreementDocument = async ({
	client_id,
	property_id,
	lease_id,
	...body
}: CreateLeaseAgreementDocumentInput) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseAgreementDocument>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/leases/${lease_id}/agreement-document`,
			{ method: 'POST', body: JSON.stringify(body) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useCreateLeaseAgreementDocument = () =>
	useMutation({ mutationFn: createLeaseAgreementDocument })

// ─── Update ───────────────────────────────────────────────────────────────────

export interface UpdateLeaseAgreementDocumentInput {
	client_id: string
	property_id: string
	lease_id: string
	mode?: 'MANUAL' | 'ONLINE'
	document_id?: string | null
	document_url?: string | null
}

const updateLeaseAgreementDocument = async ({
	client_id,
	property_id,
	lease_id,
	...body
}: UpdateLeaseAgreementDocumentInput) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseAgreementDocument>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/leases/${lease_id}/agreement-document`,
			{ method: 'PATCH', body: JSON.stringify(body) },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useUpdateLeaseAgreementDocument = () =>
	useMutation({ mutationFn: updateLeaseAgreementDocument })

// ─── Delete ───────────────────────────────────────────────────────────────────

const deleteLeaseAgreementDocument = async ({
	client_id,
	property_id,
	lease_id,
}: {
	client_id: string
	property_id: string
	lease_id: string
}) => {
	try {
		await fetchClient(
			`/v1/admin/clients/${client_id}/properties/${property_id}/leases/${lease_id}/agreement-document`,
			{ method: 'DELETE' },
		)
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useDeleteLeaseAgreementDocument = () =>
	useMutation({ mutationFn: deleteLeaseAgreementDocument })

// ─── Finalize ─────────────────────────────────────────────────────────────────

const finalizeLeaseAgreementDocument = async ({
	client_id,
	property_id,
	lease_id,
}: {
	client_id: string
	property_id: string
	lease_id: string
}) => {
	try {
		const response = await fetchClient<ApiResponse<LeaseAgreementDocument>>(
			`/v1/admin/clients/${client_id}/properties/${property_id}/leases/${lease_id}/agreement-document/finalize`,
			{ method: 'POST' },
		)
		return response.parsedBody.data
	} catch (error: unknown) {
		if (error instanceof Response) {
			const body = await error.json()
			throw new Error(body.errors?.message || 'Unknown error')
		}
		if (error instanceof Error) throw error
	}
}

export const useFinalizeLeaseAgreementDocument = () =>
	useMutation({ mutationFn: finalizeLeaseAgreementDocument })
```

- [ ] **Step 2: Add LEASE_AGREEMENT_DOCUMENT to QUERY_KEYS**

Edit `apps/property-manager/app/lib/constants.ts` — add to `QUERY_KEYS`:
```ts
LEASE_AGREEMENT_DOCUMENT: 'lease_agreement_document',
```

- [ ] **Step 3: Run types check**

```bash
cd apps/property-manager && yarn types:check
```

Expected: no errors in the new file.

---

### Task 10: Frontend — lease detail Documents tab UI

**Files:**
- Create: `apps/property-manager/app/modules/properties/property/occupancy/leases/lease/components/lease-agreement-document-setup.tsx`
- Modify: `apps/property-manager/app/modules/properties/property/occupancy/leases/lease/index.tsx`

**Interfaces:**
- Consumes: `useLeaseAgreementDocument`, `useCreateLeaseAgreementDocument`, `useDeleteLeaseAgreementDocument`, `useFinalizeLeaseAgreementDocument` from Task 9
- Consumes: existing `AddDocumentModal`, `AttachedDocumentView`, `DocumentList`, `useSigningTokens`, `useCreateDocument` from the application docs module — NOT reused directly (different mutation targets); instead, this task creates a parallel component

- [ ] **Step 1: Create LeaseAgreementDocumentSetup component**

Create `apps/property-manager/app/modules/properties/property/occupancy/leases/lease/components/lease-agreement-document-setup.tsx`:

```tsx
import { CheckCircle, ExternalLink, FileText, Info, Loader2, Pen, PenLine, Plus, Upload, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useRevalidator } from 'react-router'
import {
	useCreateLeaseAgreementDocument,
	useDeleteLeaseAgreementDocument,
	useFinalizeLeaseAgreementDocument,
	useLeaseAgreementDocument,
} from '~/api/lease-agreement-document'
import { useCreateDocument } from '~/api/documents'
import { useSigningTokens } from '~/api/signing'
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '~/components/ui/dialog'
import { DocumentUpload } from '~/components/ui/document-upload'
import { Separator } from '~/components/ui/separator'
import { Skeleton } from '~/components/ui/skeleton'
import { Spinner } from '~/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { getWitnessNodesFromContent } from '~/lib/document.utils'
import { safeString } from '~/lib/strings'
import { cn } from '~/lib/utils'
import { DocumentList } from '~/modules/properties/property/occupancy/applications/application/docs/document-list'
import { SigningStatusRow } from '~/modules/properties/property/occupancy/applications/application/docs/signing-status-row'
import { PromptSignatureButton } from '~/modules/properties/property/occupancy/applications/application/docs/prompt-signature-button'
import type { IDocumentTemplate } from '~/modules/settings/documents/controller'
import { useClient } from '~/providers/client-provider'
import { useUploadObject } from '~/hooks/use-upload-object'

const DOC_STATUS_LABEL: Record<string, string> = {
	DRAFT: 'Draft',
	FINALIZED: 'Ready for Signing',
	SIGNING: 'Signing',
	SIGNED: 'Signed',
}

const DOC_STATUS_CLASS: Record<string, string> = {
	DRAFT: 'border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
	FINALIZED: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300',
	SIGNING: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
	SIGNED: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
}

interface LeaseAgreementDocumentSetupProps {
	leaseId: string
	propertyId: string
	documentTemplates: IDocumentTemplate[]
	tenantPhone?: string
	tenantEmail?: string
	tenantName?: string
}

export function LeaseAgreementDocumentSetup({
	leaseId,
	propertyId,
	documentTemplates,
	tenantPhone,
	tenantEmail,
	tenantName,
}: LeaseAgreementDocumentSetupProps) {
	const { clientUser } = useClient()
	const clientId = safeString(clientUser?.client_id)
	const revalidator = useRevalidator()
	const [addOpen, setAddOpen] = useState(false)

	const { data: agreementDoc, isPending: isLoading } = useLeaseAgreementDocument(
		clientId,
		propertyId,
		leaseId,
	)
	const { mutateAsync: deleteDoc, isPending: isDeleting } = useDeleteLeaseAgreementDocument()
	const { mutateAsync: finalizeDoc, isPending: isFinalizing } = useFinalizeLeaseAgreementDocument()

	const handleClear = async () => {
		await deleteDoc({ client_id: clientId, property_id: propertyId, lease_id: leaseId })
		void revalidator.revalidate()
	}

	const handleFinalize = async () => {
		await finalizeDoc({ client_id: clientId, property_id: propertyId, lease_id: leaseId })
		void revalidator.revalidate()
	}

	if (isLoading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-16 w-full rounded-lg" />
				<Skeleton className="h-10 w-full rounded-lg" />
			</div>
		)
	}

	if (!agreementDoc) {
		return (
			<>
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
					<FileText className="size-10 text-zinc-400" />
					<p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
						No document attached
					</p>
					<p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
						Upload or select a document to attach to this lease.
					</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => setAddOpen(true)}
					>
						<Plus className="size-4" />
						Add Document
					</Button>
				</div>
				<AddLeaseDocumentModal
					open={addOpen}
					onOpenChange={setAddOpen}
					clientId={clientId}
					propertyId={propertyId}
					leaseId={leaseId}
					documentTemplates={documentTemplates}
				/>
			</>
		)
	}

	const isManual = agreementDoc.mode === 'MANUAL'
	const signatures = agreementDoc.signatures ?? []
	const pmSignature = signatures.find((s) => s.role === 'PROPERTY_MANAGER')
	const tenantSignature = signatures.find((s) => s.role === 'TENANT')
	const pmWitnessSignatures = signatures.filter((s) => s.role === 'PM_WITNESS')
	const tenantWitnessSignatures = signatures.filter((s) => s.role === 'TENANT_WITNESS')

	const witnessNodes = getWitnessNodesFromContent(agreementDoc.document?.content)
	const pmWitnessCount = witnessNodes.filter((n) => n.role === 'pm_witness').length
	const tenantWitnessCount = witnessNodes.filter((n) => n.role === 'tenant_witness').length
	const witnessEntries = witnessNodes.map((node, idx) => {
		const roleIdx = witnessNodes.slice(0, idx).filter((n) => n.role === node.role).length
		const sig =
			node.role === 'pm_witness'
				? pmWitnessSignatures[roleIdx]
				: tenantWitnessSignatures[roleIdx]
		const showTag = node.role === 'pm_witness' ? pmWitnessCount > 1 : tenantWitnessCount > 1
		return { label: showTag ? `${node.label} #${roleIdx + 1}` : node.label, signature: sig ?? null, role: node.role, roleIdx }
	})

	const { data: signingTokens, isPending: isLoadingTokens } = useSigningTokens(
		clientId,
		propertyId,
		{ filters: { document_id: agreementDoc.document_id ?? undefined, lease_id: leaseId } },
	)
	const tenantToken = signingTokens?.rows?.find((t) => t.role === 'TENANT') ?? null
	const pmWitnessTokens = signingTokens?.rows?.filter((t) => t.role === 'PM_WITNESS') ?? []
	const tenantWitnessTokens = signingTokens?.rows?.filter((t) => t.role === 'TENANT_WITNESS') ?? []

	return (
		<div className="space-y-4">
			{/* Document header row */}
			<div className="flex items-center justify-between rounded-lg border p-4">
				<div className="flex items-center gap-3">
					<Badge variant="default" className="flex h-10 w-10 flex-col bg-blue-100 p-1 dark:bg-blue-950">
						<FileText className="h-full w-full text-blue-600 dark:text-blue-400" />
						<span className="text-[7px] font-bold text-black dark:text-white">
							{isManual ? 'PDF' : 'DOCX'}
						</span>
					</Badge>
					<div>
						<div className="flex items-center gap-2">
							<p className="text-sm font-medium">
								{agreementDoc.document?.title ?? 'Lease Agreement'}
							</p>
							<Badge
								variant="outline"
								className={cn('text-[10px] font-semibold', DOC_STATUS_CLASS[agreementDoc.status])}
							>
								{DOC_STATUS_LABEL[agreementDoc.status] ?? agreementDoc.status}
							</Badge>
						</div>
						<p className="text-xs text-zinc-500 dark:text-zinc-400">
							{isManual ? 'Manually uploaded' : 'Selected from library'}
						</p>
					</div>
				</div>
				{agreementDoc.status === 'DRAFT' && (
					<Button
						variant="outline"
						size="sm"
						className="text-red-400 hover:text-red-500"
						disabled={isDeleting}
						onClick={handleClear}
					>
						{isDeleting ? <Spinner /> : <X className="size-4" />}
						Remove
					</Button>
				)}
			</div>

			{/* Status-specific content */}
			{isManual ? (
				<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
					<div className="flex items-center gap-2">
						<CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
						<p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
							Document ready
						</p>
					</div>
					<p className="mt-1 pl-7 text-xs text-emerald-600 dark:text-emerald-400">
						Manually uploaded documents are assumed to be pre-signed and ready to go.
					</p>
				</div>
			) : agreementDoc.status === 'DRAFT' ? (
				<div className="space-y-3">
					<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
						<div className="flex items-center gap-2">
							<PenLine className="size-5 text-zinc-500" />
							<p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
								Document needs editing
							</p>
						</div>
						<p className="mt-1 pl-7 text-xs text-zinc-500 dark:text-zinc-400">
							Edit and finalize the document before sending for signatures.
						</p>
						<Button size="sm" className="mt-3 ml-7" asChild>
							<Link to={`/properties/${propertyId}/documents/${agreementDoc.document_id}/editor`}>
								<PenLine className="size-4" />
								Edit Document
							</Link>
						</Button>
					</div>
					<Button
						size="sm"
						variant="outline"
						disabled={isFinalizing}
						onClick={handleFinalize}
					>
						{isFinalizing && <Loader2 className="size-4 animate-spin" />}
						Finalize Document
					</Button>
				</div>
			) : (
				<div className="space-y-3">
					{agreementDoc.status === 'FINALIZED' && (
						<div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
							<p className="text-xs text-amber-700 dark:text-amber-300">
								Need changes?{' '}
								<Link
									to={`/properties/${propertyId}/documents/${agreementDoc.document_id}/editor`}
									className="font-medium underline underline-offset-2"
								>
									Open the editor
								</Link>{' '}
								and revert to draft.
							</p>
						</div>
					)}

					{['SIGNING', 'SIGNED'].includes(agreementDoc.status) && (
						<div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
							<p className="text-xs text-green-700 dark:text-green-300">
								<Link
									to={`/properties/${propertyId}/documents/${agreementDoc.document_id}/signing`}
									className="font-medium underline underline-offset-2"
								>
									View the document
								</Link>{' '}
								to see signing details.
							</p>
						</div>
					)}

					<p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Signing Status</p>
					<Separator />

					{isLoadingTokens ? (
						<div className="space-y-3">
							{[...Array(2)].map((_, i) => (
								<div key={i} className="flex items-center justify-between">
									<div className="space-y-1.5">
										<Skeleton className="h-3.5 w-32" />
										<Skeleton className="h-3 w-24" />
									</div>
									<Skeleton className="h-8 w-24 rounded-md" />
								</div>
							))}
						</div>
					) : (
						<>
							<SigningStatusRow
								label="Property Manager"
								signed={Boolean(pmSignature)}
								signedAt={pmSignature?.created_at ?? null}
								signedBy={pmSignature?.signed_by?.user?.name}
							/>
							{!pmSignature && (
								<Button size="sm" asChild>
									<Link to={`/properties/${propertyId}/documents/${agreementDoc.document_id}/signing`}>
										<Pen className="size-4" />
										Sign Document
									</Link>
								</Button>
							)}

							<Separator />

							<SigningStatusRow
								label="Tenant"
								signed={Boolean(tenantSignature)}
								signedAt={tenantSignature?.created_at ?? null}
								signedBy={tenantSignature?.signed_by_name}
							/>
							{!tenantSignature && (
								<PromptSignatureButton
									existingToken={tenantToken}
									documentId={safeString(agreementDoc.document_id)}
									role="TENANT"
									propertyId={propertyId}
									leaseId={leaseId}
									email={safeString(tenantEmail)}
									phone={safeString(tenantPhone)}
									name={safeString(tenantName)}
								/>
							)}

							{witnessEntries.map((entry, idx) => {
								const witnessToken =
									entry.role === 'pm_witness'
										? (pmWitnessTokens[entry.roleIdx] ?? null)
										: (tenantWitnessTokens[entry.roleIdx] ?? null)
								return (
									<React.Fragment key={idx}>
										<Separator />
										<SigningStatusRow
											label={entry.label}
											signed={Boolean(entry.signature)}
											signedAt={entry.signature?.created_at ?? null}
											signedBy={entry.signature?.signed_by?.user?.name}
										/>
										{!entry.signature && (
											<PromptSignatureButton
												existingToken={witnessToken}
												documentId={safeString(agreementDoc.document_id)}
												propertyId={propertyId}
												leaseId={leaseId}
												role={entry.role === 'pm_witness' ? 'PM_WITNESS' : 'TENANT_WITNESS'}
											/>
										)}
									</React.Fragment>
								)
							})}
						</>
					)}
				</div>
			)}
		</div>
	)
}

// ─── Add Document Modal ───────────────────────────────────────────────────────

interface AddLeaseDocumentModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	clientId: string
	propertyId: string
	leaseId: string
	documentTemplates: IDocumentTemplate[]
}

function AddLeaseDocumentModal({
	open,
	onOpenChange,
	clientId,
	propertyId,
	leaseId,
	documentTemplates,
}: AddLeaseDocumentModalProps) {
	const [mode, setMode] = useState<'manual' | 'online'>('manual')
	const [selectedDocument, setSelectedDocument] = useState<RentloopDocument | null>(null)
	const revalidator = useRevalidator()

	const { upload, isLoading: isUploading, objectUrl: uploadedUrl } = useUploadObject(
		'leases/lease-documents',
	)
	const { mutateAsync: createDocument, isPending: isCreating } = useCreateDocument(clientId)
	const { mutateAsync: createAgreementDoc, isPending: isSaving } = useCreateLeaseAgreementDocument()

	const canSave = mode === 'online' ? Boolean(selectedDocument) : Boolean(uploadedUrl)
	const isLoading = isCreating || isSaving

	const handleSave = async () => {
		if (mode === 'manual') {
			if (!uploadedUrl) return
			await createAgreementDoc({
				client_id: clientId,
				property_id: propertyId,
				lease_id: leaseId,
				mode: 'MANUAL',
				document_url: uploadedUrl,
			})
		} else {
			if (!selectedDocument) return
			const newDoc = await createDocument({
				title: `Lease Agreement`,
				content: selectedDocument.content,
				size: selectedDocument.size,
				tags: selectedDocument.tags,
				property_id: propertyId,
				type: 'DOCUMENT',
			})
			if (!newDoc) return
			await createAgreementDoc({
				client_id: clientId,
				property_id: propertyId,
				lease_id: leaseId,
				mode: 'ONLINE',
				document_id: newDoc.id,
			})
		}

		void revalidator.revalidate()
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="h-[80vh] overflow-auto sm:max-w-3xl md:h-auto">
				<DialogHeader>
					<DialogTitle>Add Document</DialogTitle>
					<DialogDescription>
						Upload your own document or select one from the library.
					</DialogDescription>
				</DialogHeader>

				<Tabs value={mode} onValueChange={(v) => setMode(v as 'manual' | 'online')}>
					<TabsList>
						<TabsTrigger value="manual">
							<Upload className="size-4" />
							Manual Upload
						</TabsTrigger>
						<TabsTrigger value="online">
							<FileText className="size-4" />
							Select from Library
						</TabsTrigger>
					</TabsList>

					<TabsContent value="manual">
						<div className="space-y-3 pt-2">
							<Alert>
								<Info className="size-4" />
								<AlertTitle>Manual Upload</AlertTitle>
								<AlertDescription>
									Upload your own lease agreement. Accepted formats: PDF and Word
									documents up to 5MB.
								</AlertDescription>
							</Alert>
							<DocumentUpload
								acceptedFileTypes={[
									'application/pdf',
									'application/msword',
									'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
								]}
								label="Upload Lease Document"
								hint="Upload a PDF or Word document (max 5MB)"
								name="lease_document"
								maxByteSize={5242880}
								fileCallback={upload}
								isUploading={isUploading}
							/>
						</div>
					</TabsContent>

					<TabsContent value="online">
						<div className="space-y-3 pt-2">
							<Alert>
								<Info className="size-4" />
								<AlertTitle>Select from Library</AlertTitle>
								<AlertDescription>
									Choose from pre-existing document templates available on the platform.
								</AlertDescription>
							</Alert>
							<DocumentList
								documentTemplates={documentTemplates}
								property_id={propertyId}
								selectedDocument={selectedDocument}
								onSelectDocument={setSelectedDocument}
							/>
						</div>
					</TabsContent>
				</Tabs>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button disabled={!canSave || isLoading} onClick={handleSave}>
						{(isLoading || isUploading) && <Loader2 className="size-4 animate-spin" />}
						Save
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
```

- [ ] **Step 2: Update Documents tab in lease detail**

Edit `apps/property-manager/app/modules/properties/property/occupancy/leases/lease/index.tsx`.

Add import at top:
```tsx
import { LeaseAgreementDocumentSetup } from './components/lease-agreement-document-setup'
```

The loader does not yet fetch `documentTemplates` — the lease detail route needs them. Add a loader fetch for document templates following the same pattern as the application docs loader. Check the application docs route for the fetch pattern:

In the route file `_auth.properties.$propertyId.occupancy.leases.$leaseId.tsx` (or equivalent), add the document templates fetch to the loader. The exact route file needs to be found and updated — find it:

```bash
find apps/property-manager/app/routes -name "*leases*$leaseId*" | head -5
```

Add to that loader (same pattern as application docs):
```ts
import { getDocumentTemplatesForServer } from '~/api/documents/server'
// inside loader:
const documentTemplates = await getDocumentTemplatesForServer(propertyId, { authToken, baseUrl })
return { ..., documentTemplates }
```

Replace the Lease Agreement section in the Documents tab (lines ~622–699 in `index.tsx`):

```tsx
{/* Documents Tab */}
<TabsContent value="documents" className="mt-4">
    <Card className="shadow-none">
        <CardContent className="space-y-6">
            {/* Lease Agreement */}
            <div className="space-y-3">
                <SectionHeading>Lease Agreement</SectionHeading>
                {lease.lease_agreement_document_url ? (
                    <div className="space-y-4 text-sm">
                        <a
                            href={lease.lease_agreement_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                            <ExternalLink className="size-3.5" />
                            View Document
                        </a>
                        {/* Signatures: prefer LeaseAgreementDocument signatures, fall back to application */}
                        {(() => {
                            const sigs = lease.lease_agreement_document?.signatures?.length
                                ? lease.lease_agreement_document.signatures
                                : (application?.lease_agreement_document_signatures?.filter(
                                      (sig) =>
                                          sig.document_id ===
                                          application.lease_agreement_document_id,
                                  ) ?? [])
                            return sigs.length > 0 ? (
                                <div className="space-y-2">
                                    {sigs.map((sig) => {
                                        const roleLabel: Record<string, string> = {
                                            PROPERTY_MANAGER: 'Property Manager',
                                            TENANT: 'Tenant',
                                            PM_WITNESS: 'PM Witness',
                                            TENANT_WITNESS: 'Tenant Witness',
                                        }
                                        return (
                                            <div
                                                key={sig.role}
                                                className="flex items-center justify-between rounded-md border px-3 py-2"
                                            >
                                                <div>
                                                    <p className="text-xs font-medium">
                                                        {roleLabel[sig.role] ?? sig.role}
                                                    </p>
                                                    {sig.signed_by_name && (
                                                        <p className="text-muted-foreground text-xs">
                                                            {sig.signed_by_name}
                                                        </p>
                                                    )}
                                                </div>
                                                <Badge
                                                    variant="outline"
                                                    className="bg-teal-500 px-1.5 text-white dark:bg-teal-900"
                                                >
                                                    Signed {localizedDayjs(sig.created_at).format('LLL')}
                                                </Badge>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-xs">
                                    No signature records available.
                                </p>
                            )
                        })()}
                    </div>
                ) : (
                    <LeaseAgreementDocumentSetup
                        leaseId={lease.id}
                        propertyId={propertyId}
                        documentTemplates={loaderData.documentTemplates ?? []}
                        tenantPhone={lease.tenant?.phone}
                        tenantEmail={lease.tenant?.email ?? undefined}
                        tenantName={
                            lease.tenant
                                ? `${lease.tenant.first_name} ${lease.tenant.last_name}`
                                : undefined
                        }
                    />
                )}
            </div>

            {/* Termination Agreement — unchanged */}
            ...
        </CardContent>
    </Card>
</TabsContent>
```

- [ ] **Step 3: Fix any TypeScript errors**

```bash
cd apps/property-manager && yarn types:check 2>&1 | head -50
```

Fix all errors (typically: missing React import, missing `loaderData` type for `documentTemplates`, unused imports).

- [ ] **Step 4: Run lint**

```bash
cd apps/property-manager && yarn lint
```

Fix any lint errors (unused vars, unhandled promises).

- [ ] **Step 5: Verify in browser**

Start the dev server:
```bash
cd apps/property-manager && yarn dev
```

Check both scenarios:
1. A lease with `lease_agreement_document_url` set → should show the existing link + signatures UI (unchanged)
2. A lease without `lease_agreement_document_url` → should show "No document attached" empty state with "Add Document" button
3. Click "Add Document" → modal opens with Manual/Online tabs
4. Selecting a document and saving creates a `LeaseAgreementDocument` record and the UI switches to the attached view
5. Check dark mode in both states

---

### Task 11: Fix lease creation call sites for nullable URL

**Files:**
- Modify: `apps/property-manager/app/modules/properties/property/occupancy/applications/approve/use-approval-pipeline.ts`

**Interfaces:**
- Consumes: updated `Lease.lease_agreement_document_url: Nullable<string>` from Task 8

- [ ] **Step 1: Find and fix any TS errors from nullable lease_agreement_document_url**

```bash
cd apps/property-manager && yarn types:check 2>&1 | grep "lease_agreement_document_url"
```

For any error accessing `lease.lease_agreement_document_url` as a non-null string, add a null check or use optional chaining. For example, in `use-approval-pipeline.ts`, if it does:

```ts
leaseAgreementDocumentUrl: lease.lease_agreement_document_url,
```

Change to:
```ts
leaseAgreementDocumentUrl: lease.lease_agreement_document_url ?? undefined,
```

- [ ] **Step 2: Final types check**

```bash
cd apps/property-manager && yarn types:check
```

Expected: no errors.
